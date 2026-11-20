#!/usr/bin/env node

const path = require('path');
const { execFileSync } = require('child_process');
const {
  AUTO_MERGE_DELAY_MS,
  buildNoticeMarker,
  normalizeGithubPrFiles,
  evaluatePrGuard,
  evaluateAutoMergeCandidate,
  formatMaintainerNoticeComment,
  hasHoldLabel,
  inspectValidationState,
  listProfileFiles,
  listCheerFiles,
  parseMaintainers
} = require('./pr-guard');

const DEFAULT_MAX_LOOP_MS = 15 * 60 * 1000;
const DEFAULT_MAX_CHAIN_DEPTH = 20;
const MIN_POLL_SLEEP_MS = 15 * 1000;
const MAX_POLL_SLEEP_MS = 60 * 1000;
const RATE_LIMIT_BACKOFF_MS = 60 * 1000;

function isRateLimitError(error) {
  const status = Number(error?.status || error?.response?.status || 0);
  const message = String(error?.message || '').toLowerCase();
  return (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('secondary rate limit') ||
    message.includes('abuse detection')
  );
}

function normalizeGraphqlCheckStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'in_progress' || value === 'queued' || value === 'waiting' || value === 'pending' || value === 'requested') {
    return value;
  }
  return value || 'completed';
}

function normalizeGraphqlCheckConclusion(conclusion) {
  return String(conclusion || '').trim().toLowerCase() || null;
}

async function fetchOpenPullStatesViaGraphql({ github, owner, repo, core }) {
  if (typeof github?.graphql !== 'function') {
    return null;
  }

  const query = `
    query FetchOpenPullStates($owner: String!, $repo: String!, $after: String) {
      repository(owner: $owner, name: $repo) {
        pullRequests(
          states: OPEN
          baseRefName: "main"
          orderBy: { field: CREATED_AT, direction: ASC }
          first: 100
          after: $after
        ) {
          nodes {
            number
            state
            merged
            isDraft
            createdAt
            baseRefName
            headRefOid
            author {
              login
            }
            headRepository {
              name
              owner {
                login
              }
            }
            labels(first: 20) {
              nodes {
                name
              }
            }
            reviews(last: 50) {
              nodes {
                state
                author {
                  login
                }
              }
            }
            commits(last: 1) {
              nodes {
                commit {
                  oid
                  statusCheckRollup {
                    contexts(first: 100) {
                      nodes {
                        __typename
                        ... on CheckRun {
                          databaseId
                          name
                          status
                          conclusion
                          completedAt
                          detailsUrl
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  try {
    const items = [];
    let cursor = null;

    while (true) {
      const payload = await github.graphql(query, { owner, repo, after: cursor });
      const conn = payload?.repository?.pullRequests;
      const nodes = Array.isArray(conn?.nodes) ? conn.nodes : [];

      for (const node of nodes) {
        const pr = {
          number: Number(node?.number || 0),
          state: String(node?.state || 'OPEN').toLowerCase(),
          merged: Boolean(node?.merged),
          draft: Boolean(node?.isDraft),
          created_at: String(node?.createdAt || ''),
          user: { login: String(node?.author?.login || '') },
          base: { ref: String(node?.baseRefName || 'main') },
          head: {
            sha: String(node?.headRefOid || ''),
            repo: node?.headRepository
              ? {
                  name: String(node.headRepository.name || ''),
                  owner: { login: String(node.headRepository.owner?.login || '') }
                }
              : null
          },
          labels: Array.isArray(node?.labels?.nodes)
            ? node.labels.nodes.map((label) => ({ name: String(label?.name || '') })).filter((l) => l.name)
            : []
        };

        const reviews = Array.isArray(node?.reviews?.nodes)
          ? node.reviews.nodes.map((review) => ({
              user: { login: String(review?.author?.login || '') },
              state: String(review?.state || '')
            }))
          : [];

        const commitNode = node?.commits?.nodes?.[0]?.commit;
        const contextNodes = Array.isArray(commitNode?.statusCheckRollup?.contexts?.nodes)
          ? commitNode.statusCheckRollup.contexts.nodes
          : [];
        const checkRuns = contextNodes
          .filter((ctx) => ctx && (ctx.__typename === 'CheckRun' || typeof ctx.name === 'string'))
          .map((ctx) => ({
            id: Number(ctx.databaseId || 0),
            name: String(ctx.name || ''),
            status: normalizeGraphqlCheckStatus(ctx.status),
            conclusion: normalizeGraphqlCheckConclusion(ctx.conclusion),
            completed_at: String(ctx.completedAt || ''),
            html_url: String(ctx.detailsUrl || '')
          }));

        items.push({ pr, reviews, checkRuns, fromGraphql: true });
      }

      if (!conn?.pageInfo?.hasNextPage || !conn?.pageInfo?.endCursor) {
        break;
      }
      cursor = conn.pageInfo.endCursor;
    }

    return items;
  } catch (error) {
    core?.warning?.(`GraphQL batch PR fetch failed, falling back to REST: ${error.message}`);
    return null;
  }
}

function getCheapSkipReason(pr, maintainerSet) {
  if (!pr || pr.state !== 'open' || pr.merged) {
    return { reason: 'not_open' };
  }
  if (String(pr.base?.ref || '') !== 'main') {
    return { reason: 'non_main_base' };
  }
  if (pr.draft) {
    return { reason: 'draft' };
  }
  const prAuthor = String(pr.user?.login || '').trim();
  if (prAuthor && maintainerSet.has(prAuthor.toLowerCase())) {
    return { reason: 'maintainer' };
  }
  const holdLabels = hasHoldLabel(pr.labels || []);
  if (holdLabels.length > 0) {
    return { reason: 'hold_label', holdLabels };
  }
  return null;
}

function applyMergedChangesToInventory(changedFiles, existingProfileFiles, existingCheerFiles) {
  const profileSet = new Set(existingProfileFiles);
  const cheerMap = new Map(existingCheerFiles.map((item) => [item.relPath, item]));

  for (const item of Array.isArray(changedFiles) ? changedFiles : []) {
    const filePath = String(item?.path || '');
    if (!filePath) continue;

    if (filePath.startsWith('data/profiles/') && filePath.endsWith('.json')) {
      const rest = filePath.slice('data/profiles/'.length);
      if (!rest.includes('/') && !rest.startsWith('_')) {
        if (item.status === 'D') {
          profileSet.delete(rest);
        } else {
          profileSet.add(rest);
        }
      }
      continue;
    }

    if (filePath.startsWith('data/cheers/')) {
      const segments = filePath.slice('data/cheers/'.length).split('/');
      if (
        segments.length === 2 &&
        segments[0] &&
        !segments[0].startsWith('_') &&
        segments[1] &&
        !segments[1].startsWith('_') &&
        segments[1].endsWith('.json')
      ) {
        const relPath = `data/cheers/${segments[0]}/${segments[1]}`;
        if (item.status === 'D') {
          cheerMap.delete(relPath);
        } else {
          cheerMap.set(relPath, {
            target: segments[0],
            file: segments[1],
            relPath
          });
        }
      }
    }
  }

  return {
    existingProfileFiles: Array.from(profileSet).sort((a, b) => a.localeCompare(b)),
    existingCheerFiles: Array.from(cheerMap.values()).sort((a, b) => a.relPath.localeCompare(b.relPath))
  };
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultRefreshMain(workspace) {
  execFileSync('git', ['fetch', '--depth=1', 'origin', 'main'], {
    cwd: workspace,
    stdio: 'pipe'
  });
  execFileSync('git', ['reset', '--hard', 'FETCH_HEAD'], {
    cwd: workspace,
    stdio: 'pipe'
  });
}

async function fetchPrChangedFilesAndContents({ github, owner, repo, pr, core, fetchFn = global.fetch }) {
  const apiFiles = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pr.number,
    per_page: 100
  });

  const changedFiles = normalizeGithubPrFiles(apiFiles);
  const fileContents = {};

  const headOwner = pr.head?.repo?.owner?.login || owner;
  const headRepo = pr.head?.repo?.name || repo;
  const headSha = pr.head?.sha || '';
  const hasDistinctHeadRepo = Boolean(headOwner && headRepo && (headOwner !== owner || headRepo !== repo));

  for (const file of changedFiles) {
    if (file.status === 'D') continue;
    const isTargetJson =
      (file.path.startsWith('data/profiles/') || file.path.startsWith('data/cheers/')) &&
      file.path.endsWith('.json') &&
      !path.basename(file.path).startsWith('_');

    if (!isTargetJson) continue;

    let loaded = false;
    const attempts = [];

    // 1. Prefer base repository object store (same-repo GITHUB_TOKEN never hits cross-fork 403, works even if fork is deleted)
    if (file.sha) {
      attempts.push(async () => {
        const blob = await github.rest.git.getBlob({
          owner,
          repo,
          file_sha: file.sha
        });
        return Buffer.from(blob.data.content || '', 'base64').toString('utf8');
      });
    }

    if (headSha) {
      attempts.push(async () => {
        const contentRes = await github.rest.repos.getContent({
          owner,
          repo,
          path: file.path,
          ref: headSha
        });
        if (!Array.isArray(contentRes.data) && typeof contentRes.data.content === 'string') {
          return Buffer.from(contentRes.data.content, 'base64').toString('utf8');
        }
        throw new Error('Unexpected getContent payload');
      });
    }

    // 2. Fallback to fork repository API if distinct
    if (hasDistinctHeadRepo && file.sha) {
      attempts.push(async () => {
        const blob = await github.rest.git.getBlob({
          owner: headOwner,
          repo: headRepo,
          file_sha: file.sha
        });
        return Buffer.from(blob.data.content || '', 'base64').toString('utf8');
      });
    }

    // 3. Final fallback to public raw_url from pulls.listFiles (no token header needed for public repo)
    if (file.rawUrl && typeof fetchFn === 'function') {
      attempts.push(async () => {
        const res = await fetchFn(file.rawUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      });
    }

    let lastError = null;
    for (const attempt of attempts) {
      try {
        fileContents[file.path] = await attempt();
        loaded = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!loaded && lastError) {
      core?.warning?.(`Failed to fetch content for ${file.path}: ${lastError.message}`);
    }
  }

  return { changedFiles, fileContents };
}

async function postGuardComment({ github, owner, repo, issueNumber, body, core }) {
  try {
    const created = await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body
    });
    return { action: 'created', commentId: created?.data?.id || null };
  } catch (error) {
    core?.warning?.(`Failed to post PR guard comment on PR #${issueNumber}: ${error.message}`);
    return { action: 'error', error: error.message };
  }
}

async function postCommentOnceByMarker({ github, owner, repo, issueNumber, marker, body, core }) {
  try {
    const comments = await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100
    });
    if (comments.some((comment) => String(comment.body || '').includes(marker))) {
      return { posted: false, reason: 'already_exists' };
    }

    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body
    });
    return { posted: true };
  } catch (error) {
    core?.warning?.(`Failed to post notice on PR #${issueNumber}: ${error.message}`);
    return { posted: false, error: error.message };
  }
}

async function processAutoMergeQueue({
  github,
  owner,
  repo,
  workspace,
  core,
  maintainers = parseMaintainers(process.env.PR_MAINTAINERS),
  chainDepth = 0,
  waitMs = AUTO_MERGE_DELAY_MS,
  maxLoopMs = DEFAULT_MAX_LOOP_MS,
  maxChainDepth = DEFAULT_MAX_CHAIN_DEPTH,
  nowFn = () => Date.now(),
  sleepFn = defaultSleep,
  refreshMainFn = defaultRefreshMain,
  listProfilesFn = listProfileFiles,
  listCheersFn = listCheerFiles
}) {
  const startMs = nowFn();
  const maintainerSet = new Set(
    (Array.isArray(maintainers) ? maintainers : [])
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const summary = {
    passes: 0,
    merged: [],
    noticed: [],
    skipped: [],
    dispatchedPages: 0,
    continuedChain: false,
    rateLimited: false
  };

  while (true) {
    summary.passes += 1;

    try {
      refreshMainFn(workspace);
    } catch (refreshError) {
      core?.warning?.(`Failed to refresh main branch before queue pass: ${refreshError.message}`);
    }

    let currentProfileFiles = [...listProfilesFn(workspace)];
    let currentCheerFiles = [...listCheersFn(workspace)];

    const graphqlItems = await fetchOpenPullStatesViaGraphql({ github, owner, repo, core });
    const pullItems = graphqlItems
      ? graphqlItems
      : (
          await github.paginate(github.rest.pulls.list, {
            owner,
            repo,
            state: 'open',
            base: 'main',
            sort: 'created',
            direction: 'asc',
            per_page: 100
          })
        ).map((pr) => ({ pr, reviews: null, checkRuns: null, fromGraphql: false }));

    let mergedInPass = 0;
    let waitingCount = 0;
    let minRetryAfterMs = MAX_POLL_SLEEP_MS;
    let budgetExceededMidPass = false;

    for (const item of pullItems) {
      if (mergedInPass > 0 && nowFn() - startMs >= maxLoopMs) {
        waitingCount += 1;
        budgetExceededMidPass = true;
        core?.info?.(`Reached pass time budget mid-pass after merging ${mergedInPass} PR(s); pausing for clean continuation.`);
        break;
      }

      const pr = item.pr;
      const cheapSkip = getCheapSkipReason(pr, maintainerSet);
      if (cheapSkip) {
        summary.skipped.push({ pr: pr.number, reason: cheapSkip.reason });
        core?.info?.(`PR #${pr.number} skipped (${cheapSkip.reason}).`);
        continue;
      }

      const headSha = String(pr.head?.sha || '').trim();
      const prAuthor = String(pr.user?.login || '').trim();

      let reviews = item.fromGraphql ? item.reviews : [];
      let checkRuns = item.fromGraphql ? item.checkRuns : [];
      let workflowRuns = [];

      if (!item.fromGraphql) {
        try {
          reviews = await github.paginate(github.rest.pulls.listReviews, {
            owner,
            repo,
            pull_number: pr.number,
            per_page: 100
          });
        } catch (err) {
          core?.warning?.(`Failed to list reviews for PR #${pr.number}: ${err.message}`);
        }

        if (headSha) {
          try {
            const checkRes = await github.rest.checks.listForRef({
              owner,
              repo,
              ref: headSha,
              per_page: 100
            });
            checkRuns = checkRes?.data?.check_runs || [];
          } catch (err) {
            core?.warning?.(`Failed to list check runs for PR #${pr.number}: ${err.message}`);
          }
        }
      }

      // Only query workflow runs when pr-guard passed and validate CheckRun is missing (e.g. new-account action_required).
      if (headSha) {
        const preStatus = inspectValidationState({ checkRuns, workflowRuns: [] });
        if (preStatus.prGuardState === 'success' && preStatus.validateState === 'missing') {
          try {
            const wfRes = await github.rest.actions.listWorkflowRunsForRepo({
              owner,
              repo,
              head_sha: headSha,
              event: 'pull_request',
              per_page: 20
            });
            workflowRuns = wfRes?.data?.workflow_runs || [];
          } catch (err) {
            core?.warning?.(`Failed to list workflow runs for PR #${pr.number}: ${err.message}`);
          }
        }
      }

      const decision = evaluateAutoMergeCandidate({
        pr,
        reviews,
        labels: pr.labels || [],
        checkRuns,
        workflowRuns,
        maintainers,
        nowMs: nowFn(),
        waitMs
      });

      if (decision.action === 'wait') {
        waitingCount += 1;
        if (typeof decision.retryAfterMs === 'number' && decision.retryAfterMs < minRetryAfterMs) {
          minRetryAfterMs = decision.retryAfterMs;
        }
        core?.info?.(`PR #${pr.number} waiting (${decision.reason}).`);
        continue;
      }

      if (decision.action === 'needs_maintainer') {
        const marker = buildNoticeMarker(decision.reason, headSha);
        const body = formatMaintainerNoticeComment({
          reason: decision.reason,
          prAuthor,
          headSha,
          maintainers,
          workflowRunUrl: decision.workflowRunUrl
        });
        const posted = await postCommentOnceByMarker({
          github,
          owner,
          repo,
          issueNumber: pr.number,
          marker,
          body,
          core
        });
        if (posted.posted) {
          summary.noticed.push({ pr: pr.number, reason: decision.reason });
          core?.notice?.(`Notified maintainers for PR #${pr.number} (${decision.reason}).`);
        }
        continue;
      }

      if (decision.action !== 'merge') {
        summary.skipped.push({ pr: pr.number, reason: decision.reason });
        core?.info?.(`PR #${pr.number} skipped (${decision.reason}).`);
        continue;
      }

      // Re-fetch latest PR detail and re-validate against latest main right before merging.
      let prDetail;
      try {
        const detailRes = await github.rest.pulls.get({
          owner,
          repo,
          pull_number: pr.number
        });
        prDetail = detailRes?.data;
      } catch (err) {
        if (isRateLimitError(err)) {
          summary.rateLimited = true;
          waitingCount += 1;
          minRetryAfterMs = RATE_LIMIT_BACKOFF_MS;
          core?.warning?.(`Hit GitHub rate limit while fetching PR #${pr.number}; backing off.`);
          break;
        }
        core?.warning?.(`Failed to re-fetch PR #${pr.number}: ${err.message}`);
        continue;
      }

      if (!prDetail || prDetail.state !== 'open' || prDetail.merged || prDetail.draft) {
        core?.info?.(`PR #${pr.number} state changed before merge; skipping.`);
        continue;
      }

      if (String(prDetail.head?.sha || '') !== headSha) {
        core?.info?.(`PR #${pr.number} head SHA changed (${headSha} -> ${prDetail.head?.sha}); skipping.`);
        continue;
      }

      if (prDetail.mergeable === false) {
        const marker = buildNoticeMarker('merge_failed', headSha);
        const body = formatMaintainerNoticeComment({
          reason: 'merge_failed',
          prAuthor,
          headSha,
          maintainers,
          mergeError: 'PR 与最新 main 分支存在合并冲突（mergeable = false）'
        });
        const posted = await postCommentOnceByMarker({
          github,
          owner,
          repo,
          issueNumber: pr.number,
          marker,
          body,
          core
        });
        if (posted.posted) {
          summary.noticed.push({ pr: pr.number, reason: 'merge_failed' });
        }
        continue;
      }

      const { changedFiles, fileContents } = await fetchPrChangedFilesAndContents({
        github,
        owner,
        repo,
        pr: prDetail,
        core
      });

      const recheck = evaluatePrGuard({
        prAuthor,
        changedFiles,
        fileContents,
        existingProfileFiles: currentProfileFiles,
        existingCheerFiles: currentCheerFiles,
        maintainers
      });

      if (!recheck.ok) {
        const marker = buildNoticeMarker('main_recheck_failed', headSha);
        const body = formatMaintainerNoticeComment({
          reason: 'main_recheck_failed',
          prAuthor,
          headSha,
          maintainers,
          errors: recheck.errors
        });
        const posted = await postCommentOnceByMarker({
          github,
          owner,
          repo,
          issueNumber: pr.number,
          marker,
          body,
          core
        });
        if (posted.posted) {
          summary.noticed.push({ pr: pr.number, reason: 'main_recheck_failed' });
        }
        core?.warning?.(`PR #${pr.number} failed pre-merge main recheck: ${recheck.errors.join('; ')}`);
        continue;
      }

      try {
        await github.rest.pulls.merge({
          owner,
          repo,
          pull_number: pr.number,
          sha: headSha,
          merge_method: 'squash'
        });
        mergedInPass += 1;
        summary.merged.push(pr.number);
        core?.notice?.(`Auto-merged PR #${pr.number} (${headSha.slice(0, 7)}) via serial queue.`);

        // Update in-memory main inventory immediately so subsequent PRs in the same pass
        // recheck against the new tree without running git fetch 100 times.
        const updatedInventory = applyMergedChangesToInventory(
          changedFiles,
          currentProfileFiles,
          currentCheerFiles
        );
        currentProfileFiles = updatedInventory.existingProfileFiles;
        currentCheerFiles = updatedInventory.existingCheerFiles;
      } catch (mergeError) {
        if (isRateLimitError(mergeError)) {
          summary.rateLimited = true;
          waitingCount += 1;
          minRetryAfterMs = RATE_LIMIT_BACKOFF_MS;
          core?.warning?.(`Hit GitHub rate limit while merging PR #${pr.number}; pausing remaining merges in this pass.`);
          break;
        }
        const marker = buildNoticeMarker('merge_failed', headSha);
        const body = formatMaintainerNoticeComment({
          reason: 'merge_failed',
          prAuthor,
          headSha,
          maintainers,
          mergeError: mergeError.message
        });
        const posted = await postCommentOnceByMarker({
          github,
          owner,
          repo,
          issueNumber: pr.number,
          marker,
          body,
          core
        });
        if (posted.posted) {
          summary.noticed.push({ pr: pr.number, reason: 'merge_failed' });
        }
        core?.warning?.(`Auto-merge failed for PR #${pr.number}: ${mergeError.message}`);
      }
    }

    if (mergedInPass > 0) {
      try {
        await github.rest.actions.createWorkflowDispatch({
          owner,
          repo,
          workflow_id: 'pages.yml',
          ref: 'main'
        });
        summary.dispatchedPages += 1;
        core?.info?.(`Dispatched pages.yml after merging ${mergedInPass} PR(s).`);
      } catch (dispatchError) {
        core?.warning?.(`Failed to dispatch pages.yml: ${dispatchError.message}`);
      }
    }

    if (waitingCount === 0) {
      break;
    }

    if (budgetExceededMidPass || nowFn() - startMs >= maxLoopMs) {
      if (chainDepth < maxChainDepth) {
        try {
          await github.rest.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: 'auto-merge-queue.yml',
            ref: 'main',
            inputs: {
              chain_depth: String(chainDepth + 1)
            }
          });
          summary.continuedChain = true;
          core?.info?.(`Reached pass window with ${waitingCount} waiting PR(s); dispatched continuation #${chainDepth + 1}.`);
        } catch (chainError) {
          core?.warning?.(`Failed to dispatch continuation run: ${chainError.message}`);
        }
      } else {
        core?.warning?.(`Reached max continuation depth (${maxChainDepth}); stopping queue.`);
      }
      break;
    }

    const sleepMs = Math.max(MIN_POLL_SLEEP_MS, Math.min(minRetryAfterMs, MAX_POLL_SLEEP_MS));
    await sleepFn(sleepMs);
  }

  return summary;
}

module.exports = {
  DEFAULT_MAX_LOOP_MS,
  DEFAULT_MAX_CHAIN_DEPTH,
  isRateLimitError,
  applyMergedChangesToInventory,
  fetchOpenPullStatesViaGraphql,
  fetchPrChangedFilesAndContents,
  postGuardComment,
  postCommentOnceByMarker,
  processAutoMergeQueue
};

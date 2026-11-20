#!/usr/bin/env node

const path = require('path');
const { execFileSync } = require('child_process');
const {
  AUTO_MERGE_DELAY_MS,
  COMMENT_MARKER,
  buildNoticeMarker,
  normalizeGithubPrFiles,
  evaluatePrGuard,
  evaluateAutoMergeCandidate,
  formatMaintainerNoticeComment,
  listProfileFiles,
  listCheerFiles,
  parseMaintainers
} = require('./pr-guard');

const DEFAULT_MAX_LOOP_MS = 15 * 60 * 1000;
const DEFAULT_MAX_CHAIN_DEPTH = 20;
const MIN_POLL_SLEEP_MS = 15 * 1000;
const MAX_POLL_SLEEP_MS = 30 * 1000;

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

async function upsertCommentByMarker({ github, owner, repo, issueNumber, marker = COMMENT_MARKER, body, core }) {
  try {
    const comments = await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100
    });
    const existing = [...comments]
      .reverse()
      .find((comment) => String(comment.body || '').includes(marker));

    if (existing) {
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existing.id,
        body
      });
      return { action: 'updated', commentId: existing.id };
    }

    const created = await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body
    });
    return { action: 'created', commentId: created?.data?.id || null };
  } catch (error) {
    core?.warning?.(`Failed to upsert comment on PR #${issueNumber}: ${error.message}`);
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
  const summary = {
    passes: 0,
    merged: [],
    noticed: [],
    skipped: [],
    dispatchedPages: 0,
    continuedChain: false
  };

  while (true) {
    summary.passes += 1;

    try {
      refreshMainFn(workspace);
    } catch (refreshError) {
      core?.warning?.(`Failed to refresh main branch before queue pass: ${refreshError.message}`);
    }

    const openPulls = await github.paginate(github.rest.pulls.list, {
      owner,
      repo,
      state: 'open',
      base: 'main',
      sort: 'created',
      direction: 'asc',
      per_page: 100
    });

    let mergedInPass = 0;
    let waitingCount = 0;
    let minRetryAfterMs = MAX_POLL_SLEEP_MS;

    for (const pr of openPulls) {
      const headSha = String(pr.head?.sha || '').trim();
      const prAuthor = String(pr.user?.login || '').trim();

      let reviews = [];
      let checkRuns = [];
      let workflowRuns = [];

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
        existingProfileFiles: listProfilesFn(workspace),
        existingCheerFiles: listCheersFn(workspace),
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

        // Refresh local main immediately so subsequent PRs in the same pass recheck against the new tree.
        try {
          refreshMainFn(workspace);
        } catch (refreshError) {
          core?.warning?.(`Failed to refresh main after merging PR #${pr.number}: ${refreshError.message}`);
        }
      } catch (mergeError) {
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

    if (nowFn() - startMs >= maxLoopMs) {
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
  fetchPrChangedFilesAndContents,
  upsertCommentByMarker,
  postCommentOnceByMarker,
  processAutoMergeQueue
};

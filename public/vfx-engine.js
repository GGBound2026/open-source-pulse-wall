(function initPulseWallVfx(globalScope) {
  'use strict';

  // 8 Override Energy Spectra (used in Dimension 2 Showcase & optional tint override)
  const SPECTRA = {
    'cyan-volt': {
      deep: '#1e3a8a',
      main: '#0ea5e9',
      bright: '#7dd3fc',
      core: '#ffffff',
      spark: '#fde047',
      accent: '#38bdf8',
      ink: '#0f172a',
      rgb: '14, 165, 233'
    },
    'solar-gold': {
      deep: '#9a3412',
      main: '#f59e0b',
      bright: '#fde047',
      core: '#fffdf0',
      spark: '#fb7185',
      accent: '#fef08a',
      ink: '#291508',
      rgb: '245, 158, 11'
    },
    'emerald-jade': {
      deep: '#065f46',
      main: '#10b981',
      bright: '#5eead4',
      core: '#f0fdfa',
      spark: '#fde047',
      accent: '#f59e0b',
      ink: '#042f2e',
      rgb: '16, 185, 129'
    },
    'sakura-neon': {
      deep: '#9d174d',
      main: '#ec4899',
      bright: '#f9a8d4',
      core: '#fff1f2',
      spark: '#fde047',
      accent: '#22d3ee',
      ink: '#3b0724',
      rgb: '236, 72, 153'
    },
    'prism-rainbow': {
      deep: '#6d28d9',
      main: '#a855f7',
      bright: '#38bdf8',
      core: '#ffffff',
      spark: '#fde047',
      accent: '#f472b6',
      ink: '#1a1033',
      rgb: '168, 85, 247',
      rainbow: ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    },
    'amethyst-void': {
      deep: '#4c1d95',
      main: '#9333ea',
      bright: '#d8b4fe',
      core: '#faf5ff',
      spark: '#38bdf8',
      accent: '#fbbf24',
      ink: '#150a2c',
      rgb: '147, 51, 234'
    },
    'crimson-ember': {
      deep: '#991b1b',
      main: '#ef4444',
      bright: '#fb923c',
      core: '#fff7ed',
      spark: '#fde047',
      accent: '#facc15',
      ink: '#2b0a0a',
      rgb: '239, 68, 68'
    },
    'frost-opal': {
      deep: '#1d4ed8',
      main: '#60a5fa',
      bright: '#bae6fd',
      core: '#ffffff',
      spark: '#e879f9',
      accent: '#2dd4bf',
      ink: '#0d1b38',
      rgb: '96, 165, 250'
    }
  };

  // 16 Distinct Mythic, Elemental & Easter-Egg Top-Tier Frame-Break Lineages
  const LINEAGES = [
    {
      id: 'dragon-summon',
      family: '西幻 · 龙宠',
      name: '炎龙血脉',
      label: '焚天古龙王',
      desc: '巨型炽金圣冠古龙展翼绕卡盘旋，扫射炽热熔金龙息灼亮卡框！',
      swatch: ['#dc2626', '#fb923c', '#fde047'],
      nativeSpec: {
        deep: '#7f1d1d', main: '#ef4444', bright: '#fb923c', core: '#fff7ed',
        spark: '#fde047', accent: '#f59e0b', ink: '#290808', rgb: '239, 68, 68'
      }
    },
    {
      id: 'hero-slays-dragon',
      family: '史诗 · 剧场',
      name: '勇者屠龙',
      label: '圣光斩穹 · 屠龙史诗',
      desc: '毒焰恶龙盘踞卡角咆哮，圣光勇者凌空冲锋斩出耀金十字圣剑波！',
      swatch: ['#2563eb', '#facc15', '#10b981'],
      nativeSpec: {
        deep: '#1e3a8a', main: '#2563eb', bright: '#93c5fd', core: '#ffffff',
        spark: '#facc15', accent: '#10b981', ink: '#0f172a', rgb: '37, 99, 235'
      }
    },
    {
      id: 'seraph-descent',
      family: '神圣 · 天使',
      name: '炽天使降临',
      label: '六翼炽天使 · 圣光天穹',
      desc: '哥特玫瑰圣环绽放天光圣柱，六翼炽天使挥落双柄天枪与圣光彩带加冕本卡！',
      swatch: ['#e0f2fe', '#38bdf8', '#fbbf24'],
      nativeSpec: {
        deep: '#0369a1', main: '#38bdf8', bright: '#e0f2fe', core: '#ffffff',
        spark: '#fbbf24', accent: '#f59e0b', ink: '#0c4a6e', rgb: '56, 189, 248'
      }
    },
    {
      id: 'abyss-demon',
      family: '暗黑 · 恶魔',
      name: '深渊魔王',
      label: '深渊魔君 · 炎狱锁链',
      desc: '展翼魔君踏破暗紫深渊降临，交叉撕裂猩红魔爪并甩出三条燃火黑铁魔链紧锁卡框！',
      swatch: ['#18181b', '#e11d48', '#c026d3'],
      nativeSpec: {
        deep: '#18181b', main: '#e11d48', bright: '#f43f5e', core: '#ffe4e6',
        spark: '#c026d3', accent: '#f97316', ink: '#09090b', rgb: '225, 29, 72'
      }
    },
    {
      id: 'thunder-zeus',
      family: '元素 · 闪电',
      name: '雷神裁决',
      label: '万雷天罚 · 雷神战锤',
      desc: '乌云翻涌间符文雷神之锤携电光砸落卡顶，炸出四向高压分叉狂雷环绕卡框！',
      swatch: ['#312e81', '#06b6d4', '#e0f2fe'],
      nativeSpec: {
        deep: '#1e1b4b', main: '#06b6d4', bright: '#67e8f9', core: '#ffffff',
        spark: '#a78bfa', accent: '#38bdf8', ink: '#0f172a', rgb: '6, 182, 212'
      }
    },
    {
      id: 'paladin-cavalry',
      family: '西幻 · 骑士',
      name: '圣殿骑士团',
      label: '圣殿骑兵总攻',
      desc: '皇家十字纹章圣盾悬空展开，五名星灵重装枪骑自双翼纵队交错冲锋引爆星爆！',
      swatch: ['#1d4ed8', '#eab308', '#dc2626'],
      nativeSpec: {
        deep: '#1e3a8a', main: '#2563eb', bright: '#93c5fd', core: '#f8fafc',
        spark: '#eab308', accent: '#dc2626', ink: '#0f172a', rgb: '37, 99, 235'
      }
    },
    {
      id: 'sword-immortal',
      family: '中式 · 修仙',
      name: '青莲剑仙',
      label: '万剑归宗',
      desc: '巨幅青玉金莲与八卦天阵悬空展开，十二柄流光飞剑齐射环绕斩击本卡四边！',
      swatch: ['#059669', '#5eead4', '#eab308'],
      nativeSpec: {
        deep: '#065f46', main: '#10b981', bright: '#5eead4', core: '#f0fdfa',
        spark: '#fde047', accent: '#eab308', ink: '#022c22', rgb: '16, 185, 129'
      }
    },
    {
      id: 'vermilion-phoenix',
      family: '中式 · 神鸟',
      name: '朱雀涅槃',
      label: '九霄朱雀 · 涅槃凤舞',
      desc: '绯金朱雀踏破烈焰莲华曼陀罗，拖曳五彩孔雀翎尾绕卡翩跹起舞，引燃涅槃火环与炽羽！',
      swatch: ['#b91c1c', '#f97316', '#fde047'],
      nativeSpec: {
        deep: '#7f1d1d', main: '#dc2626', bright: '#fb923c', core: '#fffbeb',
        spark: '#fde047', accent: '#14b8a6', ink: '#290707', rgb: '220, 38, 38'
      }
    },
    {
      id: 'celestial-butterfly',
      family: '幻境 · 蝶梦',
      name: '幻光星蝶',
      label: '织梦星蝶 · 浮光掠影',
      desc: '琉璃彩翼织梦主蝶在绯月星环中立体振翅，引领七只幻光星蝶沿双螺旋虹带萦绕卡框！',
      swatch: ['#db2777', '#c084fc', '#38bdf8'],
      nativeSpec: {
        deep: '#831843', main: '#ec4899', bright: '#f472b6', core: '#fff1f2',
        spark: '#38bdf8', accent: '#c084fc', ink: '#3b0724', rgb: '236, 72, 153'
      }
    },
    {
      id: 'chrono-clockwork',
      family: '秘境 · 时序',
      name: '永恒时计',
      label: '苍穹星钟 · 时序逆转',
      desc: '三联精密星钟齿轮在蓝晶表盘间咬合飞转，金针归零瞬爆逆转时空震波与八枚时晶棱锋！',
      swatch: ['#0369a1', '#38bdf8', '#fbbf24'],
      nativeSpec: {
        deep: '#0c4a6e', main: '#0284c7', bright: '#7dd3fc', core: '#f0f9ff',
        spark: '#fbbf24', accent: '#38bdf8', ink: '#082f49', rgb: '2, 132, 199'
      }
    },
    {
      id: 'arcane-cosmos',
      family: '西幻 · 魔法',
      name: '星界天象',
      label: '诸神黄昏 · 星界禁咒',
      desc: '紫金六芒星阵叠合黄金星象仪与双侧符文子阵，降下星光圣柱与六颗紫金陨星！',
      swatch: ['#1e1b4b', '#7c3aed', '#fbbf24'],
      nativeSpec: {
        deep: '#312e81', main: '#7c3aed', bright: '#c4b5fd', core: '#ffffff',
        spark: '#fbbf24', accent: '#e879f9', ink: '#1e1b4b', rgb: '124, 58, 237'
      }
    },
    {
      id: 'kunpeng-whale',
      family: '中式 · 化形',
      name: '逍遥鲲鹏',
      label: '化鲲为鹏 · 扶摇九万里',
      desc: '荧光灵鲲破碧蓝水环跃起，在云爆中化形为遮天金青大鹏绕卡扶摇挥洒云羽！',
      swatch: ['#0284c7', '#14b8a6', '#f59e0b'],
      nativeSpec: {
        deep: '#0f766e', main: '#14b8a6', bright: '#67e8f9', core: '#f0fdfa',
        spark: '#f59e0b', accent: '#fbbf24', ink: '#083344', rgb: '20, 184, 166'
      }
    },
    {
      id: 'raging-tsunami',
      family: '元素 · 沧海',
      name: '沧海怒涛',
      label: '怒海狂澜 · 惊涛拍岸',
      desc: '浮世绘巨浪自双翼拔海而起卷出雪白浪爪，怒涛拍击卡框炸裂层层飞沫与回旋激流！',
      swatch: ['#0c4a6e', '#0284c7', '#e0f2fe'],
      nativeSpec: {
        deep: '#082f49', main: '#0284c7', bright: '#38bdf8', core: '#f0f9ff',
        spark: '#bae6fd', accent: '#14b8a6', ink: '#041e30', rgb: '2, 132, 199'
      }
    },
    {
      id: 'meteor-shower',
      family: '星象 · 流星',
      name: '星穹陨雨',
      label: '天穹流星 · 群星坠落',
      desc: '斜裂星穹骤降十道炽焰彗尾流星雨，巨型火流星俯冲撞击卡缘绽放陨星冲击环与漫天星尘！',
      swatch: ['#312e81', '#f97316', '#fef08a'],
      nativeSpec: {
        deep: '#312e81', main: '#f97316', bright: '#fde047', core: '#ffffff',
        spark: '#38bdf8', accent: '#fb7185', ink: '#1e1b4b', rgb: '249, 115, 22'
      }
    },
    {
      id: 'glacial-freeze',
      family: '元素 · 极寒',
      name: '绝对零度',
      label: '冰封千里 · 永冬凛域',
      desc: '绝对零度霜环席卷卡面，六出冰华雪晶凌空绽放，十四簇棱面冰山尖晶破框冰封四野！',
      swatch: ['#1e3a8a', '#38bdf8', '#f0f9ff'],
      nativeSpec: {
        deep: '#1e3a8a', main: '#0ea5e9', bright: '#bae6fd', core: '#ffffff',
        spark: '#e0f2fe', accent: '#67e8f9', ink: '#082f49', rgb: '14, 165, 233'
      }
    },
    {
      id: 'shadow-eminence',
      family: '彩蛋 · 暗影',
      name: '影之实力者',
      label: '雨夜武心祭 · I AM ATOMIC',
      desc: '彩蛋加长剧场：武心祭暴雨夜高速一敌二！黑金兜帽赤瞳暗影大人绕卡上下疾闪拉出残影，与白金精灵剑士贝阿朵莉丝、炽焰公主爱丽丝全框激战，震退狂笑「フハハハ!!」，终以加长版紫蓝 I AM ATOMIC 震散暴雨！',
      swatch: ['#09090b', '#7c3aed', '#ef4444'],
      nativeSpec: {
        deep: '#09090b', main: '#7c3aed', bright: '#c084fc', core: '#f5f3ff',
        spark: '#ef4444', accent: '#38bdf8', ink: '#020617', rgb: '124, 58, 237'
      }
    }
  ];

  const LINEAGE_MAP = Object.fromEntries(LINEAGES.map((l) => [l.id, l]));

  const ARCHETYPES = LINEAGES.map((l) => ({
    id: l.id,
    label: l.label,
    desc: l.desc,
    family: l.family,
    lineageName: l.name,
    swatch: l.swatch
  }));

  const TIER_ARCHETYPES = {
    1: ARCHETYPES,
    2: ARCHETYPES,
    3: ARCHETYPES
  };

  // Backward-compatible aliases for any legacy saved/DOM IDs
  const LEGACY_ALIAS = {
    'whip-lightning': 'thunder-zeus',
    'arc-spark': 'thunder-zeus',
    'chain-tempest': 'thunder-zeus',
    'thunder-tribulation': 'thunder-zeus',
    'star-slash': 'sword-immortal',
    'glint-cut': 'sword-immortal',
    'cross-cleave': 'hero-slays-dragon',
    'ink-dragon': 'vermilion-phoenix',
    'orbit-comet': 'vermilion-phoenix',
    'meteor-graze': 'arcane-cosmos',
    'galaxy-slingshot': 'kunpeng-whale',
    'dragon-flame': 'dragon-summon',
    'ember-lick': 'dragon-summon',
    'phoenix-sovereign': 'vermilion-phoenix',
    'vermilion-phoenix': 'vermilion-phoenix',
    'frost-fenrir': 'chrono-clockwork',
    'aurora-ribbon': 'chrono-clockwork',
    'breeze-silk': 'seraph-descent',
    'prism-lattice': 'arcane-cosmos',
    'void-rift': 'abyss-demon',
    'micro-rift': 'abyss-demon',
    'portal-barrage': 'abyss-demon',
    'arcane-circle': 'arcane-cosmos',
    'astral-meteor': 'arcane-cosmos',
    'nine-tail-fox': 'celestial-butterfly',
    'petal-tempest': 'celestial-butterfly',
    'petal-drift': 'celestial-butterfly',
    'vortex-maelstrom': 'celestial-butterfly',
    'crystal-fae': 'celestial-butterfly',
    'shockwave-nova': 'paladin-cavalry',
    'corner-ripple': 'paladin-cavalry',
    'supernova-pulse': 'seraph-descent'
  };

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpPt(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  function cubicPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    return {
      x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
      y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
    };
  }

  function cubicTangent(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function catmullRom(pts, t) {
    if (!pts.length) return { x: 0, y: 0 };
    if (pts.length === 1) return pts[0];
    const scaled = clamp(t, 0, 0.9999) * (pts.length - 1);
    const idx = Math.floor(scaled);
    const lt = scaled - idx;
    const p0 = pts[Math.max(0, idx - 1)];
    const p1 = pts[idx];
    const p2 = pts[Math.min(pts.length - 1, idx + 1)];
    const p3 = pts[Math.min(pts.length - 1, idx + 2)];
    const tt = lt * lt;
    const ttt = tt * lt;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * lt + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * lt + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt)
    };
  }

  function rectCenter(rect) {
    return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
  }

  function edgePoint(rect, side, ratio) {
    const r = Number.isFinite(ratio) ? ratio : 0.5;
    if (side === 'top') return { x: rect.left + rect.width * r, y: rect.top, nx: 0, ny: -1, side, ratio: r };
    if (side === 'bottom') return { x: rect.left + rect.width * r, y: rect.bottom, nx: 0, ny: 1, side, ratio: r };
    if (side === 'left') return { x: rect.left, y: rect.top + rect.height * r, nx: -1, ny: 0, side, ratio: r };
    return { x: rect.right, y: rect.top + rect.height * r, nx: 1, ny: 0, side, ratio: r };
  }

  function facingEdgeOnRect(fromPt, targetRect) {
    const c = rectCenter(targetRect);
    const dx = fromPt.x - c.x;
    const dy = fromPt.y - c.y;
    const normX = dx / Math.max(1, targetRect.width * 0.5);
    const normY = dy / Math.max(1, targetRect.height * 0.5);
    let side = 'top';
    let ratio = 0.5;
    if (Math.abs(normX) >= Math.abs(normY)) {
      side = normX >= 0 ? 'right' : 'left';
      ratio = clamp((fromPt.y - targetRect.top) / Math.max(1, targetRect.height), 0.16, 0.84);
    } else {
      side = normY >= 0 ? 'bottom' : 'top';
      ratio = clamp((fromPt.x - targetRect.left) / Math.max(1, targetRect.width), 0.16, 0.84);
    }
    const pt = edgePoint(targetRect, side, ratio);
    return { ...pt, side, ratio };
  }

  function buildDisplacedArc(p0, p1, p2, p3, segments, jitterScale, seedOffset, decay = 0.63) {
    const pts = [];
    for (let i = 0; i <= segments; i += 1) {
      pts.push(cubicPoint(p0, p1, p2, p3, i / segments));
    }
    const offsets = new Float32Array(segments + 1);
    function subdivide(l, r, amp) {
      if (r - l <= 1) return;
      const m = (l + r) >> 1;
      const env = Math.sin((m / segments) * Math.PI);
      const sharp = (Math.random() < 0.5 ? -1 : 1) * rand(0.45, 1.05);
      const wave = Math.sin(m * 2.3 + seedOffset) * 0.25 + sharp * 0.95;
      offsets[m] = (offsets[l] + offsets[r]) * 0.5 + wave * amp * (0.28 + 0.72 * env);
      subdivide(l, m, amp * decay);
      subdivide(m, r, amp * decay);
    }
    subdivide(0, segments, jitterScale);
    for (let i = 1; i < segments; i += 1) {
      const dx = pts[i + 1].x - pts[i - 1].x;
      const dy = pts[i + 1].y - pts[i - 1].y;
      const len = Math.hypot(dx, dy) || 1;
      pts[i].x += (-dy / len) * offsets[i];
      pts[i].y += (dx / len) * offsets[i];
    }
    return pts;
  }

  function strokePolyline(ctx, pts, count) {
    const limit = Math.min(pts.length, Math.max(2, count));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < limit; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  function safeLinearGradient(ctx, x1, y1, x2, y2, fallbackColor) {
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      return null;
    }
    if (Math.hypot(x2 - x1, y2 - y1) < 0.5) {
      return ctx.createLinearGradient(x1, y1, x1 + 1, y1 + 1);
    }
    return ctx.createLinearGradient(x1, y1, x2, y2);
  }

  function makeStrokeStyle(ctx, spec, x1, y1, x2, y2) {
    if (spec.rainbow) {
      const grad = safeLinearGradient(ctx, x1, y1, x2, y2);
      if (grad) {
        spec.rainbow.forEach((c, idx) => grad.addColorStop(idx / (spec.rainbow.length - 1), c));
        return grad;
      }
    }
    return spec.main;
  }

  function roundedRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function drawTaperedRibbon(ctx, pts, maxHalfW, colorStyle, alphaVal, power = 1.35) {
    if (pts.length < 3 || alphaVal <= 0.01) return;
    const leftSide = [];
    const rightSide = [];
    for (let i = 0; i < pts.length; i += 1) {
      const t = i / (pts.length - 1);
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const halfW = Math.pow(t, power) * maxHalfW;
      leftSide.push({ x: pts[i].x + nx * halfW, y: pts[i].y + ny * halfW });
      rightSide.push({ x: pts[i].x - nx * halfW, y: pts[i].y - ny * halfW });
    }
    ctx.globalAlpha = alphaVal;
    ctx.fillStyle = colorStyle;
    ctx.beginPath();
    ctx.moveTo(leftSide[0].x, leftSide[0].y);
    for (let i = 1; i < leftSide.length; i += 1) ctx.lineTo(leftSide[i].x, leftSide[i].y);
    for (let i = rightSide.length - 1; i >= 0; i -= 1) ctx.lineTo(rightSide[i].x, rightSide[i].y);
    ctx.closePath();
    ctx.fill();
  }

  function drawStarBloom(ctx, x, y, radius, coreColor, glowColor, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0.2 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.9);
    halo.addColorStop(0, `rgba(255,255,255,${alpha * 0.92})`);
    halo.addColorStop(0.42, glowColor);
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = alpha * 0.65;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const r = i % 2 === 0 ? radius : radius * 0.22;
      const a = (i * Math.PI) / 4;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ===========================================================================
  // 16 BESPOKE PROCEDURAL SPRITES (DISTINCT SILHOUETTES & RICH COLOR WORLDS)
  // ===========================================================================

  // 1. WESTERN WINGED FIRE DRAGON (炎龙血脉)
  function drawWingedDragon(ctx, x, y, angle, scale, age, tier, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    const wingSpeed = tier === 1 ? 18 : (tier === 2 ? 14 : 11.5);
    const flap = Math.sin(age * wingSpeed);
    const wingLift = flap * (tier === 1 ? 13 : 18);
    const tailWave = Math.sin(age * 12) * 7.5;

    const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, 48);
    aura.addColorStop(0, `rgba(${spec.rgb}, ${alpha * 0.48})`);
    aura.addColorStop(0.5, `rgba(251, 146, 60, ${alpha * 0.22})`);
    aura.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    if (tier >= 3) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.88;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(-2, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.arc(-2, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 7.2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.bezierCurveTo(-24, tailWave * 0.8, -37, -tailWave, -50, tailWave * 0.72);
    ctx.stroke();
    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 4.2;
    ctx.stroke();
    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const tx = -50;
    const ty = tailWave * 0.72;
    ctx.fillStyle = spec.spark;
    ctx.strokeStyle = spec.deep;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(tx - 9, ty);
    ctx.quadraticCurveTo(tx - 2, ty - 6, tx + 3.5, ty);
    ctx.quadraticCurveTo(tx - 2, ty + 6, tx - 9, ty);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (const sign of [-1, 1]) {
      ctx.save();
      const tipX = -15 - flap * 4.5;
      const tipY = sign * (37 + wingLift * 0.88);
      const midX = 6;
      const midY = sign * (24 + wingLift * 0.48);
      const backX = -28;
      const backY = sign * (19 + wingLift * 0.36);
      const notchX = -19;
      const notchY = sign * (25 + wingLift * 0.55);

      const wingGrad = ctx.createLinearGradient(4, 0, tipX, tipY);
      wingGrad.addColorStop(0, spec.deep);
      wingGrad.addColorStop(0.5, spec.main);
      wingGrad.addColorStop(0.84, spec.bright);
      wingGrad.addColorStop(1, spec.spark);

      ctx.globalAlpha = alpha * 0.94;
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(7, sign * 3);
      ctx.quadraticCurveTo(midX + 8, midY, tipX, tipY);
      ctx.quadraticCurveTo(notchX + 2, notchY * 0.88, notchX, notchY);
      ctx.quadraticCurveTo(backX + 3, backY * 0.92, backX, backY);
      ctx.quadraticCurveTo(-18, sign * 10, -12, sign * 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.88;
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(6, sign * 3);
      ctx.lineTo(tipX * 0.93, tipY * 0.93);
      ctx.moveTo(2, sign * 3);
      ctx.lineTo(notchX * 0.9, notchY * 0.9);
      ctx.moveTo(-2, sign * 3);
      ctx.lineTo(backX * 0.9, backY * 0.92);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    const bodyGrad = ctx.createLinearGradient(-16, 0, 26, 0);
    bodyGrad.addColorStop(0, spec.deep);
    bodyGrad.addColorStop(0.5, spec.main);
    bodyGrad.addColorStop(1, spec.bright);
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.ellipse(-2, 0, 15, tier === 1 ? 7.2 : 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(8, -4.4);
    ctx.quadraticCurveTo(17, -6.2, 25, -2.5);
    ctx.lineTo(30, 0);
    ctx.lineTo(25, 3.0);
    ctx.quadraticCurveTo(17, 5.8, 8, 4.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = tier >= 2 ? 2.4 : 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(15, -3.8);
    ctx.lineTo(tier >= 2 ? 6 : 9, tier >= 2 ? -11.5 : -8.5);
    ctx.moveTo(15, 3.8);
    ctx.lineTo(tier >= 2 ? 6 : 9, tier >= 2 ? 11.5 : 8.5);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(28, 0, tier >= 2 ? 2.6 : 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(22, -1.5, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // 2. HERO KNIGHT vs EVIL EMERALD DRAGON (勇者屠龙 · 双角色微型史诗剧场!)
  function drawHeroKnight(ctx, x, y, scale, age, tier, slashAngle, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Radiant hero aura
    const aura = ctx.createRadialGradient(0, -4, 3, 0, -4, 36);
    aura.addColorStop(0, `rgba(250, 204, 21, ${alpha * (tier >= 2 ? 0.52 : 0.25)})`);
    aura.addColorStop(0.55, `rgba(37, 99, 235, ${alpha * 0.25})`);
    aura.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -4, 36, 0, Math.PI * 2);
    ctx.fill();

    // Billowing Royal Cobalt Cape (animated wave behind hero!)
    const capeWave = Math.sin(age * 16) * 6;
    ctx.globalAlpha = alpha;
    const capeGrad = ctx.createLinearGradient(-34, -8, 2, 16);
    capeGrad.addColorStop(0, tier >= 3 ? '#facc15' : '#1d4ed8');
    capeGrad.addColorStop(0.55, '#2563eb');
    capeGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = capeGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, -12);
    ctx.bezierCurveTo(-18, -16 + capeWave * 0.4, -30, -4 - capeWave * 0.5, -38, 12 + capeWave);
    ctx.quadraticCurveTo(-24, 18 + capeWave * 0.4, -10, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Armored Legs & Silver Torso Cuirass
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, 6);
    ctx.lineTo(-10, 22);
    ctx.lineTo(-4, 22);
    ctx.lineTo(1, 10);
    ctx.lineTo(8, 22);
    ctx.lineTo(14, 20);
    ctx.lineTo(7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const chestGrad = ctx.createLinearGradient(-7, -12, 10, 8);
    chestGrad.addColorStop(0, '#f8fafc');
    chestGrad.addColorStop(0.6, '#cbd5e1');
    chestGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = chestGrad;
    ctx.beginPath();
    ctx.roundRect(-7, -12, 15, 19, 4);
    ctx.fill();
    ctx.stroke();

    // Golden Shoulder Pauldron & Cross on Chest
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(1, -9);
    ctx.lineTo(1, 3);
    ctx.moveTo(-4, -4);
    ctx.lineTo(6, -4);
    ctx.stroke();

    // Knight Visor Helmet + Fluttering Crimson/Gold Plume
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(1, -20, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark visor slit
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(2, -20);
    ctx.lineTo(9, -19.5);
    ctx.stroke();

    // Flowing Helmet Crest Plume
    ctx.fillStyle = tier >= 3 ? '#facc15' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-2, -28);
    ctx.quadraticCurveTo(-15, -34 + capeWave * 0.4, -22, -24 + capeWave * 0.5);
    ctx.quadraticCurveTo(-12, -22, -4, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heater Kite Shield on off-hand
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-11, -8);
    ctx.lineTo(1, -8);
    ctx.lineTo(1, 2);
    ctx.quadraticCurveTo(-5, 10, -11, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Raised Swinging Greatsword / Glowing Excalibur!
    ctx.save();
    ctx.translate(6, -7);
    ctx.rotate(slashAngle);
    const bladeLen = tier === 1 ? 30 : (tier === 2 ? 42 : 52);

    // Excalibur Holy Glow
    if (tier >= 2) {
      ctx.strokeStyle = `rgba(250, 204, 21, ${alpha * 0.55})`;
      ctx.lineWidth = tier >= 3 ? 11 : 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(bladeLen + 4, 0);
      ctx.stroke();
    }

    // Sword Blade
    const swordG = ctx.createLinearGradient(0, -3, bladeLen, 3);
    swordG.addColorStop(0, tier >= 2 ? '#fde047' : '#cbd5e1');
    swordG.addColorStop(0.55, '#ffffff');
    swordG.addColorStop(1, tier >= 2 ? '#facc15' : '#94a3b8');
    ctx.fillStyle = swordG;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, -3.4);
    ctx.lineTo(bladeLen - 7, -3.0);
    ctx.lineTo(bladeLen + 2, 0);
    ctx.lineTo(bladeLen - 7, 3.0);
    ctx.lineTo(2, 3.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Golden Crossguard
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.rect(-1, -8.5, 4, 17);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawEvilWyrm(ctx, x, y, scale, age, tier, hurtFlash, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const wingFlap = Math.sin(age * 13) * 14;
    const bob = Math.sin(age * 9) * 3;

    // Toxic dark-violet / venom-emerald miasma aura
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
    aura.addColorStop(0, `rgba(132, 204, 22, ${alpha * 0.35})`);
    aura.addColorStop(0.55, `rgba(88, 28, 135, ${alpha * 0.42})`);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();

    // Jagged Dark-Emerald & Violet Tattered Wyrm Wings (facing left toward Hero!)
    ctx.globalAlpha = alpha;
    const wGrad = ctx.createLinearGradient(4, -6, 36, -34 - wingFlap);
    wGrad.addColorStop(0, '#052e16');
    wGrad.addColorStop(0.55, '#065f46');
    wGrad.addColorStop(1, '#6b21a8');
    ctx.fillStyle = hurtFlash > 0.2 ? '#fef08a' : wGrad;
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -4 + bob);
    ctx.quadraticCurveTo(22, -26 - wingFlap * 0.6, 38, -32 - wingFlap);
    ctx.lineTo(30, -14 - wingFlap * 0.4);
    ctx.lineTo(42, -6 - wingFlap * 0.3);
    ctx.lineTo(24, 6);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Coiled Armored Wyrm Neck & Spiked Tail
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, 24);
    ctx.bezierCurveTo(10, 26, 22, 2, 2, -6 + bob);
    ctx.stroke();
    ctx.strokeStyle = hurtFlash > 0.2 ? '#bef264' : '#047857';
    ctx.lineWidth = 8.5;
    ctx.stroke();
    ctx.strokeStyle = '#84cc16';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Snarling Horned Wyrm Head facing LEFT!
    ctx.save();
    ctx.translate(-2, -10 + bob);
    ctx.fillStyle = hurtFlash > 0.2 ? '#fef08a' : '#065f46';
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 1.5;
    // Upper jaw
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-14, 1);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Lower roaring jaw
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(-14, 9);
    ctx.lineTo(-10, 12);
    ctx.lineTo(8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jagged Obsidian-Violet Horns
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -7);
    ctx.lineTo(18, -19);
    ctx.moveTo(8, -4);
    ctx.lineTo(22, -11);
    ctx.stroke();

    // Blazing Venom-Lime Eye & Mouth Glow
    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.arc(-5, -3.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(-12, 4, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // 3. SIX-WINGED SERAPH ARCHANGEL + CATHEDRAL ROSE HALO (炽天使降临)
  function drawRoseHalo(ctx, cx, cy, radius, age, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);

    const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.25);
    bg.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.92})`);
    bg.addColorStop(0.42, `rgba(56, 189, 248, ${alpha * 0.34})`);
    bg.addColorStop(0.76, `rgba(251, 191, 36, ${alpha * 0.22})`);
    bg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(age * 0.55);
    ctx.globalAlpha = alpha * 0.92;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
    ctx.stroke();

    // 12 Gothic Cathedral Rose Petals
    for (let i = 0; i < 12; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 6);
      ctx.strokeStyle = i % 2 === 0 ? '#f59e0b' : '#0284c7';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.25);
      ctx.quadraticCurveTo(radius * 0.18, -radius * 0.62, 0, -radius * 0.96);
      ctx.quadraticCurveTo(-radius * 0.18, -radius * 0.62, 0, -radius * 0.25);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSeraphAngel(ctx, x, y, scale, age, tier, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const wingPairs = tier === 1 ? 1 : (tier === 2 ? 2 : 3);
    const flap = Math.sin(age * 6.5) * 0.12;

    // Radiant sky-gold backlit aura so pure white wings pop crisply against cream paper!
    const aura = ctx.createRadialGradient(0, -4, 4, 0, -4, 58);
    aura.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
    aura.addColorStop(0.45, `rgba(${spec.rgb},${alpha * 0.44})`);
    aura.addColorStop(0.8, `rgba(251,191,36,${alpha * 0.22})`);
    aura.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -4, 58, 0, Math.PI * 2);
    ctx.fill();

    // Layered Feathered Angel Wings (2 / 4 / 6 wings!)
    const pairConfigs = [
      { ang: -0.35 + flap, len: 52, yOff: -8, fill: '#ffffff', edge: '#0284c7' },
      { ang: 0.12 - flap * 0.7, len: 42, yOff: 0, fill: '#f0f9ff', edge: '#d97706' },
      { ang: 0.52 + flap * 0.5, len: 34, yOff: 8, fill: '#e0f2fe', edge: '#0369a1' }
    ];

    for (let p = 0; p < wingPairs; p += 1) {
      const cfg = pairConfigs[p];
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 6, cfg.yOff);
        ctx.scale(side, 1);
        ctx.rotate(cfg.ang);
        ctx.globalAlpha = alpha * 0.96;

        const wg = ctx.createLinearGradient(0, 0, cfg.len, -18);
        wg.addColorStop(0, '#ffffff');
        wg.addColorStop(0.65, cfg.fill);
        wg.addColorStop(1, spec.bright);
        ctx.fillStyle = wg;
        ctx.strokeStyle = cfg.edge;
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(cfg.len * 0.45, -22, cfg.len, -16);
        ctx.lineTo(cfg.len * 0.84, -4);
        ctx.lineTo(cfg.len * 0.92, 4);
        ctx.lineTo(cfg.len * 0.68, 7);
        ctx.lineTo(cfg.len * 0.72, 14);
        ctx.quadraticCurveTo(cfg.len * 0.35, 16, 0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gold feather highlights
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(4, 2);
        ctx.lineTo(cfg.len * 0.88, -11);
        ctx.moveTo(4, 5);
        ctx.lineTo(cfg.len * 0.78, 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Flowing White-Gold Seraphim Robe Silhouette (Tier 2+)
    if (tier >= 2) {
      ctx.globalAlpha = alpha;
      const robeG = ctx.createLinearGradient(0, -16, 0, 26);
      robeG.addColorStop(0, '#ffffff');
      robeG.addColorStop(0.55, '#e0f2fe');
      robeG.addColorStop(1, '#bae6fd');
      ctx.fillStyle = robeG;
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(8, 2, 13, 24);
      ctx.quadraticCurveTo(0, 29, -13, 24);
      ctx.quadraticCurveTo(-8, 2, 0, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden sash
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(5, 4);
      ctx.stroke();

      // Luminous Head
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, -20, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Floating Golden Celestial Ring Halo above head!
    ctx.save();
    ctx.translate(0, tier >= 2 ? -31 : -16);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 4.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 4.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawAngelFeather(ctx, x, y, angle, size, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.quadraticCurveTo(0, -size * 0.42, -size, 0);
    ctx.quadraticCurveTo(0, size * 0.42, size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-size * 0.85, 0);
    ctx.lineTo(size * 0.85, 0);
    ctx.stroke();
    ctx.restore();
  }

  // 4. ABYSSAL DEMON LORD + CLAW SLASHES + SPIKED HELL CHAINS (深渊魔王)
  function drawDemonVisage(ctx, cx, cy, scale, age, tier, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Swirling Obsidian-Crimson Abyssal Portal
    const portal = ctx.createRadialGradient(0, 0, 4, 0, 0, 56);
    portal.addColorStop(0, `rgba(9, 9, 11, ${alpha * 0.94})`);
    portal.addColorStop(0.58, `rgba(88, 28, 135, ${alpha * 0.72})`);
    portal.addColorStop(0.84, `rgba(${spec.rgb}, ${alpha * 0.56})`);
    portal.addColorStop(1, 'rgba(9, 9, 11, 0)');
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();

    // Tattered Bat-Demon Wings in Tier 3
    if (tier >= 3) {
      const flap = Math.sin(age * 9) * 8;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.scale(s, 1);
        ctx.globalAlpha = alpha * 0.92;
        const wg = ctx.createLinearGradient(8, 0, 62, -26 - flap);
        wg.addColorStop(0, '#09090b');
        wg.addColorStop(0.65, '#4c0519');
        wg.addColorStop(1, spec.main);
        ctx.fillStyle = wg;
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.quadraticCurveTo(36, -34 - flap, 64, -22 - flap);
        ctx.lineTo(50, -2 - flap * 0.4);
        ctx.lineTo(58, 12);
        ctx.lineTo(36, 8);
        ctx.lineTo(28, 20);
        ctx.quadraticCurveTo(18, 10, 12, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // Looming Shadow Demon Skull & Ridged Curved Obsidian Horns
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(16, -14, 14, 6);
    ctx.lineTo(0, 18);
    ctx.lineTo(-14, 6);
    ctx.quadraticCurveTo(-16, -14, 0, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Huge Sweeping Curved Demon Horns!
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s, 1);
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = spec.main;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(9, -11);
      ctx.bezierCurveTo(22, -22, 34, -26, 26, -42);
      ctx.bezierCurveTo(24, -29, 14, -24, 5, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Blazing Glowing Crimson Slit Eyes + Hellfire Crown Mark
    const pulse = 0.8 + 0.2 * Math.sin(age * 14);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = spec.main;
    ctx.shadowBlur = 8;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 3.5, -2);
      ctx.lineTo(s * 10.5, -5.5 * pulse);
      ctx.lineTo(s * 8.5, 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Glowing Crimson Rune Seal on Forehead
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(3, -8);
    ctx.lineTo(0, -4);
    ctx.lineTo(-3, -8);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawDemonClawSlash(ctx, p0, p1, progress, width, spec, alpha) {
    if (progress <= 0.01 || alpha <= 0.01) return;
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    ctx.save();
    for (const offset of [-1, 0, 1]) {
      const shift = offset * width * 0.9;
      const s0 = { x: p0.x + nx * shift, y: p0.y + ny * shift };
      const s1 = { x: p1.x + nx * shift, y: p1.y + ny * shift };
      const mid = { x: lerp(s0.x, s1.x, 0.5) + nx * 12, y: lerp(s0.y, s1.y, 0.5) + ny * 12 };
      const pts = [];
      const steps = 12;
      for (let i = 0; i <= steps; i += 1) {
        const t = (i / steps) * progress;
        const u = 1 - t;
        pts.push({
          x: u * u * s0.x + 2 * u * t * mid.x + t * t * s1.x,
          y: u * u * s0.y + 2 * u * t * mid.y + t * t * s1.y
        });
      }
      drawTaperedRibbon(ctx, pts, offset === 0 ? 7.5 : 5.2, '#09090b', alpha * 0.85, 0.7);
      drawTaperedRibbon(ctx, pts, offset === 0 ? 4.4 : 3.0, spec.main, alpha * 0.95, 0.8);
      drawTaperedRibbon(ctx, pts, offset === 0 ? 1.8 : 1.1, '#ffe4e6', alpha, 0.9);
    }
    ctx.restore();
  }

  function drawHellChain(ctx, p0, p1, progress, age, spec, alpha) {
    if (progress <= 0.02 || alpha <= 0.01) return;
    const end = lerpPt(p0, p1, progress);
    const mid = { x: lerp(p0.x, end.x, 0.5), y: lerp(p0.y, end.y, 0.5) + Math.sin(age * 16) * 14 };
    const links = Math.max(4, Math.floor(Math.hypot(end.x - p0.x, end.y - p0.y) / 14));

    ctx.save();
    for (let i = 0; i <= links; i += 1) {
      const t = i / links;
      const u = 1 - t;
      const pt = {
        x: u * u * p0.x + 2 * u * t * mid.x + t * t * end.x,
        y: u * u * p0.y + 2 * u * t * mid.y + t * t * end.y
      };
      const t2 = Math.min(1, t + 0.05);
      const u2 = 1 - t2;
      const pt2 = {
        x: u2 * u2 * p0.x + 2 * u2 * t2 * mid.x + t2 * t2 * end.x,
        y: u2 * u2 * p0.y + 2 * u2 * t2 * mid.y + t2 * t2 * end.y
      };
      const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x);

      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(ang);
      ctx.globalAlpha = alpha;
      // Outer dark iron link + molten red inner rim
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, i % 2 === 0 ? 4.2 : 2.4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = i % 2 === 0 ? spec.main : '#f97316';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();
    }

    // Barbed Demon Spear-Hook at Tip
    const hookAng = Math.atan2(end.y - mid.y, end.x - mid.x);
    ctx.save();
    ctx.translate(end.x, end.y);
    ctx.rotate(hookAng);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-4, -9);
    ctx.lineTo(1, 0);
    ctx.lineTo(-4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // 5. STORMHAMMER (雷神之锤 Mjölnir) + THUNDERHEAD CLOUD (雷神裁决)
  function drawStormCloud(ctx, cx, cy, scale, age, flash, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const g = ctx.createRadialGradient(0, -4, 4, 0, 0, 56);
    g.addColorStop(0, flash > 0.4 ? `rgba(103, 232, 249, ${alpha * 0.92})` : `rgba(49, 46, 129, ${alpha * 0.88})`);
    g.addColorStop(0.55, `rgba(15, 23, 42, ${alpha * 0.85})`);
    g.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(-22, 4, 22, 0, Math.PI * 2);
    ctx.arc(0, -6, 28, 0, Math.PI * 2);
    ctx.arc(24, 3, 21, 0, Math.PI * 2);
    ctx.fill();

    // Inner cyan-white lightning vein glow inside cloud
    if (flash > 0.25) {
      ctx.globalAlpha = alpha * flash;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-18, -2);
      ctx.lineTo(-4, -9);
      ctx.lineTo(6, -1);
      ctx.lineTo(20, -6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStormHammer(ctx, x, y, angle, scale, age, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Electric plasma halo around hammerhead
    const halo = ctx.createRadialGradient(0, -8, 2, 0, -8, 34);
    halo.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.88})`);
    halo.addColorStop(0.45, `rgba(${spec.rgb}, ${alpha * 0.65})`);
    halo.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, -8, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    // Leather-wrapped Handle & Pommel
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-3.2, 2, 6.4, 24, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 27, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Beveled Metallic Uru Hammerhead
    const hg = ctx.createLinearGradient(-18, -20, 18, 4);
    hg.addColorStop(0, '#f8fafc');
    hg.addColorStop(0.45, '#94a3b8');
    hg.addColorStop(1, '#334155');
    ctx.fillStyle = hg;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(16, -20);
    ctx.lineTo(20, -14);
    ctx.lineTo(20, -2);
    ctx.lineTo(16, 4);
    ctx.lineTo(-16, 4);
    ctx.lineTo(-20, -2);
    ctx.lineTo(-20, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Cyan Nordic Rune Carving on Hammer Face!
    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 0);
    ctx.moveTo(-8, -12);
    ctx.lineTo(0, -6);
    ctx.lineTo(8, -12);
    ctx.stroke();
    ctx.restore();
  }

  // 6. ROYAL PALADIN CREST SHIELD & GALLOPING JOUSTING KNIGHT (圣殿骑士团)
  function drawPaladinShield(ctx, cx, cy, scale, age, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
    aura.addColorStop(0, `rgba(250, 204, 21, ${alpha * 0.6})`);
    aura.addColorStop(0.55, `rgba(${spec.rgb}, ${alpha * 0.35})`);
    aura.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    // Shield Base
    const sg = ctx.createLinearGradient(-22, -26, 22, 28);
    sg.addColorStop(0, '#1d4ed8');
    sg.addColorStop(0.5, '#1e40af');
    sg.addColorStop(1, '#0f172a');
    ctx.fillStyle = sg;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-22, -24);
    ctx.lineTo(22, -24);
    ctx.lineTo(22, 0);
    ctx.quadraticCurveTo(20, 22, 0, 30);
    ctx.quadraticCurveTo(-20, 22, -22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Embossed Golden Heraldic Cross + Shining Star Center
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-4, -22, 8, 48);
    ctx.fillRect(-19, -7, 38, 8);
    drawStarBloom(ctx, 0, -3, 10, '#ffffff', '#facc15', alpha);
    ctx.restore();
  }

  function drawJoustingKnight(ctx, x, y, angle, scale, age, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    const gallop = Math.sin(age * 20) * 5;
    const flagWave = Math.sin(age * 18) * 5;

    // Wind-piercing blue-gold cone around couched jousting lance!
    const cone = ctx.createLinearGradient(54, 0, -10, 0);
    cone.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.92})`);
    cone.addColorStop(0.45, `rgba(${spec.rgb}, ${alpha * 0.52})`);
    cone.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(56, -2);
    ctx.lineTo(-10, -18);
    ctx.lineTo(-10, 14);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = alpha;
    // Armored Warhorse Charger Silhouette (royal cobalt caparison + silver barding)
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(-6, 5, 19, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Horse Neck & Armored Chamfron Head
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(7, 2);
    ctx.lineTo(18, -11);
    ctx.lineTo(26, -6);
    ctx.lineTo(22, 0);
    ctx.lineTo(12, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Galloping Legs
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.lineTo(18 + gallop, 20);
    ctx.moveTo(-18, 10);
    ctx.lineTo(-28 - gallop, 19);
    ctx.stroke();

    // Mounted Silver Paladin Torso + Plumed Helmet
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(-10, -14, 11, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4, -19, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crimson Knight Plume
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-7, -23);
    ctx.quadraticCurveTo(-18, -28 + flagWave * 0.5, -24, -18 + flagWave * 0.4);
    ctx.lineTo(-9, -19);
    ctx.closePath();
    ctx.fill();

    // Long Couched Golden-Silver Jousting Lance + Fluttering Crimson Pennant!
    const lg = ctx.createLinearGradient(-12, -3, 56, -2);
    lg.addColorStop(0, '#eab308');
    lg.addColorStop(0.5, '#f8fafc');
    lg.addColorStop(1, '#ffffff');
    ctx.fillStyle = lg;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(54, -2);
    ctx.lineTo(-10, 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fluttering Crimson-Gold Tournament Pennant on Lance!
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(28, -2);
    ctx.lineTo(10, -13 + flagWave * 0.5);
    ctx.lineTo(16, -6 + flagWave * 0.3);
    ctx.lineTo(8, 2 + flagWave * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 7. XIANXIA CELADON JADE FLYING SWORDS + LOTUS + BAGUA (青莲剑仙)
  function drawImmortalLotus(ctx, cx, cy, radius, rotation, tiltY, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, tiltY);
    ctx.rotate(rotation);
    for (let i = 0; i < 8; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 8);
      const grad = ctx.createLinearGradient(0, -radius * 0.45, 0, -radius * 1.22);
      grad.addColorStop(0, `rgba(${spec.rgb}, ${alpha * 0.25})`);
      grad.addColorStop(0.6, `rgba(${spec.rgb}, ${alpha * 0.72})`);
      grad.addColorStop(1, `rgba(254, 240, 138, ${alpha * 0.94})`);
      ctx.fillStyle = grad;
      ctx.strokeStyle = spec.bright;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.45);
      ctx.quadraticCurveTo(radius * 0.28, -radius * 0.85, 0, -radius * 1.24);
      ctx.quadraticCurveTo(-radius * 0.28, -radius * 0.85, 0, -radius * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBaguaCircle(ctx, cx, cy, radius, rotation, tiltY, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 4 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, tiltY);

    const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.2);
    bg.addColorStop(0, `rgba(${spec.rgb}, ${alpha * 0.42})`);
    bg.addColorStop(0.65, `rgba(2, 44, 34, ${alpha * 0.56})`);
    bg.addColorStop(1, 'rgba(2, 44, 34, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(rotation);
    ctx.globalAlpha = alpha * 0.95;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      if (i === 0) ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
      else ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    ctx.closePath();
    ctx.stroke();

    const trigrams = [
      [1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1],
      [1, 1, 0], [0, 1, 0], [1, 0, 0], [0, 0, 0]
    ];
    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 4);
      const bars = trigrams[i];
      for (let b = 0; b < 3; b += 1) {
        const y = -radius * (0.70 + b * 0.085);
        const half = radius * 0.14;
        ctx.beginPath();
        if (bars[b]) {
          ctx.moveTo(-half, y);
          ctx.lineTo(half, y);
        } else {
          ctx.moveTo(-half, y);
          ctx.lineTo(-half * 0.22, y);
          ctx.moveTo(half * 0.22, y);
          ctx.lineTo(half, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    const r = radius * 0.42;
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0fdfa';
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.arc(0, r * 0.5, r * 0.5, Math.PI / 2, -Math.PI / 2, true);
    ctx.arc(0, -r * 0.5, r * 0.5, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(0, -r * 0.5, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0fdfa';
    ctx.beginPath();
    ctx.arc(0, r * 0.5, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawImmortalSword(ctx, x, y, angle, scale, age, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    const glow = ctx.createLinearGradient(-22, 0, 36, 0);
    glow.addColorStop(0, `rgba(${spec.rgb}, 0)`);
    glow.addColorStop(0.5, `rgba(${spec.rgb}, ${alpha * 0.58})`);
    glow.addColorStop(1, `rgba(255,255,255,${alpha * 0.9})`);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();

    const bladeGrad = ctx.createLinearGradient(-10, -4, 36, 4);
    bladeGrad.addColorStop(0, spec.deep);
    bladeGrad.addColorStop(0.42, spec.bright);
    bladeGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(36, 0);
    ctx.lineTo(25, -3.5);
    ctx.lineTo(-10, -3.1);
    ctx.lineTo(-10, 3.1);
    ctx.lineTo(25, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(33, 0);
    ctx.stroke();

    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#422006';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-9, -8.8);
    ctx.lineTo(-13, -6);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-13, 6);
    ctx.lineTo(-9, 8.8);
    ctx.lineTo(-6.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-21, 0);
    ctx.stroke();

    const wave = Math.sin(age * 16) * 4;
    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-21, 0);
    ctx.quadraticCurveTo(-29, wave, -37, -wave * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  // 8. VERMILION PHOENIX + LOTUS FLAME MANDALA (朱雀涅槃)
  function drawPhoenixMandala(ctx, cx, cy, radius, rotation, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);

    const glow = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 1.28);
    glow.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.72})`);
    glow.addColorStop(0.42, `rgba(${spec.rgb}, ${alpha * 0.48})`);
    glow.addColorStop(0.82, `rgba(127, 29, 29, ${alpha * 0.25})`);
    glow.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.28, 0, Math.PI * 2);
    ctx.fill();

    // 16 Scalloped Lotus Flame Petals
    ctx.save();
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha * 0.92;
    for (let i = 0; i < 16; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 16);
      const pg = ctx.createLinearGradient(0, -radius * 0.5, 0, -radius * 1.08);
      pg.addColorStop(0, spec.main);
      pg.addColorStop(0.6, spec.bright);
      pg.addColorStop(1, spec.spark);
      ctx.fillStyle = pg;
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.56);
      ctx.quadraticCurveTo(radius * 0.13, -radius * 0.84, 0, -radius * 1.08);
      ctx.quadraticCurveTo(-radius * 0.13, -radius * 0.84, 0, -radius * 0.56);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Counter-rotating Inner Filigree Octagram + Double Gold Ring
    ctx.save();
    ctx.rotate(-rotation * 1.35);
    ctx.globalAlpha = alpha * 0.94;
    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    for (let sq = 0; sq < 2; sq += 1) {
      ctx.save();
      ctx.rotate((sq * Math.PI) / 4);
      const s = radius * 0.42;
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawVermilionPhoenix(ctx, x, y, angle, scale, age, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    const flap = Math.sin(age * 11.5);
    const wingSpan = 42 + flap * 12;

    // Radiant Phoenix Solar Aura
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 56);
    aura.addColorStop(0, `rgba(255, 251, 235, ${alpha * 0.82})`);
    aura.addColorStop(0.45, `rgba(${spec.rgb}, ${alpha * 0.5})`);
    aura.addColorStop(0.8, `rgba(251, 146, 60, ${alpha * 0.22})`);
    aura.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();

    // 5 Flowing Peacock-Eyespot Phoenix Tail Streamers!
    for (let tIdx = -2; tIdx <= 2; tIdx += 1) {
      const len = 58 - Math.abs(tIdx) * 8;
      const wave = Math.sin(age * 10 - tIdx * 0.9) * (9 + Math.abs(tIdx) * 2);
      const spreadY = tIdx * 8.5;
      const tipX = -len;
      const tipY = spreadY + wave;

      ctx.save();
      ctx.globalAlpha = alpha * 0.92;
      ctx.lineCap = 'round';
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(-10, tIdx * 1.4);
      ctx.bezierCurveTo(-len * 0.38, spreadY * 0.55 - wave * 0.5, -len * 0.72, spreadY + wave * 0.7, tipX, tipY);
      ctx.stroke();

      const tg = ctx.createLinearGradient(-10, 0, tipX, tipY);
      tg.addColorStop(0, spec.main);
      tg.addColorStop(0.58, spec.bright);
      tg.addColorStop(1, spec.spark);
      ctx.strokeStyle = tg;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Jade-Gold Peacock Feather Eyespot at Streamer Tip
      ctx.fillStyle = spec.accent;
      ctx.strokeStyle = spec.spark;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(tipX, tipY, 5.2, 3.6, Math.atan2(wave, -20) * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3-Tier Layered Flame-Feather Wings (symmetric top & bottom in flight space)
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(1, s);
      ctx.globalAlpha = alpha * 0.96;

      // Primary Pinion Plume Layer
      const wg = ctx.createLinearGradient(8, 2, -26, wingSpan);
      wg.addColorStop(0, spec.core);
      wg.addColorStop(0.28, spec.spark);
      wg.addColorStop(0.62, spec.bright);
      wg.addColorStop(1, spec.main);
      ctx.fillStyle = wg;
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.moveTo(10, 3);
      ctx.quadraticCurveTo(4, wingSpan * 0.64, -18, wingSpan);
      ctx.lineTo(-14, wingSpan * 0.72);
      ctx.lineTo(-28, wingSpan * 0.78);
      ctx.lineTo(-20, wingSpan * 0.52);
      ctx.lineTo(-34, wingSpan * 0.54);
      ctx.lineTo(-22, wingSpan * 0.30);
      ctx.quadraticCurveTo(-12, 12, -10, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner Golden Feather Shafts
      ctx.strokeStyle = '#fffbeb';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(6, 4);
      ctx.lineTo(-15, wingSpan * 0.88);
      ctx.moveTo(1, 4);
      ctx.lineTo(-24, wingSpan * 0.68);
      ctx.moveTo(-4, 4);
      ctx.lineTo(-28, wingSpan * 0.48);
      ctx.stroke();
      ctx.restore();
    }

    // Sleek Vermilion-Gold Torso + Graceful Neck & Crown Crest
    ctx.globalAlpha = alpha;
    const bg = ctx.createLinearGradient(-16, 0, 26, 0);
    bg.addColorStop(0, spec.deep);
    bg.addColorStop(0.45, spec.main);
    bg.addColorStop(0.85, spec.bright);
    bg.addColorStop(1, spec.spark);
    ctx.fillStyle = bg;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-1, 0, 14.5, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Arched Neck & Crowned Head
    ctx.beginPath();
    ctx.moveTo(9, -4.2);
    ctx.quadraticCurveTo(18, -7, 25, -2.5);
    ctx.lineTo(31, 0);
    ctx.lineTo(24, 3.2);
    ctx.quadraticCurveTo(16, 5.2, 9, 4.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Triple Sweeping Golden Phoenix Crown Plumes
    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    for (const cOff of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.moveTo(18, cOff * 1.8);
      ctx.quadraticCurveTo(10, cOff * 7.5 - 6, 1, cOff * 11 - 9 + flap * 2.2);
      ctx.stroke();
    }

    // Golden Hooked Beak & Luminous Jewel Eye
    ctx.fillStyle = spec.spark;
    ctx.beginPath();
    ctx.moveTo(27, -2.0);
    ctx.lineTo(34, 0.5);
    ctx.lineTo(27, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(22, -1.2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFlameFeather(ctx, x, y, angle, size, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    const fg = ctx.createLinearGradient(-size, 0, size, 0);
    fg.addColorStop(0, spec.main);
    fg.addColorStop(0.55, spec.bright);
    fg.addColorStop(1, spec.spark);
    ctx.fillStyle = fg;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.quadraticCurveTo(0, -size * 0.44, -size, 0);
    ctx.quadraticCurveTo(0, size * 0.44, size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fffbeb';
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, 0);
    ctx.lineTo(size * 0.85, 0);
    ctx.stroke();
    ctx.restore();
  }

  // 9. CELESTIAL PRISM BUTTERFLY + LUNAR HALO + CRYSTAL MOTES (幻光星蝶)
  function drawCrystalSpark(ctx, x, y, size, rot, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || size <= 0.5 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = spec.spark;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const r = i % 2 === 0 ? size : size * 0.28;
      const a = (i * Math.PI) / 4;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawButterflyMoonRing(ctx, cx, cy, radius, age, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);

    const halo = ctx.createRadialGradient(0, 0, radius * 0.14, 0, 0, radius * 1.32);
    halo.addColorStop(0, `rgba(255, 241, 242, ${alpha * 0.65})`);
    halo.addColorStop(0.45, `rgba(${spec.rgb}, ${alpha * 0.38})`);
    halo.addColorStop(0.8, `rgba(192, 132, 252, ${alpha * 0.22})`);
    halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.32, 0, Math.PI * 2);
    ctx.fill();

    // Tilted Orbital Filigree Rings
    ctx.save();
    ctx.rotate(age * 0.45);
    ctx.globalAlpha = alpha * 0.88;
    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      drawCrystalSpark(ctx, Math.cos(a) * radius, Math.sin(a) * radius, i % 2 === 0 ? 5.5 : 3.8, a, spec, alpha * 0.95);
    }
    ctx.restore();

    // Luminous Iridescent Crescent Moon inside ring
    ctx.save();
    ctx.rotate(-0.35);
    ctx.globalAlpha = alpha * 0.95;
    const mg = ctx.createLinearGradient(-radius * 0.4, -radius * 0.4, radius * 0.4, radius * 0.4);
    mg.addColorStop(0, '#fff1f2');
    mg.addColorStop(0.55, spec.bright);
    mg.addColorStop(1, spec.accent);
    ctx.fillStyle = mg;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.44, 0.42, Math.PI * 2 - 0.42);
    ctx.quadraticCurveTo(-radius * 0.08, 0, Math.cos(0.42) * radius * 0.44, Math.sin(0.42) * radius * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawPrismButterfly(ctx, x, y, angle, scale, flapPhase, spec, alpha, isQueen = false) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // 3D cosine foreshortening for graceful butterfly wing beats
    const wingFold = 0.28 + 0.72 * Math.abs(Math.cos(flapPhase));

    if (isQueen) {
      const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, 44);
      aura.addColorStop(0, `rgba(255, 241, 242, ${alpha * 0.8})`);
      aura.addColorStop(0.5, `rgba(${spec.rgb}, ${alpha * 0.42})`);
      aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(1, side * wingFold);
      ctx.globalAlpha = alpha * 0.95;

      // Upper Forewing (sculpted stained-glass morpho wing)
      const fg = ctx.createLinearGradient(0, 2, -6, 36);
      fg.addColorStop(0, spec.core);
      fg.addColorStop(0.24, spec.spark);
      fg.addColorStop(0.58, spec.main);
      fg.addColorStop(1, spec.deep);
      ctx.fillStyle = fg;
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = isQueen ? 1.5 : 1.25;
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.bezierCurveTo(22, 10, 26, 32, 6, 36);
      ctx.bezierCurveTo(-4, 38, -12, 24, -6, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lower Swallowtail Hindwing
      const hg = ctx.createLinearGradient(-2, 2, -24, 24);
      hg.addColorStop(0, spec.bright);
      hg.addColorStop(0.55, spec.accent);
      hg.addColorStop(1, spec.deep);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.bezierCurveTo(-4, 22, -14, 28, -24, 24);
      ctx.lineTo(-19, 14);
      ctx.quadraticCurveTo(-24, 6, -12, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Delicate Stained-Glass Wing Veins & Pearl Rim Dots
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.lineWidth = isQueen ? 1.15 : 0.9;
      ctx.beginPath();
      ctx.moveTo(2, 4);
      ctx.quadraticCurveTo(14, 16, 12, 30);
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(4, 20, 0, 32);
      ctx.moveTo(-5, 4);
      ctx.lineTo(-19, 20);
      ctx.stroke();

      if (isQueen) {
        ctx.fillStyle = spec.spark;
        ctx.beginPath();
        ctx.arc(8, 22, 2.8, 0, Math.PI * 2);
        ctx.arc(-13, 16, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, 22, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Slender Body + Star-Tipped Antennae
    ctx.globalAlpha = alpha;
    ctx.fillStyle = spec.ink;
    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10.5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = 1.2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(8, s * 1);
      ctx.quadraticCurveTo(14, s * 6, 17, s * 8.5);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(17, s * 8.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 10. CHRONO CLOCKWORK + TIME REVERSAL SHOCKWAVE + CRYSTAL SHARDS (永恒时计)
  function drawClockGear(ctx, cx, cy, outerR, teeth, rot, fillStyle, strokeStyle, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || outerR < 4 || alpha <= 0.01) return;
    const innerR = outerR * 0.80;
    const step = (Math.PI * 2) / teeth;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.25;

    ctx.beginPath();
    for (let i = 0; i < teeth; i += 1) {
      const a0 = i * step;
      const a1 = a0 + step * 0.18;
      const a2 = a0 + step * 0.34;
      const a3 = a0 + step * 0.64;
      const a4 = a0 + step * 0.80;
      if (i === 0) ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      else ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
      ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
      ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Cutout Ring + Spokes
    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.6;
    for (let s = 0; s < 6; s += 1) {
      const sa = (s * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sa) * outerR * 0.56, Math.sin(sa) * outerR * 0.56);
      ctx.stroke();
    }
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 0.19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawAstronomicalClock(ctx, cx, cy, radius, age, p, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 8 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);

    const isReversing = p >= 0.44;
    const reverseSign = isReversing ? -1 : 1;
    const gearRate = isReversing ? age * 3.1 : age * 1.4;

    // Deep Sapphire-Obsidian Celestial Dial Glow
    const dialGlow = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.32);
    dialGlow.addColorStop(0, `rgba(240, 249, 255, ${alpha * 0.36})`);
    dialGlow.addColorStop(0.54, `rgba(8, 47, 73, ${alpha * 0.88})`);
    dialGlow.addColorStop(0.84, `rgba(${spec.rgb}, ${alpha * 0.36})`);
    dialGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = dialGlow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.32, 0, Math.PI * 2);
    ctx.fill();

    // 3 Meshing Counter-Rotating Precision Gears!
    drawClockGear(ctx, -radius * 0.72, -radius * 0.36, radius * 0.36, 10, -gearRate * 1.5 * reverseSign, spec.spark, spec.ink, alpha * 0.95);
    drawClockGear(ctx, radius * 0.72, radius * 0.34, radius * 0.40, 12, -gearRate * 1.25 * reverseSign, spec.bright, spec.ink, alpha * 0.95);
    drawClockGear(ctx, 0, 0, radius * 0.62, 16, gearRate * reverseSign, spec.main, spec.spark, alpha * 0.92);

    // Double Metallic Astral Clock Bezel
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.stroke();

    // 12 Radial Hour Markers (Cardinal Golden Diamonds)
    for (let h = 0; h < 12; h += 1) {
      const ha = (h * Math.PI) / 6 - Math.PI / 2;
      const isCardinal = h % 3 === 0;
      const rx = Math.cos(ha) * radius * 0.94;
      const ry = Math.sin(ha) * radius * 0.94;
      if (isCardinal) {
        drawCrystalSpark(ctx, rx, ry, 5.2, ha, spec, alpha);
      } else {
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ha) * radius * 0.88, Math.sin(ha) * radius * 0.88);
        ctx.lineTo(Math.cos(ha) * radius * 0.98, Math.sin(ha) * radius * 0.98);
        ctx.stroke();
      }
    }

    // Time-Reversal Luminous Arc Trail when spinning backward
    let minAngle;
    let hrAngle;
    if (!isReversing) {
      const fwd = p / 0.44;
      minAngle = -Math.PI / 2 - Math.PI * 1.15 * (1 - fwd * fwd);
      hrAngle = -Math.PI / 2 - Math.PI * 0.25 * (1 - fwd);
    } else {
      const rev = (p - 0.44) / 0.56;
      const sweep = Math.pow(rev, 1.25) * Math.PI * 3.4;
      minAngle = -Math.PI / 2 - sweep;
      hrAngle = -Math.PI / 2 - sweep * 0.35;

      ctx.save();
      ctx.globalAlpha = alpha * 0.65 * (1 - rev * 0.5);
      ctx.strokeStyle = spec.bright;
      ctx.lineWidth = 6.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.72, minAngle, -Math.PI / 2);
      ctx.stroke();
      ctx.strokeStyle = spec.spark;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }

    // Ornate Filigree Hour & Minute Hands
    for (const [handAng, handLen, handW, col] of [
      [hrAngle, radius * 0.52, 3.8, spec.spark],
      [minAngle, radius * 0.78, 2.6, '#ffffff']
    ]) {
      ctx.save();
      ctx.rotate(handAng);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(handLen * 0.25, -handW);
      ctx.lineTo(handLen, 0);
      ctx.lineTo(handLen * 0.25, handW);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawStarBloom(ctx, 0, 0, isReversing ? 11 : 7, '#ffffff', spec.spark, alpha);
    ctx.restore();
  }

  function drawTimePrismShard(ctx, x, y, angle, len, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    // Upper Beveled Facet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-len * 0.15, -len * 0.32);
    ctx.lineTo(-len, 0);
    ctx.closePath();
    ctx.fill();

    // Lower Facet
    const lg = ctx.createLinearGradient(-len, 0, len, 0);
    lg.addColorStop(0, spec.deep);
    lg.addColorStop(0.55, spec.main);
    lg.addColorStop(1, spec.bright);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-len, 0);
    ctx.lineTo(-len * 0.15, len * 0.32);
    ctx.closePath();
    ctx.fill();

    // Crisp Ink Border + Golden Core Glint
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-len * 0.15, -len * 0.32);
    ctx.lineTo(-len, 0);
    ctx.lineTo(-len * 0.15, len * 0.32);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = spec.spark;
    ctx.beginPath();
    ctx.arc(0, 0, len * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 11. COSMIC ARCANE MAGIC CIRCLE + GOLDEN ARMILLARY ASTROLABE (星界天象)
  function drawArcaneCircle(ctx, cx, cy, radius, rotation, tiltY, layers, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 4 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, tiltY);

    const bg = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 1.2);
    bg.addColorStop(0, `rgba(${spec.rgb}, ${alpha * 0.36})`);
    bg.addColorStop(0.56, `rgba(18, 12, 48, ${alpha * 0.62})`);
    bg.addColorStop(0.88, `rgba(14, 10, 36, ${alpha * 0.26})`);
    bg.addColorStop(1, 'rgba(18, 12, 40, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha * 0.94;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.stroke();

    const ticks = layers >= 3 ? 24 : 16;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < ticks; i += 1) {
      const a = (i / ticks) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.90, Math.sin(a) * radius * 0.90);
      ctx.lineTo(Math.cos(a) * radius * 0.98, Math.sin(a) * radius * 0.98);
      ctx.stroke();
    }

    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85);
      else ctx.lineTo(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-rotation * 1.25);
    ctx.globalAlpha = alpha * 0.94;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const a = (i * Math.PI * 2) / 3 + Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85);
      else ctx.lineTo(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85);
    }
    ctx.closePath();
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const a = (i * Math.PI) / 3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85, layers >= 3 ? 3.2 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawAstrolabe(ctx, cx, cy, radius, age, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.18);
    bg.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.72})`);
    bg.addColorStop(0.35, `rgba(30, 27, 75, ${alpha * 0.72})`);
    bg.addColorStop(0.78, `rgba(${spec.rgb}, ${alpha * 0.34})`);
    bg.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.18, 0, Math.PI * 2);
    ctx.fill();

    const rings = [
      { rx: radius, ry: radius * 0.45, rot: age * 1.4 + 0.3, color: '#fbbf24', w: 2.2 },
      { rx: radius * 0.82, ry: radius * 0.38, rot: -age * 2.0 - 0.5, color: spec.bright, w: 1.8 },
      { rx: radius * 0.62, ry: radius * 0.62, rot: age * 0.9, color: '#fde047', w: 1.4 }
    ];
    for (const rg of rings) {
      ctx.save();
      ctx.rotate(rg.rot);
      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = rg.color;
      ctx.lineWidth = rg.w;
      ctx.beginPath();
      ctx.ellipse(0, 0, rg.rx, rg.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      const bx = Math.cos(age * 3.5 + rg.rot) * rg.rx;
      const by = Math.sin(age * 3.5 + rg.rot) * rg.ry;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawStarBloom(ctx, 0, 0, radius * 0.32, '#ffffff', '#fbbf24', alpha);
    ctx.restore();
  }

  // 12. BIOLUMINESCENT CELESTIAL WHALE (鲲) -> GOLDEN-TEAL GIANT ROC (鹏) (逍遥鲲鹏 · 化形!)
  function drawSpiritWhale(ctx, x, y, angle, scale, age, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    const fluke = Math.sin(age * 10) * 8;
    const finWave = Math.sin(age * 8) * 6;

    const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, 48);
    aura.addColorStop(0, `rgba(103, 232, 249, ${alpha * 0.68})`);
    aura.addColorStop(0.5, `rgba(${spec.rgb}, ${alpha * 0.42})`);
    aura.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.96;
    // Flowing Translucent Star-Fin Pectoral Wings (鲲翼鳍)
    for (const s of [-1, 1]) {
      ctx.fillStyle = `rgba(103, 232, 249, ${alpha * 0.72})`;
      ctx.strokeStyle = '#0c4a6e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(4, s * 5);
      ctx.bezierCurveTo(-4, s * (22 + finWave), -20, s * (30 + finWave), -28, s * (16 + finWave * 0.5));
      ctx.quadraticCurveTo(-14, s * 10, -8, s * 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Crescent Bioluminescent Whale Tail Fluke
    ctx.fillStyle = spec.bright;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-36, -15 + fluke * 0.6, -42, -18 + fluke);
    ctx.quadraticCurveTo(-32, 0 + fluke * 0.4, -42, 18 + fluke);
    ctx.quadraticCurveTo(-36, 15 + fluke * 0.6, -22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sculpted Celestial Whale Body (Ocean Teal -> Pearl Belly + Glowing Star Spots!)
    const wg = ctx.createLinearGradient(-24, -10, 26, 10);
    wg.addColorStop(0, '#0c4a6e');
    wg.addColorStop(0.45, spec.main);
    wg.addColorStop(0.85, spec.bright);
    wg.addColorStop(1, '#f0fdfa');
    ctx.fillStyle = wg;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(26, -1);
    ctx.bezierCurveTo(22, -13, 0, -14, -24, -2);
    ctx.lineTo(-24, 2);
    ctx.bezierCurveTo(-2, 13, 18, 12, 26, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Bioluminescent Star-Speckles along Whale Back + Golden Eye!
    ctx.fillStyle = '#fef08a';
    for (const [sx, sy, sr] of [[-12, -2, 1.5], [-4, -5, 1.8], [5, -4, 1.6], [12, -2, 1.4]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(18, -2, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGoldenPeng(ctx, x, y, angle, scale, age, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    const sweep = Math.sin(age * 11) * 16;
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 56);
    aura.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.78})`);
    aura.addColorStop(0.5, `rgba(${spec.rgb}, ${alpha * 0.45})`);
    aura.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();

    // Flowing Turquoise-Gold Cloud Tail Streamers
    for (const po of [-1, 0, 1]) {
      const len = po === 0 ? 58 : 46;
      const wv = Math.sin(age * 10 + po * 1.3) * 9;
      ctx.globalAlpha = alpha * 0.88;
      ctx.strokeStyle = po === 0 ? '#f59e0b' : spec.main;
      ctx.lineWidth = po === 0 ? 4.8 : 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, po * 2);
      ctx.bezierCurveTo(-len * 0.35, po * 9 + wv, -len * 0.7, po * 14 - wv, -len, po * 10 + wv * 0.7);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Colossal Golden-Turquoise Cloud-Feathered Roc Wings (大鹏遮天翼)
    for (const s of [-1, 1]) {
      ctx.save();
      const grad = ctx.createLinearGradient(10, 0, -24, s * (42 + sweep));
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.35, '#f59e0b');
      grad.addColorStop(0.72, spec.main);
      grad.addColorStop(1, '#0c4a6e');
      ctx.globalAlpha = alpha * 0.96;
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#083344';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, s * 2);
      ctx.quadraticCurveTo(6, s * (26 + sweep * 0.6), -14, s * (42 + sweep));
      ctx.lineTo(-10, s * (28 + sweep * 0.55));
      ctx.lineTo(-24, s * (30 + sweep * 0.45));
      ctx.lineTo(-16, s * (16 + sweep * 0.3));
      ctx.lineTo(-28, s * (14 + sweep * 0.2));
      ctx.quadraticCurveTo(-14, s * 4, -8, s * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Radiant Golden Roc Torso & Eagle Beak
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fef9c3';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(2, 0, 14, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(15, -2.5);
    ctx.lineTo(25, 0);
    ctx.lineTo(15, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 13. HOKUSAI BREAKING TSUNAMI WAVE & SEA-FOAM SPRAY (波浪狂涛 · 沧海怒涛)
  function drawBreakingTsunamiWave(ctx, originX, originY, width, height, dir, curl, age, spec, alpha) {
    if (!Number.isFinite(originX) || !Number.isFinite(originY) || height < 8 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(dir, 1);

    const waveGrad = safeLinearGradient(ctx, 0, 8, width * 0.6, -height);
    if (waveGrad) {
      waveGrad.addColorStop(0, spec.deep);
      waveGrad.addColorStop(0.42, spec.main);
      waveGrad.addColorStop(0.8, spec.bright);
      waveGrad.addColorStop(1, '#e0f2fe');
    }

    // Hollow curling inner barrel (deep storm-teal shadow)
    const crestTipX = width * (0.48 + curl * 0.24);
    const crestTipY = -height * (0.94 - curl * 0.1);
    const barrelX = width * 0.28;
    const barrelY = -height * 0.48;

    ctx.globalAlpha = alpha * 0.94;
    ctx.fillStyle = waveGrad || spec.main;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-width * 0.56, 12);
    ctx.bezierCurveTo(-width * 0.34, -height * 0.38, -width * 0.06, -height * 1.06, crestTipX, crestTipY);
    ctx.bezierCurveTo(crestTipX + 24 * curl, crestTipY + height * 0.22, barrelX + 16, barrelY + 4, barrelX - 6, barrelY + height * 0.14);
    ctx.bezierCurveTo(barrelX - 18, -height * 0.16, width * 0.3, 6, width * 0.62, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner ocean barrel shadow crescent
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = spec.deep;
    ctx.beginPath();
    ctx.moveTo(-width * 0.18, 8);
    ctx.bezierCurveTo(-width * 0.04, -height * 0.44, width * 0.18, -height * 0.66, barrelX + 2, barrelY + height * 0.12);
    ctx.bezierCurveTo(width * 0.08, -height * 0.24, width * 0.02, -4, -width * 0.18, 8);
    ctx.closePath();
    ctx.fill();

    // Flowing hydro striations inside wave body (ukiyo-e style)
    ctx.globalAlpha = alpha * 0.76;
    ctx.strokeStyle = spec.spark;
    ctx.lineWidth = 1.5;
    for (let v = 0; v < 4; v += 1) {
      const f = 0.22 + v * 0.18;
      ctx.beginPath();
      ctx.moveTo(-width * (0.48 - v * 0.07), 8);
      ctx.bezierCurveTo(
        -width * (0.24 - v * 0.05), -height * f,
        width * (0.04 + v * 0.04), -height * (f + 0.18),
        crestTipX * (0.62 + v * 0.09), crestTipY * (0.58 + v * 0.11)
      );
      ctx.stroke();
    }

    // Hooked white sea-foam claws erupting off breaking crest
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.3;
    const clawCount = 7;
    for (let i = 0; i < clawCount; i += 1) {
      const t = i / (clawCount - 1);
      const bx = lerp(crestTipX * 0.62, crestTipX + 20 * curl, t);
      const by = lerp(crestTipY * 1.03, crestTipY + height * 0.26 * curl, t * t);
      const clawLen = (11 + Math.sin(i * 1.9 + age * 8) * 4) * (0.75 + curl * 0.45);
      const ca = lerp(-0.55, 0.88, t);
      const tx = bx + Math.cos(ca) * clawLen;
      const ty = by + Math.sin(ca) * clawLen + t * 5;
      ctx.beginPath();
      ctx.moveTo(bx - 4, by - 2);
      ctx.quadraticCurveTo(bx + Math.cos(ca - 0.35) * clawLen * 0.75, by + Math.sin(ca - 0.35) * clawLen * 0.75, tx, ty);
      ctx.quadraticCurveTo(bx + 3, by + 5, bx - 4, by + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Airborne foam spray pearls
    for (let s = 0; s < 6; s += 1) {
      const ang = -0.3 + s * 0.28 + Math.sin(age * 6 + s) * 0.1;
      const dist = 10 + (s % 3) * 11 + curl * 14;
      const sx = crestTipX + Math.cos(ang) * dist;
      const sy = crestTipY + Math.sin(ang) * dist + 4;
      ctx.fillStyle = s % 2 === 0 ? '#ffffff' : spec.spark;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2 + (s % 3) * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawFoamSplashCluster(ctx, x, y, progress, maxR, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || progress >= 1 || alpha <= 0.01) return;
    const inv = 1 - progress;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha * inv;
    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI + (i / 7) * Math.PI;
      const r = maxR * (0.28 + progress * 0.85) * (0.75 + (i % 3) * 0.16);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.68 - progress * 8;
      ctx.strokeStyle = spec.bright;
      ctx.lineWidth = 2.6 * inv;
      ctx.beginPath();
      ctx.moveTo(px * 0.38, py * 0.38);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 3.2 * inv + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 14. METEOR SHOWER BOLIDE HEAD & CRATER IMPACT RING (流星坠落 · 星穹陨雨)
  function drawShootingMeteorHead(ctx, x, y, angle, size, spec, alpha, isHero) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || size <= 0.5 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Outer fiery plasma aura
    const auraR = size * (isHero ? 3.2 : 2.5);
    const aura = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, auraR);
    aura.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.94})`);
    aura.addColorStop(0.32, `rgba(253, 224, 71, ${alpha * 0.72})`);
    aura.addColorStop(0.66, `rgba(${spec.rgb}, ${alpha * 0.38})`);
    aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Parabolic atmospheric reentry shock cone
    ctx.globalAlpha = alpha * 0.92;
    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = isHero ? 3.4 : 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-size * 2.1, -size * 1.45);
    ctx.quadraticCurveTo(size * 1.65, 0, -size * 2.1, size * 1.45);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isHero ? 1.7 : 1.0;
    ctx.beginPath();
    ctx.moveTo(-size * 1.5, -size * 1.05);
    ctx.quadraticCurveTo(size * 1.4, 0, -size * 1.5, size * 1.05);
    ctx.stroke();

    // Faceted molten bolide rock/star core with crisp dark outline
    ctx.fillStyle = spec.main;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = isHero ? 1.8 : 1.2;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i * Math.PI) / 3;
      const rad = i % 2 === 0 ? size : size * 0.8;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawStarBloom(ctx, 0, 0, size * (isHero ? 1.65 : 1.2), '#ffffff', spec.bright, alpha);
    ctx.restore();
  }

  function drawMeteorImpactRing(ctx, x, y, progress, maxR, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || progress >= 1 || alpha <= 0.01) return;
    const inv = 1 - progress;
    const rx = maxR * (0.25 + progress * 0.85);
    const ry = rx * 0.42;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha * inv;

    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 4.5 * inv + 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 2.0 * inv + 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4 + 0.2;
      ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : spec.bright;
      ctx.lineWidth = 1.8 * inv + 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rx * 0.3, Math.sin(a) * ry * 0.3);
      ctx.lineTo(Math.cos(a) * rx * 1.15, Math.sin(a) * ry * 1.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 15. FACETED GLACIER CRYSTAL SPIRE & 6-FOLD SNOWFLAKE (冰封千里 · 绝对零度)
  function drawGlacierCrystalSpire(ctx, x, y, angle, length, width, grow, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || grow <= 0.02 || alpha <= 0.01) return;
    const L = length * grow;
    const W = width * (0.4 + 0.6 * grow);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    // Two smaller flanking side-shards for rich clustered silhouette
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * W * 0.52, L * 0.04);
      ctx.rotate(side * 0.34);
      const sL = L * 0.56;
      const sW = W * 0.48;
      ctx.fillStyle = side < 0 ? spec.bright : spec.main;
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, -sL);
      ctx.lineTo(sW, -sL * 0.25);
      ctx.lineTo(sW * 0.62, 4);
      ctx.lineTo(-sW * 0.62, 4);
      ctx.lineTo(-sW, -sL * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Main central prism spire: lit left half + shaded right half + crisp ridge
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -L);
    ctx.lineTo(-W * 0.85, -L * 0.28);
    ctx.lineTo(-W * 0.55, 5);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();

    const rightGrad = safeLinearGradient(ctx, 0, -L, W, 4);
    if (rightGrad) {
      rightGrad.addColorStop(0, spec.bright);
      rightGrad.addColorStop(0.45, spec.main);
      rightGrad.addColorStop(1, spec.deep);
    }
    ctx.fillStyle = rightGrad || spec.main;
    ctx.beginPath();
    ctx.moveTo(0, -L);
    ctx.lineTo(W * 0.85, -L * 0.28);
    ctx.lineTo(W * 0.55, 5);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();

    // Dark cobalt outer outline & sharp central bevel ridge
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -L);
    ctx.lineTo(W * 0.85, -L * 0.28);
    ctx.lineTo(W * 0.55, 5);
    ctx.lineTo(-W * 0.55, 5);
    ctx.lineTo(-W * 0.85, -L * 0.28);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, -L * 0.94);
    ctx.lineTo(0, 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawDendriticSnowflake(ctx, cx, cy, radius, rotation, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // Cold frost halo backing so snowflake stays radiant on bright ivory & dark space
    const halo = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 1.3);
    halo.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.72})`);
    halo.addColorStop(0.55, `rgba(${spec.rgb}, ${alpha * 0.34})`);
    halo.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawBranches = (strokeColor, width) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (i * Math.PI) / 3;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        ctx.moveTo(0, 0);
        ctx.lineTo(cosA * radius, sinA * radius);

        for (const [frac, branchLen] of [[0.46, radius * 0.34], [0.74, radius * 0.23]]) {
          const bx = cosA * radius * frac;
          const by = sinA * radius * frac;
          for (const side of [-1, 1]) {
            const ba = a + side * 0.78;
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(ba) * branchLen, by + Math.sin(ba) * branchLen);
          }
        }
      }
      ctx.stroke();

      // Inner hexagonal crystal ring
      ctx.beginPath();
      for (let i = 0; i <= 6; i += 1) {
        const a = (i * Math.PI) / 3;
        const rx = Math.cos(a) * radius * 0.34;
        const ry = Math.sin(a) * radius * 0.34;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    };

    // Deep sapphire halo stroke + cyan mid + frost-white crystal core
    drawBranches(spec.ink, 4.4);
    drawBranches(spec.main, 2.5);
    drawBranches('#ffffff', 1.25);

    drawStarBloom(ctx, 0, 0, radius * 0.28, '#ffffff', spec.bright, alpha);
    ctx.restore();
  }

  function drawFrostCreepCorner(ctx, x, y, dirAngle, reach, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || reach < 4 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dirAngle);
    ctx.globalAlpha = alpha * 0.85;
    ctx.lineCap = 'round';
    for (const [color, lw] of [[spec.ink, 3.0], [spec.bright, 1.4]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(reach * 0.55, 0);
      ctx.lineTo(reach, -reach * 0.22);
      ctx.moveTo(reach * 0.32, 0);
      ctx.lineTo(reach * 0.65, reach * 0.28);
      ctx.moveTo(reach * 0.68, -reach * 0.08);
      ctx.lineTo(reach * 0.94, reach * 0.14);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 16. EASTER EGG: S1 EP 20 BUSHIN FESTIVAL RAINY NIGHT 1v2 (彩蛋：影之实力者 · 雨夜一敌二)
  function drawShadowSama(ctx, x, y, scale, pose, age, spec, alpha, facing = 1) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    const isLaugh = pose === 'laugh';
    const isAtomic = pose === 'atomic';
    const isDash = pose === 'dash';
    const laughJitter = isLaugh ? Math.sin(age * 30) * 1.6 : 0;
    const coatBillow = Math.sin(age * (isDash ? 20 : 13)) * (isAtomic ? 10 : (isDash ? 11 : 7));
    const manaViolet = spec.main || '#7c3aed';
    const manaBlue = spec.accent || '#38bdf8';
    const eyeRed = '#ef4444';
    const goldTrim = '#fbbf24';
    const runeGold = '#fde047';

    ctx.save();
    ctx.translate(x, y + laughJitter);
    ctx.scale(facing * scale, scale);

    // Swirling dark violet & electric blue arcane mana aura around Shadow
    const auraR = isAtomic ? 64 : (isDash ? 46 : 54);
    const aura = ctx.createRadialGradient(0, 4, 4, 0, 4, auraR);
    aura.addColorStop(0, `rgba(9, 9, 11, ${alpha * 0.86})`);
    aura.addColorStop(0.48, `rgba(${spec.rgb || '124, 58, 237'}, ${alpha * 0.48})`);
    aura.addColorStop(0.78, `rgba(56, 189, 248, ${alpha * 0.24})`);
    aura.addColorStop(1, 'rgba(9, 9, 11, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 4, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Twin swirling violet & cyan arcane mana tendrils wrapping silhouette
    ctx.save();
    ctx.globalAlpha = alpha * 0.82;
    for (const [col, spd, rMul] of [[manaViolet, 2.8, 1], [manaBlue, -3.4, 0.84]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = isAtomic ? 2.4 : 1.7;
      ctx.beginPath();
      for (let i = 0; i <= 14; i += 1) {
        const t = i / 14;
        const a = t * Math.PI * 2.2 + age * spd;
        const wx = Math.cos(a) * (20 + Math.sin(t * Math.PI) * 12) * rMul;
        const wy = lerp(34, -22, t);
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }
    ctx.restore();

    const leanAngle = isDash ? 0.42 : (pose === 'parry' ? 0.08 : (isAtomic ? -0.05 : -0.03));
    ctx.rotate(leanAngle);

    // 1. Sleek black hooded long coat with intricate gold trim & glowing golden runes
    ctx.globalAlpha = alpha;
    const coatGrad = safeLinearGradient(ctx, -22, -10, 24, 46);
    if (coatGrad) {
      coatGrad.addColorStop(0, '#050507');
      coatGrad.addColorStop(0.55, '#11111a');
      coatGrad.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = coatGrad || '#09090b';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -8);
    ctx.bezierCurveTo(-24 - coatBillow * 0.45, 7, -33 - coatBillow, 27, -35 - coatBillow * 0.9, 44);
    ctx.lineTo(-16 - coatBillow * 0.45, 36);
    ctx.lineTo(-11, 46);
    ctx.lineTo(-4, 24);
    ctx.lineTo(4, 24);
    ctx.lineTo(13 + coatBillow * 0.35, 45);
    ctx.lineTo(19 + coatBillow * 0.45, 35);
    ctx.lineTo(32 + coatBillow * 0.8, 42);
    ctx.bezierCurveTo(26 + coatBillow * 0.4, 21, 18, 6, 11, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tight black high-collar bodysuit & boots underneath
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(-6.5, -7, 13, 29, 3);
    ctx.fill();
    ctx.fillRect(-5.8, 20, 4.2, 19);
    ctx.fillRect(1.6, 20, 4.2, 19);

    // Metallic gold trim along coat lapels & lower coattails + glowing golden runes
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(-4.5, 22);
    ctx.moveTo(8, -7);
    ctx.lineTo(4.5, 22);
    ctx.moveTo(-30 - coatBillow * 0.75, 40);
    ctx.lineTo(-14 - coatBillow * 0.38, 34);
    ctx.moveTo(15 + coatBillow * 0.35, 41);
    ctx.lineTo(28 + coatBillow * 0.68, 39);
    ctx.stroke();

    // Glowing golden arcane rune diamonds along coat edges & hems
    const runePulse = 0.65 + 0.35 * Math.sin(age * 9);
    ctx.save();
    ctx.globalAlpha = alpha * runePulse;
    ctx.fillStyle = runeGold;
    for (const [rx, ry] of [
      [-6.5, 0], [6.5, 0], [-5.2, 11], [5.2, 11],
      [-23 - coatBillow * 0.5, 31], [22 + coatBillow * 0.45, 30]
    ]) {
      ctx.beginPath();
      ctx.moveTo(rx, ry - 2.3);
      ctx.lineTo(rx + 1.8, ry);
      ctx.lineTo(rx, ry + 2.3);
      ctx.lineTo(rx - 1.8, ry);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // High-collar flared neck guard framing deep hood
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.lineTo(-15, -23);
    ctx.lineTo(-6, -18);
    ctx.lineTo(6, -18);
    ctx.lineTo(15, -23);
    ctx.lineTo(13, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Jet-black slim katana gleaming with violet-blue mana
    ctx.save();
    if (isDash) {
      // Forward thrust / slash swing while lunging at high speed
      ctx.translate(10, 0);
      ctx.rotate(0.24 + Math.sin(age * 24) * 0.14);
    } else if (pose === 'parry') {
      // Cross-body calm two-threat katana guard
      ctx.translate(-2, 0);
      ctx.rotate(-0.48 + Math.sin(age * 16) * 0.08);
    } else if (isAtomic) {
      // Raised skyward calling I AM ATOMIC
      ctx.translate(10, -2);
      ctx.rotate(-1.22);
    } else {
      ctx.translate(14, 4);
      ctx.rotate(-0.62 + Math.sin(age * 9) * 0.05);
    }
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(16, -4.5, 46, -1.5);
    ctx.stroke();
    ctx.strokeStyle = manaViolet;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.strokeStyle = manaBlue;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = goldTrim;
    ctx.fillRect(-1, -4, 2.6, 8);
    drawStarBloom(ctx, 46, -1.5, isAtomic ? 12 : 8, '#ffffff', manaBlue, alpha * 0.92);
    ctx.restore();

    // 3. Deep Obsidian Hood + Piercing Glowing Crimson Red Eyes
    ctx.save();
    ctx.translate(0, -19);
    const headTilt = isLaugh ? (-0.20 + Math.sin(age * 24) * 0.08) : (pose === 'parry' ? 0.04 : -0.06);
    ctx.rotate(headTilt);

    // Pale sharp jawline emerging cleanly beneath deep hood shadow
    ctx.fillStyle = '#d1d5db';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-6.6, -2);
    ctx.lineTo(-5.0, 5.4);
    ctx.lineTo(0, 8.8);
    ctx.lineTo(5.0, 5.4);
    ctx.lineTo(6.6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pointed deep hood shrouded in shadow with metallic gold rim
    ctx.fillStyle = '#050507';
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(-12.5, 2.5);
    ctx.bezierCurveTo(-13.5, -10, -7, -18, 0, -21);
    ctx.bezierCurveTo(7, -18, 13.5, -10, 12.5, 2.5);
    ctx.lineTo(7, -1);
    ctx.lineTo(3.5, 2);
    ctx.lineTo(0, -1.5);
    ctx.lineTo(-3.5, 2);
    ctx.lineTo(-7, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Deep facial shadow cavern inside the hood opening
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(0, -2.5, 6.2, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piercing Glowing Crimson Red Eyes shining out of darkness
    for (const side of [-1, 1]) {
      const ex = side * 3.5;
      const ey = -1.6;
      const eyeGlow = ctx.createRadialGradient(ex, ey, 0.4, ex, ey, 7.2);
      eyeGlow.addColorStop(0, `rgba(239, 68, 68, ${alpha * 0.96})`);
      eyeGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(ex, ey, 7.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = eyeRed;
      ctx.beginPath();
      ctx.moveTo(ex - side * 2.8, ey - 1.1);
      ctx.lineTo(ex + side * 2.5, ey - 0.3);
      ctx.lineTo(ex - side * 2.1, ey + 1.3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Crimson eye light-trails streaking back during high-speed dashes!
      if (isDash) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.9})`;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 20, ey - 5);
        ctx.stroke();
      }
    }

    if (isLaugh) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(-3.2, 4.2);
      ctx.quadraticCurveTo(0.2, 7.4, 3.6, 3.9);
      ctx.quadraticCurveTo(0.2, 5.5, -3.2, 4.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gloved hand splayed over half his face in classic maniacal laugh pose
      ctx.save();
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(-13.5, 14.5);
      ctx.lineTo(-6.2, 2.8);
      ctx.lineTo(-2.5, 3.8);
      ctx.lineTo(-9.2, 15.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (const [fx, fy] of [[-7.0, -3.6], [-4.3, -4.6], [-1.7, -3.4]]) {
        ctx.beginPath();
        ctx.moveTo(-4.6, 3.1);
        ctx.lineTo(fx, fy);
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1.9;
        ctx.stroke();
        ctx.strokeStyle = goldTrim;
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  // Beatrix — First War Goddess, Elf Swordmaster (铂金长发 + 精灵尖耳 + 白金露腰战裙 + 银色长剑)
  function drawBeatrixElf(ctx, x, y, scale, pose, age, alpha, facing = 1) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    const isLunge = pose === 'lunge';
    const hairWave = Math.sin(age * 16) * 5.5;
    const gold = '#eab308';
    const ink = '#334155';
    const skin = '#fde6d8';
    const blonde = '#fef9c3';
    const blondeShade = '#e5d399';
    const eyeBlueViolet = '#818cf8';

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing * scale, scale);
    ctx.globalAlpha = alpha;

    // Subtle cool silver-violet aura
    const aura = ctx.createRadialGradient(0, 4, 2, 0, 4, 44);
    aura.addColorStop(0, `rgba(224, 231, 255, ${alpha * 0.56})`);
    aura.addColorStop(0.6, `rgba(129, 140, 248, ${alpha * 0.24})`);
    aura.addColorStop(1, 'rgba(224, 231, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 4, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(isLunge ? 0.24 : -0.10);

    // Long flowing platinum blonde hair streaming dynamically behind
    const hairGrad = safeLinearGradient(ctx, -28, -22, 4, 20);
    if (hairGrad) {
      hairGrad.addColorStop(0, blonde);
      hairGrad.addColorStop(0.65, blondeShade);
      hairGrad.addColorStop(1, '#cbb67c');
    }
    ctx.fillStyle = hairGrad || blonde;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, -22);
    ctx.bezierCurveTo(-18, -16 + hairWave * 0.4, -30, -2 + hairWave, -34, 14 + hairWave * 0.8);
    ctx.lineTo(-20, 12 + hairWave * 0.5);
    ctx.lineTo(-24, 20 + hairWave * 0.7);
    ctx.quadraticCurveTo(-10, 10, -2, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Athletic legs: fair thighs peeking cleanly above knee-high brown leather boots + dark shorts
    ctx.fillStyle = skin;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.0;
    // Front & back legs
    ctx.beginPath();
    ctx.moveTo(-5, 16);
    ctx.lineTo(-10, 28);
    ctx.lineTo(-5, 29);
    ctx.lineTo(0, 17);
    ctx.lineTo(6, 29);
    ctx.lineTo(11, 28);
    ctx.lineTo(5, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Knee-high dark leather boots with gold cuffs
    ctx.fillStyle = '#3f2618';
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.roundRect(-11.5, 25, 6.2, 16, 2);
    ctx.roundRect(5.2, 25, 6.2, 16, 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-11.5, 26);
    ctx.lineTo(-5.3, 26);
    ctx.moveTo(5.2, 26);
    ctx.lineTo(11.4, 26);
    ctx.stroke();

    // Dark athletic shorts & flaring white high-slit combat skirt with gold trim
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 12, 12, 8);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(-6, 9);
    ctx.lineTo(-15 - hairWave * 0.25, 23);
    ctx.lineTo(-6, 21);
    ctx.lineTo(-2, 15);
    ctx.lineTo(3, 15);
    ctx.lineTo(8, 22);
    ctx.lineTo(13, 22);
    ctx.lineTo(6, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(-6, 9.5);
    ctx.lineTo(6, 9.5);
    ctx.moveTo(-14 - hairWave * 0.2, 22);
    ctx.lineTo(-6, 20.5);
    ctx.stroke();

    // Exposed fair midriff waist!
    ctx.fillStyle = skin;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.roundRect(-5, 2, 10, 8, 2);
    ctx.fill();
    ctx.stroke();

    // White sleeveless warrior crop top with gold trim
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6.5, -9);
    ctx.lineTo(6.5, -9);
    ctx.lineTo(5.5, 3);
    ctx.lineTo(-5.5, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-6, -8.5);
    ctx.lineTo(0, -3.5);
    ctx.lineTo(6, -8.5);
    ctx.moveTo(-5.5, 2.5);
    ctx.lineTo(5.5, 2.5);
    ctx.stroke();

    // Sword arm + leather bracer + sleek silver longsword
    ctx.save();
    ctx.translate(4, -5);
    ctx.rotate(isLunge ? -0.18 + Math.sin(age * 18) * 0.08 : -0.82);
    ctx.fillStyle = skin;
    ctx.fillRect(0, -1.8, 12, 3.6);
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.0;
    ctx.fillRect(5, -2.3, 7, 4.6);
    ctx.strokeRect(5, -2.3, 7, 4.6);

    // Sleek mirror-silver longsword blade
    const bladeGrad = safeLinearGradient(ctx, 11, -2, 50, 2);
    if (bladeGrad) {
      bladeGrad.addColorStop(0, '#cbd5e1');
      bladeGrad.addColorStop(0.5, '#ffffff');
      bladeGrad.addColorStop(1, '#e0e7ff');
    }
    ctx.fillStyle = bladeGrad || '#f8fafc';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(12, -1.8);
    ctx.lineTo(49, 0);
    ctx.lineTo(12, 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.fillRect(10.5, -4.5, 2.2, 9);
    drawStarBloom(ctx, 48, 0, isLunge ? 7.5 : 5, '#ffffff', '#a5b4fc', alpha * 0.9);
    ctx.restore();

    // Head: fair anime face, calm pale blue-violet eyes, side-part blonde hair + POINTED ELF EAR!
    ctx.save();
    ctx.translate(0, -17.5);
    ctx.fillStyle = skin;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.arc(0, 0, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Signature pointed elf ear jutting backward cleanly past hair
    ctx.fillStyle = skin;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-4.5, -1);
    ctx.lineTo(-14.5, -4.5);
    ctx.lineTo(-5.8, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Calm & sharp pale blue-violet eye
    ctx.fillStyle = eyeBlueViolet;
    ctx.beginPath();
    ctx.ellipse(2.6, 0.2, 2.0, 1.2, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.2, 0, 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Side-parted platinum blonde bangs framing temple without hiding elf ear
    ctx.fillStyle = blonde;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-6.8, -1.5);
    ctx.bezierCurveTo(-6.5, -8.5, 6.5, -9, 7.2, -1);
    ctx.lineTo(5.2, -3.5);
    ctx.lineTo(1.8, -0.5);
    ctx.lineTo(-1.8, -3.8);
    ctx.lineTo(-5.4, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // Iris Midgar — First Princess & Crimson Knight Commander (绯红长直发 + 红黑军装 + 金肩章 + 红披风 + 烈焰大剑)
  function drawIrisPrincess(ctx, x, y, scale, pose, age, alpha, facing = -1) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    const isCleave = pose === 'cleave';
    const capeWave = Math.sin(age * 15) * 6.0;
    const crimsonHair = '#dc2626';
    const uniformRed = '#b91c1c';
    const uniformBlack = '#18181b';
    const gold = '#fbbf24';
    const ink = '#450a0a';

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing * scale, scale);
    ctx.globalAlpha = alpha;

    // Fiery crimson aura glow
    const aura = ctx.createRadialGradient(0, 4, 2, 0, 4, 46);
    aura.addColorStop(0, `rgba(251, 146, 60, ${alpha * 0.44})`);
    aura.addColorStop(0.55, `rgba(220, 38, 38, ${alpha * 0.28})`);
    aura.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 4, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(isCleave ? 0.22 : -0.10);

    // Flowing red shoulder cape with gold border trim billowing behind
    ctx.fillStyle = '#991b1b';
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.bezierCurveTo(-20 - capeWave * 0.4, 2, -29 - capeWave * 0.8, 18, -32 - capeWave, 33);
    ctx.lineTo(-10 - capeWave * 0.3, 27);
    ctx.lineTo(2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Long straight crimson red hair streaming sleekly in the rain
    const redHairGrad = safeLinearGradient(ctx, -26, -24, 2, 16);
    if (redHairGrad) {
      redHairGrad.addColorStop(0, '#ef4444');
      redHairGrad.addColorStop(0.5, crimsonHair);
      redHairGrad.addColorStop(1, '#7f1d1d');
    }
    ctx.fillStyle = redHairGrad || crimsonHair;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(-3, -23);
    ctx.lineTo(-27 - capeWave * 0.25, 16);
    ctx.lineTo(-16 - capeWave * 0.2, 18);
    ctx.lineTo(-10, 6);
    ctx.lineTo(-1, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fitted white trousers & knee-high heeled dark knight boots with gold cuff trim
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-5, 11);
    ctx.lineTo(-10, 27);
    ctx.lineTo(-5, 28);
    ctx.lineTo(0, 15);
    ctx.lineTo(6, 28);
    ctx.lineTo(10.5, 27);
    ctx.lineTo(5, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.roundRect(-11, 24, 5.8, 17, 1.5);
    ctx.roundRect(5, 24, 5.8, 17, 1.5);
    ctx.fill();
    ctx.strokeRect(-11, 24, 5.8, 3);
    ctx.strokeRect(5, 24, 5.8, 3);

    // Ornate crimson & black military-style knight uniform coat with gold epaulets & braiding
    ctx.fillStyle = uniformRed;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7.5, -9);
    ctx.lineTo(7.5, -9);
    ctx.lineTo(8, 12);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Black waistcoat front panel + gold coat trim
    ctx.fillStyle = uniformBlack;
    ctx.fillRect(-3.6, -8.5, 7.2, 20);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-7.5, -9);
    ctx.lineTo(-3.6, 11.5);
    ctx.moveTo(7.5, -9);
    ctx.lineTo(3.6, 11.5);
    ctx.moveTo(-8, 6);
    ctx.lineTo(8, 6);
    ctx.stroke();

    // Prominent royal gold epaulets on both shoulders
    ctx.fillStyle = gold;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(-6.8, -8.5, 4.2, 2.3, -0.2, 0, Math.PI * 2);
    ctx.ellipse(6.8, -8.5, 4.2, 2.3, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // White gloved sword arm + broadsword engulfed in blazing crimson flames!
    ctx.save();
    ctx.translate(5, -5);
    ctx.rotate(isCleave ? -0.15 + Math.sin(age * 20) * 0.09 : -0.78);
    ctx.fillStyle = uniformRed;
    ctx.fillRect(0, -2, 8, 4);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.9;
    ctx.fillRect(6, -2.1, 6, 4.2);
    ctx.strokeRect(6, -2.1, 6, 4.2);

    // Royal broadsword
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(12, -2.8);
    ctx.lineTo(48, 0);
    ctx.lineTo(12, 2.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blazing crimson & golden-orange flames licking along broadsword blade
    const flicker = Math.sin(age * 26) * 2.4;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.bezierCurveTo(22, -5 - flicker, 34, 4 + flicker, 50, -1);
    ctx.stroke();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 4.5;
    ctx.stroke();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.fillRect(10.5, -5.2, 2.6, 10.4);
    ctx.restore();

    // Head: sharp determined face, fierce crimson red eyes, straight red bangs
    ctx.save();
    ctx.translate(0, -17.5);
    ctx.fillStyle = '#fde6d8';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.arc(0, 0, 6.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fierce crimson eye
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(2.6, 0.2, 2.0, 1.15, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.1, 0, 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Straight crimson bangs with glossy highlight
    ctx.fillStyle = crimsonHair;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-6.8, 1);
    ctx.bezierCurveTo(-7, -8.5, 6.5, -9, 7, -1);
    ctx.lineTo(4.2, -3.2);
    ctx.lineTo(1.5, 0.2);
    ctx.lineTo(-1.5, -2.8);
    ctx.lineTo(-4.8, 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // Heavy Rainy Night Arena covering full card perimeter + Atomic Freeze/Vaporization
  function drawRainyNightStage(ctx, focusX, focusY, rect, age, rainFreezeP, rainDisperseP, spec, alpha, vpW, vpH) {
    if (!Number.isFinite(focusX) || !Number.isFinite(focusY) || alpha <= 0.01) return;
    ctx.save();

    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const stageFade = alpha * (1 - rainDisperseP * 0.78);

    // Subtle stormy backlighting mist tracking around the full card battle zone
    const nightBg = ctx.createRadialGradient(focusX, focusY, 10, cx, cy, Math.max(rect.width, rect.height) * 0.95);
    nightBg.addColorStop(0, `rgba(15, 23, 42, ${stageFade * 0.58})`);
    nightBg.addColorStop(0.55, `rgba(30, 27, 75, ${stageFade * 0.34})`);
    nightBg.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = nightBg;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 12, rect.width * 0.88, rect.height * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    // 34 slanted pouring rain streaks spanning above, below, and sides of card
    ctx.lineCap = 'round';
    const xMin = Math.max(8, rect.left - 56);
    const xMax = Math.min(vpW - 8, rect.right + 56);
    const yMin = Math.max(12, rect.top - 82);
    const yMax = Math.min(vpH - 12, rect.bottom + 54);
    const bandW = Math.max(80, xMax - xMin);
    const spanH = Math.max(80, yMax - yMin);
    const freezeMul = 1 - clamp(rainFreezeP, 0, 0.96);

    for (let i = 0; i < 34; i += 1) {
      const seed = (i * 0.6180339) % 1;
      const rxBase = xMin + seed * bandW;
      const effectiveAge = age * (1 - rainFreezeP * 0.7);
      const fallPhase = ((effectiveAge * (2.5 + (i % 4) * 0.3) * freezeMul + seed * 4.3) % 1);
      const ryBase = yMin + fallPhase * spanH;

      let x1 = rxBase;
      let y1 = ryBase;
      let dx = -9;
      let dy = 24;
      let dropAlpha = stageFade * (0.34 + 0.36 * Math.sin(fallPhase * Math.PI));

      if (rainDisperseP > 0) {
        const pushAngle = Math.atan2(y1 - cy, x1 - cx);
        const pushDist = rainDisperseP * 110;
        x1 += Math.cos(pushAngle) * pushDist;
        y1 += Math.sin(pushAngle) * pushDist;
        dx = Math.cos(pushAngle) * 28;
        dy = Math.sin(pushAngle) * 28;
        dropAlpha *= 1 - rainDisperseP;
      }

      if (dropAlpha <= 0.02) continue;
      ctx.globalAlpha = dropAlpha;
      ctx.strokeStyle = i % 3 === 0 ? spec.accent : '#cbd5e1';
      ctx.lineWidth = i % 4 === 0 ? 1.7 : 1.15;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + dx, y1 + dy);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBeatrixSilverArc(ctx, x, y, radius, startA, endA, progress, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || progress >= 1 || alpha <= 0.01) return;
    const sweep = lerp(startA, endA, clamp(progress * 1.45, 0, 1));
    const fade = (1 - progress) * alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.globalAlpha = fade * 0.85;
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 10 * (1 - progress * 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, radius, startA, sweep);
    ctx.stroke();

    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 6 * (1 - progress * 0.35);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }

  function drawIrisFlameArc(ctx, x, y, radius, startA, endA, progress, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || progress >= 1 || alpha <= 0.01) return;
    const sweep = lerp(startA, endA, clamp(progress * 1.45, 0, 1));
    const fade = (1 - progress) * alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.globalAlpha = fade * 0.9;
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 13 * (1 - progress * 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, radius, startA, sweep);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8.5 * (1 - progress * 0.3);
    ctx.stroke();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3.2 * (1 - progress * 0.3);
    ctx.stroke();

    const tipX = Math.cos(sweep) * radius;
    const tipY = Math.sin(sweep) * radius;
    drawStarBloom(ctx, tipX, tipY, 12 * fade, '#ffffff', '#f97316', fade);
    ctx.restore();
  }

  function drawShadowSlashArc(ctx, x, y, radius, startA, endA, progress, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || progress >= 1 || alpha <= 0.01) return;
    const sweep = lerp(startA, endA, clamp(progress * 1.45, 0, 1));
    const fade = (1 - progress) * alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';

    ctx.globalAlpha = fade * 0.92;
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 15 * (1 - progress * 0.4);
    ctx.beginPath();
    ctx.arc(0, 0, radius, startA, sweep);
    ctx.stroke();

    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 9 * (1 - progress * 0.4);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4.2 * (1 - progress * 0.4);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const tipX = Math.cos(sweep) * radius;
    const tipY = Math.sin(sweep) * radius;
    drawStarBloom(ctx, tipX, tipY, 13 * fade, '#ffffff', '#ef4444', fade);
    ctx.restore();
  }

  function drawAtomicRing(ctx, cx, cy, radius, rotation, age, spec, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;

    // Deep obsidian-violet Atomic ring aura
    const ringGrad = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 1.15);
    ringGrad.addColorStop(0, 'rgba(9, 9, 11, 0)');
    ringGrad.addColorStop(0.55, `rgba(${spec.rgb}, ${alpha * 0.34})`);
    ringGrad.addColorStop(0.85, `rgba(56, 189, 248, ${alpha * 0.28})`);
    ringGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Outer & inner segmented Atomic runes
    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([12, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 8-point sacred Atomic diamond lattice
    ctx.strokeStyle = spec.bright;
    ctx.lineWidth = 1.5;
    for (let sq = 0; sq < 2; sq += 1) {
      ctx.save();
      ctx.rotate(sq * (Math.PI / 4) + age * 0.6);
      const s = radius * 0.66;
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.restore();
    }

    ctx.restore();
  }

  // ===========================================================================
  // MAIN ENGINE CLASS
  // ===========================================================================

  class PulseWallVfxEngine {
    constructor({ canvas, wallEl, viewportEl, ambient = true, maxEffects = 18, onSpotlightChange = null }) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.wallEl = wallEl;
      this.viewportEl = viewportEl;
      this.ambient = ambient !== false;
      this.maxEffects = maxEffects;
      this.onSpotlightChange = typeof onSpotlightChange === 'function' ? onSpotlightChange : null;
      this.dpr = 1;
      this.width = 0;
      this.height = 0;
      this.paused = false;
      this.reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
      this.rafId = 0;
      this.lastFrameAt = 0;

      this.effects = [];
      this.sparks = [];
      this.motes = [];
      this.borderFlashes = [];
      this.cardHalos = [];
      this.hoveredCard = null;
      this.directorMode = 'ambient';
      this.spotlightIndex = 0;
      this.spotlightCard = null;
      this.awaitingBreather = false;
      this.nextAmbientAt = 0;
      this.nextHoverBurstAt = 0;
      this.lastAmbientCard = null;
      this.introQueued = false;

      if (!this.canvas || !this.ctx) return;
      this.handleResize = this.handleResize.bind(this);
      this.tick = this.tick.bind(this);
      this.handleResize();
      window.addEventListener('resize', this.handleResize, { passive: true });
      this.bindMotionMedia();
      this.startLoop();
    }

    bindMotionMedia() {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (!mq) return;
      const update = () => {
        this.reducedMotion = mq.matches;
        if (this.reducedMotion) this.clearAll();
      };
      if (mq.addEventListener) mq.addEventListener('change', update);
    }

    handleResize() {
      if (!this.canvas) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    setPaused(paused) {
      this.paused = Boolean(paused);
      if (this.paused) this.clearAll();
      else this.nextAmbientAt = performance.now() + 650;
    }

    clearAll() {
      this.effects.length = 0;
      this.sparks.length = 0;
      this.motes.length = 0;
      this.borderFlashes.length = 0;
      this.cardHalos.length = 0;
      this.setSpotlightCard(null);
      this.awaitingBreather = false;
      if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    }

    setSpotlightCard(card) {
      const next = card && document.body.contains(card) ? card : null;
      if (this.spotlightCard === next) return;
      if (this.spotlightCard) {
        this.spotlightCard.classList.remove('is-vfx-spotlight');
      }
      this.spotlightCard = next;
      if (this.spotlightCard) {
        this.spotlightCard.classList.add('is-vfx-spotlight');
      }
      if (this.onSpotlightChange) {
        this.onSpotlightChange(this.spotlightCard);
      }
    }

    setDirectorMode(mode) {
      const normalized = mode === 'spotlight' ? 'spotlight' : 'ambient';
      if (this.directorMode === normalized) return;
      this.directorMode = normalized;
      this.spotlightIndex = 0;
      this.clearAll();
      if (!this.paused && !this.reducedMotion && this.ambient) {
        this.nextAmbientAt = performance.now() + (normalized === 'spotlight' ? 520 : 1400);
      }
    }

    interruptForFocus(card, { intensity = 1.26 } = {}) {
      if (!card || !document.body.contains(card) || this.paused || this.reducedMotion) return;
      const tier = this.getCardVfxTier(card);
      if (tier <= 0) return;
      this.effects.length = 0;
      this.borderFlashes.length = 0;
      this.cardHalos.length = 0;
      this.setSpotlightCard(card);
      this.triggerForCard(card, { intensity, unleashed: true });
      this.awaitingBreather = true;
      this.nextAmbientAt = performance.now() + rand(1800, 2500);
    }

    focusTriggerCard(card, options = {}) {
      this.interruptForFocus(card, { intensity: 1.28, ...options });
    }

    getCardVfxTier(card) {
      if (!card) return 0;
      if (card.dataset.starVfxTier === '0') return 0;
      const archetype = String(card.dataset.starVfx || '').trim();
      if (!archetype || archetype === 'none') return 0;
      return 3;
    }

    notifyWallRendered() {
      this.hoveredCard = null;
      this.setSpotlightCard(null);
      this.awaitingBreather = false;
      this.spotlightIndex = 0;
      if (!this.ambient || this.paused || this.reducedMotion) return;
      if (!this.introQueued) {
        this.introQueued = true;
        window.setTimeout(() => this.playIntroShowcase(), 480);
      }
      this.nextAmbientAt = performance.now() + (this.directorMode === 'spotlight' ? 680 : 1850);
    }

    playIntroShowcase() {
      if (this.paused || this.reducedMotion) return;
      const cards = this.getVisibleStarredCards();
      if (!cards.length) return;
      if (this.directorMode === 'spotlight') {
        const first = cards[0];
        this.spotlightIndex = 1 % cards.length;
        this.setSpotlightCard(first);
        this.triggerForCard(first, { intensity: 1.12, unleashed: false });
        this.awaitingBreather = true;
        return;
      }
      this.triggerForCard(cards[0], { intensity: 1.05 });
    }

    setHoveredCard(card) {
      const eligible = card && this.getCardVfxTier(card) > 0 ? card : null;
      if (eligible === this.hoveredCard) return;
      this.hoveredCard = eligible;
      if (this.hoveredCard && !this.paused && !this.reducedMotion) {
        if (this.directorMode === 'spotlight') {
          this.interruptForFocus(this.hoveredCard, { intensity: 1.22 });
        } else {
          this.triggerForCard(this.hoveredCard, { intensity: 1.18, unleashed: true });
        }
        this.nextHoverBurstAt = performance.now() + rand(2100, 2600);
      } else if (!this.hoveredCard && this.directorMode === 'spotlight' && this.effects.length === 0) {
        this.setSpotlightCard(null);
      }
    }

    triggerSurge(card) {
      if (!card || this.paused || this.reducedMotion) return;
      const tier = this.getCardVfxTier(card);
      if (tier <= 0) return;
      if (this.directorMode === 'spotlight') {
        this.interruptForFocus(card, { intensity: 1.28 });
        return;
      }
      this.triggerForCard(card, { intensity: 1.24, unleashed: true });
    }

    getVisibleStarredCards() {
      if (!this.wallEl) return [];
      const all = Array.from(this.wallEl.querySelectorAll('.profile-card.is-starred, .vfx-specimen'));
      if (!all.length) return [];
      const vp = this.viewportEl ? this.viewportEl.getBoundingClientRect() : {
        top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth
      };
      return all.filter((card) => {
        if (this.getCardVfxTier(card) <= 0) return false;
        const r = card.getBoundingClientRect();
        if (r.width < 40 || r.height < 40) return false;
        const visibleH = Math.min(r.bottom, vp.bottom) - Math.max(r.top, vp.top);
        return visibleH > r.height * 0.52;
      });
    }

    pulseCardHit(card) {
      if (!card || this.reducedMotion || this.paused) return;
      card.classList.remove('is-vfx-hit');
      window.requestAnimationFrame(() => {
        if (!document.body.contains(card)) return;
        card.classList.add('is-vfx-hit');
        window.clearTimeout(card._vfxHitTimer);
        card._vfxHitTimer = window.setTimeout(() => card.classList.remove('is-vfx-hit'), 180);
      });
    }

    spawnCardHalo(card, spec, duration = 0.68, strength = 1) {
      if (!card || !document.body.contains(card)) return;
      this.cardHalos.push({ card, spec, age: 0, duration, strength });
    }

    spawnMote(x, y, spec, { vx = rand(-28, 28), vy = rand(-55, -14), size = rand(4, 9), maxLife = rand(0.45, 0.9) } = {}) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (this.motes.length > 160) this.motes.shift();
      this.motes.push({
        x, y, vx, vy, size,
        life: 0, maxLife,
        phase: rand(0, Math.PI * 2),
        color: Math.random() < 0.45 ? spec.spark : (Math.random() < 0.5 ? '#ffffff' : spec.bright),
        glow: Math.random() < 0.5 ? spec.accent : spec.main
      });
    }

    spawnImpactSparks(x, y, nx, ny, spec, count, speedScale = 1, options = {}) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const baseAngle = Math.atan2(ny || -1, nx || 0);
      const customGravity = typeof options.gravity === 'number' ? options.gravity : null;
      const customSpread = typeof options.spread === 'number' ? options.spread : 1.35;
      for (let i = 0; i < count; i += 1) {
        const angle = baseAngle + rand(-customSpread, customSpread);
        const speed = rand(110, 380) * speedScale;
        this.sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (customGravity !== null && customGravity < 0 ? rand(35, 110) : rand(18, 86)),
          gravity: customGravity !== null ? customGravity : rand(260, 480),
          drag: rand(0.92, 0.965),
          life: 0,
          maxLife: rand(0.28, 0.68),
          size: rand(1.6, 3.4),
          color: i % 3 === 0 ? '#ffffff' : (i % 2 === 0 ? spec.spark : spec.bright),
          glow: i % 2 === 0 ? spec.main : spec.accent
        });
      }
      const moteCount = Math.min(4, Math.ceil(count / 5));
      for (let m = 0; m < moteCount; m += 1) {
        this.spawnMote(x + rand(-10, 10), y + rand(-10, 10), spec);
      }
    }

    spawnBorderFlash(card, side, ratio, spec, duration = 0.36, span = 0.34) {
      if (!card || !document.body.contains(card)) return;
      const safeRatio = Number.isFinite(ratio) ? ratio : 0.5;
      this.borderFlashes.push({
        card,
        side: side || 'top',
        ratio: clamp(safeRatio, 0.08, 0.92),
        span: Number.isFinite(span) ? span : 0.34,
        spec,
        age: 0,
        duration: Math.max(0.08, Number.isFinite(duration) ? duration : 0.36)
      });
    }

    resolveSpec(lineageId, card) {
      const paletteMode = card.dataset.starPaletteMode || 'native';
      const spectrumId = card.dataset.starSpectrum || 'native';
      if (paletteMode === 'override' || (spectrumId !== 'native' && card.dataset.specimenGroup === 'spectra')) {
        return SPECTRA[spectrumId] || LINEAGE_MAP[lineageId]?.nativeSpec || SPECTRA['cyan-volt'];
      }
      return LINEAGE_MAP[lineageId]?.nativeSpec || SPECTRA[spectrumId] || SPECTRA['cyan-volt'];
    }

    triggerForCard(card, { intensity = 1, unleashed = false } = {}) {
      if (!card || !document.body.contains(card)) return;
      const tier = this.getCardVfxTier(card);
      if (tier <= 0) return;

      const rawId = String(card.dataset.starVfx || '').trim();
      if (!rawId || rawId === 'none') return;
      const lineageId = LEGACY_ALIAS[rawId] || rawId;
      const spec = this.resolveSpec(lineageId, card);
      const rect = card.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;

      if (this.effects.length >= this.maxEffects) this.effects.shift();

      switch (lineageId) {
        case 'dragon-summon':
          this.spawnDragonSummon(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'hero-slays-dragon':
          this.spawnHeroSlaysDragon(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'seraph-descent':
          this.spawnSeraphDescent(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'abyss-demon':
          this.spawnAbyssDemon(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'thunder-zeus':
          this.spawnThunderZeus(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'paladin-cavalry':
          this.spawnPaladinCavalry(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'sword-immortal':
          this.spawnSwordImmortal(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'vermilion-phoenix':
          this.spawnVermilionPhoenix(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'celestial-butterfly':
          this.spawnCelestialButterfly(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'chrono-clockwork':
          this.spawnChronoClockwork(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'arcane-cosmos':
          this.spawnArcaneCosmos(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'kunpeng-whale':
          this.spawnKunpengWhale(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'raging-tsunami':
          this.spawnRagingTsunami(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'meteor-shower':
          this.spawnMeteorShower(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'glacial-freeze':
          this.spawnGlacialFreeze(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'shadow-eminence':
          this.spawnShadowEminence(card, rect, spec, tier, intensity, unleashed);
          break;
        default:
          this.spawnDragonSummon(card, rect, spec, tier, intensity, unleashed);
          break;
      }
    }

    // =========================================================================
    // 01. DRAGON SUMMON (炎龙血脉 · 焚天古龙王)
    // =========================================================================
    spawnDragonSummon(card, rect, spec, tier, intensity, unleashed) {
      this.effects.push({
        type: 'dragon-summon',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.05,
        flip: Math.random() < 0.5 ? 1 : -1,
        trail: [],
        breathTimer: 0,
        hitPhase: 0
      });
      this.spawnCardHalo(card, spec, 0.85, 1.2);
    }

    updateDrawDragonSummon(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const fade = p < 0.1 ? p / 0.1 : (p > 0.85 ? (1 - p) / 0.15 : 1);
      const c = rectCenter(rect);
      const f = fx.flip;

      const waypoints = [
        { x: rect.left + (f > 0 ? -0.35 : 1.35) * rect.width, y: rect.top + rect.height * 0.25 },
        { x: c.x - f * rect.width * 0.18, y: Math.max(46, rect.top - rect.height * 0.78) },
        { x: rect.left + (f > 0 ? 1.36 : -0.36) * rect.width, y: rect.top - rect.height * 0.12 },
        { x: rect.left + (f > 0 ? 1.15 : -0.15) * rect.width, y: rect.bottom + rect.height * 0.34 },
        { x: rect.left + (f > 0 ? -0.25 : 1.25) * rect.width, y: rect.bottom + rect.height * 0.18 }
      ];

      const pos = catmullRom(waypoints, p);
      const ahead = catmullRom(waypoints, Math.min(0.999, p + 0.025));
      const heading = Math.atan2(ahead.y - pos.y, ahead.x - pos.x);
      fx.trail.push(pos);
      if (fx.trail.length > 26) fx.trail.shift();

      if (fx.trail.length >= 3) {
        ctx.save();
        const outerG = safeLinearGradient(ctx, fx.trail[0].x, fx.trail[0].y, pos.x, pos.y);
        if (outerG) {
          outerG.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
          outerG.addColorStop(0.55, fx.spec.main);
          outerG.addColorStop(1, fx.spec.spark);
          drawTaperedRibbon(ctx, fx.trail, 13, outerG, fade * 0.65);
        }
        drawTaperedRibbon(ctx, fx.trail, 4.2, '#fef9c3', fade * 0.9);
        ctx.restore();
      }

      fx.breathTimer += dt;
      if (p > 0.20 && p < 0.85 && fx.breathTimer >= 0.06) {
        fx.breathTimer = 0;
        const mouthX = pos.x + Math.cos(heading) * 24;
        const mouthY = pos.y + Math.sin(heading) * 24;
        const aimTarget = facingEdgeOnRect({ x: mouthX, y: mouthY }, rect);

        if (fx.hitPhase === 0 && p > 0.34) {
          fx.hitPhase = 1;
          this.spawnBorderFlash(fx.card, aimTarget.side, aimTarget.ratio, fx.spec, 0.45, 0.48);
          this.spawnImpactSparks(aimTarget.x, aimTarget.y, aimTarget.nx, aimTarget.ny, fx.spec, 18, 1.05);
          this.pulseCardHit(fx.card);
        } else if (fx.hitPhase === 1 && p > 0.66) {
          fx.hitPhase = 2;
          this.spawnBorderFlash(fx.card, aimTarget.side, aimTarget.ratio, fx.spec, 0.45, 0.48);
          this.spawnImpactSparks(aimTarget.x, aimTarget.y, aimTarget.nx, aimTarget.ny, fx.spec, 18, 1.1);
          this.pulseCardHit(fx.card);
        }

        const bdx = aimTarget.x - mouthX;
        const bdy = aimTarget.y - mouthY;
        const bLen = Math.hypot(bdx, bdy) || 1;
        this.spawnImpactSparks(mouthX, mouthY, bdx / bLen, bdy / bLen, fx.spec, 4, 0.88, { gravity: -60, spread: 0.28 });
      }

      if (p > 0.20 && p < 0.84) {
        const sc = 1.48;
        const mx = pos.x + Math.cos(heading) * 26 * sc;
        const my = pos.y + Math.sin(heading) * 26 * sc;
        const targetPt = facingEdgeOnRect({ x: mx, y: my }, rect);
        const breathPts = buildDisplacedArc({ x: mx, y: my }, lerpPt({ x: mx, y: my }, targetPt, 0.35), lerpPt({ x: mx, y: my }, targetPt, 0.7), targetPt, 10, 14, fx.age * 26, 0.62);
        const flameG = safeLinearGradient(ctx, mx, my, targetPt.x, targetPt.y);
        if (flameG) {
          flameG.addColorStop(0, '#fef9c3');
          flameG.addColorStop(0.35, '#fb923c');
          flameG.addColorStop(0.75, fx.spec.main);
          flameG.addColorStop(1, fx.spec.deep);
          drawTaperedRibbon(ctx, breathPts, 20, flameG, fade * 0.74, 0.85);
        }
        drawTaperedRibbon(ctx, breathPts, 8.5, '#fef08a', fade * 0.94, 0.9);
        drawStarBloom(ctx, targetPt.x, targetPt.y, 20, '#ffffff', '#fb923c', fade * 0.92);
      }

      drawWingedDragon(ctx, pos.x, pos.y, heading, 1.50 * fx.intensity, fx.age, 3, fx.spec, fade);
    }

    // =========================================================================
    // 02. HERO SLAYS DRAGON (勇者屠龙 · 圣光斩穹屠龙史诗)
    // =========================================================================
    spawnHeroSlaysDragon(card, rect, spec, tier, intensity, unleashed) {
      this.effects.push({
        type: 'hero-slays-dragon',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.1,
        clashDone: false
      });
      this.spawnCardHalo(card, spec, 0.92, 1.25);
    }

    updateDrawHeroSlaysDragon(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const fade = p < 0.08 ? p / 0.08 : (p > 0.86 ? (1 - p) / 0.14 : 1);
      const topY = Math.max(66, rect.top - 52);

      // Evil Venom Dragon positioned menacingly over upper-right corner of card
      const dragonHome = { x: rect.right - rect.width * 0.14, y: topY };

      // Hero charges from left -> vaults into center-right slash -> follows through!
      const heroStart = { x: rect.left - 36, y: rect.top + 12 };
      const heroApex = { x: dragonHome.x - 44, y: dragonHome.y - 12 };
      const heroEnd = { x: dragonHome.x + 28, y: dragonHome.y - 26 };

      const chargeP = clamp(p / 0.52, 0, 1);
      const easeCharge = 1 - Math.pow(1 - chargeP, 2.1);
      const heroPos = p < 0.52
        ? cubicPoint(heroStart, { x: rect.left + rect.width * 0.25, y: topY - 45 }, heroApex, heroApex, easeCharge)
        : lerpPt(heroApex, heroEnd, clamp((p - 0.52) / 0.48, 0, 1));

      const slashSwing = p < 0.36
        ? lerp(-2.3, -1.6, p / 0.36)
        : (p < 0.56 ? lerp(-1.6, 0.95, (p - 0.36) / 0.20) : 0.95);

      const hitP = clamp((p - 0.48) / 0.45, 0, 1);
      const hurtFlash = p > 0.46 && p < 0.72 ? Math.sin(((p - 0.46) / 0.26) * Math.PI) : 0;
      const dragonPos = {
        x: dragonHome.x + hitP * 46,
        y: dragonHome.y - Math.sin(hitP * Math.PI) * 16
      };
      const dragonAlpha = fade * (hitP > 0.55 ? clamp(1 - (hitP - 0.55) / 0.45, 0, 1) : 1);

      // Phase 1: Evil Dragon spews venomous lime-violet dragonfire toward Hero
      if (p > 0.14 && p < 0.56) {
        const bp = clamp((p - 0.14) / 0.34, 0, 1);
        const mouth = { x: dragonPos.x - 18, y: dragonPos.y - 4 };
        const fireTip = lerpPt(mouth, { x: heroPos.x + 18, y: heroPos.y }, Math.min(1, bp));
        const venomPts = buildDisplacedArc(mouth, lerpPt(mouth, fireTip, 0.4), lerpPt(mouth, fireTip, 0.7), fireTip, 8, 10, fx.age * 20, 0.6);
        drawTaperedRibbon(ctx, venomPts, 13, '#581c87', fade * 0.68, 0.8);
        drawTaperedRibbon(ctx, venomPts, 6.5, '#84cc16', fade * 0.95, 0.9);
      }

      // Phase 2: Hero Unleashes Colossal Golden Excalibur Crescent & Cross-Cleave Shockwave!
      if (p > 0.38 && p < 0.88) {
        const sp = clamp((p - 0.38) / 0.46, 0, 1);
        const slashAlpha = Math.sin(sp * Math.PI);
        const arcR = 112 * (0.45 + 0.55 * sp);
        ctx.save();
        ctx.translate(dragonHome.x - 16, dragonHome.y);
        ctx.globalAlpha = slashAlpha * 0.52;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, arcR, -Math.PI * 0.48, Math.PI * 0.42);
        ctx.stroke();

        ctx.globalAlpha = slashAlpha * 0.96;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.arc(0, 0, arcR, -Math.PI * 0.48, Math.PI * 0.42);
        ctx.stroke();

        const crossL = 135 * sp;
        ctx.globalAlpha = slashAlpha * 0.92;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 10 * (1 - sp * 0.5);
        ctx.beginPath();
        ctx.moveTo(-crossL, -crossL * 0.45);
        ctx.lineTo(crossL, crossL * 0.45);
        ctx.moveTo(-crossL * 0.55, crossL * 0.55);
        ctx.lineTo(crossL * 0.55, -crossL * 0.55);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();
      }

      if (!fx.clashDone && p >= 0.47) {
        fx.clashDone = true;
        const goldSpec = SPECTRA['solar-gold'];
        const clashPt = { x: dragonHome.x - 12, y: dragonHome.y };
        this.spawnImpactSparks(clashPt.x, clashPt.y, 0, -1, goldSpec, 26, 1.15);
        this.spawnImpactSparks(clashPt.x, clashPt.y, 1, 0, SPECTRA['emerald-jade'], 14, 0.95);
        this.spawnBorderFlash(fx.card, 'top', 0.62, goldSpec, 0.52, 0.62);
        this.spawnBorderFlash(fx.card, 'right', 0.25, goldSpec, 0.48, 0.42);
        this.pulseCardHit(fx.card);
      }

      if (p > 0.44 && p < 0.72) {
        const flashA = Math.sin(((p - 0.44) / 0.28) * Math.PI);
        drawStarBloom(ctx, dragonHome.x - 10, dragonHome.y, 46, '#ffffff', '#facc15', flashA);
      }

      drawEvilWyrm(ctx, dragonPos.x, dragonPos.y, 1.32 * fx.intensity, fx.age, 3, hurtFlash, dragonAlpha);
      drawHeroKnight(ctx, heroPos.x, heroPos.y, 1.32 * fx.intensity, fx.age, 3, slashSwing, fade);
    }

    // =========================================================================
    // 03. SERAPH DESCENT (炽天使降临 · 六翼炽天使玫瑰圣环)
    // =========================================================================
    spawnSeraphDescent(card, rect, spec, tier, intensity, unleashed) {
      const feathers = Array.from({ length: 16 }, (_, i) => ({
        xOff: rand(-0.65, 0.65),
        delay: 0.14 + (i / 16) * 0.7,
        driftX: rand(-34, 34),
        speedY: rand(45, 95),
        spin: rand(-3, 3),
        size: rand(7, 13)
      }));
      this.effects.push({
        type: 'seraph-descent',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.05,
        selfHitDone: false,
        cornerHitDone: false,
        feathers
      });
      this.spawnCardHalo(card, spec, 0.95, 1.2);
    }

    updateDrawSeraphDescent(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.18 ? p / 0.18 : (p > 0.82 ? (1 - p) / 0.18 : 1);
      const cx = rect.left + rect.width * 0.5;
      const cy = Math.max(66, rect.top - 52 - (1 - open) * 16);

      // Descending Sky-White & Gold Column of Heaven
      if (p > 0.12 && p < 0.86) {
        const bp = Math.sin(((p - 0.12) / 0.74) * Math.PI);
        const bw = 54 * bp;
        if (bw > 1) {
          const g = safeLinearGradient(ctx, cx - bw, 0, cx + bw, 0);
          if (g) {
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.28, `rgba(56, 189, 248, ${bp * 0.42})`);
            g.addColorStop(0.5, `rgba(255, 255, 255, ${bp * 0.88})`);
            g.addColorStop(0.72, `rgba(251, 191, 36, ${bp * 0.42})`);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(cx - bw, cy - 110, bw * 2, rect.bottom - cy + 124);
          }
        }
      }

      // Giant Gothic Cathedral Rose-Window Halo behind Six-Winged Archangel
      drawRoseHalo(ctx, cx, cy - 6, 66 * open * fx.intensity, fx.age, fx.spec, open * 0.95);

      // Twin Crisscrossing Golden Spears of Heaven piercing self card top
      if (p > 0.22 && p < 0.82) {
        const sp = clamp((p - 0.22) / 0.34, 0, 1);
        const sAlpha = p > 0.65 ? (0.82 - p) / 0.17 : 1;
        for (const side of [-1, 1]) {
          const s0 = { x: cx + side * 74, y: cy - 38 };
          const s1 = edgePoint(rect, 'top', side < 0 ? 0.76 : 0.24);
          const tip = lerpPt(s0, s1, sp);
          ctx.save();
          ctx.globalAlpha = sAlpha;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(s0.x, s0.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          drawStarBloom(ctx, tip.x, tip.y, 12, '#ffffff', '#fbbf24', sAlpha);
          ctx.restore();
        }
      }

      // Symmetric Golden-Sky Blessing Ribbons sweeping to crown left & right card corners
      if (p > 0.24) {
        const rp = clamp((p - 0.24) / 0.72, 0, 1);
        const rFade = rp < 0.2 ? rp / 0.2 : (rp > 0.8 ? (1 - rp) / 0.2 : 1);
        for (const side of [-1, 1]) {
          const corner = { x: side < 0 ? rect.left + 8 : rect.right - 8, y: rect.top - 4 };
          const ctrl = { x: cx + side * rect.width * 0.62, y: cy - 42 };
          const ribbonPts = [];
          for (let i = 0; i <= 14; i += 1) {
            const t = (i / 14) * clamp(rp / 0.36, 0, 1);
            const u = 1 - t;
            ribbonPts.push({
              x: u * u * cx + 2 * u * t * ctrl.x + t * t * corner.x,
              y: u * u * cy + 2 * u * t * ctrl.y + t * t * corner.y
            });
          }
          drawTaperedRibbon(ctx, ribbonPts, 6.5, fx.spec.main, rFade * 0.58, 0.8);
          drawTaperedRibbon(ctx, ribbonPts, 3.0, '#fef08a', rFade * 0.94, 0.9);
          if (rp > 0.32) {
            ctx.save();
            ctx.translate(corner.x, corner.y - 6);
            ctx.globalAlpha = rFade;
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, 20 * rFade, 6.5 * rFade, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.restore();
          }
        }
        if (!fx.cornerHitDone && rp >= 0.36) {
          fx.cornerHitDone = true;
          this.spawnBorderFlash(fx.card, 'left', 0.14, fx.spec, 0.44, 0.36);
          this.spawnBorderFlash(fx.card, 'right', 0.14, fx.spec, 0.44, 0.36);
        }
      }

      if (!fx.selfHitDone && p > 0.32) {
        fx.selfHitDone = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.52, 0.68);
        this.spawnImpactSparks(cx, rect.top, 0, -1, fx.spec, 18, 0.95);
        this.pulseCardHit(fx.card);
      }

      for (const ft of fx.feathers) {
        if (fx.age < ft.delay) continue;
        const fa = fx.age - ft.delay;
        const fp = clamp(fa / 0.95, 0, 1);
        if (fp >= 1) continue;
        const fxX = cx + ft.xOff * rect.width + Math.sin(fa * 5 + ft.spin) * 16 + ft.driftX * fp;
        const fxY = cy + fa * ft.speedY;
        drawAngelFeather(ctx, fxX, fxY, Math.sin(fa * 4 + ft.spin) * 0.7, ft.size, (1 - fp) * open);
      }

      drawSeraphAngel(ctx, cx, cy, 1.38 * fx.intensity, fx.age, 3, fx.spec, open);
    }

    // =========================================================================
    // 04. ABYSS DEMON LORD (深渊魔王 · 深渊魔君炎狱锁链)
    // =========================================================================
    spawnAbyssDemon(card, rect, spec, tier, intensity, unleashed) {
      this.effects.push({
        type: 'abyss-demon',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 1.95,
        selfHitDone: false,
        chainTargets: [
          { side: 'left', ratio: 0.34, delay: 0.24, hitDone: false },
          { side: 'right', ratio: 0.34, delay: 0.34, hitDone: false },
          { side: 'bottom', ratio: 0.5, delay: 0.44, hitDone: false }
        ]
      });
      this.spawnCardHalo(card, spec, 0.92, 1.2);
    }

    updateDrawAbyssDemon(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.16 ? p / 0.16 : (p > 0.80 ? (1 - p) / 0.20 : 1);
      const cx = rect.left + rect.width * 0.5;
      const cy = Math.max(66, rect.top - 48);

      drawDemonVisage(ctx, cx, cy, 1.32 * open * fx.intensity, fx.age, 3, fx.spec, open);

      // Twin Crossed Triple-Claw Slashes across Card Frame
      if (p > 0.18 && p < 0.78) {
        const sp = clamp((p - 0.18) / 0.32, 0, 1);
        const sAlpha = p > 0.62 ? (0.78 - p) / 0.16 : 1;
        drawDemonClawSlash(ctx, { x: rect.left - 18, y: rect.top - 22 }, { x: rect.right + 12, y: rect.top + rect.height * 0.52 }, sp, 10, fx.spec, sAlpha);
        drawDemonClawSlash(ctx, { x: rect.right + 18, y: rect.top - 22 }, { x: rect.left - 12, y: rect.top + rect.height * 0.52 }, sp, 10, fx.spec, sAlpha);
        if (!fx.selfHitDone && sp >= 0.55) {
          fx.selfHitDone = true;
          this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.48, 0.72);
          this.spawnImpactSparks(cx, rect.top, 0, -1, fx.spec, 22, 1.15);
          this.pulseCardHit(fx.card);
        }
      }

      // 3 Spiked Obsidian-Red Hell Chains physically latch onto self card's left, right, and bottom borders
      for (const ch of fx.chainTargets) {
        if (fx.age < ch.delay) continue;
        const cp = clamp((fx.age - ch.delay) / (fx.duration - ch.delay), 0, 1);
        const hitPt = edgePoint(rect, ch.side, ch.ratio);
        const shootP = clamp(cp / 0.28, 0, 1);
        const cAlpha = cp > 0.78 ? (1 - cp) / 0.22 : 1;

        drawHellChain(ctx, { x: cx, y: cy + 8 }, hitPt, shootP, fx.age, fx.spec, cAlpha);

        if (!ch.hitDone && shootP >= 0.92) {
          ch.hitDone = true;
          this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.52, 0.5);
          this.spawnImpactSparks(hitPt.x, hitPt.y, hitPt.nx, hitPt.ny, fx.spec, 18, 1.08);
          this.pulseCardHit(fx.card);
        }
      }
    }

    // =========================================================================
    // 05. THUNDER ZEUS (雷神裁决 · 万雷天罚战锤)
    // =========================================================================
    spawnThunderZeus(card, rect, spec, tier, intensity, unleashed) {
      this.effects.push({
        type: 'thunder-zeus',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 1.85,
        flip: Math.random() < 0.5 ? 1 : -1,
        seed: Math.random() * 80,
        selfHitDone: false,
        branchHitsDone: false
      });
      this.spawnCardHalo(card, spec, 0.9, 1.2);
    }

    drawHighVoltageBolt(ctx, p0, p1, archY, segments, jitter, seed, spec, alpha, widthScale = 1) {
      const ctrl1 = { x: lerp(p0.x, p1.x, 0.33), y: Math.min(p0.y, p1.y) - archY };
      const ctrl2 = { x: lerp(p0.x, p1.x, 0.67), y: Math.min(p0.y, p1.y) - archY * 0.85 };
      const pts = buildDisplacedArc(p0, ctrl1, ctrl2, p1, segments, jitter, seed, 0.64);

      ctx.save();
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2.6;
      ctx.lineCap = 'round';
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = spec.deep;
      ctx.lineWidth = 11 * widthScale;
      strokePolyline(ctx, pts, pts.length);

      ctx.globalAlpha = alpha * 0.96;
      ctx.strokeStyle = makeStrokeStyle(ctx, spec, p0.x, p0.y, p1.x, p1.y);
      ctx.lineWidth = 4.4 * widthScale;
      strokePolyline(ctx, pts, pts.length);

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.9 * widthScale;
      strokePolyline(ctx, pts, pts.length);

      if (pts.length > 8) {
        const mid = pts[Math.floor(pts.length * 0.45)];
        const tip = { x: mid.x + rand(-42, 42), y: mid.y + rand(22, 50) };
        const fork = buildDisplacedArc(mid, lerpPt(mid, tip, 0.5), lerpPt(mid, tip, 0.8), tip, 6, 11, seed + 17, 0.65);
        ctx.globalAlpha = alpha * 0.82;
        ctx.strokeStyle = spec.bright;
        ctx.lineWidth = 2.0 * widthScale;
        strokePolyline(ctx, fork, fork.length);
      }
      ctx.restore();
    }

    updateDrawThunderZeus(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.14 ? p / 0.14 : (p > 0.82 ? (1 - p) / 0.18 : 1);
      const cloudPt = { x: rect.left + rect.width * 0.5, y: Math.max(54, rect.top - 66) };
      const flicker = 0.72 + 0.28 * Math.sin(fx.age * 95);

      drawStormCloud(ctx, cloudPt.x, cloudPt.y, 1.38 * open, fx.age, p > 0.2 && p < 0.75 ? flicker : 0, open);

      const hammerStart = { x: rect.left - fx.flip * 80, y: Math.max(46, rect.top - 96) };
      const impactPt = { x: rect.left + rect.width * 0.5, y: rect.top };
      const hammerP = clamp(p / 0.34, 0, 1);
      const returnP = clamp((p - 0.58) / 0.38, 0, 1);
      const hammerPos = p < 0.34
        ? cubicPoint(hammerStart, { x: cloudPt.x, y: cloudPt.y - 45 }, impactPt, impactPt, hammerP * hammerP)
        : (p < 0.58 ? impactPt : lerpPt(impactPt, { x: rect.right + fx.flip * 70, y: Math.max(44, rect.top - 86) }, returnP));
      const hammerRot = p < 0.34 ? fx.age * 22 : (p < 0.58 ? 0.35 : -fx.age * 18);

      if (!fx.selfHitDone && p >= 0.32) {
        fx.selfHitDone = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.52, 0.76);
        this.spawnImpactSparks(impactPt.x, impactPt.y, 0, -1, fx.spec, 26, 1.25);
        this.pulseCardHit(fx.card);
      }

      if (p > 0.28 && p < 0.88) {
        const boltA = (p > 0.70 ? (0.88 - p) / 0.18 : 1) * flicker;
        const seedTick = fx.seed + Math.floor(fx.age * 22);
        this.drawHighVoltageBolt(ctx, cloudPt, impactPt, 12, 16, 18, seedTick, fx.spec, boltA, 1.15);

        const targets = [
          edgePoint(rect, 'left', 0.28),
          edgePoint(rect, 'right', 0.28),
          edgePoint(rect, 'left', 0.82),
          edgePoint(rect, 'right', 0.82)
        ];
        targets.forEach((pt, idx) => {
          const arch = idx < 2 ? 44 : 18;
          this.drawHighVoltageBolt(ctx, impactPt, pt, arch, 14, 18, seedTick + (idx + 1) * 13, fx.spec, boltA * 0.92, 0.92);
        });

        if (!fx.branchHitsDone && p >= 0.38) {
          fx.branchHitsDone = true;
          for (const pt of targets) {
            this.spawnBorderFlash(fx.card, pt.side, pt.ratio, fx.spec, 0.48, 0.38);
            this.spawnImpactSparks(pt.x, pt.y, pt.nx, pt.ny, fx.spec, 10, 1.0);
          }
        }
      }

      drawStormHammer(ctx, hammerPos.x, hammerPos.y, hammerRot, 1.25 * fx.intensity, fx.age, fx.spec, open);
    }

    // =========================================================================
    // 06. PALADIN CAVALRY (圣殿骑士团 · 圣殿骑兵总攻)
    // =========================================================================
    spawnPaladinCavalry(card, rect, spec, tier, intensity, unleashed) {
      const riders = [];
      for (let i = 0; i < 5; i += 1) {
        riders.push({
          dir: i % 2 === 0 ? 1 : -1,
          delay: 0.12 + i * 0.11,
          yOff: -38 + i * 19,
          hitDone: false,
          trail: []
        });
      }
      this.effects.push({
        type: 'paladin-cavalry',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 1.92,
        riders
      });
      this.spawnCardHalo(card, spec, 0.92, 1.2);
    }

    updateDrawPaladinCavalry(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.16 ? p / 0.16 : (p > 0.80 ? (1 - p) / 0.20 : 1);
      const cx = rect.left + rect.width * 0.5;
      const shieldY = Math.max(60, rect.top - 40);

      drawPaladinShield(ctx, cx, shieldY, 1.15 * open * fx.intensity, fx.age, fx.spec, open);

      for (const rd of fx.riders) {
        if (fx.age < rd.delay) continue;
        const rp = clamp((fx.age - rd.delay) / 0.82, 0, 1);
        if (rp >= 1) continue;
        const rAlpha = rp < 0.12 ? rp / 0.12 : (rp > 0.82 ? (1 - rp) / 0.18 : 1);

        const span = rect.width * 1.78;
        const startX = cx - rd.dir * span * 0.58;
        const endX = cx + rd.dir * span * 0.58;
        const y = Math.max(54, rect.top + rd.yOff + Math.sin(rp * Math.PI * 2) * 8);
        const curX = lerp(startX, endX, rp);
        const pos = { x: curX, y };

        rd.trail.push(pos);
        if (rd.trail.length > 18) rd.trail.shift();

        if (rd.trail.length >= 3) {
          const g = safeLinearGradient(ctx, rd.trail[0].x, rd.trail[0].y, pos.x, pos.y);
          if (g) {
            g.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            g.addColorStop(0.55, fx.spec.main);
            g.addColorStop(1, '#facc15');
            drawTaperedRibbon(ctx, rd.trail, 8.5, g, rAlpha * 0.65);
          }
          drawTaperedRibbon(ctx, rd.trail, 2.4, '#ffffff', rAlpha * 0.9);
        }

        if (!rd.hitDone && rp >= 0.48) {
          rd.hitDone = true;
          this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.44, 0.58);
          this.spawnImpactSparks(pos.x, pos.y, rd.dir, -0.5, fx.spec, 16, 1.1);
          this.pulseCardHit(fx.card);
        }

        ctx.save();
        ctx.translate(pos.x, pos.y);
        if (rd.dir < 0) ctx.scale(-1, 1);
        drawJoustingKnight(ctx, 0, 0, 0, 1.05 * fx.intensity, fx.age, fx.spec, rAlpha);
        ctx.restore();
      }
    }

    // =========================================================================
    // 07. SWORD IMMORTAL (青莲剑仙 · 万剑归宗)
    // =========================================================================
    spawnSwordImmortal(card, rect, spec, tier, intensity, unleashed) {
      const count = 12;
      const swords = [];
      for (let i = 0; i < count; i += 1) {
        const spreadAngle = lerp(-Math.PI * 0.88, -Math.PI * 0.12, i / (count - 1));
        swords.push({
          idx: i,
          spreadAngle,
          launchDelay: 0.24 + i * 0.048,
          flightDur: 0.48,
          targetSide: i % 3 === 0 ? 'left' : (i % 3 === 1 ? 'top' : 'right'),
          targetRatio: 0.14 + ((i * 0.23) % 0.72),
          hitDone: false,
          trail: []
        });
      }
      this.effects.push({
        type: 'sword-immortal',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 1.78,
        swords
      });
      this.spawnCardHalo(card, spec, 0.88, 1.2);
    }

    updateDrawSwordImmortal(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const arrayCenter = { x: rect.left + rect.width * 0.5, y: Math.max(58, rect.top - 68) };
      const open = p < 0.16 ? p / 0.16 : (p > 0.80 ? (1 - p) / 0.20 : 1);
      const r = 72 * open * fx.intensity;

      drawImmortalLotus(ctx, arrayCenter.x, arrayCenter.y, r * 1.05, -fx.age * 0.85, 0.52, fx.spec, open * 0.92);
      drawBaguaCircle(ctx, arrayCenter.x, arrayCenter.y, r, fx.age * 1.4, 0.52, fx.spec, open * 0.96);

      for (const sw of fx.swords) {
        const hoverDist = 78;
        const fanPt = {
          x: arrayCenter.x + Math.cos(sw.spreadAngle) * hoverDist,
          y: arrayCenter.y + Math.sin(sw.spreadAngle) * hoverDist * 0.62
        };
        const hitPt = edgePoint(rect, sw.targetSide, sw.targetRatio);

        let pos;
        let angle;
        let swAlpha = 1;
        if (fx.age < sw.launchDelay) {
          const ap = clamp(fx.age / Math.max(0.12, sw.launchDelay), 0, 1);
          pos = {
            x: lerp(arrayCenter.x, fanPt.x, ap),
            y: lerp(arrayCenter.y, fanPt.y, ap) + Math.sin(fx.age * 24 + sw.idx) * 2.5
          };
          angle = Math.atan2(hitPt.y - pos.y, hitPt.x - pos.x);
          swAlpha = ap;
        } else {
          const fp = clamp((fx.age - sw.launchDelay) / sw.flightDur, 0, 1);
          const ctrl = {
            x: lerp(fanPt.x, hitPt.x, 0.45) + Math.cos(sw.spreadAngle) * 32,
            y: Math.min(fanPt.y, hitPt.y) - 34
          };
          const ease = fp < 0.7 ? Math.pow(fp / 0.7, 1.45) : 1;
          pos = cubicPoint(fanPt, ctrl, ctrl, hitPt, ease);
          const tan = cubicTangent(fanPt, ctrl, ctrl, hitPt, Math.min(0.99, ease));
          angle = Math.atan2(tan.y, tan.x);
          swAlpha = fp > 0.72 ? (1 - fp) / 0.28 : 1;
          if (fp < 0.72) {
            sw.trail.push(pos);
            if (sw.trail.length > 14) sw.trail.shift();
          }
          if (!sw.hitDone && fp >= 0.68) {
            sw.hitDone = true;
            this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.36, 0.30);
            this.spawnImpactSparks(hitPt.x, hitPt.y, hitPt.nx, hitPt.ny, fx.spec, 12, 0.98);
            this.pulseCardHit(fx.card);
          }
        }
        if (swAlpha <= 0.02) continue;
        if (sw.trail.length >= 3) {
          const g = safeLinearGradient(ctx, sw.trail[0].x, sw.trail[0].y, pos.x, pos.y);
          if (g) {
            g.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            g.addColorStop(0.55, fx.spec.bright);
            g.addColorStop(1, '#fef08a');
            drawTaperedRibbon(ctx, sw.trail, 4.5, g, swAlpha * 0.74);
          }
        }
        drawImmortalSword(ctx, pos.x, pos.y, angle, 1.12 * fx.intensity, fx.age + sw.idx, fx.spec, swAlpha);
      }
    }

    // =========================================================================
    // 08. VERMILION PHOENIX (朱雀涅槃 · 九霄朱雀涅槃凤舞)
    // =========================================================================
    spawnVermilionPhoenix(card, rect, spec, tier, intensity, unleashed) {
      const feathers = Array.from({ length: 16 }, (_, i) => ({
        angle: (i / 16) * Math.PI * 2 + rand(-0.15, 0.15),
        delay: 0.16 + (i / 16) * 0.85,
        speed: rand(55, 115),
        size: rand(7, 13),
        spin: rand(-3.5, 3.5)
      }));
      this.effects.push({
        type: 'vermilion-phoenix',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.05,
        flip: Math.random() < 0.5 ? 1 : -1,
        trail: [],
        borderHits: [false, false, false],
        feathers
      });
      this.spawnCardHalo(card, spec, 0.95, 1.25);
    }

    updateDrawVermilionPhoenix(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.14 ? p / 0.14 : (p > 0.84 ? (1 - p) / 0.16 : 1);
      const c = rectCenter(rect);
      const f = fx.flip;
      const mandalaCenter = { x: c.x, y: Math.max(60, rect.top - 48) };

      drawPhoenixMandala(ctx, mandalaCenter.x, mandalaCenter.y, 56 * open * fx.intensity, fx.age * 0.9, fx.spec, open * 0.94);

      // Expanding Nirvana Flame Ring centered on card
      if (p > 0.14 && p < 0.68) {
        const rp = (p - 0.14) / 0.54;
        const ringR = 26 + rp * (Math.max(rect.width, rect.height) * 0.72);
        const rAlpha = Math.sin(rp * Math.PI);
        ctx.save();
        ctx.translate(c.x, rect.top + 8);
        ctx.globalAlpha = rAlpha * 0.85;
        ctx.strokeStyle = fx.spec.main;
        ctx.lineWidth = 10 * (1 - rp * 0.55);
        ctx.beginPath();
        ctx.ellipse(0, 0, ringR, ringR * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = fx.spec.spark;
        ctx.lineWidth = 3.2 * (1 - rp * 0.4);
        ctx.stroke();
        ctx.restore();
      }

      // Sweeping figure-8 flight path cradling the card
      const waypoints = [
        { x: rect.left + (f > 0 ? -0.22 : 1.22) * rect.width, y: rect.top + 18 },
        { x: c.x - f * rect.width * 0.36, y: Math.max(48, rect.top - rect.height * 0.72) },
        { x: rect.left + (f > 0 ? 1.24 : -0.24) * rect.width, y: rect.top + rect.height * 0.16 },
        { x: c.x + f * rect.width * 0.32, y: rect.bottom + rect.height * 0.28 },
        { x: rect.left + (f > 0 ? -0.28 : 1.28) * rect.width, y: rect.top + rect.height * 0.44 }
      ];

      const pos = catmullRom(waypoints, p);
      const ahead = catmullRom(waypoints, Math.min(0.999, p + 0.025));
      const heading = Math.atan2(ahead.y - pos.y, ahead.x - pos.x);
      fx.trail.push(pos);
      if (fx.trail.length > 28) fx.trail.shift();

      if (fx.trail.length >= 3) {
        const g = safeLinearGradient(ctx, fx.trail[0].x, fx.trail[0].y, pos.x, pos.y);
        if (g) {
          g.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
          g.addColorStop(0.5, fx.spec.main);
          g.addColorStop(0.8, fx.spec.bright);
          g.addColorStop(1, fx.spec.spark);
          drawTaperedRibbon(ctx, fx.trail, 13, g, open * 0.72);
        }
        drawTaperedRibbon(ctx, fx.trail, 4.0, '#fffbeb', open * 0.92);
      }

      // Drifting glowing flame feathers
      for (const ft of fx.feathers) {
        if (fx.age < ft.delay) continue;
        const fa = fx.age - ft.delay;
        const fp = clamp(fa / 0.85, 0, 1);
        if (fp >= 1) continue;
        const fxX = mandalaCenter.x + Math.cos(ft.angle) * (24 + fa * ft.speed);
        const fxY = mandalaCenter.y + Math.sin(ft.angle) * (18 + fa * ft.speed * 0.65) + fa * 26;
        drawFlameFeather(ctx, fxX, fxY, ft.angle + fa * ft.spin, ft.size, fx.spec, (1 - fp) * open);
      }

      if (!fx.borderHits[0] && p >= 0.24) {
        fx.borderHits[0] = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.48, 0.64);
        this.spawnImpactSparks(c.x, rect.top, 0, -1, fx.spec, 18, 1.05);
        this.pulseCardHit(fx.card);
      }
      if (!fx.borderHits[1] && p >= 0.48) {
        fx.borderHits[1] = true;
        const side = f > 0 ? 'right' : 'left';
        const pt = edgePoint(rect, side, 0.35);
        this.spawnBorderFlash(fx.card, side, 0.35, fx.spec, 0.46, 0.5);
        this.spawnImpactSparks(pt.x, pt.y, pt.nx, pt.ny, fx.spec, 14, 1.0);
      }
      if (!fx.borderHits[2] && p >= 0.72) {
        fx.borderHits[2] = true;
        this.spawnBorderFlash(fx.card, 'bottom', 0.5, fx.spec, 0.46, 0.58);
        this.spawnImpactSparks(c.x, rect.bottom, 0, 1, fx.spec, 14, 0.95);
        this.pulseCardHit(fx.card);
      }

      drawVermilionPhoenix(ctx, pos.x, pos.y, heading, 1.32 * fx.intensity, fx.age, fx.spec, open);
    }

    // =========================================================================
    // 09. CELESTIAL BUTTERFLY (幻光星蝶 · 织梦星蝶浮光掠影)
    // =========================================================================
    spawnCelestialButterfly(card, rect, spec, tier, intensity, unleashed) {
      const orbiters = Array.from({ length: 7 }, (_, i) => ({
        phase: (i / 7) * Math.PI * 2,
        speed: (i % 2 === 0 ? 1 : -1) * rand(2.4, 3.4),
        rx: 0.46 + (i % 3) * 0.14,
        ry: 0.36 + (i % 2) * 0.16,
        scale: rand(0.56, 0.80),
        delay: 0.14 + i * 0.08,
        hitDone: false
      }));
      const sparkles = Array.from({ length: 22 }, (_, i) => ({
        xOff: rand(-0.62, 0.62),
        yOff: rand(-0.48, 0.55),
        phase: i * 0.9,
        size: rand(3.8, 7.5),
        driftY: rand(-22, 18)
      }));
      this.effects.push({
        type: 'celestial-butterfly',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.05,
        flip: Math.random() < 0.5 ? 1 : -1,
        queenTrail: [],
        selfHitDone: false,
        orbiters,
        sparkles
      });
      this.spawnCardHalo(card, spec, 0.95, 1.15);
    }

    updateDrawCelestialButterfly(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.14 ? p / 0.14 : (p > 0.84 ? (1 - p) / 0.16 : 1);
      const c = rectCenter(rect);
      const f = fx.flip;
      const haloPos = { x: c.x, y: Math.max(60, rect.top - 48) };

      drawButterflyMoonRing(ctx, haloPos.x, haloPos.y, 50 * open * fx.intensity, fx.age, fx.spec, open * 0.94);

      // Dual Braided Iridescent Silk Ribbons spiraling along left and right edges to card crown
      const ribbonProg = clamp(p / 0.72, 0, 1);
      for (const side of [-1, 1]) {
        const rPts = [];
        for (let i = 0; i <= 18; i += 1) {
          const t = (i / 18) * ribbonProg;
          const swirl = Math.sin(t * Math.PI * 3 + fx.age * 4) * 22 * side;
          rPts.push({
            x: lerp(c.x + side * rect.width * 0.56, haloPos.x, t) + swirl,
            y: lerp(rect.bottom + 12, haloPos.y, t)
          });
        }
        if (rPts.length >= 3) {
          const rg = safeLinearGradient(ctx, rPts[0].x, rPts[0].y, rPts[rPts.length - 1].x, rPts[rPts.length - 1].y);
          if (rg) {
            rg.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            rg.addColorStop(0.5, fx.spec.accent);
            rg.addColorStop(1, fx.spec.spark);
            drawTaperedRibbon(ctx, rPts, 6.5, rg, open * 0.65, 0.9);
          }
          drawTaperedRibbon(ctx, rPts, 2.2, '#ffffff', open * 0.88, 0.9);
        }
      }

      // Twinkling Crystal Stardust Motes
      for (const spk of fx.sparkles) {
        const tw = (0.5 + 0.5 * Math.sin(fx.age * 7 + spk.phase)) * open;
        drawCrystalSpark(
          ctx,
          c.x + spk.xOff * rect.width,
          c.y + spk.yOff * rect.height + spk.driftY * p,
          spk.size * (0.7 + 0.4 * tw),
          fx.age * 1.4 + spk.phase,
          fx.spec,
          tw * 0.9
        );
      }

      // 7 Miniature Prism Butterflies Orbiting Card Perimeter
      for (const ob of fx.orbiters) {
        if (fx.age < ob.delay) continue;
        const op = clamp((fx.age - ob.delay) / (fx.duration - ob.delay), 0, 1);
        const oAlpha = (op < 0.16 ? op / 0.16 : (op > 0.82 ? (1 - op) / 0.18 : 1)) * open;
        const ang = ob.phase + fx.age * ob.speed;
        const ox = c.x + Math.cos(ang) * rect.width * ob.rx;
        const oy = c.y + Math.sin(ang) * rect.height * ob.ry - 14;
        const tangentAng = Math.atan2(
          Math.cos(ang) * rect.height * ob.ry * ob.speed,
          -Math.sin(ang) * rect.width * ob.rx * ob.speed
        );

        if (!ob.hitDone && op > 0.35) {
          ob.hitDone = true;
          const pt = facingEdgeOnRect({ x: ox, y: oy }, rect);
          this.spawnBorderFlash(fx.card, pt.side, pt.ratio, fx.spec, 0.36, 0.32);
          this.spawnImpactSparks(pt.x, pt.y, pt.nx, pt.ny, fx.spec, 6, 0.82);
        }

        drawPrismButterfly(ctx, ox, oy, tangentAng, ob.scale * fx.intensity, fx.age * 13 + ob.phase, fx.spec, oAlpha, false);
      }

      // Grand Queen Morpho Butterfly gliding in a luminous S-curve across card top
      const qWaypoints = [
        { x: rect.left + (f > 0 ? -0.20 : 1.20) * rect.width, y: rect.top + 8 },
        { x: c.x - f * rect.width * 0.24, y: haloPos.y + 8 },
        { x: c.x + f * rect.width * 0.24, y: Math.max(46, haloPos.y - 16) },
        { x: rect.left + (f > 0 ? 1.24 : -0.24) * rect.width, y: rect.top + 16 }
      ];
      const qPos = catmullRom(qWaypoints, p);
      const qAhead = catmullRom(qWaypoints, Math.min(0.999, p + 0.025));
      const qHeading = Math.atan2(qAhead.y - qPos.y, qAhead.x - qPos.x);

      fx.queenTrail.push(qPos);
      if (fx.queenTrail.length > 22) fx.queenTrail.shift();
      if (fx.queenTrail.length >= 3) {
        drawTaperedRibbon(ctx, fx.queenTrail, 7.5, fx.spec.main, open * 0.56);
        drawTaperedRibbon(ctx, fx.queenTrail, 2.5, '#ffffff', open * 0.9);
      }

      if (!fx.selfHitDone && p > 0.36) {
        fx.selfHitDone = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.5, 0.68);
        this.spawnImpactSparks(c.x, rect.top, 0, -1, fx.spec, 18, 0.95);
        this.pulseCardHit(fx.card);
      }

      drawPrismButterfly(ctx, qPos.x, qPos.y, qHeading, 1.35 * fx.intensity, fx.age * 11, fx.spec, open, true);
    }

    // =========================================================================
    // 10. CHRONO CLOCKWORK (永恒时计 · 苍穹星钟时序逆转)
    // =========================================================================
    spawnChronoClockwork(card, rect, spec, tier, intensity, unleashed) {
      const prismSpecs = [
        { side: 'top', ratio: 0.2, delay: 0.46 },
        { side: 'top', ratio: 0.5, delay: 0.48 },
        { side: 'top', ratio: 0.8, delay: 0.50 },
        { side: 'left', ratio: 0.28, delay: 0.54 },
        { side: 'right', ratio: 0.28, delay: 0.56 },
        { side: 'left', ratio: 0.72, delay: 0.62 },
        { side: 'right', ratio: 0.72, delay: 0.64 },
        { side: 'bottom', ratio: 0.5, delay: 0.68 }
      ];
      this.effects.push({
        type: 'chrono-clockwork',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 1.98,
        reversalBurstDone: false,
        shockAge: -1,
        prisms: prismSpecs.map((ps) => ({ ...ps, hitDone: false }))
      });
      this.spawnCardHalo(card, spec, 0.92, 1.2);
    }

    updateDrawChronoClockwork(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const open = p < 0.14 ? p / 0.14 : (p > 0.84 ? (1 - p) / 0.16 : 1);
      const c = rectCenter(rect);
      const clockCenter = { x: c.x, y: Math.max(66, rect.top - 52) };

      drawAstronomicalClock(ctx, clockCenter.x, clockCenter.y, 48 * open * fx.intensity, fx.age, p, fx.spec, open);

      // Midnight Reversal Detonation at p = 0.44
      if (!fx.reversalBurstDone && p >= 0.44) {
        fx.reversalBurstDone = true;
        fx.shockAge = 0;
        this.spawnCardHalo(fx.card, fx.spec, 0.85, 1.35);
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.55, 0.82);
        this.spawnImpactSparks(clockCenter.x, clockCenter.y, 0, 1, fx.spec, 26, 1.2);
        this.pulseCardHit(fx.card);
      }

      // Twin Concentric Chrono Shockwave Rings with radial tick marks
      if (fx.shockAge >= 0 && fx.shockAge < 0.75) {
        fx.shockAge += dt;
        const sp = fx.shockAge / 0.75;
        const sAlpha = (1 - sp) * 0.92;
        const rOuter = 26 + sp * (Math.max(rect.width, rect.height) * 0.92);
        const rInner = 16 + sp * (Math.max(rect.width, rect.height) * 0.62);

        ctx.save();
        ctx.translate(clockCenter.x, clockCenter.y);
        ctx.globalAlpha = sAlpha;
        ctx.strokeStyle = fx.spec.bright;
        ctx.lineWidth = 4.2 * (1 - sp) + 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = fx.spec.spark;
        ctx.lineWidth = 2.4 * (1 - sp) + 0.8;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, rInner, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 8 Faceted Chrono Crystal Prisms launching from Clock Face onto Card Borders
      for (const pr of fx.prisms) {
        if (fx.age < pr.delay) continue;
        const flightP = clamp((fx.age - pr.delay) / 0.36, 0, 1);
        if (flightP >= 1) continue;
        const hitPt = edgePoint(rect, pr.side, pr.ratio);
        const ang = Math.atan2(hitPt.y - clockCenter.y, hitPt.x - clockCenter.x);
        const startPt = {
          x: clockCenter.x + Math.cos(ang) * 28,
          y: clockCenter.y + Math.sin(ang) * 28
        };
        const cur = lerpPt(startPt, hitPt, flightP * flightP * 0.45 + flightP * 0.55);

        if (!pr.hitDone && flightP >= 0.88) {
          pr.hitDone = true;
          this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.42, 0.36);
          this.spawnImpactSparks(hitPt.x, hitPt.y, hitPt.nx, hitPt.ny, fx.spec, 10, 0.95);
          this.pulseCardHit(fx.card);
        }

        drawTimePrismShard(ctx, cur.x, cur.y, ang, 15 * fx.intensity, fx.spec, open);
      }
    }

    // =========================================================================
    // 11. ARCANE COSMOS (星界天象 · 诸神黄昏星界禁咒)
    // =========================================================================
    spawnArcaneCosmos(card, rect, spec, tier, intensity, unleashed) {
      const sideHits = [
        { side: 'top', ratio: 0.25 },
        { side: 'top', ratio: 0.5 },
        { side: 'top', ratio: 0.75 },
        { side: 'left', ratio: 0.25 },
        { side: 'right', ratio: 0.25 },
        { side: 'top', ratio: 0.5 }
      ];
      const meteors = sideHits.map((target, i) => ({
        delay: 0.22 + i * 0.13,
        duration: 0.46,
        side: target.side,
        sideRatio: target.ratio,
        hitDone: false,
        trail: []
      }));
      this.effects.push({
        type: 'arcane-cosmos',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 1.92,
        meteors
      });
      this.spawnCardHalo(card, spec, 0.95, 1.25);
    }

    updateDrawArcaneCosmos(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.18 ? p / 0.18 : (p > 0.78 ? (1 - p) / 0.22 : 1);
      const center = { x: rect.left + rect.width * 0.5, y: Math.max(60, rect.top - 50) };

      const radius = 96 * (0.4 + 0.6 * open) * fx.intensity;
      drawArcaneCircle(ctx, center.x, center.y, radius, fx.age * 1.45, 0.52, 3, fx.spec, open);
      drawAstrolabe(ctx, center.x, center.y - 12, 52 * open * fx.intensity, fx.age, fx.spec, open * 0.94);

      if (p > 0.22 && p < 0.82) {
        const beamEnv = Math.sin(((p - 0.22) / 0.60) * Math.PI);
        const bw = 38 * beamEnv;
        if (bw > 0.8) {
          const g = safeLinearGradient(ctx, center.x - bw, 0, center.x + bw, 0);
          if (g) {
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.3, `rgba(${fx.spec.rgb}, ${beamEnv * 0.55})`);
            g.addColorStop(0.5, `rgba(255, 253, 240, ${beamEnv * 0.9})`);
            g.addColorStop(0.7, `rgba(${fx.spec.rgb}, ${beamEnv * 0.55})`);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(center.x - bw, center.y - 100, bw * 2, rect.bottom - center.y + 114);
          }
        }
      }

      // Symmetric Flanking Mini Rune Sub-Circles Framing Card Corners
      if (p > 0.20) {
        const sp = clamp((p - 0.20) / 0.72, 0, 1);
        const sOpen = sp < 0.22 ? sp / 0.22 : (sp > 0.78 ? (1 - sp) / 0.22 : 1);
        for (const side of [-1, 1]) {
          const subC = {
            x: side < 0 ? rect.left - 18 : rect.right + 18,
            y: rect.top + 12
          };
          const mid = { x: lerp(center.x, subC.x, 0.5), y: Math.min(center.y, subC.y) - 34 };
          ctx.save();
          ctx.globalAlpha = sOpen * 0.9;
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2.4;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -fx.age * 80;
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.quadraticCurveTo(mid.x, mid.y, subC.x, subC.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          drawArcaneCircle(ctx, subC.x, subC.y, 38 * sOpen, -fx.age * 1.9, 0.52, 2, fx.spec, sOpen * 0.92);
        }
      }

      for (const m of fx.meteors) {
        if (fx.age < m.delay) continue;
        const mp = clamp((fx.age - m.delay) / m.duration, 0, 1);
        if (mp >= 1) continue;
        const hitPt = edgePoint(rect, m.side, m.sideRatio);
        const startPt = { x: center.x + (m.sideRatio - 0.5) * 32, y: center.y - 24 };
        const ctrl = { x: lerp(startPt.x, hitPt.x, 0.45) - 18, y: Math.min(startPt.y, hitPt.y) - 36 };
        const pos = cubicPoint(startPt, ctrl, ctrl, hitPt, mp * mp * 0.4 + mp * 0.6);

        m.trail.push(pos);
        if (m.trail.length > 16) m.trail.shift();
        if (m.trail.length >= 3) {
          const g = safeLinearGradient(ctx, m.trail[0].x, m.trail[0].y, pos.x, pos.y);
          if (g) {
            g.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            g.addColorStop(0.55, fx.spec.main);
            g.addColorStop(1, '#fef08a');
            drawTaperedRibbon(ctx, m.trail, 8.5, g, 0.8);
          }
        }
        drawStarBloom(ctx, pos.x, pos.y, 15, '#ffffff', '#fbbf24', 1);

        if (!m.hitDone && mp >= 0.9) {
          m.hitDone = true;
          this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.44, 0.42);
          this.spawnImpactSparks(hitPt.x, hitPt.y, hitPt.nx, hitPt.ny, fx.spec, 18, 1.05);
          this.pulseCardHit(fx.card);
        }
      }
    }

    // =========================================================================
    // 12. KUNPENG WHALE -> ROC (逍遥鲲鹏 · 化鲲为鹏扶摇九万里)
    // =========================================================================
    spawnKunpengWhale(card, rect, spec, tier, intensity, unleashed) {
      this.effects.push({
        type: 'kunpeng-whale',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.15,
        flip: Math.random() < 0.5 ? 1 : -1,
        trail: [],
        morphDone: false,
        selfHitDone: false,
        sweepHitDone: false
      });
      this.spawnCardHalo(card, spec, 0.94, 1.2);
    }

    updateDrawKunpengWhale(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const fade = p < 0.1 ? p / 0.1 : (p > 0.85 ? (1 - p) / 0.15 : 1);
      const f = fx.flip;
      const c = rectCenter(rect);

      if (p < 0.46) {
        const rp = p / 0.46;
        const rx = 22 + rp * 74;
        ctx.save();
        ctx.translate(c.x, rect.top);
        ctx.globalAlpha = (1 - rp) * 0.85;
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 3.5 * (1 - rp) + 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, rx * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Breaches skyward (0..0.42), morphs into Golden Roc at apex, sweeps around card right & bottom!
      const waypoints = [
        { x: c.x - f * rect.width * 0.38, y: rect.top + 22 },
        { x: c.x, y: Math.max(54, rect.top - rect.height * 0.78) },
        { x: rect.left + (f > 0 ? 1.24 : -0.24) * rect.width, y: rect.top + rect.height * 0.24 },
        { x: c.x + f * rect.width * 0.25, y: rect.bottom + rect.height * 0.34 },
        { x: rect.left + (f > 0 ? -0.28 : 1.28) * rect.width, y: rect.top + rect.height * 0.35 }
      ];

      const pos = catmullRom(waypoints, p);
      const ahead = catmullRom(waypoints, Math.min(0.999, p + 0.025));
      const heading = Math.atan2(ahead.y - pos.y, ahead.x - pos.x);

      fx.trail.push(pos);
      if (fx.trail.length > 26) fx.trail.shift();

      const isPeng = p >= 0.42;

      if (fx.trail.length >= 3) {
        const g = safeLinearGradient(ctx, fx.trail[0].x, fx.trail[0].y, pos.x, pos.y);
        if (g) {
          g.addColorStop(0, 'rgba(20, 184, 166, 0)');
          g.addColorStop(0.5, isPeng ? '#f59e0b' : fx.spec.main);
          g.addColorStop(1, isPeng ? '#fef08a' : '#67e8f9');
          drawTaperedRibbon(ctx, fx.trail, isPeng ? 13 : 9.5, g, fade * 0.7);
        }
        drawTaperedRibbon(ctx, fx.trail, 2.6, '#ffffff', fade * 0.9);
      }

      if (!fx.morphDone && p >= 0.42) {
        fx.morphDone = true;
        this.spawnImpactSparks(pos.x, pos.y, 0, -1, SPECTRA['solar-gold'], 24, 1.15, { gravity: -40 });
        this.spawnImpactSparks(pos.x, pos.y, 0, 1, fx.spec, 16, 0.95);
        this.pulseCardHit(fx.card);
      }
      if (p > 0.36 && p < 0.56) {
        const mp = Math.sin(((p - 0.36) / 0.20) * Math.PI);
        drawStarBloom(ctx, pos.x, pos.y, 44 * mp, '#ffffff', '#f59e0b', mp);
      }

      if (!fx.selfHitDone && p > 0.26) {
        fx.selfHitDone = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.46, 0.56);
        this.spawnImpactSparks(c.x, rect.top, 0, -1, fx.spec, 16, 0.95);
      }

      if (!fx.sweepHitDone && p > 0.72) {
        fx.sweepHitDone = true;
        this.spawnBorderFlash(fx.card, 'bottom', 0.5, SPECTRA['solar-gold'], 0.48, 0.56);
        this.spawnImpactSparks(c.x, rect.bottom, 0, 1, SPECTRA['solar-gold'], 18, 1.0);
        this.pulseCardHit(fx.card);
      }

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(heading);
      if (Math.cos(heading) < 0) ctx.scale(1, -1);
      if (isPeng) {
        drawGoldenPeng(ctx, 0, 0, 0, 1.36 * fx.intensity, fx.age, fx.spec, fade);
      } else {
        drawSpiritWhale(ctx, 0, 0, 0, 1.32 * fx.intensity, fx.age, fx.spec, fade);
      }
      ctx.restore();
    }

    // =========================================================================
    // 13. RAGING TSUNAMI (波浪狂涛 · 怒海狂澜 · 惊涛拍岸)
    // =========================================================================
    spawnRagingTsunami(card, rect, spec, tier, intensity, unleashed) {
      this.effects.push({
        type: 'raging-tsunami',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.25,
        flip: Math.random() < 0.5 ? 1 : -1,
        primaryCrashDone: false,
        secondaryCrashDone: false,
        primarySplashAge: -1,
        secondarySplashAge: -1,
        mistTimer: 0
      });
      this.spawnCardHalo(card, spec, 0.96, 1.3);
    }

    updateDrawRagingTsunami(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const open = p < 0.14 ? p / 0.14 : (p > 0.84 ? (1 - p) / 0.16 : 1);
      const c = rectCenter(rect);
      const f = fx.flip;

      // Twin opposing swirling current ribbons hugging & breaking around the card
      const streamProg = clamp(p / 0.65, 0, 1);
      for (const side of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= 18; i += 1) {
          const t = (i / 18) * streamProg;
          const swellX = side * (rect.width * 0.58 + Math.sin(t * Math.PI * 1.4) * 32);
          const swellY = lerp(rect.bottom + 14, rect.top - 34, t) + Math.cos(t * Math.PI * 2 + fx.age * 5) * 10;
          pts.push({ x: c.x + swellX * (1 - t * 0.45), y: swellY });
        }
        if (pts.length >= 3) {
          const sg = safeLinearGradient(ctx, pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
          if (sg) {
            sg.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            sg.addColorStop(0.5, fx.spec.main);
            sg.addColorStop(1, '#ffffff');
            drawTaperedRibbon(ctx, pts, 9.5, sg, open * 0.68, 0.9);
          }
          drawTaperedRibbon(ctx, pts, 3.0, '#e0f2fe', open * 0.9, 0.9);
        }
      }

      // Main Hero Ukiyo-e Breaking Wave curling up and crashing over top edge
      const p1Rise = clamp(p / 0.44, 0, 1);
      const p1Ease = 1 - Math.pow(1 - p1Rise, 2.2);
      const p1Curl = clamp((p - 0.12) / 0.36, 0, 1);
      const mainH = Math.min(118, rect.height * 0.86) * p1Ease * fx.intensity;
      const mainW = (rect.width * 0.72) * fx.intensity;
      const mainBaseX = f > 0 ? rect.left + rect.width * 0.24 : rect.right - rect.width * 0.24;
      const mainBaseY = Math.max(46 + mainH, rect.top + 8);
      if (mainH > 10) {
        drawBreakingTsunamiWave(ctx, mainBaseX, mainBaseY, mainW, mainH, f, p1Curl, fx.age, fx.spec, open);
      }

      // Opposing flank surge curling inward across the opposite edge & lower corner
      if (p > 0.20) {
        const p2 = clamp((p - 0.20) / 0.48, 0, 1);
        const p2Fade = p2 > 0.82 ? (1 - p2) / 0.18 : 1;
        const p2Ease = 1 - Math.pow(1 - Math.min(1, p2 * 1.45), 2);
        const subH = Math.min(82, rect.height * 0.62) * p2Ease * fx.intensity;
        const subW = (rect.width * 0.58) * fx.intensity;
        const subX = f > 0 ? rect.right - rect.width * 0.14 : rect.left + rect.width * 0.14;
        const subY = rect.bottom + 14;
        if (subH > 8) {
          drawBreakingTsunamiWave(ctx, subX, subY, subW, subH, -f, clamp(p2 * 1.3, 0, 1), fx.age + 0.5, fx.spec, open * p2Fade * 0.94);
        }
      }

      // Continuous fine sea-mist droplets while waves crest
      fx.mistTimer += dt;
      if (p > 0.18 && p < 0.78 && fx.mistTimer >= 0.08) {
        fx.mistTimer = 0;
        const crestX = mainBaseX + f * mainW * 0.46;
        const crestY = Math.max(38, mainBaseY - mainH * 0.75);
        this.spawnImpactSparks(crestX, crestY, f, -0.35, fx.spec, 4, 0.72, { speedMin: 70, speedMax: 170, gravity: 320 });
      }

      // Primary crest crash onto top border
      if (!fx.primaryCrashDone && p >= 0.43) {
        fx.primaryCrashDone = true;
        fx.primarySplashAge = 0;
        const hitX = c.x + f * rect.width * 0.18;
        this.spawnCardHalo(fx.card, fx.spec, 0.94, 1.3);
        this.spawnBorderFlash(fx.card, 'top', f > 0 ? 0.62 : 0.38, fx.spec, 0.55, 0.72);
        this.spawnBorderFlash(fx.card, f > 0 ? 'left' : 'right', 0.26, fx.spec, 0.46, 0.48);
        this.spawnImpactSparks(hitX, rect.top, 0, -1, fx.spec, 24, 1.18, { gravity: 360 });
        this.pulseCardHit(fx.card);
      }
      if (fx.primarySplashAge >= 0 && fx.primarySplashAge < 0.56) {
        fx.primarySplashAge += dt;
        const sp = fx.primarySplashAge / 0.56;
        drawFoamSplashCluster(ctx, c.x + f * rect.width * 0.18, rect.top, sp, 72 * fx.intensity, fx.spec, open);
      }

      // Secondary riptide crash across bottom border
      if (!fx.secondaryCrashDone && p >= 0.64) {
        fx.secondaryCrashDone = true;
        fx.secondarySplashAge = 0;
        const hitX = c.x - f * rect.width * 0.18;
        this.spawnBorderFlash(fx.card, 'bottom', f > 0 ? 0.38 : 0.62, fx.spec, 0.52, 0.68);
        this.spawnBorderFlash(fx.card, f > 0 ? 'right' : 'left', 0.68, fx.spec, 0.45, 0.46);
        this.spawnImpactSparks(hitX, rect.bottom, 0, 1, fx.spec, 20, 1.08, { gravity: 300 });
        this.pulseCardHit(fx.card);
      }
      if (fx.secondarySplashAge >= 0 && fx.secondarySplashAge < 0.52) {
        fx.secondarySplashAge += dt;
        const sp = fx.secondarySplashAge / 0.52;
        drawFoamSplashCluster(ctx, c.x - f * rect.width * 0.18, rect.bottom, sp, 62 * fx.intensity, fx.spec, open);
      }
    }

    // =========================================================================
    // 14. METEOR SHOWER (流星坠落 · 天穹流星 · 群星坠落)
    // =========================================================================
    spawnMeteorShower(card, rect, spec, tier, intensity, unleashed) {
      const flip = Math.random() < 0.5 ? 1 : -1;
      const defs = [
        { delay: 0.02, dur: 0.62, size: 7.5, kind: 'graze', sx: -0.52, ex: 0.96, side: 'top', ratio: 0.24 },
        { delay: 0.12, dur: 0.64, size: 8.4, kind: 'graze', sx: 0.12, ex: 1.24, side: 'right', ratio: 0.34 },
        { delay: 0.20, dur: 0.66, size: 10.8, kind: 'impact', sx: -0.38, ex: 0.24, side: 'top', ratio: 0.24 },
        { delay: 0.32, dur: 0.60, size: 7.4, kind: 'graze', sx: -0.72, ex: 0.44, side: 'left', ratio: 0.62 },
        { delay: 0.42, dur: 0.68, size: 11.4, kind: 'impact', sx: 0.02, ex: 0.78, side: 'top', ratio: 0.78 },
        { delay: 0.52, dur: 0.62, size: 8.2, kind: 'graze', sx: -0.26, ex: 1.28, side: 'bottom', ratio: 0.68 },
        { delay: 0.62, dur: 0.68, size: 10.4, kind: 'impact', sx: -0.50, ex: 0.18, side: 'right', ratio: 0.54 },
        { delay: 0.72, dur: 0.62, size: 8.0, kind: 'graze', sx: 0.18, ex: 1.32, side: 'top', ratio: 0.86 },
        { delay: 0.84, dur: 0.60, size: 8.8, kind: 'graze', sx: -0.60, ex: 0.82, side: 'bottom', ratio: 0.32 },
        { delay: 0.64, dur: 0.94, size: 17.0, kind: 'hero', sx: -0.44, ex: 0.52, side: 'top', ratio: 0.50 }
      ];
      this.effects.push({
        type: 'meteor-shower',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.35,
        flip,
        meteors: defs.map((d) => ({ ...d, trail: [], hitDone: false, impactAge: -1 })),
        dustTimer: 0
      });
      this.spawnCardHalo(card, spec, 0.92, 1.24);
    }

    updateDrawMeteorShower(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const open = p < 0.12 ? p / 0.12 : (p > 0.86 ? (1 - p) / 0.14 : 1);
      const c = rectCenter(rect);
      const f = fx.flip;

      // Oblique Indigo-Gold Celestial Sky-Rift Portal above upper corner
      const riftCenter = { x: c.x - f * rect.width * 0.26, y: Math.max(38, rect.top - 52) };
      ctx.save();
      ctx.translate(riftCenter.x, riftCenter.y);
      ctx.rotate(-0.32 * f);
      const riftGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 68 * open);
      riftGlow.addColorStop(0, `rgba(254, 240, 138, ${open * 0.82})`);
      riftGlow.addColorStop(0.36, `rgba(${fx.spec.rgb}, ${open * 0.52})`);
      riftGlow.addColorStop(0.72, `rgba(49, 46, 129, ${open * 0.42})`);
      riftGlow.addColorStop(1, 'rgba(30, 27, 75, 0)');
      ctx.fillStyle = riftGlow;
      ctx.beginPath();
      ctx.ellipse(0, 0, 68 * open, 19 * open, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = open * 0.85;
      ctx.strokeStyle = fx.spec.bright;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 52 * open, 12 * open, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      fx.dustTimer += dt;
      if (p < 0.85 && fx.dustTimer >= 0.09) {
        fx.dustTimer = 0;
        this.spawnMote(c.x + rand(-rect.width * 0.6, rect.width * 0.6), Math.max(32, rect.top - rand(10, 64)), fx.spec);
      }

      for (const m of fx.meteors) {
        const hitPt = m.kind === 'graze'
          ? {
              x: c.x + f * (m.ex - 0.5) * rect.width * 1.18,
              y: rect.bottom + 42,
              nx: 0,
              ny: 1,
              side: m.side,
              ratio: m.ratio
            }
          : edgePoint(rect, m.side, m.ratio);

        if (m.impactAge >= 0 && m.impactAge < 0.78) {
          m.impactAge += dt;
          drawMeteorImpactRing(
            ctx,
            hitPt.x,
            hitPt.y,
            m.impactAge / 0.78,
            (m.kind === 'hero' ? 92 : 52) * fx.intensity,
            fx.spec,
            open
          );
        }

        if (fx.age < m.delay) continue;
        const mp = clamp((fx.age - m.delay) / m.dur, 0, 1);
        if (mp >= 1) continue;

        const startX = c.x + f * m.sx * rect.width - f * 52;
        const startY = Math.max(22, rect.top - (m.kind === 'hero' ? 140 : 108));
        const easeP = mp * mp * 0.45 + mp * 0.55;
        const pos = lerpPt({ x: startX, y: startY }, hitPt, easeP);
        const angle = Math.atan2(hitPt.y - startY, hitPt.x - startX);

        m.trail.push(pos);
        if (m.trail.length > (m.kind === 'hero' ? 24 : 18)) m.trail.shift();

        if (m.trail.length >= 3) {
          // Deep indigo/ink outer contrast sheath so shooting tails pop starkly against light paper too
          drawTaperedRibbon(ctx, m.trail, m.kind === 'hero' ? 16 : 9, fx.spec.deep, open * 0.42, 1.25);
          const g = safeLinearGradient(ctx, m.trail[0].x, m.trail[0].y, pos.x, pos.y);
          if (g) {
            g.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            g.addColorStop(0.45, fx.spec.main);
            g.addColorStop(0.85, fx.spec.bright);
            g.addColorStop(1, '#ffffff');
            drawTaperedRibbon(ctx, m.trail, m.kind === 'hero' ? 13 : 7.2, g, open * 0.9, 1.25);
          }
          drawTaperedRibbon(ctx, m.trail, m.kind === 'hero' ? 4.4 : 2.3, '#ffffff', open * 0.96, 1.25);
        }

        drawShootingMeteorHead(ctx, pos.x, pos.y, angle, m.size * fx.intensity, fx.spec, open, m.kind === 'hero');

        if (!m.hitDone && mp >= 0.88) {
          m.hitDone = true;
          if (m.kind !== 'graze') {
            m.impactAge = 0;
            const isHero = m.kind === 'hero';
            this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, isHero ? 0.68 : 0.46, isHero ? 0.86 : 0.44);
            this.spawnImpactSparks(hitPt.x, hitPt.y, hitPt.nx, hitPt.ny, fx.spec, isHero ? 32 : 12, isHero ? 1.36 : 0.95);
            this.pulseCardHit(fx.card);
            if (isHero) {
              this.spawnCardHalo(fx.card, fx.spec, 0.98, 1.42);
            }
          } else {
            this.spawnImpactSparks(pos.x, pos.y, f * 0.4, -0.6, fx.spec, 7, 0.78);
          }
        }
      }
    }

    // =========================================================================
    // 15. GLACIAL FREEZE (冰封千里 · 绝对零度 · 永冬凛域)
    // =========================================================================
    spawnGlacialFreeze(card, rect, spec, tier, intensity, unleashed) {
      const spires = [
        { side: 'top', ratio: 0.14, tilt: -0.22, len: 52, width: 12, delay: 0.14 },
        { side: 'top', ratio: 0.30, tilt: -0.08, len: 42, width: 10, delay: 0.18 },
        { side: 'top', ratio: 0.70, tilt: 0.08, len: 42, width: 10, delay: 0.18 },
        { side: 'top', ratio: 0.86, tilt: 0.22, len: 52, width: 12, delay: 0.14 },
        { side: 'left', ratio: 0.20, tilt: -0.28, len: 48, width: 11, delay: 0.22 },
        { side: 'left', ratio: 0.54, tilt: 0.04, len: 40, width: 10, delay: 0.26 },
        { side: 'left', ratio: 0.84, tilt: 0.32, len: 46, width: 11, delay: 0.30 },
        { side: 'right', ratio: 0.20, tilt: 0.28, len: 48, width: 11, delay: 0.22 },
        { side: 'right', ratio: 0.54, tilt: -0.04, len: 40, width: 10, delay: 0.26 },
        { side: 'right', ratio: 0.84, tilt: -0.32, len: 46, width: 11, delay: 0.30 },
        { side: 'bottom', ratio: 0.16, tilt: 0.24, len: 44, width: 11, delay: 0.34 },
        { side: 'bottom', ratio: 0.40, tilt: 0.06, len: 36, width: 9.5, delay: 0.36 },
        { side: 'bottom', ratio: 0.60, tilt: -0.06, len: 36, width: 9.5, delay: 0.36 },
        { side: 'bottom', ratio: 0.84, tilt: -0.24, len: 44, width: 11, delay: 0.34 }
      ];
      this.effects.push({
        type: 'glacial-freeze',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 2.30,
        spires: spires.map((sp) => ({ ...sp, hitDone: false })),
        freezeLockDone: false,
        shatterDone: false,
        snowTimer: 0
      });
      this.spawnCardHalo(card, spec, 0.94, 1.25);
    }

    updateDrawGlacialFreeze(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const open = p < 0.14 ? p / 0.14 : (p > 0.82 ? (1 - p) / 0.18 : 1);
      const c = rectCenter(rect);
      const snowPos = { x: c.x, y: Math.max(54, rect.top - 42) };

      // Polar Absolute-Zero Frost Pulse Wave expanding cleanly past card perimeter
      if (p < 0.45) {
        const wp = p / 0.45;
        const expand = wp * 34;
        const baseR = parseFloat(window.getComputedStyle(fx.card).borderRadius) || 14;
        ctx.save();
        roundedRectPath(
          ctx,
          rect.left - expand,
          rect.top - expand,
          rect.width + expand * 2,
          rect.height + expand * 2,
          baseR + expand * 0.4
        );
        ctx.globalAlpha = (1 - wp) * 0.88;
        ctx.strokeStyle = fx.spec.bright;
        ctx.lineWidth = 6 * (1 - wp) + 1.5;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * (1 - wp);
        ctx.stroke();
        ctx.restore();
      }

      // Twin swirling Arctic frost-wind ribbons framing card sides
      const windProg = clamp(p / 0.72, 0, 1);
      for (const side of [-1, 1]) {
        const wPts = [];
        for (let i = 0; i <= 18; i += 1) {
          const t = (i / 18) * windProg;
          const arcX = side * (rect.width * 0.56 + Math.sin(t * Math.PI * 1.8) * 26);
          const arcY = lerp(rect.bottom + 8, snowPos.y, t);
          wPts.push({ x: c.x + arcX * (1 - t * 0.62), y: arcY });
        }
        if (wPts.length >= 3) {
          drawTaperedRibbon(ctx, wPts, 6.2, fx.spec.bright, open * 0.6, 0.9);
          drawTaperedRibbon(ctx, wPts, 2.0, '#ffffff', open * 0.9, 0.9);
        }
      }

      // Crystalline Frost Creep branching across all 4 corners
      const creepReach = clamp(p / 0.35, 0, 1) * 32 * fx.intensity;
      drawFrostCreepCorner(ctx, rect.left + 4, rect.top + 4, 0.72, creepReach, fx.spec, open);
      drawFrostCreepCorner(ctx, rect.right - 4, rect.top + 4, Math.PI - 0.72, creepReach, fx.spec, open);
      drawFrostCreepCorner(ctx, rect.left + 4, rect.bottom - 4, -0.72, creepReach, fx.spec, open);
      drawFrostCreepCorner(ctx, rect.right - 4, rect.bottom - 4, -Math.PI + 0.72, creepReach, fx.spec, open);

      // 14 Faceted Glacier Crystal Spires erupting outward along card frame
      const recede = p > 0.76 ? clamp((1 - p) / 0.24, 0, 1) : 1;
      for (const sp of fx.spires) {
        if (fx.age < sp.delay) continue;
        const growRaw = clamp((fx.age - sp.delay) / 0.28, 0, 1);
        const grow = (1 - Math.pow(1 - growRaw, 2.6)) * recede;
        if (grow <= 0.02) continue;

        const ep = edgePoint(rect, sp.side, sp.ratio);
        const normalAngle = Math.atan2(ep.ny, ep.nx) + Math.PI / 2;
        drawGlacierCrystalSpire(
          ctx,
          ep.x,
          ep.y,
          normalAngle + sp.tilt,
          sp.len * fx.intensity,
          sp.width * fx.intensity,
          grow,
          fx.spec,
          open
        );

        if (!sp.hitDone && growRaw >= 0.68) {
          sp.hitDone = true;
          this.spawnImpactSparks(ep.x, ep.y, ep.nx, ep.ny, fx.spec, 5, 0.76);
        }
      }

      // Grand 6-Fold Dendritic Snowflake Halo rotating overhead
      const snowOpen = p < 0.2 ? p / 0.2 : open;
      drawDendriticSnowflake(ctx, snowPos.x, snowPos.y, 44 * (0.45 + 0.55 * snowOpen) * fx.intensity, fx.age * 0.85, fx.spec, open);

      if (!fx.freezeLockDone && p >= 0.40) {
        fx.freezeLockDone = true;
        for (const side of ['top', 'bottom', 'left', 'right']) {
          this.spawnBorderFlash(fx.card, side, 0.5, fx.spec, 0.58, 0.82);
        }
        this.spawnImpactSparks(snowPos.x, snowPos.y, 0, 1, fx.spec, 20, 1.05, { gravity: 110 });
        this.pulseCardHit(fx.card);
      }

      if (!fx.shatterDone && p >= 0.78) {
        fx.shatterDone = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.46, 0.88);
        this.spawnImpactSparks(c.x, rect.top, 0, -1, fx.spec, 18, 1.0, { gravity: 160 });
      }

      fx.snowTimer += dt;
      if (p > 0.14 && p < 0.82 && fx.snowTimer >= 0.1) {
        fx.snowTimer = 0;
        this.spawnMote(c.x + rand(-rect.width * 0.58, rect.width * 0.58), rand(snowPos.y - 22, rect.bottom + 18), fx.spec);
      }
    }

    // =========================================================================
    // 16. EASTER EGG: SHADOW S1 EP20 RAINY NIGHT 1v2 DUEL (彩蛋：影之实力者 · 雨夜武心祭)
    // =========================================================================
    spawnShadowEminence(card, rect, spec, tier, intensity, unleashed) {
      // Prevent overlapping duplicate Shadow battle on the same card
      this.effects = this.effects.filter((fx) => !(fx.card === card && fx.type === 'shadow-eminence'));
      this.effects.push({
        type: 'shadow-eminence',
        tier: 3, card, spec, intensity, unleashed,
        age: 0,
        duration: 5.80,
        shadowTrail: [],
        beatrixTrail: [],
        irisTrail: [],
        shadowAfterimages: [],
        afterimageTimer: 0,
        beatFlags: {},
        rainSparkTimer: 0,
        atomicBlastDone: false,
        atomicAftershockDone: false
      });
      this.spawnCardHalo(card, spec, 0.98, 1.5);
    }

    updateDrawShadowEminence(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const open = p < 0.05 ? p / 0.05 : (p > 0.94 ? (1 - p) / 0.06 : 1);
      const c = rectCenter(rect);
      const vpW = Math.max(320, this.width || window.innerWidth || 1280);
      const vpH = Math.max(320, this.height || window.innerHeight || 820);

      // Safe viewport-clamped fight zones encircling all 4 sides of the card
      const leftX = clamp(rect.left - 22, 46, Math.max(92, vpW - 180));
      const rightX = clamp(rect.right + 18, leftX + 110, Math.max(leftX + 110, vpW - 46));
      const centerX = (leftX + rightX) * 0.5;
      const topY = clamp(rect.top - 40, 48, Math.max(100, vpH - 130));
      const botY = clamp(rect.bottom + 24, topY + 70, vpH - 46);
      const midY = (topY + botY) * 0.5;

      const Z = {
        TOP_L: { x: lerp(leftX, centerX, 0.24), y: topY },
        TOP_C: { x: centerX, y: topY - 4 },
        TOP_R: { x: lerp(centerX, rightX, 0.76), y: topY },
        MID_L: { x: leftX, y: midY },
        MID_R: { x: rightX, y: midY },
        BOT_L: { x: lerp(leftX, centerX, 0.26), y: botY },
        BOT_C: { x: centerX, y: botY + 4 },
        BOT_R: { x: lerp(centerX, rightX, 0.74), y: botY }
      };

      const sampleTrack = (frames, tVal) => {
        if (tVal <= frames[0].p) return { x: frames[0].x, y: frames[0].y, vx: 0, vy: 0 };
        for (let i = 0; i < frames.length - 1; i += 1) {
          const a = frames[i];
          const b = frames[i + 1];
          if (tVal <= b.p) {
            const span = Math.max(0.0001, b.p - a.p);
            const u = clamp((tVal - a.p) / span, 0, 1);
            // Snappy anime dash curve (fast acceleration, brief impact hang)
            const ease = u * u * (3 - 2 * u);
            return {
              x: lerp(a.x, b.x, ease),
              y: lerp(a.y, b.y, ease),
              vx: (b.x - a.x) / span,
              vy: (b.y - a.y) / span
            };
          }
        }
        const last = frames[frames.length - 1];
        return { x: last.x, y: last.y, vx: 0, vy: 0 };
      };

      const pushTrail = (arr, pt, maxLen) => {
        const last = arr[arr.length - 1];
        if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 3.5) {
          arr.push({ x: pt.x, y: pt.y });
          if (arr.length > maxLen) arr.shift();
        }
      };

      // Rain freezes during Atomic buildup (p = 0.72..0.81), then vaporizes radially on detonation (p = 0.81..1.00)
      const rainFreezeP = p >= 0.72 && p < 0.81 ? clamp((p - 0.72) / 0.09, 0, 1) : 0;
      const rainDisperseP = p >= 0.81 ? clamp((p - 0.81) / 0.14, 0, 1) : 0;

      // Keyframed synchronized trajectories across Act 1 High-Speed Chase + Beat 6 Counter
      const shadowTrack = [
        { p: 0.00, ...Z.MID_L },
        { p: 0.08, ...Z.TOP_L },
        { p: 0.18, ...Z.BOT_R },
        { p: 0.28, ...Z.BOT_L },
        { p: 0.37, ...Z.TOP_R },
        { p: 0.43, ...Z.MID_L },
        { p: 0.47, ...Z.BOT_C },
        { p: 0.51, ...Z.MID_R },
        { p: 0.54, ...Z.TOP_C },
        { p: 0.59, ...Z.TOP_C }
      ];
      const beatrixTrack = [
        { p: 0.00, ...Z.TOP_R },
        { p: 0.08, x: Z.TOP_L.x - 32, y: Z.TOP_L.y + 4 },
        { p: 0.18, x: Z.BOT_R.x + 28, y: Z.BOT_R.y - 6 },
        { p: 0.28, x: Z.BOT_L.x - 30, y: Z.BOT_L.y + 4 },
        { p: 0.37, x: Z.TOP_R.x - 32, y: Z.TOP_R.y + 4 },
        { p: 0.43, x: Z.MID_L.x - 4, y: Z.MID_L.y - 10 },
        { p: 0.48, ...Z.BOT_L },
        { p: 0.54, x: clamp(Z.TOP_C.x - 46, 44, vpW - 90), y: Z.TOP_C.y + 4 },
        { p: 0.57, x: clamp(Z.TOP_C.x - 46, 44, vpW - 90), y: Z.TOP_C.y + 4 },
        { p: 0.65, x: leftX - 4, y: topY + 6 },
        { p: 0.72, x: leftX - 10, y: topY + 10 }
      ];
      const irisTrack = [
        { p: 0.00, ...Z.BOT_L },
        { p: 0.08, x: Z.TOP_L.x + 34, y: Z.TOP_L.y + 4 },
        { p: 0.18, x: Z.BOT_R.x - 32, y: Z.BOT_R.y + 4 },
        { p: 0.28, x: Z.BOT_L.x + 34, y: Z.BOT_L.y + 4 },
        { p: 0.37, x: Z.TOP_R.x + 30, y: Z.TOP_R.y + 4 },
        { p: 0.43, ...Z.BOT_R },
        { p: 0.47, x: Z.BOT_C.x + 32, y: Z.BOT_C.y },
        { p: 0.54, x: clamp(Z.TOP_C.x + 46, 90, vpW - 44), y: Z.TOP_C.y + 4 },
        { p: 0.57, x: clamp(Z.TOP_C.x + 46, 90, vpW - 44), y: Z.TOP_C.y + 4 },
        { p: 0.65, x: rightX + 4, y: topY + 6 },
        { p: 0.72, x: rightX + 10, y: topY + 10 }
      ];

      const shadowState = p <= 0.59 ? sampleTrack(shadowTrack, p) : { x: Z.TOP_C.x, y: Z.TOP_C.y - 4, vx: 0, vy: 0 };
      drawRainyNightStage(ctx, shadowState.x, shadowState.y, rect, fx.age, rainFreezeP, rainDisperseP, fx.spec, open, vpW, vpH);

      fx.rainSparkTimer += dt;
      if (p < 0.80 && fx.rainSparkTimer >= 0.12) {
        fx.rainSparkTimer = 0;
        this.spawnMote(clamp(shadowState.x + rand(-80, 80), 20, vpW - 20), clamp(shadowState.y + rand(-36, 36), 20, vpH - 20), fx.spec);
      }

      // -----------------------------------------------------------------------
      // ACT 1 & ACT 2 FIGHTERS: Full-Card Speed Ribbons, Clash Sparks & Poses
      // -----------------------------------------------------------------------
      if (p < 0.73) {
        const bPos = sampleTrack(beatrixTrack, p);
        const iPos = sampleTrack(irisTrack, p);
        const inChase = p < 0.53;
        const inRecoil = p >= 0.57;

        if (inChase) {
          pushTrail(fx.beatrixTrail, bPos, 14);
          pushTrail(fx.irisTrail, iPos, 14);
        } else if (fx.beatrixTrail.length || fx.irisTrail.length) {
          if (fx.beatrixTrail.length > 0) fx.beatrixTrail.shift();
          if (fx.irisTrail.length > 0) fx.irisTrail.shift();
        }

        if (fx.beatrixTrail.length >= 3) {
          drawTaperedRibbon(ctx, fx.beatrixTrail, 7.5, '#6366f1', open * 0.42);
          drawTaperedRibbon(ctx, fx.beatrixTrail, 2.8, '#ffffff', open * 0.85);
        }
        if (fx.irisTrail.length >= 3) {
          drawTaperedRibbon(ctx, fx.irisTrail, 9.5, '#dc2626', open * 0.48);
          drawTaperedRibbon(ctx, fx.irisTrail, 5.2, '#f97316', open * 0.74);
          drawTaperedRibbon(ctx, fx.irisTrail, 2.2, '#fde047', open * 0.9);
        }

        const flankAlpha = p > 0.63 ? clamp((0.73 - p) / 0.10, 0, 1) * open : open;
        const bFacing = inRecoil ? 1 : (bPos.x <= shadowState.x + 8 ? 1 : -1);
        const iFacing = inRecoil ? -1 : (iPos.x >= shadowState.x - 8 ? -1 : 1);
        const bPose = inRecoil ? 'recoil' : 'lunge';
        const iPose = inRecoil ? 'recoil' : 'cleave';
        const flankScale = (inChase ? 0.96 : 1.04) * fx.intensity;

        drawBeatrixElf(ctx, bPos.x, bPos.y, flankScale, bPose, fx.age, flankAlpha, bFacing);
        drawIrisPrincess(ctx, iPos.x, iPos.y, flankScale, iPose, fx.age, flankAlpha, iFacing);
      }

      // Render Shadow Speed Ribbon + Dash Afterimages during p = 0.00..0.56
      if (p < 0.56) {
        pushTrail(fx.shadowTrail, shadowState, 16);
        fx.afterimageTimer += dt;
        if (fx.afterimageTimer >= 0.045) {
          fx.afterimageTimer = 0;
          fx.shadowAfterimages.push({
            x: shadowState.x,
            y: shadowState.y,
            facing: shadowState.vx >= 0 ? 1 : -1
          });
          if (fx.shadowAfterimages.length > 6) fx.shadowAfterimages.shift();
        }
      } else if (fx.shadowTrail.length || fx.shadowAfterimages.length) {
        if (fx.shadowTrail.length > 0) fx.shadowTrail.shift();
        if (fx.shadowAfterimages.length > 0) fx.shadowAfterimages.shift();
      }

      if (fx.shadowTrail.length >= 3) {
        drawTaperedRibbon(ctx, fx.shadowTrail, 11.5, '#09090b', open * 0.55);
        drawTaperedRibbon(ctx, fx.shadowTrail, 7.2, fx.spec.main, open * 0.78);
        drawTaperedRibbon(ctx, fx.shadowTrail, 2.8, fx.spec.accent, open * 0.94);
      }

      for (let i = 0; i < fx.shadowAfterimages.length; i += 1) {
        const af = fx.shadowAfterimages[i];
        const afAlpha = ((i + 1) / fx.shadowAfterimages.length) * 0.36 * open;
        drawShadowSama(ctx, af.x, af.y, 1.02 * fx.intensity, 'dash', fx.age, fx.spec, afAlpha, af.facing);
      }

      // Crisp Synchronized Clash Fireworks across TOP_L, BOT_R, BOT_L, TOP_R, MID_L, BOT_C, TOP_C!
      const clashes = [
        { id: 'c1', p: 0.08, durP: 0.07, pt: Z.TOP_L, side: 'top', ratio: 0.22, mode: 'both' },
        { id: 'c2', p: 0.18, durP: 0.07, pt: Z.BOT_R, side: 'bottom', ratio: 0.78, mode: 'iris' },
        { id: 'c3', p: 0.28, durP: 0.07, pt: Z.BOT_L, side: 'bottom', ratio: 0.24, mode: 'beatrix' },
        { id: 'c4', p: 0.37, durP: 0.07, pt: Z.TOP_R, side: 'top', ratio: 0.78, mode: 'both' },
        { id: 'c5', p: 0.43, durP: 0.06, pt: Z.MID_L, side: 'left', ratio: 0.50, mode: 'beatrix' },
        { id: 'c6', p: 0.47, durP: 0.06, pt: Z.BOT_C, side: 'bottom', ratio: 0.50, mode: 'iris' },
        { id: 'c7', p: 0.56, durP: 0.09, pt: Z.TOP_C, side: 'top', ratio: 0.50, mode: 'counter' }
      ];
      for (const cl of clashes) {
        if (p < cl.p) continue;
        if (!fx.beatFlags[cl.id]) {
          fx.beatFlags[cl.id] = true;
          this.spawnBorderFlash(fx.card, cl.side, cl.ratio, fx.spec, 0.38, cl.mode === 'counter' ? 0.88 : 0.46);
          if (cl.mode === 'iris' || cl.mode === 'both' || cl.mode === 'counter') {
            this.spawnImpactSparks(cl.pt.x, cl.pt.y, 0.4, -0.5, SPECTRA['crimson-ember'], 12, 1.05);
          }
          if (cl.mode === 'beatrix' || cl.mode === 'both' || cl.mode === 'counter') {
            this.spawnImpactSparks(cl.pt.x, cl.pt.y, -0.4, -0.5, SPECTRA['frost-opal'], 12, 1.0);
          }
          this.spawnImpactSparks(cl.pt.x, cl.pt.y, 0, -1, fx.spec, cl.mode === 'counter' ? 22 : 10, 1.12);
          this.pulseCardHit(fx.card);
        }
        const cp = clamp((p - cl.p) / cl.durP, 0, 1);
        if (cp < 1) {
          if (cl.mode === 'beatrix' || cl.mode === 'both') {
            drawBeatrixSilverArc(ctx, cl.pt.x, cl.pt.y, 50 * fx.intensity, -2.1, 0.4, cp, open);
          }
          if (cl.mode === 'iris' || cl.mode === 'both') {
            drawIrisFlameArc(ctx, cl.pt.x, cl.pt.y, 54 * fx.intensity, 0.6, 3.2, cp, open);
          }
          if (cl.mode === 'counter') {
            drawShadowSlashArc(ctx, cl.pt.x, cl.pt.y + 4, 78 * fx.intensity, -Math.PI * 0.92, Math.PI * 0.12, cp, fx.spec, open);
            drawShadowSlashArc(ctx, cl.pt.x, cl.pt.y + 4, 68 * fx.intensity, 0.18, Math.PI * 1.18, cp, fx.spec, open);
          } else {
            drawShadowSlashArc(ctx, cl.pt.x, cl.pt.y, 46 * fx.intensity, -1.3, 1.1, cp, fx.spec, open);
          }
        }
      }

      // Render Live Shadow Silhouette across Act 1 Chase ('dash'/'parry'), Act 2 ('laugh'), Act 3 Charge ('atomic')
      if (p < 0.85) {
        const heroFade = p > 0.79 ? clamp((0.85 - p) / 0.06, 0, 1) : open;
        let pose = p < 0.52 ? 'dash' : 'parry';
        let heroFacing = p < 0.52 ? (shadowState.vx >= 0 ? 1 : -1) : 1;
        let heroScale = (p < 0.52 ? 1.10 : 1.22) * fx.intensity;
        let heroY = shadowState.y;

        if (p >= 0.58 && p < 0.72) {
          pose = 'laugh';
          heroFacing = 1;
          heroScale = 1.30 * fx.intensity;
          heroY = Z.TOP_C.y - 4;

          // Swirling violet-blue mana vortex behind laughing Shadow
          ctx.save();
          ctx.translate(Z.TOP_C.x, heroY + 10);
          for (let k = 0; k < 2; k += 1) {
            ctx.rotate((k === 0 ? 1 : -1.3) * fx.age * 2.4);
            ctx.globalAlpha = heroFade * 0.78;
            ctx.strokeStyle = k === 0 ? fx.spec.main : fx.spec.accent;
            ctx.lineWidth = k === 0 ? 2.6 : 1.7;
            ctx.setLineDash([16, 12]);
            ctx.beginPath();
            ctx.ellipse(0, 0, 52 + k * 14, 18 + k * 6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();

          // Floating bold anime laugh SFX ("フハハハ!!", "ククク…")
          const lp = clamp((p - 0.58) / 0.14, 0, 1);
          const laughFade = lp < 0.15 ? lp / 0.15 : (lp > 0.8 ? (1 - lp) / 0.2 : 1);
          const shakeX = Math.sin(fx.age * 36) * 2.1;
          const floatY = -lp * 10;
          ctx.save();
          ctx.font = '900 17px system-ui, "Hiragino Sans", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          for (const t of [
            { str: 'フハハハ!!', dx: 64 + shakeX, dy: -22 + floatY, rot: 0.14, fill: '#f5f3ff', glow: fx.spec.main },
            { str: 'ククク…', dx: -62 - shakeX * 0.7, dy: -2 + floatY * 0.8, rot: -0.14, fill: '#fde047', glow: fx.spec.spark }
          ]) {
            const tx = clamp(Z.TOP_C.x + t.dx, 56, vpW - 56);
            const ty = Math.max(30, heroY + t.dy);
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(t.rot);
            ctx.globalAlpha = laughFade;
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 4.4;
            ctx.strokeText(t.str, 0, 0);
            ctx.strokeStyle = t.glow;
            ctx.lineWidth = 1.9;
            ctx.strokeText(t.str, 0, 0);
            ctx.fillStyle = t.fill;
            ctx.fillText(t.str, 0, 0);
            ctx.restore();
          }
          ctx.restore();
        } else if (p >= 0.72) {
          pose = 'atomic';
          heroFacing = 1;
          heroScale = 1.28 * fx.intensity;
          heroY = Z.TOP_C.y - 6;
        }

        drawShadowSama(ctx, shadowState.x, heroY, heroScale, pose, fx.age, fx.spec, heroFade, heroFacing);
      }

      // -----------------------------------------------------------------------
      // ACT 3 (p = 0.72..1.00, 1.62s extended finale!): Compression -> I AM ATOMIC!
      // -----------------------------------------------------------------------
      if (p >= 0.72) {
        const ap = clamp((p - 0.72) / 0.28, 0, 1);
        if (ap < 0.32) {
          // Extended buildup: rain-freezing compression + inward corner mana filaments + "I... AM..."
          const compress = ap / 0.32;
          const r = lerp(rect.width * 0.68, 20, compress) * fx.intensity;
          drawAtomicRing(ctx, c.x, c.y, r, fx.age * 2.6, fx.age, fx.spec, compress * open);
          drawStarBloom(ctx, c.x, c.y, 20 * compress + 6, '#ffffff', '#38bdf8', open);

          ctx.save();
          ctx.globalAlpha = open * 0.85 * compress;
          ctx.lineCap = 'round';
          for (const corner of [
            { x: rect.left, y: rect.top },
            { x: rect.right, y: rect.top },
            { x: rect.left, y: rect.bottom },
            { x: rect.right, y: rect.bottom }
          ]) {
            const pt = lerpPt(corner, c, compress * 0.86);
            ctx.strokeStyle = fx.spec.main;
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(corner.x, corner.y);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.4;
            ctx.stroke();
          }

          if (compress > 0.35) {
            ctx.font = '900 15px ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';
            const preY = Math.max(34, rect.top - 18);
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 4.6;
            ctx.strokeText('I...  AM...', c.x, preY);
            ctx.fillStyle = '#c084fc';
            ctx.fillText('I...  AM...', c.x, preY);
          }
          ctx.restore();
        } else {
          // Prolonged Multi-Wave Detonation: "I AM ATOMIC!"
          const detP = (ap - 0.32) / 0.68;
          if (!fx.atomicBlastDone) {
            fx.atomicBlastDone = true;
            this.spawnCardHalo(fx.card, fx.spec, 1.0, 1.6);
            for (const side of ['top', 'bottom', 'left', 'right']) {
              this.spawnBorderFlash(fx.card, side, 0.5, fx.spec, 0.88, 0.96);
            }
            this.spawnImpactSparks(c.x, c.y, 0, -1, fx.spec, 30, 1.55, { speedMin: 200, speedMax: 480 });
            this.spawnImpactSparks(c.x, rect.top, 0, -1, SPECTRA['cyan-volt'], 18, 1.35);
            this.pulseCardHit(fx.card);
          }
          if (!fx.atomicAftershockDone && detP >= 0.38) {
            fx.atomicAftershockDone = true;
            this.spawnCardHalo(fx.card, SPECTRA['cyan-volt'], 0.95, 1.25);
            this.spawnImpactSparks(c.x, c.y, 0, -1, SPECTRA['cyan-volt'], 20, 1.4);
            this.pulseCardHit(fx.card);
          }

          const blastFade = (detP < 0.62 ? 1 : clamp((1 - detP) / 0.38, 0, 1)) * open;
          const baseReach = Math.max(rect.width, rect.height) * 1.05 * fx.intensity;
          const blastR = 26 + Math.pow(detP, 0.72) * baseReach;

          ctx.save();
          const dome = ctx.createRadialGradient(c.x, c.y, blastR * 0.08, c.x, c.y, blastR);
          dome.addColorStop(0, `rgba(255, 255, 255, ${blastFade * 0.88})`);
          dome.addColorStop(0.28, `rgba(56, 189, 248, ${blastFade * 0.68})`);
          dome.addColorStop(0.60, `rgba(${fx.spec.rgb}, ${blastFade * 0.58})`);
          dome.addColorStop(0.88, `rgba(9, 9, 11, ${blastFade * 0.36})`);
          dome.addColorStop(1, 'rgba(9, 9, 11, 0)');
          ctx.fillStyle = dome;
          ctx.beginPath();
          ctx.arc(c.x, c.y, blastR, 0, Math.PI * 2);
          ctx.fill();

          // Primary + secondary rotating Atomic arcane rings inside sphere
          drawAtomicRing(ctx, c.x, c.y, blastR * 0.90, -fx.age * 2.0, fx.age, fx.spec, blastFade);
          drawAtomicRing(ctx, c.x, c.y, blastR * 0.58, fx.age * 2.6, fx.age * 1.4, SPECTRA['cyan-volt'], blastFade * 0.88);

          // 3 staggered spherical shockwaves
          for (const [waveMul, col, w] of [
            [1.0, '#ffffff', 5.2],
            [0.80, fx.spec.accent, 3.6],
            [0.54, fx.spec.bright, 2.6]
          ]) {
            ctx.globalAlpha = blastFade;
            ctx.strokeStyle = col;
            ctx.lineWidth = w * (1 - detP * 0.65) + 0.8;
            ctx.beginPath();
            ctx.arc(c.x, c.y, blastR * waveMul, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Radial Atomic energy rays bursting from card center
          ctx.globalAlpha = blastFade * 0.72;
          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 2.0;
          for (let rIdx = 0; rIdx < 8; rIdx += 1) {
            const ra = (rIdx * Math.PI) / 4 + fx.age * 0.45;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ra) * blastR * 0.25 + c.x, Math.sin(ra) * blastR * 0.25 + c.y);
            ctx.lineTo(Math.cos(ra) * blastR * 0.96 + c.x, Math.sin(ra) * blastR * 0.96 + c.y);
            ctx.stroke();
          }

          const textAlpha = detP < 0.14 ? detP / 0.14 : (detP > 0.74 ? clamp((1 - detP) / 0.26, 0, 1) : 1);
          ctx.font = '900 18px ui-sans-serif, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = textAlpha;
          const bannerY = Math.max(36, rect.top - 24 - detP * 14);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 5.5;
          ctx.strokeText('I AM ATOMIC', c.x, bannerY);
          ctx.strokeStyle = fx.spec.main;
          ctx.lineWidth = 2.6;
          ctx.strokeText('I AM ATOMIC', c.x, bannerY);
          ctx.fillStyle = '#f5f3ff';
          ctx.fillText('I AM ATOMIC', c.x, bannerY);
          ctx.restore();
        }
      }
    }

    // =========================================================================
    // MAIN UPDATE & RENDER LOOP
    // =========================================================================
    startLoop() {
      this.lastFrameAt = performance.now();
      this.nextAmbientAt = this.lastFrameAt + 1900;
      this.rafId = window.requestAnimationFrame(this.tick);
    }

    tick(now) {
      this.rafId = window.requestAnimationFrame(this.tick);
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameAt) / 1000));
      this.lastFrameAt = now;

      if (this.paused || this.reducedMotion || document.hidden) return;

      const curDpr = Math.min(window.devicePixelRatio || 1, 2);
      if (window.innerWidth !== this.width || window.innerHeight !== this.height || curDpr !== this.dpr) {
        this.handleResize();
      }

      if (this.directorMode === 'spotlight') {
        // Spotlight Director: strictly ONE actor at a time -> curtain close -> 1.5s-2.5s breather -> next podium card (#1 -> #2 -> #3...)
        if (this.effects.length > 0) {
          this.awaitingBreather = true;
        } else if (this.awaitingBreather) {
          this.awaitingBreather = false;
          this.setSpotlightCard(null);
          this.nextAmbientAt = now + rand(1500, 2500);
        } else if (this.ambient && !this.hoveredCard && now >= this.nextAmbientAt) {
          const visible = this.getVisibleStarredCards();
          if (visible.length) {
            const pick = visible[this.spotlightIndex % visible.length];
            this.spotlightIndex = (this.spotlightIndex + 1) % visible.length;
            if (pick) {
              this.setSpotlightCard(pick);
              this.triggerForCard(pick, { intensity: 1.14, unleashed: false });
              this.awaitingBreather = true;
            }
          } else {
            this.nextAmbientAt = now + 1500;
          }
        }
      } else if (this.ambient && now >= this.nextAmbientAt) {
        // Default Wall Ambient Mode: keep stage clean (never stack two high-tier epics on top of each other)
        const visible = this.getVisibleStarredCards();
        const activeNonHover = this.effects.filter((fx) => !fx.unleashed).length;
        const hasBigEpicRunning = this.effects.some((fx) => fx.tier >= 2);
        if (visible.length && activeNonHover < 1 && !hasBigEpicRunning) {
          const pool = visible.length > 1
            ? visible.filter((c) => c !== this.lastAmbientCard && c !== this.hoveredCard)
            : visible;
          const weighted = [];
          for (const c of pool) {
            const w = this.getCardVfxTier(c);
            for (let k = 0; k < w; k += 1) weighted.push(c);
          }
          const pick = weighted[Math.floor(Math.random() * weighted.length)] || visible[0];
          if (pick) {
            this.lastAmbientCard = pick;
            this.triggerForCard(pick, { intensity: 1.0, unleashed: false });
          }
        }
        this.nextAmbientAt = now + rand(1900, 3000);
      }

      if (this.hoveredCard && document.body.contains(this.hoveredCard) && now >= this.nextHoverBurstAt) {
        const hasRunningShadow = this.effects.some(
          (fx) => fx.card === this.hoveredCard && fx.type === 'shadow-eminence'
        );
        if (hasRunningShadow) {
          this.nextHoverBurstAt = now + 650;
        } else {
          const tier = this.getCardVfxTier(this.hoveredCard);
          if (tier > 0) {
            if (this.directorMode === 'spotlight') {
              if (this.effects.length === 0) {
                this.interruptForFocus(this.hoveredCard, { intensity: 1.22 });
                this.nextHoverBurstAt = now + rand(tier >= 3 ? 2200 : 1650, tier >= 3 ? 2700 : 2100);
              }
            } else {
              this.triggerForCard(this.hoveredCard, { intensity: 1.18, unleashed: true });
              this.nextHoverBurstAt = now + rand(tier >= 3 ? 1900 : 1450, tier >= 3 ? 2400 : 1900);
            }
          }
        }
      }

      if (!this.effects.length && !this.sparks.length && !this.motes.length && !this.borderFlashes.length && !this.cardHalos.length) {
        return;
      }

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      for (let i = this.cardHalos.length - 1; i >= 0; i -= 1) {
        const halo = this.cardHalos[i];
        halo.age += dt;
        if (halo.age >= halo.duration || !document.body.contains(halo.card)) {
          this.cardHalos.splice(i, 1);
          continue;
        }
        this.drawCardHalo(ctx, halo);
      }

      for (let i = this.borderFlashes.length - 1; i >= 0; i -= 1) {
        const flash = this.borderFlashes[i];
        flash.age += dt;
        if (flash.age >= flash.duration || !document.body.contains(flash.card)) {
          this.borderFlashes.splice(i, 1);
          continue;
        }
        this.drawBorderFlash(ctx, flash);
      }

      for (let i = this.effects.length - 1; i >= 0; i -= 1) {
        const fx = this.effects[i];
        fx.age += dt;
        if (fx.age >= fx.duration || !document.body.contains(fx.card)) {
          this.effects.splice(i, 1);
          continue;
        }
        const rect = fx.card.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) continue;

        switch (fx.type) {
          case 'dragon-summon':
            this.updateDrawDragonSummon(ctx, fx, rect, dt);
            break;
          case 'hero-slays-dragon':
            this.updateDrawHeroSlaysDragon(ctx, fx, rect);
            break;
          case 'seraph-descent':
            this.updateDrawSeraphDescent(ctx, fx, rect);
            break;
          case 'abyss-demon':
            this.updateDrawAbyssDemon(ctx, fx, rect);
            break;
          case 'thunder-zeus':
            this.updateDrawThunderZeus(ctx, fx, rect);
            break;
          case 'paladin-cavalry':
            this.updateDrawPaladinCavalry(ctx, fx, rect);
            break;
          case 'sword-immortal':
            this.updateDrawSwordImmortal(ctx, fx, rect);
            break;
          case 'vermilion-phoenix':
            this.updateDrawVermilionPhoenix(ctx, fx, rect);
            break;
          case 'celestial-butterfly':
            this.updateDrawCelestialButterfly(ctx, fx, rect);
            break;
          case 'chrono-clockwork':
            this.updateDrawChronoClockwork(ctx, fx, rect, dt);
            break;
          case 'arcane-cosmos':
            this.updateDrawArcaneCosmos(ctx, fx, rect);
            break;
          case 'kunpeng-whale':
            this.updateDrawKunpengWhale(ctx, fx, rect);
            break;
          case 'raging-tsunami':
            this.updateDrawRagingTsunami(ctx, fx, rect, dt);
            break;
          case 'meteor-shower':
            this.updateDrawMeteorShower(ctx, fx, rect, dt);
            break;
          case 'glacial-freeze':
            this.updateDrawGlacialFreeze(ctx, fx, rect, dt);
            break;
          case 'shadow-eminence':
            this.updateDrawShadowEminence(ctx, fx, rect, dt);
            break;
          default:
            break;
        }
      }

      for (let i = this.motes.length - 1; i >= 0; i -= 1) {
        const m = this.motes[i];
        m.life += dt;
        if (m.life >= m.maxLife) {
          this.motes.splice(i, 1);
          continue;
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const p = m.life / m.maxLife;
        const twinkle = (0.55 + 0.45 * Math.sin(m.life * 20 + m.phase)) * Math.sin(p * Math.PI);
        drawStarBloom(ctx, m.x, m.y, m.size * (0.7 + 0.4 * twinkle), m.color, m.glow, twinkle);
      }

      for (let i = this.sparks.length - 1; i >= 0; i -= 1) {
        const s = this.sparks[i];
        s.life += dt;
        if (s.life >= s.maxLife) {
          this.sparks.splice(i, 1);
          continue;
        }
        s.vx *= Math.pow(s.drag, dt * 60);
        s.vy = s.vy * Math.pow(s.drag, dt * 60) + s.gravity * dt;
        const px = s.x;
        const py = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const alpha = 1 - s.life / s.maxLife;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.globalAlpha = alpha * 0.56;
        ctx.strokeStyle = s.glow;
        ctx.lineWidth = s.size * 2.4;
        ctx.beginPath();
        ctx.moveTo(px - s.vx * 0.018, py - s.vy * 0.018);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        ctx.beginPath();
        ctx.moveTo(px - s.vx * 0.012, py - s.vy * 0.012);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawCardHalo(ctx, halo) {
      const rect = halo.card.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      const p = clamp(halo.age / Math.max(0.05, halo.duration), 0, 1);
      const env = p < 0.18 ? p / 0.18 : Math.pow(1 - (p - 0.18) / 0.82, 1.4);
      const expand = lerp(0, 6, p);

      const baseRadius = parseFloat(window.getComputedStyle(halo.card).borderRadius) || 4;
      ctx.save();
      roundedRectPath(ctx, rect.left - expand, rect.top - expand, rect.width + expand * 2, rect.height + expand * 2, baseRadius + expand * 0.4);
      ctx.globalAlpha = env * 0.44 * halo.strength;
      ctx.strokeStyle = halo.spec.deep;
      ctx.lineWidth = 8.5;
      ctx.stroke();

      roundedRectPath(ctx, rect.left - 1, rect.top - 1, rect.width + 2, rect.height + 2, baseRadius);
      ctx.globalAlpha = env * 0.88 * halo.strength;
      ctx.strokeStyle = halo.spec.main;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      ctx.globalAlpha = env * 0.94 * halo.strength;
      ctx.strokeStyle = halo.spec.spark;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    drawBorderFlash(ctx, flash) {
      const rect = flash.card.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const p = clamp(flash.age / Math.max(0.05, flash.duration), 0, 1);
      const alpha = Math.pow(1 - p, 1.5);
      const ratio = Number.isFinite(flash.ratio) ? clamp(flash.ratio, 0.08, 0.92) : 0.5;
      const half = (Number.isFinite(flash.span) ? flash.span : 0.34) * 0.5;
      const a = clamp(ratio - half, 0.03, 0.97);
      const b = clamp(ratio + half, 0.03, 0.97);

      let x1, y1, x2, y2, cx, cy;
      if (flash.side === 'top' || flash.side === 'bottom') {
        const y = flash.side === 'top' ? rect.top : rect.bottom;
        x1 = rect.left + rect.width * a;
        x2 = rect.left + rect.width * b;
        y1 = y;
        y2 = y;
        cx = rect.left + rect.width * ratio;
        cy = y;
      } else {
        const x = flash.side === 'left' ? rect.left : rect.right;
        y1 = rect.top + rect.height * a;
        y2 = rect.top + rect.height * b;
        x1 = x;
        x2 = x;
        cx = x;
        cy = rect.top + rect.height * ratio;
      }

      if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) return;

      ctx.save();
      ctx.lineCap = 'round';
      const grad = safeLinearGradient(ctx, x1, y1, x2, y2);
      if (grad) {
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, flash.spec.main);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = alpha * 0.78;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      const coreGrad = safeLinearGradient(ctx, x1, y1, x2, y2);
      if (coreGrad) {
        coreGrad.addColorStop(0, 'rgba(255,255,255,0)');
        coreGrad.addColorStop(0.5, '#fef9c3');
        coreGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = coreGrad;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      drawStarBloom(ctx, cx, cy, 14 * (0.65 + p * 0.65), '#ffffff', flash.spec.main, alpha);
      ctx.restore();
    }
  }

  PulseWallVfxEngine.SPECTRA = SPECTRA;
  PulseWallVfxEngine.LINEAGES = LINEAGES;
  PulseWallVfxEngine.ARCHETYPES = ARCHETYPES;
  PulseWallVfxEngine.TIER_ARCHETYPES = TIER_ARCHETYPES;
  globalScope.PulseWallVfxEngine = PulseWallVfxEngine;
})(window);

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

  // 12 Distinct Mythic & Multi-Element Frame-Break Lineages (each with its own iconic native palette!)
  const LINEAGES = [
    {
      id: 'dragon-summon',
      family: '西幻 · 龙宠',
      name: '炎龙血脉',
      swatch: ['#dc2626', '#fb923c', '#fde047'],
      nativeSpec: {
        deep: '#7f1d1d', main: '#ef4444', bright: '#fb923c', core: '#fff7ed',
        spark: '#fde047', accent: '#f59e0b', ink: '#290808', rgb: '239, 68, 68'
      },
      tiers: {
        1: { id: 'dragon-summon', label: '小火龙幼崽', desc: '保留龙宠：灵动小火龙破框展翅绕飞，欢快吐出炽热火星弹点亮卡边' },
        2: { id: 'dragon-summon', label: '炽翼飞龙', desc: '进化形态：成年飞龙展开流焰蝠翼 200% 盘旋俯冲，喷吐灼热锥形龙息' },
        3: { id: 'dragon-summon', label: '焚天古龙王', desc: '顶格邻格交互：巨型炽金圣冠古龙翱翔半屏，飞掠 2–3 张邻卡扫射熔金龙息！' }
      }
    },
    {
      id: 'hero-slays-dragon',
      family: '史诗 · 剧场',
      name: '勇者屠龙',
      swatch: ['#2563eb', '#facc15', '#10b981'],
      nativeSpec: {
        deep: '#1e3a8a', main: '#2563eb', bright: '#93c5fd', core: '#ffffff',
        spark: '#facc15', accent: '#10b981', ink: '#0f172a', rgb: '37, 99, 235'
      },
      tiers: {
        1: { id: 'hero-slays-dragon', label: '见习勇者斩幼龙', desc: '微型剧场：蓝披风小勇者腾空挥出银色剑弧，与右角顽皮墨绿幼龙交锋击退！' },
        2: { id: 'hero-slays-dragon', label: '圣剑骑士破魔龙', desc: '史诗对决：银甲骑士凌空斩落金色圣剑波，与喷吐毒焰的墨绿恶龙凌空对撞！' },
        3: { id: 'hero-slays-dragon', label: '圣光斩穹 · 屠龙史诗', desc: '顶格邻格剧场：盘踞邻卡的巨型毒焰魔龙咆哮来袭，圣光勇者冲锋斩出十字圣剑波震撼全排邻卡！' }
      }
    },
    {
      id: 'seraph-descent',
      family: '神圣 · 天使',
      name: '炽天使降临',
      swatch: ['#e0f2fe', '#38bdf8', '#fbbf24'],
      nativeSpec: {
        deep: '#0369a1', main: '#38bdf8', bright: '#e0f2fe', core: '#ffffff',
        spark: '#fbbf24', accent: '#f59e0b', ink: '#0c4a6e', rgb: '56, 189, 248'
      },
      tiers: {
        1: { id: 'seraph-descent', label: '圣羽微光', desc: '圣白金蓝：卡顶浮现耀金光环与双翼圣羽舒展，飘落纯净天蓝金边羽毛' },
        2: { id: 'seraph-descent', label: '四翼圣使天降', desc: '神圣降临：四翼天使沐浴天蓝圣光柱降世，双柄金色天枪交叉贯穿卡角！' },
        3: { id: 'seraph-descent', label: '六翼炽天使 · 众卡圣咏', desc: '顶格邻格赐福：哥特玫瑰圣环绽放，六翼炽天使牵引圣光彩带与飞羽为周围邻卡加冕金环！' }
      }
    },
    {
      id: 'abyss-demon',
      family: '暗黑 · 恶魔',
      name: '深渊魔王',
      swatch: ['#18181b', '#e11d48', '#c026d3'],
      nativeSpec: {
        deep: '#18181b', main: '#e11d48', bright: '#f43f5e', core: '#ffe4e6',
        spark: '#c026d3', accent: '#f97316', ink: '#09090b', rgb: '225, 29, 72'
      },
      tiers: {
        1: { id: 'abyss-demon', label: '深渊魔爪', desc: '黑曜猩红：卡外撕开暗紫空间裂隙，三道炽红黑边恶魔爪痕猛然撕过卡角！' },
        2: { id: 'abyss-demon', label: '炎魔角影降世', desc: '魔王威压：暗黑魔门中浮现弯曲黑曜魔角与赤红竖瞳，双爪交叉裂焰猛击卡框！' },
        3: { id: 'abyss-demon', label: '深渊魔君 · 锁链吞噬', desc: '顶格邻格锁链：展翼魔君踏破深渊，甩出 3 条燃火黑铁倒刺魔链死死钩住邻卡引爆赤雷！' }
      }
    },
    {
      id: 'thunder-zeus',
      family: '元素 · 闪电',
      name: '雷神裁决',
      swatch: ['#312e81', '#06b6d4', '#e0f2fe'],
      nativeSpec: {
        deep: '#1e1b4b', main: '#06b6d4', bright: '#67e8f9', core: '#ffffff',
        spark: '#a78bfa', accent: '#38bdf8', ink: '#0f172a', rgb: '6, 182, 212'
      },
      tiers: {
        1: { id: 'thunder-zeus', label: '高压鞭雷', desc: '电光青白：卡顶凝聚靛蓝雷云，大幅度向外弓起高压青蓝鞭状闪电抽击边框！' },
        2: { id: 'thunder-zeus', label: '雷神战锤轰鸣', desc: '风暴召唤：符文雷神之锤携电光疾旋划破乌云，砸落卡顶炸出三股分叉狂雷！' },
        3: { id: 'thunder-zeus', label: '万雷电网 · 连锁感电', desc: '顶格邻格连电：风暴漩涡掷出雷神之锤，青白高压连锁闪电在 3 张邻卡之间接力弹跳！' }
      }
    },
    {
      id: 'paladin-cavalry',
      family: '西幻 · 骑士',
      name: '圣殿骑士团',
      swatch: ['#1d4ed8', '#eab308', '#dc2626'],
      nativeSpec: {
        deep: '#1e3a8a', main: '#2563eb', bright: '#93c5fd', core: '#f8fafc',
        spark: '#eab308', accent: '#dc2626', ink: '#0f172a', rgb: '37, 99, 235'
      },
      tiers: {
        1: { id: 'paladin-cavalry', label: '孤骑突刺', desc: '皇蓝银金：银铠骑士骑枪挂着赤金三角旗，裹挟蓝白螺旋风锥斜掠冲锋！' },
        2: { id: 'paladin-cavalry', label: '圆桌圣盾与双骑', desc: '骑士荣耀：皇家十字纹章圣盾凌空展开，双骑自左右驰骋对撞迸发耀金星爆！' },
        3: { id: 'paladin-cavalry', label: '圣殿骑兵总攻', desc: '顶格邻格冲锋：皇家赤金战旗高悬，5 名星灵重装枪骑列阵横扫本卡与周围邻卡！' }
      }
    },
    {
      id: 'sword-immortal',
      family: '中式 · 修仙',
      name: '青莲剑仙',
      swatch: ['#059669', '#5eead4', '#eab308'],
      nativeSpec: {
        deep: '#065f46', main: '#10b981', bright: '#5eead4', core: '#f0fdfa',
        spark: '#fde047', accent: '#eab308', ink: '#022c22', rgb: '16, 185, 129'
      },
      tiers: {
        1: { id: 'sword-immortal', label: '御剑初成', desc: '青玉霜白：一柄翠绿流光飞剑携金红剑穗破空跃出，斩出凌厉青莲剑弧' },
        2: { id: 'sword-immortal', label: '青莲五剑阵', desc: '修仙进阶：青玉金莲与八卦剑阵悬顶绽放，祭出 5 柄灵剑齐射织出翠绿剑幕！' },
        3: { id: 'sword-immortal', label: '万剑归宗', desc: '顶格邻格剑雨：巨幅青莲八卦天阵悬空展开，12 柄青玉飞剑腾空攒射周围邻卡！' }
      }
    },
    {
      id: 'ink-dragon',
      family: '中式 · 国风',
      name: '泼墨神龙',
      swatch: ['#0f172a', '#dc2626', '#f59e0b'],
      nativeSpec: {
        deep: '#0f172a', main: '#1e293b', bright: '#64748b', core: '#f8fafc',
        spark: '#dc2626', accent: '#f59e0b', ink: '#020617', rgb: '15, 23, 42'
      },
      tiers: {
        1: { id: 'ink-dragon', label: '墨蛟戏珠', desc: '浓墨朱印：泼墨黑龙跃出追逐朱砂灵珠，甩落浓墨飞白并盖下一枚赤红篆印！' },
        2: { id: 'ink-dragon', label: '泼墨神龙腾渊', desc: '国潮长卷：金角金爪水墨神龙驾青碧祥云盘绕 200%，泼墨飞溅金箔点睛！' },
        3: { id: 'ink-dragon', label: '九霄墨龙巡界', desc: '顶格邻格盖印：巨型水墨金鳞神龙穿梭本卡与 2–3 张邻卡，所过之处齐盖朱砂大印！' }
      }
    },
    {
      id: 'nine-tail-fox',
      family: '中式 · 灵宠',
      name: '九尾天狐',
      swatch: ['#fff1f2', '#ec4899', '#22d3ee'],
      nativeSpec: {
        deep: '#9d174d', main: '#ec4899', bright: '#fbcfe8', core: '#fff1f2',
        spark: '#22d3ee', accent: '#a855f7', ink: '#4a044e', rgb: '236, 72, 153'
      },
      tiers: {
        1: { id: 'nine-tail-fox', label: '灵狐探首', desc: '月白樱粉：软萌月白单尾小灵狐轻盈跃过卡顶，抛洒 2 团幽青狐火与樱瓣！' },
        2: { id: 'nine-tail-fox', label: '三尾妖狐幻舞', desc: '灵宠进化：三尾灵狐踏月凌空曼舞，4 盏青紫狐火提灯携漫天落樱环卡飞旋！' },
        3: { id: 'nine-tail-fox', label: '九尾天狐魅影', desc: '顶格邻格魅影：九条巨幅月白樱尖狐尾如孔雀开屏，派遣幽青狐火与樱雨飞赴邻卡！' }
      }
    },
    {
      id: 'frost-fenrir',
      family: '北欧 · 冰兽',
      name: '极地冰狼',
      swatch: ['#1d4ed8', '#38bdf8', '#2dd4bf'],
      nativeSpec: {
        deep: '#0c4a6e', main: '#0284c7', bright: '#7dd3fc', core: '#f0f9ff',
        spark: '#2dd4bf', accent: '#34d399', ink: '#082f49', rgb: '2, 132, 199'
      },
      tiers: {
        1: { id: 'frost-fenrir', label: '雪狼踏霜', desc: '寒冰晶蓝：矫健冰晶小雪狼破角疾奔跃过，踏碎一路六角冰晶与霜花星尘！' },
        2: { id: 'frost-fenrir', label: '凛冬冰狼啸月', desc: '冰兽进化：晶体冰狼仰天跃过冰蓝残月，甩出 6 枚棱镜冰枪狠狠钉入卡框！' },
        3: { id: 'frost-fenrir', label: '芬里尔极光冰原', desc: '顶格邻格冰封：翡翠极光幕横贯天际，巨型芬里尔冰狼驰骋冰封 2–3 张邻卡！' }
      }
    },
    {
      id: 'arcane-cosmos',
      family: '西幻 · 魔法',
      name: '星界天象',
      swatch: ['#1e1b4b', '#7c3aed', '#fbbf24'],
      nativeSpec: {
        deep: '#312e81', main: '#7c3aed', bright: '#c4b5fd', core: '#ffffff',
        spark: '#fbbf24', accent: '#e879f9', ink: '#1e1b4b', rgb: '124, 58, 237'
      },
      tiers: {
        1: { id: 'arcane-cosmos', label: '学徒星环', desc: '午夜星紫：卡角展开深空蓝紫六芒星阵，旋转射出 1 枚璀璨紫金彗星！' },
        2: { id: 'arcane-cosmos', label: '大法师星象天陨', desc: '禁咒进阶：双层星阵叠加黄金天体星象仪运转，降下星光圣柱与 3 颗陨星！' },
        3: { id: 'arcane-cosmos', label: '诸神黄昏 · 星界禁咒', desc: '顶格邻格天陨：巨幅星象仪以金色符文锁链在邻卡刻画子阵，齐降星陨风暴！' }
      }
    },
    {
      id: 'kunpeng-whale',
      family: '中式 · 化形',
      name: '逍遥鲲鹏',
      swatch: ['#0284c7', '#14b8a6', '#f59e0b'],
      nativeSpec: {
        deep: '#0f766e', main: '#14b8a6', bright: '#67e8f9', core: '#f0fdfa',
        spark: '#f59e0b', accent: '#fbbf24', ink: '#083344', rgb: '20, 184, 166'
      },
      tiers: {
        1: { id: 'kunpeng-whale', label: '灵鲲跃浪', desc: '海青流光：荧光琉璃小灵鲲跃出碧蓝水环，摆尾溅起晶莹水珠与金色星泡！' },
        2: { id: 'kunpeng-whale', label: '巨鲲巡海', desc: '北冥巨兽：星斑巨鲲乘碧青星河水带游弋 200%，长鳍翻涌星海浪涛！' },
        3: { id: 'kunpeng-whale', label: '化鲲为鹏 · 扶摇九万里', desc: '顶格化形交互：巨鲲破空跃起在云涡中化形为遮天金青大鹏，扶摇掠过周围邻卡挥洒云羽！' }
      }
    }
  ];

  const LINEAGE_MAP = Object.fromEntries(LINEAGES.map((l) => [l.id, l]));

  const TIER_ARCHETYPES = {
    1: LINEAGES.map((l) => ({ ...l.tiers[1], family: l.family, lineageName: l.name, swatch: l.swatch })),
    2: LINEAGES.map((l) => ({ ...l.tiers[2], family: l.family, lineageName: l.name, swatch: l.swatch })),
    3: LINEAGES.map((l) => ({ ...l.tiers[3], family: l.family, lineageName: l.name, swatch: l.swatch }))
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
    'orbit-comet': 'ink-dragon',
    'meteor-graze': 'arcane-cosmos',
    'galaxy-slingshot': 'kunpeng-whale',
    'dragon-flame': 'dragon-summon',
    'ember-lick': 'dragon-summon',
    'phoenix-sovereign': 'kunpeng-whale',
    'vermilion-phoenix': 'kunpeng-whale',
    'aurora-ribbon': 'frost-fenrir',
    'breeze-silk': 'seraph-descent',
    'prism-lattice': 'arcane-cosmos',
    'void-rift': 'abyss-demon',
    'micro-rift': 'abyss-demon',
    'portal-barrage': 'abyss-demon',
    'arcane-circle': 'arcane-cosmos',
    'astral-meteor': 'arcane-cosmos',
    'petal-tempest': 'nine-tail-fox',
    'petal-drift': 'nine-tail-fox',
    'vortex-maelstrom': 'nine-tail-fox',
    'crystal-fae': 'nine-tail-fox',
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
  // 12 BESPOKE PROCEDURAL SPRITES (DISTINCT SILHOUETTES & RICH COLOR WORLDS)
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

  // 8. SUMI-INK GUOCHAO EASTERN DRAGON + VERMILION SEAL STAMP (泼墨神龙)
  function drawVermilionSeal(ctx, x, y, scale, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 3);
    ctx.fill();
    ctx.stroke();
    // Stylized seal glyph strokes (朱砂篆印)
    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.rect(-8.5, -8.5, 17, 17);
    ctx.moveTo(0, -8.5);
    ctx.lineTo(0, 8.5);
    ctx.moveTo(-8.5, 0);
    ctx.lineTo(8.5, 0);
    ctx.moveTo(-5, -4);
    ctx.lineTo(-5, 4);
    ctx.moveTo(5, -4);
    ctx.lineTo(5, 4);
    ctx.stroke();
    ctx.restore();
  }

  function drawSumiEasternDragon(ctx, spinePts, age, tier, spec, alpha) {
    if (spinePts.length < 4 || alpha <= 0.01) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawSpineBody = (widthFactor, color, alphaMult) => {
      ctx.strokeStyle = color;
      for (let i = 1; i < spinePts.length; i += 1) {
        const t = i / (spinePts.length - 1);
        const profile = Math.pow(t, 0.7) * (1.14 - Math.pow(Math.max(0, t - 0.82) * 2, 2));
        const baseW = (tier === 1 ? 8.5 : (tier === 2 ? 13 : 16.5)) * profile * widthFactor;
        ctx.globalAlpha = alpha * alphaMult * clamp(t * 1.4, 0.16, 1);
        ctx.lineWidth = Math.max(1.2, baseW);
        ctx.beginPath();
        ctx.moveTo(spinePts[i - 1].x, spinePts[i - 1].y);
        ctx.lineTo(spinePts[i].x, spinePts[i].y);
        ctx.stroke();
      }
    };

    // Expressive calligraphy ink wash contour + gold-leaf scales highlight!
    drawSpineBody(1.5, 'rgba(15, 23, 42, 0.32)', 0.5);
    drawSpineBody(1.12, spec.ink, 0.94);
    drawSpineBody(0.68, spec.main, 0.95);
    drawSpineBody(0.24, '#f59e0b', 0.92);

    // Golden Dorsal Spine Fins & Sculpted Claws
    ctx.globalAlpha = alpha * 0.95;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    for (let i = 3; i < spinePts.length - 2; i += 2) {
      const a = spinePts[i - 1];
      const b = spinePts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const finLen = (tier === 1 ? 5.5 : 10) * (i / spinePts.length);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + nx * finLen - (dx / len) * 3, b.y + ny * finLen - (dy / len) * 3);
      ctx.stroke();
    }

    if (spinePts.length >= 12) {
      for (const ci of [Math.floor(spinePts.length * 0.36), Math.floor(spinePts.length * 0.70)]) {
        const a = spinePts[ci - 1];
        const b = spinePts[ci];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const arm = tier >= 2 ? 12 : 8;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.0;
        for (const side of [-1, 1]) {
          const ex = b.x + nx * arm * side + (dx / len) * 4;
          const ey = b.y + ny * arm * side + (dy / len) * 4;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(ex, ey);
          ctx.lineTo(ex + (dx / len) * 5, ey + (dy / len) * 5);
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex + nx * 4 * side, ey + ny * 4 * side);
          ctx.stroke();
        }
      }
    }

    const head = spinePts[spinePts.length - 1];
    const neck = spinePts[spinePts.length - 2];
    const headAng = Math.atan2(head.y - neck.y, head.x - neck.x);
    const hs = tier === 1 ? 0.85 : (tier === 2 ? 1.12 : 1.38);

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(headAng);
    ctx.scale(hs, hs);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = spec.ink;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.quadraticCurveTo(9, -7.5, -6, -6.5);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-6, 6.5);
    ctx.quadraticCurveTo(9, 7.5, 16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Branching Gold-Leaf Antlers
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-2, s * 4);
      ctx.lineTo(-15, s * 14);
      ctx.moveTo(-8, s * 9);
      ctx.lineTo(-6, s * 15);
      ctx.stroke();
    }

    // Flowing Ink-Gold Whiskers
    const wv = Math.sin(age * 16) * 5;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(11, s * 2.5);
      ctx.bezierCurveTo(6, s * (12 + wv * 0.5), -6, s * (18 - wv * 0.6), -19, s * (14 + wv));
      ctx.stroke();
    }

    // Vermilion-Gold Dragon Eyes!
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(4, -2.6, 2.0, 0, Math.PI * 2);
    ctx.arc(4, 2.6, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(4.4, -2.6, 0.9, 0, Math.PI * 2);
    ctx.arc(4.4, 2.6, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawInkCloud(ctx, x, y, scale, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha * 0.78;
    ctx.fillStyle = '#0f766e';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-10, 2, 7, Math.PI * 0.6, Math.PI * 1.9);
    ctx.arc(0, -3, 9, Math.PI * 1.1, Math.PI * 2.1);
    ctx.arc(11, 2, 6.5, Math.PI * 1.2, Math.PI * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 9. NINE-TAILED SAKURA SPIRIT FOX + FOXFIRE WISPS (九尾天狐 · 1尾 -> 3尾 -> 9尾!)
  function drawSpiritFox(ctx, x, y, scale, age, tailCount, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Moonlit Rose-Violet Halo behind Fox
    const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, tailCount >= 9 ? 62 : 42);
    aura.addColorStop(0, `rgba(255, 241, 242, ${alpha * 0.92})`);
    aura.addColorStop(0.45, `rgba(${spec.rgb}, ${alpha * 0.45})`);
    aura.addColorStop(0.8, `rgba(147, 51, 234, ${alpha * 0.2})`);
    aura.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, tailCount >= 9 ? 62 : 42, 0, Math.PI * 2);
    ctx.fill();

    // Fanned Fluffy Sakura-Tipped Tails (1 / 3 / 9!)
    const spread = tailCount === 1 ? 0 : (tailCount === 3 ? 0.95 : 2.35);
    for (let i = 0; i < tailCount; i += 1) {
      const frac = tailCount === 1 ? 0 : (i / (tailCount - 1)) * 2 - 1;
      const baseAng = -Math.PI * 0.78 + frac * spread * 0.55 + Math.sin(age * 7 + i * 0.7) * 0.1;
      const tLen = tailCount >= 9 ? (46 - Math.abs(frac) * 8) : (tailCount === 3 ? 38 : 30);

      ctx.save();
      ctx.translate(-8, 2);
      ctx.rotate(baseAng);
      ctx.globalAlpha = alpha * 0.95;

      const tg = ctx.createLinearGradient(0, 0, tLen, 0);
      tg.addColorStop(0, '#fff1f2');
      tg.addColorStop(0.55, '#fce7f3');
      tg.addColorStop(0.82, spec.main);
      tg.addColorStop(1, '#a855f7');
      ctx.fillStyle = tg;
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(tLen * 0.45, -10.5, tLen, -1);
      ctx.quadraticCurveTo(tLen * 0.48, 10.5, 0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Agile Moon-White Fox Body + Pointed Sakura-Tipped Ears!
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff1f2';
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.5;

    // Graceful arching body
    ctx.beginPath();
    ctx.ellipse(0, 4, 13, 6.8, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Slender leaping paws
    ctx.strokeStyle = spec.main;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, 7);
    ctx.lineTo(18, 12);
    ctx.moveTo(-7, 8);
    ctx.lineTo(-16, 14);
    ctx.stroke();

    // Fox Head + Cheek Fluff + Pointed Ears
    ctx.save();
    ctx.translate(12, -4);
    ctx.fillStyle = '#fff1f2';
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(13, 2);
    ctx.quadraticCurveTo(6, -8, -5, -6);
    ctx.lineTo(-7, 2);
    ctx.quadraticCurveTo(2, 8, 13, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin Pointed Ears with Sakura-Pink Tips!
    for (const ex of [-4, 2]) {
      ctx.fillStyle = spec.main;
      ctx.beginPath();
      ctx.moveTo(ex, -5);
      ctx.lineTo(ex - 2, -16);
      ctx.lineTo(ex + 5, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing Cyan-Pink Mystic Fox Eye + Crimson Forehead Mark
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(4.5, -1, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.main;
    ctx.beginPath();
    ctx.arc(0, -3.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawFoxfireWisp(ctx, x, y, radius, age, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || radius <= 0.5 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    const sway = Math.sin(age * 11) * 3;
    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 2.2);
    halo.addColorStop(0, `rgba(255,255,255,${alpha * 0.95})`);
    halo.addColorStop(0.45, `rgba(34, 211, 238, ${alpha * 0.72})`);
    halo.addColorStop(0.8, `rgba(168, 85, 247, ${alpha * 0.34})`);
    halo.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Teardrop ghostly foxfire flame
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(sway, -radius * 1.45);
    ctx.quadraticCurveTo(radius * 0.9, -radius * 0.2, 0, radius * 0.85);
    ctx.quadraticCurveTo(-radius * 0.9, -radius * 0.2, sway, -radius * 1.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSakuraPetal(ctx, x, y, angle, size, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f472b6';
    ctx.strokeStyle = '#fff1f2';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.9, -size * 0.4, size * 0.7, size * 0.8, 0, size);
    ctx.bezierCurveTo(-size * 0.7, size * 0.8, -size * 0.9, -size * 0.4, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 10. CRYSTALLINE NORDIC FROST WOLF (FENRIR) + FROST MOON + AURORA (极地冰狼)
  function drawFrostMoon(ctx, cx, cy, radius, alpha) {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || radius < 6 || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    const aura = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.6);
    aura.addColorStop(0, `rgba(240, 249, 255, ${alpha * 0.88})`);
    aura.addColorStop(0.5, `rgba(56, 189, 248, ${alpha * 0.44})`);
    aura.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Glowing icy crescent moon
    ctx.globalAlpha = alpha * 0.96;
    ctx.fillStyle = '#e0f2fe';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0.35, Math.PI * 2 - 0.35);
    ctx.quadraticCurveTo(-radius * 0.15, 0, Math.cos(0.35) * radius, Math.sin(0.35) * radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawFrostWolf(ctx, x, y, angle, scale, age, tier, spec, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    const stride = Math.sin(age * 18) * 7;

    // Glacier Frost Aura
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 44);
    aura.addColorStop(0, `rgba(240, 249, 255, ${alpha * 0.85})`);
    aura.addColorStop(0.45, `rgba(${spec.rgb}, ${alpha * 0.52})`);
    aura.addColorStop(0.8, `rgba(45, 212, 191, ${alpha * 0.24})`);
    aura.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    // Jagged Faceted Crystalline Tail
    ctx.fillStyle = spec.bright;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.lineTo(-34, -10 + stride * 0.4);
    ctx.lineTo(-42, -2 + stride * 0.5);
    ctx.lineTo(-28, 6 + stride * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sprinting Faceted Legs
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, 4);
    ctx.lineTo(22 + stride, 15);
    ctx.moveTo(-10, 5);
    ctx.lineTo(-22 - stride, 16);
    ctx.stroke();
    ctx.strokeStyle = spec.deep;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Angular Crystalline Wolf Body + Spiky Ice Mane
    const bg = ctx.createLinearGradient(-16, -12, 24, 10);
    bg.addColorStop(0, spec.deep);
    bg.addColorStop(0.48, spec.main);
    bg.addColorStop(0.82, spec.bright);
    bg.addColorStop(1, '#ffffff');
    ctx.fillStyle = bg;
    ctx.strokeStyle = spec.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-18, 2);
    ctx.lineTo(-6, -10);
    ctx.lineTo(2, -16); // Ice mane spike 1
    ctx.lineTo(7, -10);
    ctx.lineTo(14, -15); // Ice mane spike 2
    ctx.lineTo(18, -7);
    ctx.lineTo(28, -2); // Snout
    ctx.lineTo(20, 4);
    ctx.lineTo(10, 7);
    ctx.lineTo(-14, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pointed Wolf Ears & Blazing Aurora-Cyan Eye!
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(14, -10);
    ctx.lineTo(12, -21);
    ctx.lineTo(19, -11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.arc(20.5, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawIcicleShard(ctx, x, y, angle, len, alpha) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(-len, 0, len, 0);
    g.addColorStop(0, '#0284c7');
    g.addColorStop(0.55, '#7dd3fc');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-len * 0.2, -len * 0.26);
    ctx.lineTo(-len, 0);
    ctx.lineTo(-len * 0.2, len * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
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
      const rawTier = card.dataset.starVfxTier;
      if (rawTier !== undefined && rawTier !== '') {
        return Math.max(0, Math.min(3, Number(rawTier) || 0));
      }
      const archetype = String(card.dataset.starVfx || '').trim();
      if (!archetype || archetype === 'none') return 0;
      return 2;
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
      const sorted = cards.slice().sort((a, b) => this.getCardVfxTier(b) - this.getCardVfxTier(a));
      this.triggerForCard(sorted[0], { intensity: 1.05 });
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
        const tier = this.getCardVfxTier(this.hoveredCard);
        this.nextHoverBurstAt = performance.now() + rand(tier >= 3 ? 2100 : 1550, tier >= 3 ? 2600 : 2000);
      } else if (!this.hoveredCard && this.directorMode === 'spotlight' && this.effects.length === 0) {
        this.setSpotlightCard(null);
      }
    }

    triggerSurge(card) {
      if (!card || this.paused || this.reducedMotion) return;
      const tier = this.getCardVfxTier(card);
      if (tier <= 0) return;
      if (this.directorMode === 'spotlight') {
        this.interruptForFocus(card, { intensity: tier === 1 ? 1.14 : 1.28 });
        return;
      }
      this.triggerForCard(card, { intensity: tier === 1 ? 1.1 : 1.24, unleashed: true });
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

    getNeighborCards(sourceCard, maxCount = 3) {
      if (!sourceCard) return [];
      const scope = sourceCard.closest('.showcase-grid, .wall, #contributorsWall, #showcasePanels') || this.wallEl || document;
      const srcRect = sourceCard.getBoundingClientRect();
      if (srcRect.width < 20 || srcRect.height < 20) return [];
      const srcCenter = rectCenter(srcRect);
      const maxReach = Math.hypot(srcRect.width, srcRect.height) * 2.25;

      return Array.from(scope.querySelectorAll('.profile-card, .vfx-specimen'))
        .filter((el) => el !== sourceCard && document.body.contains(el))
        .map((el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 40) return null;
          if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return null;
          const c = rectCenter(r);
          const dist = Math.hypot(c.x - srcCenter.x, c.y - srcCenter.y);
          if (dist > maxReach) return null;
          return { card: el, rect: r, center: c, dist };
        })
        .filter(Boolean)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, maxCount);
    }

    pulseCardHit(card, { neighbor = false } = {}) {
      if (!card || this.reducedMotion || this.paused) return;
      const cls = neighbor ? 'is-vfx-neighbor-hit' : 'is-vfx-hit';
      card.classList.remove(cls);
      window.requestAnimationFrame(() => {
        if (!document.body.contains(card)) return;
        card.classList.add(cls);
        const timerKey = neighbor ? '_vfxNeighborTimer' : '_vfxHitTimer';
        window.clearTimeout(card[timerKey]);
        card[timerKey] = window.setTimeout(() => card.classList.remove(cls), neighbor ? 240 : 180);
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

    triggerNeighborImpact(neighborCard, hitPt, spec, { sparks = 14, flashDuration = 0.48, span = 0.44, halo = true, recoil = true } = {}) {
      if (!neighborCard || !document.body.contains(neighborCard)) return;
      this.spawnBorderFlash(neighborCard, hitPt.side, hitPt.ratio, spec, flashDuration, span);
      this.spawnImpactSparks(hitPt.x, hitPt.y, hitPt.nx, hitPt.ny, spec, sparks, 1.05);
      if (halo) this.spawnCardHalo(neighborCard, spec, 0.68, 0.95);
      if (recoil) this.pulseCardHit(neighborCard, { neighbor: true });
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
        case 'ink-dragon':
          this.spawnInkDragon(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'nine-tail-fox':
          this.spawnNineTailFox(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'frost-fenrir':
          this.spawnFrostFenrir(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'arcane-cosmos':
          this.spawnArcaneCosmos(card, rect, spec, tier, intensity, unleashed);
          break;
        case 'kunpeng-whale':
          this.spawnKunpengWhale(card, rect, spec, tier, intensity, unleashed);
          break;
        default:
          this.spawnDragonSummon(card, rect, spec, tier, intensity, unleashed);
          break;
      }
    }

    // =========================================================================
    // 01. DRAGON SUMMON (炎龙血脉 · 小火龙 -> 炽翼飞龙 -> 焚天古龙王)
    // =========================================================================
    spawnDragonSummon(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      this.effects.push({
        type: 'dragon-summon',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.15 : (tier === 2 ? 1.55 : 2.05),
        flip: Math.random() < 0.5 ? 1 : -1,
        trail: [],
        breathTimer: 0,
        selfHitDone: false,
        neighbors: neighbors.map((nb) => ({ card: nb.card, hitDone: false }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.72, tier >= 3 ? 1.2 : 0.85);
    }

    updateDrawDragonSummon(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const fade = p < 0.1 ? p / 0.1 : (p > 0.85 ? (1 - p) / 0.15 : 1);
      const c = rectCenter(rect);
      const f = fx.flip;

      const waypoints = [];
      if (fx.tier === 1) {
        waypoints.push(
          { x: rect.left + (f > 0 ? 0.15 : 0.85) * rect.width, y: rect.top + 10 },
          { x: rect.left + (f > 0 ? 0.25 : 0.75) * rect.width, y: Math.max(44, rect.top - rect.height * 0.44) },
          { x: rect.left + (f > 0 ? 0.88 : 0.12) * rect.width, y: Math.max(44, rect.top - rect.height * 0.36) },
          { x: rect.left + (f > 0 ? 1.12 : -0.12) * rect.width, y: rect.top + rect.height * 0.35 }
        );
      } else if (fx.tier === 2) {
        waypoints.push(
          { x: rect.left + (f > 0 ? -0.25 : 1.25) * rect.width, y: rect.top + rect.height * 0.2 },
          { x: rect.left + (f > 0 ? 0.18 : 0.82) * rect.width, y: Math.max(46, rect.top - rect.height * 0.76) },
          { x: rect.left + (f > 0 ? 1.22 : -0.22) * rect.width, y: Math.max(46, rect.top - rect.height * 0.34) },
          { x: rect.left + (f > 0 ? 1.18 : -0.18) * rect.width, y: rect.bottom + rect.height * 0.32 },
          { x: rect.left + (f > 0 ? 0.12 : 0.88) * rect.width, y: rect.bottom + rect.height * 0.24 }
        );
      } else {
        waypoints.push(
          { x: c.x - f * rect.width * 0.72, y: Math.max(46, rect.top - rect.height * 0.34) },
          { x: c.x, y: Math.max(46, rect.top - rect.height * 0.72) }
        );
        for (const nb of fx.neighbors) {
          if (nb.card && document.body.contains(nb.card)) {
            const nr = nb.card.getBoundingClientRect();
            waypoints.push({ x: nr.left + nr.width * 0.5, y: Math.max(48, nr.top - nr.height * 0.30) });
          }
        }
        if (waypoints.length < 4) {
          waypoints.push({ x: c.x + f * rect.width * 1.1, y: Math.max(48, rect.top - 30) });
        }
      }

      const pos = catmullRom(waypoints, p);
      const ahead = catmullRom(waypoints, Math.min(0.999, p + 0.025));
      const heading = Math.atan2(ahead.y - pos.y, ahead.x - pos.x);
      fx.trail.push(pos);
      if (fx.trail.length > (fx.tier === 1 ? 16 : 26)) fx.trail.shift();

      if (fx.trail.length >= 3) {
        ctx.save();
        const outerG = safeLinearGradient(ctx, fx.trail[0].x, fx.trail[0].y, pos.x, pos.y);
        if (outerG) {
          outerG.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
          outerG.addColorStop(0.55, fx.spec.main);
          outerG.addColorStop(1, fx.spec.spark);
          drawTaperedRibbon(ctx, fx.trail, fx.tier === 1 ? 4.5 : (fx.tier === 2 ? 9 : 13), outerG, fade * 0.65);
        }
        drawTaperedRibbon(ctx, fx.trail, fx.tier === 1 ? 1.8 : 4.2, '#fef9c3', fade * 0.9);
        ctx.restore();
      }

      fx.breathTimer += dt;
      if (p > 0.22 && p < 0.84 && fx.breathTimer >= (fx.tier === 1 ? 0.14 : 0.06)) {
        fx.breathTimer = 0;
        const mouthX = pos.x + Math.cos(heading) * (20 * (fx.tier === 1 ? 0.85 : 1.2));
        const mouthY = pos.y + Math.sin(heading) * (20 * (fx.tier === 1 ? 0.85 : 1.2));
        let aimTarget = facingEdgeOnRect({ x: mouthX, y: mouthY }, rect);

        if (fx.tier >= 3 && fx.neighbors.length) {
          let bestDist = Infinity;
          for (const nb of fx.neighbors) {
            if (!nb.card || !document.body.contains(nb.card)) continue;
            const nr = nb.card.getBoundingClientRect();
            const d = Math.hypot(nr.left + nr.width * 0.5 - mouthX, nr.top + nr.height * 0.5 - mouthY);
            if (d < bestDist) {
              bestDist = d;
              aimTarget = facingEdgeOnRect({ x: mouthX, y: mouthY }, nr);
              if (!nb.hitDone && d < nr.width * 1.15) {
                nb.hitDone = true;
                this.triggerNeighborImpact(nb.card, aimTarget, fx.spec, { sparks: 18, flashDuration: 0.55, span: 0.5 });
              }
            }
          }
        } else if (!fx.selfHitDone && p > 0.44) {
          fx.selfHitDone = true;
          this.spawnBorderFlash(fx.card, aimTarget.side, aimTarget.ratio, fx.spec, 0.42, 0.42);
          this.spawnImpactSparks(aimTarget.x, aimTarget.y, aimTarget.nx, aimTarget.ny, fx.spec, fx.tier === 1 ? 7 : 18, 1.0);
          if (fx.tier >= 2) this.pulseCardHit(fx.card);
        }

        const bdx = aimTarget.x - mouthX;
        const bdy = aimTarget.y - mouthY;
        const bLen = Math.hypot(bdx, bdy) || 1;
        this.spawnImpactSparks(mouthX, mouthY, bdx / bLen, bdy / bLen, fx.spec, fx.tier === 1 ? 2 : 4, 0.88, { gravity: -60, spread: 0.28 });
      }

      if (fx.tier >= 2 && p > 0.22 && p < 0.82) {
        const sc = fx.tier === 2 ? 1.2 : 1.48;
        const mx = pos.x + Math.cos(heading) * 26 * sc;
        const my = pos.y + Math.sin(heading) * 26 * sc;
        let targetPt = facingEdgeOnRect({ x: mx, y: my }, rect);
        if (fx.tier >= 3 && fx.neighbors.length) {
          const valid = fx.neighbors.filter((n) => n.card && document.body.contains(n.card));
          if (valid.length) {
            valid.sort((a, b) => {
              const ca = rectCenter(a.card.getBoundingClientRect());
              const cb = rectCenter(b.card.getBoundingClientRect());
              return Math.hypot(ca.x - mx, ca.y - my) - Math.hypot(cb.x - mx, cb.y - my);
            });
            targetPt = facingEdgeOnRect({ x: mx, y: my }, valid[0].card.getBoundingClientRect());
          }
        }
        const breathPts = buildDisplacedArc({ x: mx, y: my }, lerpPt({ x: mx, y: my }, targetPt, 0.35), lerpPt({ x: mx, y: my }, targetPt, 0.7), targetPt, 10, 14, fx.age * 26, 0.62);
        const flameG = safeLinearGradient(ctx, mx, my, targetPt.x, targetPt.y);
        if (flameG) {
          flameG.addColorStop(0, '#fef9c3');
          flameG.addColorStop(0.35, '#fb923c');
          flameG.addColorStop(0.75, fx.spec.main);
          flameG.addColorStop(1, fx.spec.deep);
          drawTaperedRibbon(ctx, breathPts, fx.tier >= 3 ? 20 : 14, flameG, fade * 0.74, 0.85);
        }
        drawTaperedRibbon(ctx, breathPts, fx.tier >= 3 ? 8.5 : 6.0, '#fef08a', fade * 0.94, 0.9);
        drawStarBloom(ctx, targetPt.x, targetPt.y, fx.tier >= 3 ? 20 : 14, '#ffffff', '#fb923c', fade * 0.92);
      }

      const dragonScale = fx.tier === 1 ? 0.90 : (fx.tier === 2 ? 1.22 : 1.50);
      drawWingedDragon(ctx, pos.x, pos.y, heading, dragonScale * fx.intensity, fx.age, fx.tier, fx.spec, fade);
    }

    // =========================================================================
    // 02. HERO SLAYS DRAGON (勇者屠龙 · 从朴素到绚丽的微型史诗剧场!)
    // =========================================================================
    spawnHeroSlaysDragon(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      this.effects.push({
        type: 'hero-slays-dragon',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.25 : (tier === 2 ? 1.65 : 2.15),
        clashDone: false,
        neighbors: neighbors.map((nb) => ({ card: nb.card, hitDone: false }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.9, tier >= 3 ? 1.25 : 0.95);
    }

    updateDrawHeroSlaysDragon(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const fade = p < 0.08 ? p / 0.08 : (p > 0.86 ? (1 - p) / 0.14 : 1);
      const topY = Math.max(66, rect.top - (fx.tier === 1 ? 26 : (fx.tier === 2 ? 44 : 54)));

      // Evil Venom Dragon positioned menacingly on right side (or hovering over right neighbor in Tier 3!)
      let dragonHome = { x: rect.right - rect.width * 0.12, y: topY };
      if (fx.tier >= 3 && fx.neighbors.length && fx.neighbors[0].card && document.body.contains(fx.neighbors[0].card)) {
        const nr = fx.neighbors[0].card.getBoundingClientRect();
        dragonHome = { x: lerp(rect.right, nr.left + nr.width * 0.5, 0.55), y: Math.max(64, Math.min(rect.top, nr.top) - 34) };
      }

      // Hero charges from left -> vaults into center-right slash -> follows through!
      const heroStart = { x: rect.left - 34, y: rect.top + 12 };
      const heroApex = { x: dragonHome.x - 42, y: dragonHome.y - 12 };
      const heroEnd = { x: dragonHome.x + 28, y: dragonHome.y - 26 };

      const chargeP = clamp(p / 0.52, 0, 1);
      const easeCharge = 1 - Math.pow(1 - chargeP, 2.1);
      const heroPos = p < 0.52
        ? cubicPoint(heroStart, { x: rect.left + rect.width * 0.25, y: topY - 45 }, heroApex, heroApex, easeCharge)
        : lerpPt(heroApex, heroEnd, clamp((p - 0.52) / 0.48, 0, 1));

      // Sword swings from raised back (-2.1 rad) through blazing slash (+0.85 rad)!
      const slashSwing = p < 0.36
        ? lerp(-2.3, -1.6, p / 0.36)
        : (p < 0.56 ? lerp(-1.6, 0.95, (p - 0.36) / 0.20) : 0.95);

      // Dragon recoils back & flashes gold-lime when struck after p >= 0.48!
      const hitP = clamp((p - 0.48) / 0.45, 0, 1);
      const hurtFlash = p > 0.46 && p < 0.72 ? Math.sin(((p - 0.46) / 0.26) * Math.PI) : 0;
      const dragonPos = {
        x: dragonHome.x + hitP * (fx.tier >= 2 ? 44 : 26),
        y: dragonHome.y - Math.sin(hitP * Math.PI) * 16
      };
      const dragonAlpha = fade * (hitP > 0.55 ? clamp(1 - (hitP - 0.55) / 0.45, 0, 1) : 1);

      // Phase 1 (p = 0.14..0.52): Evil Dragon spews venomous lime-violet dragonfire toward Hero!
      if (p > 0.14 && p < 0.56) {
        const bp = clamp((p - 0.14) / 0.34, 0, 1);
        const mouth = { x: dragonPos.x - 18, y: dragonPos.y - 4 };
        const fireTip = lerpPt(mouth, { x: heroPos.x + 18, y: heroPos.y }, Math.min(1, bp));
        const venomPts = buildDisplacedArc(mouth, lerpPt(mouth, fireTip, 0.4), lerpPt(mouth, fireTip, 0.7), fireTip, 8, 10, fx.age * 20, 0.6);
        drawTaperedRibbon(ctx, venomPts, fx.tier === 1 ? 6 : 13, '#581c87', fade * 0.68, 0.8);
        drawTaperedRibbon(ctx, venomPts, fx.tier === 1 ? 3 : 6.5, '#84cc16', fade * 0.95, 0.9);
      }

      // Phase 2 (p >= 0.38): Hero Unleashes Golden/Silver Crescent Sword-Wave & Excalibur Cross-Cleave!
      if (p > 0.38 && p < 0.88) {
        const sp = clamp((p - 0.38) / 0.46, 0, 1);
        const slashAlpha = Math.sin(sp * Math.PI);
        const arcR = (fx.tier === 1 ? 42 : (fx.tier === 2 ? 78 : 112)) * (0.45 + 0.55 * sp);
        ctx.save();
        ctx.translate(dragonHome.x - 16, dragonHome.y);
        // Giant crescent golden Excalibur sword-wave!
        ctx.globalAlpha = slashAlpha * 0.52;
        ctx.strokeStyle = fx.tier === 1 ? '#3b82f6' : '#f59e0b';
        ctx.lineWidth = fx.tier === 1 ? 10 : (fx.tier === 2 ? 18 : 26);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, arcR, -Math.PI * 0.48, Math.PI * 0.42);
        ctx.stroke();

        ctx.globalAlpha = slashAlpha * 0.96;
        ctx.strokeStyle = fx.tier === 1 ? '#ffffff' : '#fef08a';
        ctx.lineWidth = fx.tier === 1 ? 3.5 : 7.5;
        ctx.beginPath();
        ctx.arc(0, 0, arcR, -Math.PI * 0.48, Math.PI * 0.42);
        ctx.stroke();

        // Tier 3 Colossal Golden Cross-Cleave Shockwave!
        if (fx.tier >= 3) {
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
        }
        ctx.restore();
      }

      // Impact Clash Spark Explosion + Neighbor Shockwaves!
      if (!fx.clashDone && p >= 0.47) {
        fx.clashDone = true;
        const goldSpec = SPECTRA['solar-gold'];
        const clashPt = { x: dragonHome.x - 12, y: dragonHome.y };
        this.spawnImpactSparks(clashPt.x, clashPt.y, 0, -1, goldSpec, fx.tier === 1 ? 12 : 24, 1.15);
        this.spawnImpactSparks(clashPt.x, clashPt.y, 1, 0, SPECTRA['emerald-jade'], fx.tier === 1 ? 6 : 12, 0.95);
        this.spawnBorderFlash(fx.card, 'top', 0.62, goldSpec, 0.48, 0.56);
        if (fx.tier >= 2) this.pulseCardHit(fx.card);

        if (fx.tier >= 3) {
          for (const nb of fx.neighbors) {
            if (!nb.card || !document.body.contains(nb.card)) continue;
            nb.hitDone = true;
            const nr = nb.card.getBoundingClientRect();
            const hitPt = facingEdgeOnRect(clashPt, nr);
            this.triggerNeighborImpact(nb.card, hitPt, goldSpec, { sparks: 18, flashDuration: 0.6, span: 0.55 });
          }
        }
      }

      // Draw Clash Starburst + Both Epic Characters!
      if (p > 0.44 && p < 0.72) {
        const flashA = Math.sin(((p - 0.44) / 0.28) * Math.PI);
        drawStarBloom(ctx, dragonHome.x - 10, dragonHome.y, fx.tier === 1 ? 18 : (fx.tier === 2 ? 32 : 46), '#ffffff', '#facc15', flashA);
      }

      const dScale = fx.tier === 1 ? 0.72 : (fx.tier === 2 ? 1.06 : 1.32);
      const hScale = fx.tier === 1 ? 0.85 : (fx.tier === 2 ? 1.12 : 1.32);
      drawEvilWyrm(ctx, dragonPos.x, dragonPos.y, dScale * fx.intensity, fx.age, fx.tier, hurtFlash, dragonAlpha);
      drawHeroKnight(ctx, heroPos.x, heroPos.y, hScale * fx.intensity, fx.age, fx.tier, slashSwing, fade);
    }

    // =========================================================================
    // 03. SERAPH DESCENT (炽天使降临 · 圣羽 -> 四翼圣使 -> 六翼炽天使玫瑰圣环!)
    // =========================================================================
    spawnSeraphDescent(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      const featherCount = tier === 1 ? 6 : (tier === 2 ? 10 : 16);
      const feathers = Array.from({ length: featherCount }, (_, i) => ({
        xOff: rand(-0.65, 0.65),
        delay: 0.14 + (i / featherCount) * 0.7,
        driftX: rand(-34, 34),
        speedY: rand(45, 95),
        spin: rand(-3, 3),
        size: rand(7, 13)
      }));
      this.effects.push({
        type: 'seraph-descent',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.15 : (tier === 2 ? 1.55 : 2.05),
        selfHitDone: false,
        feathers,
        neighbors: neighbors.map((nb, i) => ({ card: nb.card, delay: 0.3 + i * 0.16, hitDone: false }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.95, 1.1);
    }

    updateDrawSeraphDescent(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.18 ? p / 0.18 : (p > 0.82 ? (1 - p) / 0.18 : 1);
      const cx = rect.left + rect.width * 0.5;
      const cy = Math.max(66, rect.top - (fx.tier === 1 ? 26 : (fx.tier === 2 ? 44 : 52)) - (1 - open) * 16);

      // Tier 2 & 3: Descending Sky-White & Gold Column of Heaven!
      if (fx.tier >= 2 && p > 0.12 && p < 0.86) {
        const bp = Math.sin(((p - 0.12) / 0.74) * Math.PI);
        const bw = (fx.tier === 2 ? 36 : 54) * bp;
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

      // Tier 3: Giant Gothic Cathedral Rose-Window Halo behind Archangel!
      if (fx.tier >= 3) {
        drawRoseHalo(ctx, cx, cy - 6, 66 * open * fx.intensity, fx.age, fx.spec, open * 0.95);
      }

      // Tier 2: Twin Crisscrossing Golden Spears of Heaven!
      if (fx.tier === 2 && p > 0.25 && p < 0.8) {
        const sp = clamp((p - 0.25) / 0.35, 0, 1);
        const sAlpha = p > 0.65 ? (0.8 - p) / 0.15 : 1;
        for (const side of [-1, 1]) {
          const s0 = { x: cx + side * 66, y: cy - 36 };
          const s1 = edgePoint(rect, 'top', side < 0 ? 0.74 : 0.26);
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

      if (!fx.selfHitDone && p > 0.32) {
        fx.selfHitDone = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.5, 0.62);
        this.spawnImpactSparks(cx, rect.top, 0, -1, fx.spec, fx.tier === 1 ? 8 : 16, 0.9);
      }

      // Tier 3: Radiant Blessing Ribbons Crowning 2–3 Neighbor Cards with Floating Golden Halos!
      if (fx.tier >= 3) {
        for (const nb of fx.neighbors) {
          if (fx.age < nb.delay || !nb.card || !document.body.contains(nb.card)) continue;
          const np = clamp((fx.age - nb.delay) / (fx.duration - nb.delay), 0, 1);
          const nFade = np < 0.2 ? np / 0.2 : (np > 0.8 ? (1 - np) / 0.2 : 1);
          const nr = nb.card.getBoundingClientRect();
          const nc = { x: nr.left + nr.width * 0.5, y: nr.top - 10 };
          const ctrl = { x: lerp(cx, nc.x, 0.5), y: Math.min(cy, nc.y) - 48 };

          // Sweeping golden-sky blessing ribbon
          const ribbonPts = [];
          const steps = 14;
          for (let i = 0; i <= steps; i += 1) {
            const t = (i / steps) * clamp(np / 0.35, 0, 1);
            const u = 1 - t;
            ribbonPts.push({
              x: u * u * cx + 2 * u * t * ctrl.x + t * t * nc.x,
              y: u * u * cy + 2 * u * t * ctrl.y + t * t * nc.y
            });
          }
          drawTaperedRibbon(ctx, ribbonPts, 6.5, '#38bdf8', nFade * 0.58, 0.8);
          drawTaperedRibbon(ctx, ribbonPts, 3.0, '#fef08a', nFade * 0.94, 0.9);

          // Floating Golden Halo crowning the neighbor card!
          if (np > 0.25) {
            ctx.save();
            ctx.translate(nc.x, nc.y - 6);
            ctx.globalAlpha = nFade;
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 28 * nFade, 9 * nFade, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2.0;
            ctx.stroke();
            ctx.restore();
          }

          if (!nb.hitDone && np >= 0.32) {
            nb.hitDone = true;
            const hitPt = facingEdgeOnRect({ x: cx, y: cy }, nr);
            this.triggerNeighborImpact(nb.card, hitPt, fx.spec, { sparks: 14, flashDuration: 0.55, span: 0.5 });
          }
        }
      }

      // Drifting Pure White Gold-Rimmed Angel Feathers
      for (const ft of fx.feathers) {
        if (fx.age < ft.delay) continue;
        const fa = fx.age - ft.delay;
        const fp = clamp(fa / 0.95, 0, 1);
        if (fp >= 1) continue;
        const fxX = cx + ft.xOff * rect.width + Math.sin(fa * 5 + ft.spin) * 16 + ft.driftX * fp;
        const fxY = cy + fa * ft.speedY;
        drawAngelFeather(ctx, fxX, fxY, Math.sin(fa * 4 + ft.spin) * 0.7, ft.size, (1 - fp) * open);
      }

      const angelScale = fx.tier === 1 ? 0.88 : (fx.tier === 2 ? 1.15 : 1.38);
      drawSeraphAngel(ctx, cx, cy, angelScale * fx.intensity, fx.age, fx.tier, fx.spec, open);
    }

    // =========================================================================
    // 04. ABYSS DEMON LORD (深渊魔王 · 魔爪裂隙 -> 炎魔角影 -> 锁链吞噬邻卡!)
    // =========================================================================
    spawnAbyssDemon(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      this.effects.push({
        type: 'abyss-demon',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.05 : (tier === 2 ? 1.48 : 1.95),
        flip: Math.random() < 0.5 ? 1 : -1,
        selfHitDone: false,
        neighbors: neighbors.map((nb, i) => ({ card: nb.card, delay: 0.25 + i * 0.14, hitDone: false }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.9, 1.15);
    }

    updateDrawAbyssDemon(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.16 ? p / 0.16 : (p > 0.80 ? (1 - p) / 0.20 : 1);
      const cx = rect.left + rect.width * 0.5;
      const cy = Math.max(66, rect.top - (fx.tier === 2 ? 38 : 48));

      if (fx.tier === 1) {
        // Jagged Dark Dimensional Tear + Triple Crimson Claw Slash across Corner!
        const rPt = { x: fx.flip > 0 ? rect.right + 16 : rect.left - 16, y: rect.top - 16 };
        ctx.save();
        ctx.translate(rPt.x, rPt.y);
        ctx.rotate(fx.flip * 0.45);
        ctx.globalAlpha = open * 0.92;
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = '#c026d3';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26 * open, 8 * open, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const slashP = clamp((p - 0.15) / 0.42, 0, 1);
        const s0 = { x: rPt.x + fx.flip * 16, y: rPt.y - 14 };
        const s1 = { x: rect.left + rect.width * (fx.flip > 0 ? 0.45 : 0.55), y: rect.top + rect.height * 0.42 };
        drawDemonClawSlash(ctx, s0, s1, slashP, 9, fx.spec, open);
        if (!fx.selfHitDone && slashP > 0.55) {
          fx.selfHitDone = true;
          this.spawnBorderFlash(fx.card, 'top', fx.flip > 0 ? 0.78 : 0.22, fx.spec, 0.42, 0.36);
          this.spawnImpactSparks(lerp(s0.x, s1.x, 0.55), rect.top, 0, -1, fx.spec, 14, 1.0);
        }
        return;
      }

      // Tier 2 & 3: Looming Horned Obsidian Demon Visage rises above card!
      drawDemonVisage(ctx, cx, cy, (fx.tier === 2 ? 1.08 : 1.32) * open * fx.intensity, fx.age, fx.tier, fx.spec, open);

      // Twin Crossed Triple-Claw Slashes on Self Card!
      if (p > 0.20 && p < 0.78) {
        const sp = clamp((p - 0.20) / 0.32, 0, 1);
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

      // Tier 3: Spiked Obsidian-Red Hell Chains physically latch onto 2–3 Neighbor Cards!
      if (fx.tier >= 3) {
        for (const nb of fx.neighbors) {
          if (fx.age < nb.delay || !nb.card || !document.body.contains(nb.card)) continue;
          const np = clamp((fx.age - nb.delay) / (fx.duration - nb.delay), 0, 1);
          const nr = nb.card.getBoundingClientRect();
          const hitPt = facingEdgeOnRect({ x: cx, y: cy }, nr);
          const shootP = clamp(np / 0.28, 0, 1);
          const cAlpha = np > 0.78 ? (1 - np) / 0.22 : 1;

          drawHellChain(ctx, { x: cx, y: cy + 8 }, hitPt, shootP, fx.age, fx.spec, cAlpha);

          if (!nb.hitDone && shootP >= 0.92) {
            nb.hitDone = true;
            this.triggerNeighborImpact(nb.card, hitPt, fx.spec, { sparks: 22, flashDuration: 0.6, span: 0.56 });
          }
        }
      }
    }

    // =========================================================================
    // 05. THUNDER ZEUS (雷神裁决 · 高压鞭雷 -> 雷神战锤 -> 万雷电网连锁感电!)
    // =========================================================================
    spawnThunderZeus(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      this.effects.push({
        type: 'thunder-zeus',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 0.92 : (tier === 2 ? 1.42 : 1.85),
        flip: Math.random() < 0.5 ? 1 : -1,
        seed: Math.random() * 80,
        selfHitDone: false,
        neighbors: neighbors.map((nb, i) => ({ card: nb.card, delay: 0.34 + i * 0.14, hitDone: false }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.88, 1.15);
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

      // Forked sub-bolt
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
      const cloudPt = { x: rect.left + rect.width * 0.5, y: Math.max(54, rect.top - (fx.tier === 1 ? 42 : 66)) };
      const flicker = 0.72 + 0.28 * Math.sin(fx.age * 95);

      // Billowing Dark Stormcloud Overhead
      drawStormCloud(ctx, cloudPt.x, cloudPt.y, (fx.tier === 1 ? 0.75 : (fx.tier === 2 ? 1.1 : 1.38)) * open, fx.age, p > 0.2 && p < 0.75 ? flicker : 0, open);

      // Tier 1: High-Arching Whip Lightning snapping outside the frame!
      if (fx.tier === 1) {
        const p0 = edgePoint(rect, 'top', fx.flip > 0 ? 0.18 : 0.82);
        const p1 = edgePoint(rect, fx.flip > 0 ? 'right' : 'left', 0.42);
        const boltA = p < 0.25 ? p / 0.25 : Math.pow(1 - (p - 0.25) / 0.75, 1.3);
        this.drawHighVoltageBolt(ctx, p0, p1, rect.height * 0.58, 18, 22, fx.seed + Math.floor(fx.age * 24), fx.spec, boltA * flicker, 0.9);
        if (!fx.selfHitDone && p > 0.22) {
          fx.selfHitDone = true;
          this.spawnBorderFlash(fx.card, p1.side, p1.ratio, fx.spec, 0.4, 0.38);
          this.spawnImpactSparks(p1.x, p1.y, p1.nx, p1.ny, fx.spec, 14, 1.1);
        }
        return;
      }

      // Tier 2 & 3: Spinning Electrified Stormhammer (雷神之锤) Smashing Down!
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
        this.spawnImpactSparks(impactPt.x, impactPt.y, 0, -1, fx.spec, 24, 1.25);
        this.pulseCardHit(fx.card);
      }

      // Discharging Lightning Bolts from Cloud -> Impact -> Multi-Hop Chain Lightning across Neighbors!
      if (p > 0.28 && p < 0.88) {
        const boltA = (p > 0.70 ? (0.88 - p) / 0.18 : 1) * flicker;
        const seedTick = fx.seed + Math.floor(fx.age * 22);
        this.drawHighVoltageBolt(ctx, cloudPt, impactPt, 12, 16, 18, seedTick, fx.spec, boltA, 1.15);

        if (fx.tier === 2) {
          const leftPt = edgePoint(rect, 'left', 0.35);
          const rightPt = edgePoint(rect, 'right', 0.35);
          this.drawHighVoltageBolt(ctx, impactPt, leftPt, 44, 14, 16, seedTick + 9, fx.spec, boltA * 0.9, 0.85);
          this.drawHighVoltageBolt(ctx, impactPt, rightPt, 44, 14, 16, seedTick + 19, fx.spec, boltA * 0.9, 0.85);
        } else {
          // Tier 3: True Multi-Hop Chain Lightning jumping self -> nb1 -> nb2 -> nb3!
          let prevPt = impactPt;
          for (let i = 0; i < fx.neighbors.length; i += 1) {
            const nb = fx.neighbors[i];
            if (fx.age < nb.delay || !nb.card || !document.body.contains(nb.card)) continue;
            const nr = nb.card.getBoundingClientRect();
            const hitPt = facingEdgeOnRect(prevPt, nr);
            this.drawHighVoltageBolt(ctx, prevPt, hitPt, 36, 18, 22, seedTick + i * 23, fx.spec, boltA, 1.1);
            if (!nb.hitDone) {
              nb.hitDone = true;
              this.triggerNeighborImpact(nb.card, hitPt, fx.spec, { sparks: 22, flashDuration: 0.56, span: 0.52 });
            }
            prevPt = hitPt;
          }
        }
      }

      drawStormHammer(ctx, hammerPos.x, hammerPos.y, hammerRot, (fx.tier === 2 ? 1.05 : 1.25) * fx.intensity, fx.age, fx.spec, open);
    }

    // =========================================================================
    // 06. PALADIN CAVALRY (圣殿骑士团 · 孤骑突刺 -> 圆桌圣盾双骑 -> 5骑总攻邻卡!)
    // =========================================================================
    spawnPaladinCavalry(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      const riders = [];
      if (tier === 1) {
        riders.push({ dir: Math.random() < 0.5 ? 1 : -1, delay: 0.04, yOff: -14, targetCard: card, isNeighbor: false, hitDone: false, trail: [] });
      } else if (tier === 2) {
        riders.push({ dir: 1, delay: 0.08, yOff: -24, targetCard: card, isNeighbor: false, hitDone: false, trail: [] });
        riders.push({ dir: -1, delay: 0.08, yOff: -24, targetCard: card, isNeighbor: false, hitDone: false, trail: [] });
      } else {
        // Tier 3: 5-Knight Astral Cavalry Wedge sweeping self AND neighbor cards!
        const targets = [card, ...neighbors.map((n) => n.card)];
        for (let i = 0; i < 5; i += 1) {
          const tgt = targets[i % targets.length];
          riders.push({
            dir: i % 2 === 0 ? 1 : -1,
            delay: 0.14 + i * 0.11,
            yOff: -16 + (i - 2) * 18,
            targetCard: tgt,
            isNeighbor: tgt !== card,
            hitDone: false,
            trail: []
          });
        }
      }
      this.effects.push({
        type: 'paladin-cavalry',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 0.95 : (tier === 2 ? 1.42 : 1.92),
        clashDone: false,
        riders
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.9, 1.15);
    }

    updateDrawPaladinCavalry(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.16 ? p / 0.16 : (p > 0.80 ? (1 - p) / 0.20 : 1);
      const cx = rect.left + rect.width * 0.5;
      const shieldY = Math.max(60, rect.top - 40);

      // Tier 2 & 3: Royal Heraldic Paladin Crest Shield unfolding overhead!
      if (fx.tier >= 2) {
        drawPaladinShield(ctx, cx, shieldY, (fx.tier === 2 ? 0.92 : 1.15) * open * fx.intensity, fx.age, fx.spec, open);
      }

      for (const rd of fx.riders) {
        if (fx.age < rd.delay) continue;
        const rp = clamp((fx.age - rd.delay) / (fx.tier === 1 ? 0.78 : 0.82), 0, 1);
        if (rp >= 1) continue;
        const rAlpha = rp < 0.12 ? rp / 0.12 : (rp > 0.82 ? (1 - rp) / 0.18 : 1);
        const tgtEl = rd.targetCard && document.body.contains(rd.targetCard) ? rd.targetCard : fx.card;
        const tr = tgtEl.getBoundingClientRect();

        const span = tr.width * (fx.tier === 3 ? 1.75 : 1.5);
        const startX = tr.left + tr.width * 0.5 - rd.dir * span * 0.58;
        const endX = tr.left + tr.width * 0.5 + rd.dir * span * 0.58;
        const y = Math.max(54, tr.top + rd.yOff + Math.sin(rp * Math.PI * 2) * 8);
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
            drawTaperedRibbon(ctx, rd.trail, fx.tier === 1 ? 5 : 8.5, g, rAlpha * 0.65);
          }
          drawTaperedRibbon(ctx, rd.trail, 2.4, '#ffffff', rAlpha * 0.9);
        }

        if (!rd.hitDone && rp >= 0.48) {
          rd.hitDone = true;
          const hitPt = edgePoint(tr, 'top', 0.5);
          if (rd.isNeighbor) {
            this.triggerNeighborImpact(tgtEl, hitPt, fx.spec, { sparks: 16, flashDuration: 0.5, span: 0.48 });
          } else {
            this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.44, 0.58);
            this.spawnImpactSparks(pos.x, pos.y, rd.dir, -0.5, fx.spec, fx.tier === 1 ? 10 : 18, 1.1);
            if (fx.tier >= 2) this.pulseCardHit(fx.card);
          }
        }

        ctx.save();
        ctx.translate(pos.x, pos.y);
        if (rd.dir < 0) ctx.scale(-1, 1);
        drawJoustingKnight(ctx, 0, 0, 0, (fx.tier === 1 ? 0.82 : (fx.tier === 2 ? 0.95 : 1.05)) * fx.intensity, fx.age, fx.spec, rAlpha);
        ctx.restore();
      }
    }

    // =========================================================================
    // 07. SWORD IMMORTAL (青莲剑仙 · 青玉飞剑 + 金莲八卦 + 万剑归宗!)
    // =========================================================================
    spawnSwordImmortal(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      const count = tier === 1 ? 1 : (tier === 2 ? 5 : 12);
      const swords = [];
      for (let i = 0; i < count; i += 1) {
        const nb = neighbors.length ? neighbors[i % neighbors.length] : null;
        const spreadAngle = count === 1 ? -Math.PI * 0.5 : lerp(-Math.PI * 0.88, -Math.PI * 0.12, i / (count - 1));
        swords.push({
          idx: i,
          spreadAngle,
          launchDelay: tier === 1 ? 0.05 : (0.24 + i * (tier === 2 ? 0.075 : 0.048)),
          flightDur: tier === 1 ? 0.68 : 0.48,
          targetCard: tier >= 3 && nb ? nb.card : card,
          isNeighbor: Boolean(tier >= 3 && nb),
          targetSide: i % 2 === 0 ? 'top' : (i % 3 === 0 ? 'left' : 'right'),
          targetRatio: rand(0.16, 0.84),
          hitDone: false,
          trail: []
        });
      }
      this.effects.push({
        type: 'sword-immortal',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 0.92 : (tier === 2 ? 1.38 : 1.78),
        swords
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.85, tier >= 3 ? 1.2 : 0.9);
    }

    updateDrawSwordImmortal(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const arrayCenter = { x: rect.left + rect.width * 0.5, y: Math.max(58, rect.top - (fx.tier === 1 ? 34 : (fx.tier === 2 ? 56 : 68))) };

      if (fx.tier >= 2) {
        const open = p < 0.16 ? p / 0.16 : (p > 0.80 ? (1 - p) / 0.20 : 1);
        const r = (fx.tier === 2 ? 50 : 72) * open * fx.intensity;
        drawImmortalLotus(ctx, arrayCenter.x, arrayCenter.y, r * 1.05, -fx.age * 0.85, 0.52, fx.spec, open * 0.92);
        drawBaguaCircle(ctx, arrayCenter.x, arrayCenter.y, r, fx.age * 1.4, 0.52, fx.spec, open * 0.96);
      }

      for (const sw of fx.swords) {
        const hoverDist = fx.tier === 1 ? 26 : (fx.tier === 2 ? 54 : 78);
        const fanPt = {
          x: arrayCenter.x + Math.cos(sw.spreadAngle) * hoverDist,
          y: arrayCenter.y + Math.sin(sw.spreadAngle) * hoverDist * 0.62
        };
        const targetEl = sw.targetCard && document.body.contains(sw.targetCard) ? sw.targetCard : fx.card;
        const tgtRect = targetEl.getBoundingClientRect();
        const hitPt = sw.isNeighbor ? facingEdgeOnRect(fanPt, tgtRect) : edgePoint(tgtRect, sw.targetSide, sw.targetRatio);

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
            if (sw.isNeighbor) {
              this.triggerNeighborImpact(targetEl, hitPt, fx.spec, { sparks: 12, flashDuration: 0.44, span: 0.36 });
            } else {
              this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.32, 0.28);
              this.spawnImpactSparks(hitPt.x, hitPt.y, hitPt.nx, hitPt.ny, fx.spec, fx.tier === 1 ? 8 : 12, 0.95);
              if (fx.tier >= 2) this.pulseCardHit(fx.card);
            }
          }
        }
        if (swAlpha <= 0.02) continue;
        if (sw.trail.length >= 3) {
          const g = safeLinearGradient(ctx, sw.trail[0].x, sw.trail[0].y, pos.x, pos.y);
          if (g) {
            g.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            g.addColorStop(0.55, fx.spec.bright);
            g.addColorStop(1, '#fef08a');
            drawTaperedRibbon(ctx, sw.trail, fx.tier === 1 ? 3.2 : 4.5, g, swAlpha * 0.74);
          }
        }
        drawImmortalSword(ctx, pos.x, pos.y, angle, (fx.tier === 1 ? 1.0 : 1.12) * fx.intensity, fx.age + sw.idx, fx.spec, swAlpha);
      }
    }

    // =========================================================================
    // 08. INK DRAGON (泼墨神龙 · 墨蛟 -> 泼墨金爪神龙 -> 巡界齐盖朱砂印!)
    // =========================================================================
    spawnInkDragon(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      this.effects.push({
        type: 'ink-dragon',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.18 : (tier === 2 ? 1.62 : 2.15),
        flip: Math.random() < 0.5 ? 1 : -1,
        selfHitDone: false,
        neighbors: neighbors.map((nb) => ({ card: nb.card, hitDone: false, sealAge: -1, sealPt: null })),
        clouds: [],
        selfSealAge: -1
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.85, 1.1);
    }

    updateDrawInkDragon(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const fade = p < 0.1 ? p / 0.1 : (p > 0.86 ? (1 - p) / 0.14 : 1);
      const f = fx.flip;
      const c = rectCenter(rect);

      const pathPts = [];
      if (fx.tier === 1) {
        pathPts.push(
          { x: rect.left + (f > 0 ? 0.08 : 0.92) * rect.width, y: rect.top + 18 },
          { x: rect.left + (f > 0 ? 0.25 : 0.75) * rect.width, y: Math.max(46, rect.top - rect.height * 0.44) },
          { x: rect.left + (f > 0 ? 0.78 : 0.22) * rect.width, y: Math.max(46, rect.top - rect.height * 0.30) },
          { x: rect.left + (f > 0 ? 1.14 : -0.14) * rect.width, y: rect.top + rect.height * 0.28 }
        );
      } else if (fx.tier === 2) {
        pathPts.push(
          { x: rect.left - f * rect.width * 0.24, y: rect.bottom - 18 },
          { x: rect.left + (f > 0 ? 0.15 : 0.85) * rect.width, y: Math.max(48, rect.top - rect.height * 0.72) },
          { x: rect.left + (f > 0 ? 1.24 : -0.24) * rect.width, y: rect.top - rect.height * 0.12 },
          { x: rect.left + (f > 0 ? 0.88 : 0.12) * rect.width, y: rect.bottom + rect.height * 0.38 },
          { x: rect.left + (f > 0 ? -0.22 : 1.22) * rect.width, y: rect.top + rect.height * 0.24 }
        );
      } else {
        pathPts.push(
          { x: rect.left - f * 48, y: rect.top + 30 },
          { x: c.x, y: Math.max(48, rect.top - rect.height * 0.74) }
        );
        for (let i = 0; i < fx.neighbors.length; i += 1) {
          const nb = fx.neighbors[i];
          if (nb.card && document.body.contains(nb.card)) {
            const nr = nb.card.getBoundingClientRect();
            const nc = rectCenter(nr);
            pathPts.push({ x: nc.x, y: Math.max(50, i % 2 === 0 ? nr.top - 22 : nr.bottom + 20) });
          }
        }
        if (pathPts.length < 4) {
          pathPts.push({ x: c.x + f * rect.width * 1.1, y: c.y - 30 });
        }
      }

      const segCount = fx.tier === 1 ? 16 : (fx.tier === 2 ? 26 : 36);
      const bodySpan = fx.tier === 1 ? 0.36 : (fx.tier === 2 ? 0.46 : 0.50);
      const headT = clamp(p * 1.12, 0.08, 0.999);
      const tailT = Math.max(0, headT - bodySpan);
      const spine = [];
      for (let i = 0; i <= segCount; i += 1) {
        const t = lerp(tailT, headT, i / segCount);
        const pt = catmullRom(pathPts, t);
        const slither = Math.sin(t * 22 - fx.age * 11) * (fx.tier === 1 ? 6 : 11) * Math.sin((i / segCount) * Math.PI);
        spine.push({ x: pt.x + slither * 0.45, y: pt.y + slither });
      }
      const headPt = spine[spine.length - 1];

      if (Math.random() < 0.18 && p < 0.85) {
        fx.clouds.push({ x: headPt.x + rand(-18, 18), y: headPt.y + rand(-14, 14), age: 0, maxAge: 0.72, scale: rand(0.65, 1.15) });
      }
      for (let i = fx.clouds.length - 1; i >= 0; i -= 1) {
        const cl = fx.clouds[i];
        cl.age += dt;
        if (cl.age >= cl.maxAge) {
          fx.clouds.splice(i, 1);
          continue;
        }
        drawInkCloud(ctx, cl.x, cl.y - cl.age * 18, cl.scale, (1 - cl.age / cl.maxAge) * fade);
      }

      if (!fx.selfHitDone && p > 0.28) {
        fx.selfHitDone = true;
        fx.selfSealAge = 0;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.42, 0.48);
        this.spawnImpactSparks(rect.left + rect.width * 0.5, rect.top, 0, -1, fx.spec, fx.tier === 1 ? 8 : 16, 0.95);
        if (fx.tier >= 2) this.pulseCardHit(fx.card);
      }

      if (fx.selfSealAge >= 0 && fx.selfSealAge < 0.9) {
        fx.selfSealAge += dt;
        const sa = clamp(1 - fx.selfSealAge / 0.9, 0, 1);
        const bounce = fx.selfSealAge < 0.12 ? lerp(1.6, 1.0, fx.selfSealAge / 0.12) : 1.0;
        drawVermilionSeal(ctx, rect.right - 22, rect.top + 14, bounce * (fx.tier === 1 ? 0.82 : 1.05), sa);
      }

      if (fx.tier >= 3) {
        for (const nb of fx.neighbors) {
          if (!nb.card || !document.body.contains(nb.card)) continue;
          const nr = nb.card.getBoundingClientRect();
          const nc = rectCenter(nr);
          if (!nb.hitDone && Math.hypot(headPt.x - nc.x, headPt.y - nc.y) < Math.max(nr.width, nr.height) * 0.78) {
            nb.hitDone = true;
            nb.sealAge = 0;
            nb.sealPt = { x: nr.right - 20, y: nr.top + 16 };
            const hitPt = facingEdgeOnRect(headPt, nr);
            this.triggerNeighborImpact(nb.card, hitPt, fx.spec, { sparks: 18, flashDuration: 0.58, span: 0.54 });
          }
          if (nb.sealAge >= 0 && nb.sealAge < 0.95 && nb.sealPt) {
            nb.sealAge += dt;
            const sa = clamp(1 - nb.sealAge / 0.95, 0, 1);
            const bounce = nb.sealAge < 0.12 ? lerp(1.7, 1.0, nb.sealAge / 0.12) : 1.0;
            drawVermilionSeal(ctx, nb.sealPt.x, nb.sealPt.y, bounce, sa);
          }
        }
      }

      // Vermilion-Gold Dragon Pearl ahead of snout!
      const pearlPt = catmullRom(pathPts, Math.min(0.999, headT + 0.055));
      drawStarBloom(ctx, pearlPt.x, pearlPt.y, fx.tier === 1 ? 10 : 15, '#fef08a', '#dc2626', fade);
      drawSumiEasternDragon(ctx, spine, fx.age, fx.tier, fx.spec, fade);
    }

    // =========================================================================
    // 09. NINE-TAIL FOX (九尾天狐 · 1尾小狐 -> 3尾幻舞 -> 9尾开屏狐火樱雨!)
    // =========================================================================
    spawnNineTailFox(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      const wispCount = tier === 1 ? 2 : (tier === 2 ? 4 : 9);
      const wisps = Array.from({ length: wispCount }, (_, i) => {
        const nb = neighbors.length ? neighbors[i % neighbors.length] : null;
        return {
          targetCard: tier >= 3 && nb ? nb.card : card,
          isNeighbor: Boolean(tier >= 3 && nb),
          phase: (i / wispCount) * Math.PI * 2,
          delay: 0.16 + i * 0.07,
          hitDone: false
        };
      });
      const petals = Array.from({ length: tier === 1 ? 8 : (tier === 2 ? 16 : 26) }, () => ({
        xOff: rand(-0.6, 0.6),
        yOff: rand(-0.5, 0.1),
        vx: rand(-48, 48),
        vy: rand(22, 68),
        rot: rand(0, Math.PI * 2),
        spin: rand(-4, 4),
        size: rand(4, 7.5)
      }));
      this.effects.push({
        type: 'nine-tail-fox',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.15 : (tier === 2 ? 1.58 : 2.05),
        flip: Math.random() < 0.5 ? 1 : -1,
        selfHitDone: false,
        wisps,
        petals
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.9, 1.05);
    }

    updateDrawNineTailFox(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.15 ? p / 0.15 : (p > 0.82 ? (1 - p) / 0.18 : 1);
      const cx = rect.left + rect.width * 0.5;
      const baseTop = Math.max(66, rect.top - (fx.tier === 1 ? 26 : (fx.tier === 2 ? 44 : 50)));

      // Fox movement: leaps gracefully in T1/T2, hovers imperially fanning 9 tails in T3!
      let foxX = cx;
      let foxY = baseTop;
      if (fx.tier < 3) {
        foxX = lerp(rect.left + rect.width * 0.12, rect.left + rect.width * 0.88, fx.flip > 0 ? p : 1 - p);
        foxY = baseTop - Math.sin(p * Math.PI) * (fx.tier === 1 ? 22 : 38);
      } else {
        foxY = baseTop + Math.sin(fx.age * 4) * 6;
      }

      // Drifting Sakura Blossoms
      for (const pt of fx.petals) {
        const px = cx + pt.xOff * rect.width + pt.vx * fx.age;
        const py = baseTop + pt.yOff * 60 + pt.vy * fx.age;
        drawSakuraPetal(ctx, px, py, pt.rot + fx.age * pt.spin, pt.size, open * 0.9);
      }

      // Orbiting / Neighbor-Seeking Ghostly Cyan-Violet Foxfire Wisps!
      for (const w of fx.wisps) {
        if (fx.age < w.delay) continue;
        const wp = clamp((fx.age - w.delay) / (fx.duration - w.delay), 0, 1);
        const tgtEl = w.targetCard && document.body.contains(w.targetCard) ? w.targetCard : fx.card;
        const tr = tgtEl.getBoundingClientRect();
        const tc = rectCenter(tr);

        const travel = clamp(wp / 0.42, 0, 1);
        const orbitR = w.isNeighbor ? 52 : (fx.tier === 1 ? 42 : 68);
        const ang = w.phase + fx.age * 3.8;
        const orbitPt = {
          x: tc.x + Math.cos(ang) * orbitR,
          y: (w.isNeighbor ? tr.top + 8 : baseTop) + Math.sin(ang) * (orbitR * 0.55)
        };
        const pos = lerpPt({ x: foxX, y: foxY }, orbitPt, 1 - Math.pow(1 - travel, 2.2));

        if (!w.hitDone && travel >= 0.9) {
          w.hitDone = true;
          const hitPt = facingEdgeOnRect(pos, tr);
          if (w.isNeighbor) {
            this.triggerNeighborImpact(tgtEl, hitPt, fx.spec, { sparks: 10, flashDuration: 0.48, span: 0.4 });
          } else if (!fx.selfHitDone) {
            fx.selfHitDone = true;
            this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.38, 0.42);
            this.spawnImpactSparks(hitPt.x, hitPt.y, 0, -1, fx.spec, 10, 0.85);
          }
        }
        drawFoxfireWisp(ctx, pos.x, pos.y, fx.tier >= 3 ? 9 : 7, fx.age + w.phase, open);
      }

      const tailCount = fx.tier === 1 ? 1 : (fx.tier === 2 ? 3 : 9);
      const foxScale = fx.tier === 1 ? 0.84 : (fx.tier === 2 ? 1.08 : 1.32);
      ctx.save();
      ctx.translate(foxX, foxY);
      if (fx.tier < 3 && fx.flip < 0) ctx.scale(-1, 1);
      drawSpiritFox(ctx, 0, 0, foxScale * fx.intensity, fx.age, tailCount, fx.spec, open);
      ctx.restore();
    }

    // =========================================================================
    // 10. FROST FENRIR (极地冰狼 · 雪狼踏霜 -> 冰狼啸月 -> 芬里尔极光冰原!)
    // =========================================================================
    spawnFrostFenrir(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      const shardCount = tier === 1 ? 3 : (tier === 2 ? 6 : 12);
      const shards = Array.from({ length: shardCount }, (_, i) => {
        const nb = neighbors.length ? neighbors[i % neighbors.length] : null;
        return {
          targetCard: tier >= 3 && nb ? nb.card : card,
          isNeighbor: Boolean(tier >= 3 && nb),
          delay: 0.24 + i * 0.055,
          ratio: rand(0.14, 0.86),
          hitDone: false
        };
      });
      this.effects.push({
        type: 'frost-fenrir',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.12 : (tier === 2 ? 1.55 : 2.0),
        flip: Math.random() < 0.5 ? 1 : -1,
        shards,
        trail: [],
        neighbors: neighbors.map((nb) => ({ card: nb.card, frostAge: -1 }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.9, 1.15);
    }

    updateDrawFrostFenrir(ctx, fx, rect, dt) {
      const p = fx.age / fx.duration;
      const open = p < 0.14 ? p / 0.14 : (p > 0.84 ? (1 - p) / 0.16 : 1);
      const cx = rect.left + rect.width * 0.5;
      const moonY = Math.max(58, rect.top - (fx.tier === 2 ? 52 : 62));

      // Tier 2 & 3: Glowing Frost Crescent Moon!
      if (fx.tier >= 2) {
        drawFrostMoon(ctx, cx, moonY, (fx.tier === 2 ? 28 : 38) * open * fx.intensity, open);
      }

      // Tier 3: Shimmering Emerald-Cyan Northern Lights Aurora Curtain across upper wall!
      if (fx.tier >= 3) {
        const leftX = Math.max(20, rect.left - rect.width * 0.85);
        const rightX = Math.min(this.width - 20, rect.right + rect.width * 0.85);
        const auroraPts = [];
        for (let i = 0; i <= 16; i += 1) {
          const t = i / 16;
          auroraPts.push({
            x: lerp(leftX, rightX, t),
            y: moonY - 10 + Math.sin(t * 7 + fx.age * 3.5) * 18
          });
        }
        const ag = safeLinearGradient(ctx, leftX, moonY, rightX, moonY);
        if (ag) {
          ag.addColorStop(0, 'rgba(45, 212, 191, 0)');
          ag.addColorStop(0.25, '#34d399');
          ag.addColorStop(0.55, '#38bdf8');
          ag.addColorStop(0.8, '#818cf8');
          ag.addColorStop(1, 'rgba(56, 189, 248, 0)');
          drawTaperedRibbon(ctx, auroraPts, 24, ag, open * 0.44, 0.5);
          drawTaperedRibbon(ctx, auroraPts, 8, '#f0f9ff', open * 0.65, 0.5);
        }
      }

      // Wolf bounding spline across card top (and leaping past neighbors in T3!)
      const startPt = { x: rect.left + (fx.flip > 0 ? -0.18 : 1.18) * rect.width, y: rect.top + 8 };
      const apexPt = { x: cx, y: moonY + 12 };
      const endPt = { x: rect.left + (fx.flip > 0 ? 1.24 : -0.24) * rect.width, y: rect.top + 6 };
      const pos = cubicPoint(startPt, { x: lerp(startPt.x, apexPt.x, 0.6), y: moonY - 12 }, { x: lerp(apexPt.x, endPt.x, 0.4), y: moonY - 12 }, endPt, p);
      const tan = cubicTangent(startPt, apexPt, apexPt, endPt, Math.min(0.99, p));
      const heading = Math.atan2(tan.y, tan.x);

      fx.trail.push(pos);
      if (fx.trail.length > 18) fx.trail.shift();
      if (fx.trail.length >= 3) {
        drawTaperedRibbon(ctx, fx.trail, fx.tier === 1 ? 4 : 8, '#7dd3fc', open * 0.56);
        drawTaperedRibbon(ctx, fx.trail, 2.2, '#ffffff', open * 0.9);
      }

      // Launching Razor Icicle Shards into Self & Neighbor Cards!
      for (const sh of fx.shards) {
        if (fx.age < sh.delay) continue;
        const sp = clamp((fx.age - sh.delay) / 0.36, 0, 1);
        if (sp >= 1) continue;
        const tgtEl = sh.targetCard && document.body.contains(sh.targetCard) ? sh.targetCard : fx.card;
        const tr = tgtEl.getBoundingClientRect();
        const origin = { x: cx + rand(-18, 18), y: moonY + 8 };
        const hitPt = sh.isNeighbor ? facingEdgeOnRect(origin, tr) : edgePoint(tr, 'top', sh.ratio);
        const cur = lerpPt(origin, hitPt, sp * sp * 0.4 + sp * 0.6);
        const ang = Math.atan2(hitPt.y - origin.y, hitPt.x - origin.x);

        if (!sh.hitDone && sp >= 0.9) {
          sh.hitDone = true;
          if (sh.isNeighbor) {
            this.triggerNeighborImpact(tgtEl, hitPt, fx.spec, { sparks: 12, flashDuration: 0.48, span: 0.42 });
            const nbEntry = fx.neighbors.find((n) => n.card === tgtEl);
            if (nbEntry && nbEntry.frostAge < 0) nbEntry.frostAge = 0;
          } else {
            this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.36, 0.32);
            this.spawnImpactSparks(hitPt.x, hitPt.y, 0, -1, fx.spec, 8, 0.9);
          }
        }
        drawIcicleShard(ctx, cur.x, cur.y, ang, fx.tier === 1 ? 10 : 15, open);
      }

      // Tier 3: Crystalline Hexagonal Frost Ring Blooming on Frozen Neighbor Cards!
      for (const nb of fx.neighbors) {
        if (nb.frostAge < 0 || nb.frostAge > 0.65 || !nb.card || !document.body.contains(nb.card)) continue;
        nb.frostAge += dt;
        const fp = nb.frostAge / 0.65;
        const nr = nb.card.getBoundingClientRect();
        const nc = rectCenter(nr);
        const hexR = 26 + fp * 54;
        ctx.save();
        ctx.translate(nc.x, nc.y);
        ctx.rotate(fp * 0.4);
        ctx.globalAlpha = (1 - fp) * 0.9;
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 3.2 * (1 - fp) + 1;
        ctx.beginPath();
        for (let k = 0; k < 6; k += 1) {
          const a = (k * Math.PI) / 3;
          if (k === 0) ctx.moveTo(Math.cos(a) * hexR, Math.sin(a) * hexR);
          else ctx.lineTo(Math.cos(a) * hexR, Math.sin(a) * hexR);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(heading);
      if (Math.cos(heading) < 0) ctx.scale(1, -1);
      drawFrostWolf(ctx, 0, 0, 0, (fx.tier === 1 ? 0.85 : (fx.tier === 2 ? 1.12 : 1.35)) * fx.intensity, fx.age, fx.tier, fx.spec, open);
      ctx.restore();
    }

    // =========================================================================
    // 11. ARCANE COSMOS (星界天象 · 六芒星阵 + 黄金星象仪 + 邻卡子阵陨星!)
    // =========================================================================
    spawnArcaneCosmos(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      const count = tier === 1 ? 1 : (tier === 2 ? 3 : 6);
      const meteors = Array.from({ length: count }, (_, i) => {
        const nb = neighbors.length ? neighbors[i % neighbors.length] : null;
        return {
          targetCard: tier >= 3 && nb && i > 0 ? nb.card : card,
          isNeighbor: Boolean(tier >= 3 && nb && i > 0),
          delay: (tier === 1 ? 0.14 : 0.22) + i * 0.13,
          duration: 0.46,
          sideRatio: rand(0.18, 0.82),
          hitDone: false,
          trail: []
        };
      });
      this.effects.push({
        type: 'arcane-cosmos',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.05 : (tier === 2 ? 1.52 : 1.92),
        cornerRight: Math.random() < 0.5,
        selfHitDone: false,
        meteors,
        neighbors: neighbors.map((nb, i) => ({ card: nb.card, delay: 0.24 + i * 0.14, hitDone: false }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.95, 1.2);
    }

    updateDrawArcaneCosmos(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const open = p < 0.18 ? p / 0.18 : (p > 0.78 ? (1 - p) / 0.22 : 1);
      const center = fx.tier === 1
        ? { x: fx.cornerRight ? rect.right + 14 : rect.left - 14, y: Math.max(50, rect.top - 14) }
        : { x: rect.left + rect.width * 0.5, y: Math.max(60, rect.top - (fx.tier === 2 ? 38 : 50)) };

      const radius = (fx.tier === 1 ? 36 : (fx.tier === 2 ? 74 : 96)) * (0.4 + 0.6 * open) * fx.intensity;
      drawArcaneCircle(ctx, center.x, center.y, radius, fx.age * 1.45, fx.tier === 1 ? 0.84 : 0.52, fx.tier, fx.spec, open);
      if (fx.tier >= 2) {
        drawAstrolabe(ctx, center.x, center.y - 12, (fx.tier === 2 ? 36 : 52) * open * fx.intensity, fx.age, fx.spec, open * 0.94);
      }

      // Tier 2 & 3: Vertical Star-Beam
      if (fx.tier >= 2 && p > 0.22 && p < 0.82) {
        const beamEnv = Math.sin(((p - 0.22) / 0.60) * Math.PI);
        const bw = (fx.tier === 2 ? 26 : 38) * beamEnv;
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

      // Tier 3: Rune-Chain Linked Sub-Circles on Neighbor Cards!
      if (fx.tier >= 3) {
        for (const nb of fx.neighbors) {
          if (fx.age < nb.delay || !nb.card || !document.body.contains(nb.card)) continue;
          const np = clamp((fx.age - nb.delay) / (fx.duration - nb.delay), 0, 1);
          const nOpen = np < 0.22 ? np / 0.22 : (np > 0.78 ? (1 - np) / 0.22 : 1);
          const nr = nb.card.getBoundingClientRect();
          const nc = { x: nr.left + nr.width * 0.5, y: nr.top + 8 };
          const mid = { x: lerp(center.x, nc.x, 0.5), y: Math.min(center.y, nc.y) - 40 };

          ctx.save();
          ctx.globalAlpha = nOpen * 0.9;
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2.6;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -fx.age * 80;
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.quadraticCurveTo(mid.x, mid.y, nc.x, nc.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          drawArcaneCircle(ctx, nc.x, nc.y, 44 * nOpen, -fx.age * 1.9, 0.52, 2, fx.spec, nOpen * 0.92);
        }
      }

      // Meteors dropping onto self / neighbor cards
      for (const m of fx.meteors) {
        if (fx.age < m.delay) continue;
        const mp = clamp((fx.age - m.delay) / m.duration, 0, 1);
        if (mp >= 1) continue;
        const targetEl = m.targetCard && document.body.contains(m.targetCard) ? m.targetCard : fx.card;
        const tr = targetEl.getBoundingClientRect();
        const hitPt = m.isNeighbor ? facingEdgeOnRect(center, tr) : edgePoint(tr, 'top', m.sideRatio);
        const startPt = { x: center.x + rand(-12, 12), y: center.y - 24 };
        const ctrl = { x: lerp(startPt.x, hitPt.x, 0.45) - 20, y: Math.min(startPt.y, hitPt.y) - 36 };
        const pos = cubicPoint(startPt, ctrl, ctrl, hitPt, mp * mp * 0.4 + mp * 0.6);

        m.trail.push(pos);
        if (m.trail.length > 16) m.trail.shift();
        if (m.trail.length >= 3) {
          const g = safeLinearGradient(ctx, m.trail[0].x, m.trail[0].y, pos.x, pos.y);
          if (g) {
            g.addColorStop(0, `rgba(${fx.spec.rgb}, 0)`);
            g.addColorStop(0.55, fx.spec.main);
            g.addColorStop(1, '#fef08a');
            drawTaperedRibbon(ctx, m.trail, fx.tier === 1 ? 4.5 : 8.5, g, 0.8);
          }
        }
        drawStarBloom(ctx, pos.x, pos.y, fx.tier === 1 ? 10 : 15, '#ffffff', '#fbbf24', 1);

        if (!m.hitDone && mp >= 0.9) {
          m.hitDone = true;
          if (m.isNeighbor) {
            this.triggerNeighborImpact(targetEl, hitPt, fx.spec, { sparks: 18, flashDuration: 0.52, span: 0.48 });
          } else {
            this.spawnBorderFlash(fx.card, hitPt.side, hitPt.ratio, fx.spec, 0.42, 0.42);
            this.spawnImpactSparks(hitPt.x, hitPt.y, 0, -1, fx.spec, fx.tier === 1 ? 10 : 18, 1.05);
            if (fx.tier >= 2) this.pulseCardHit(fx.card);
          }
        }
      }
    }

    // =========================================================================
    // 12. KUNPENG WHALE -> ROC (逍遥鲲鹏 · 灵鲲跃浪 -> 巨鲲巡海 -> 化鲲为鹏!)
    // =========================================================================
    spawnKunpengWhale(card, rect, spec, tier, intensity, unleashed) {
      const neighbors = tier >= 3 ? this.getNeighborCards(card, 3) : [];
      this.effects.push({
        type: 'kunpeng-whale',
        tier, card, spec, intensity, unleashed,
        age: 0,
        duration: tier === 1 ? 1.2 : (tier === 2 ? 1.65 : 2.2),
        flip: Math.random() < 0.5 ? 1 : -1,
        trail: [],
        morphDone: false,
        selfHitDone: false,
        neighbors: neighbors.map((nb) => ({ card: nb.card, hitDone: false }))
      });
      if (tier >= 2) this.spawnCardHalo(card, spec, 0.92, 1.15);
    }

    updateDrawKunpengWhale(ctx, fx, rect) {
      const p = fx.age / fx.duration;
      const fade = p < 0.1 ? p / 0.1 : (p > 0.85 ? (1 - p) / 0.15 : 1);
      const f = fx.flip;
      const c = rectCenter(rect);

      // Luminous turquoise ocean breach water-ring at launch edge!
      if (p < 0.46) {
        const rp = p / 0.46;
        const rx = 22 + rp * (fx.tier === 1 ? 44 : 74);
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

      const waypoints = [];
      if (fx.tier === 1) {
        waypoints.push(
          { x: rect.left + (f > 0 ? 0.18 : 0.82) * rect.width, y: rect.top + 16 },
          { x: c.x, y: Math.max(48, rect.top - rect.height * 0.48) },
          { x: rect.left + (f > 0 ? 0.92 : 0.08) * rect.width, y: rect.top + 12 }
        );
      } else if (fx.tier === 2) {
        waypoints.push(
          { x: rect.left + (f > 0 ? -0.18 : 1.18) * rect.width, y: rect.top + 28 },
          { x: rect.left + (f > 0 ? 0.25 : 0.75) * rect.width, y: Math.max(48, rect.top - rect.height * 0.78) },
          { x: rect.left + (f > 0 ? 1.18 : -0.18) * rect.width, y: rect.top + 10 },
          { x: c.x, y: rect.bottom + 26 }
        );
      } else {
        // Tier 3: Giant Whale breaches skyward (0..0.42), METAMORPHOSES into Golden Roc at apex, sweeps 2-3 neighbor cards!
        waypoints.push(
          { x: c.x - f * rect.width * 0.4, y: rect.top + 22 },
          { x: c.x, y: Math.max(54, rect.top - rect.height * 0.76) }
        );
        for (const nb of fx.neighbors) {
          if (nb.card && document.body.contains(nb.card)) {
            const nr = nb.card.getBoundingClientRect();
            waypoints.push({ x: nr.left + nr.width * 0.5, y: Math.max(52, nr.top - nr.height * 0.28) });
          }
        }
        if (waypoints.length < 4) {
          waypoints.push({ x: c.x + f * rect.width * 1.15, y: Math.max(52, rect.top - 26) });
        }
      }

      const pos = catmullRom(waypoints, p);
      const ahead = catmullRom(waypoints, Math.min(0.999, p + 0.025));
      const heading = Math.atan2(ahead.y - pos.y, ahead.x - pos.x);

      fx.trail.push(pos);
      if (fx.trail.length > 26) fx.trail.shift();

      const isPeng = fx.tier >= 3 && p >= 0.42;

      // Swirling Sea-Foam / Golden Cloud Wake Ribbon!
      if (fx.trail.length >= 3) {
        const g = safeLinearGradient(ctx, fx.trail[0].x, fx.trail[0].y, pos.x, pos.y);
        if (g) {
          g.addColorStop(0, 'rgba(20, 184, 166, 0)');
          g.addColorStop(0.5, isPeng ? '#f59e0b' : fx.spec.main);
          g.addColorStop(1, isPeng ? '#fef08a' : '#67e8f9');
          drawTaperedRibbon(ctx, fx.trail, fx.tier === 1 ? 5 : (isPeng ? 13 : 9.5), g, fade * 0.7);
        }
        drawTaperedRibbon(ctx, fx.trail, 2.6, '#ffffff', fade * 0.9);
      }

      // Tier 3 Mid-Air Metamorphosis Cloud-Gold Burst at p = 0.42!
      if (fx.tier >= 3 && !fx.morphDone && p >= 0.42) {
        fx.morphDone = true;
        this.spawnImpactSparks(pos.x, pos.y, 0, -1, SPECTRA['solar-gold'], 24, 1.15, { gravity: -40 });
        this.spawnImpactSparks(pos.x, pos.y, 0, 1, fx.spec, 16, 0.95);
        this.pulseCardHit(fx.card);
      }
      if (fx.tier >= 3 && p > 0.36 && p < 0.56) {
        const mp = Math.sin(((p - 0.36) / 0.20) * Math.PI);
        drawStarBloom(ctx, pos.x, pos.y, 44 * mp, '#ffffff', '#f59e0b', mp);
      }

      if (!fx.selfHitDone && p > 0.26) {
        fx.selfHitDone = true;
        this.spawnBorderFlash(fx.card, 'top', 0.5, fx.spec, 0.44, 0.52);
        this.spawnImpactSparks(c.x, rect.top, 0, -1, fx.spec, fx.tier === 1 ? 10 : 16, 0.95);
      }

      // Tier 3 Golden Roc sweeps neighbor cards!
      if (fx.tier >= 3 && isPeng) {
        for (const nb of fx.neighbors) {
          if (nb.hitDone || !nb.card || !document.body.contains(nb.card)) continue;
          const nr = nb.card.getBoundingClientRect();
          const nc = rectCenter(nr);
          if (Math.hypot(pos.x - nc.x, pos.y - nc.y) < Math.max(nr.width, nr.height) * 0.85) {
            nb.hitDone = true;
            const hitPt = facingEdgeOnRect(pos, nr);
            this.triggerNeighborImpact(nb.card, hitPt, SPECTRA['solar-gold'], { sparks: 20, flashDuration: 0.58, span: 0.54 });
          }
        }
      }

      // Render either Bioluminescent Spirit Whale (鲲) OR Golden-Turquoise Great Roc (大鹏)!
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(heading);
      if (Math.cos(heading) < 0) ctx.scale(1, -1);
      if (isPeng) {
        drawGoldenPeng(ctx, 0, 0, 0, 1.36 * fx.intensity, fx.age, fx.spec, fade);
      } else {
        const wScale = fx.tier === 1 ? 0.86 : (fx.tier === 2 ? 1.18 : 1.32);
        drawSpiritWhale(ctx, 0, 0, 0, wScale * fx.intensity, fx.age, fx.spec, fade);
      }
      ctx.restore();
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
          case 'ink-dragon':
            this.updateDrawInkDragon(ctx, fx, rect, dt);
            break;
          case 'nine-tail-fox':
            this.updateDrawNineTailFox(ctx, fx, rect);
            break;
          case 'frost-fenrir':
            this.updateDrawFrostFenrir(ctx, fx, rect, dt);
            break;
          case 'arcane-cosmos':
            this.updateDrawArcaneCosmos(ctx, fx, rect);
            break;
          case 'kunpeng-whale':
            this.updateDrawKunpengWhale(ctx, fx, rect);
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
  PulseWallVfxEngine.TIER_ARCHETYPES = TIER_ARCHETYPES;
  globalScope.PulseWallVfxEngine = PulseWallVfxEngine;
})(window);

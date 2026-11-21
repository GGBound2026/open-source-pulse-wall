(function initVfxShowcase() {
  'use strict';

  function getArchetypes() {
    const engine = window.PulseWallVfxEngine;
    if (Array.isArray(engine?.ARCHETYPES)) return engine.ARCHETYPES;
    return engine?.TIER_ARCHETYPES?.[3] || [];
  }

  const STAR_SPECTRA = [
    { id: 'cyan-volt', label: '星蓝雷电' },
    { id: 'solar-gold', label: '炽日鎏金' },
    { id: 'emerald-jade', label: '翡翠极光' },
    { id: 'sakura-neon', label: '绯樱粉金' },
    { id: 'prism-rainbow', label: '全息虹彩' },
    { id: 'amethyst-void', label: '虚空紫晶' },
    { id: 'crimson-ember', label: '绯红余烬' },
    { id: 'frost-opal', label: '冰川月白' }
  ];

  const STAR_THEMES = [
    { id: 'prism', label: '棱镜虹彩', tone: 'light', motto: '柔雾全息多色漫反射，轻盈通透' },
    { id: 'goldleaf', label: '鎏金典藏', tone: 'light', motto: '暖象牙底衬古铜金箔光晕，典雅厚重' },
    { id: 'aurora', label: '翡翠极光', tone: 'dark', motto: '深森墨绿叠青碧极光，高亮护眼反差' },
    { id: 'sakura', label: '落樱玫瑰金', tone: 'light', motto: '樱粉与暖杏玫瑰金渐变，温润细腻' },
    { id: 'celestial', label: '午夜星穹', tone: 'dark', motto: '靛蓝深空映暖金星辉，塔罗典藏质感' },
    { id: 'opalescent', label: '月白欧泊', tone: 'light', motto: '冷薰衣草与冰蓝欧泊珠光，清冽明净' },
    { id: 'amber', label: '琥珀鎏铜', tone: 'light', motto: '焦糖琥珀与暖铜晕染，复古手账温感' },
    { id: 'obsidian', label: '黑曜紫晶', tone: 'dark', motto: '深黑曜石缀紫晶与品红霓晕，冷峻深邃' }
  ];

  const STAR_PATTERNS = [
    { id: 'constellation', label: '星图连线' },
    { id: 'sunburst', label: '破晓芒光' },
    { id: 'botanical', label: '鎏金叶脉' },
    { id: 'nebula-rings', label: '星轨同心环' },
    { id: 'sacred-geo', label: '菱格星纹' },
    { id: 'aurora-waves', label: '流云光带' },
    { id: 'compass-rose', label: '航海星盘' },
    { id: 'prism-facets', label: '晶格折面' }
  ];

  const STAR_BADGES = [
    { id: 'crystal-star', label: '水晶棱镜星' },
    { id: 'wax-seal', label: '复古火漆印' },
    { id: 'shooting-star', label: '璀璨流星章' },
    { id: 'crescent-crest', label: '新月星辰章' },
    { id: 'ribbon-medal', label: '丝带星勋章' },
    { id: 'enamel-charm', label: '珐琅星挂坠' },
    { id: 'prism-diamond', label: '八芒星菱钻' },
    { id: 'laurel-star', label: '月桂星冠章' }
  ];

  function starPatternSvg(patternId) {
    switch (patternId) {
      case 'constellation':
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.15" opacity="0.82">
              <path d="M22 52 L74 32 L128 66 L192 28 L256 54 L298 22" stroke-dasharray="3 4" />
              <path d="M74 32 L106 116 L180 132 L256 54" opacity="0.7" />
              <path d="M192 28 L224 114 L290 144" stroke-dasharray="2 4" opacity="0.65" />
              <path d="M28 158 L106 116 L154 188" opacity="0.6" />
            </g>
            <g fill="currentColor">
              <circle cx="22" cy="52" r="2.6" />
              <circle cx="74" cy="32" r="3.2" />
              <circle cx="128" cy="66" r="2.4" />
              <circle cx="192" cy="28" r="3.4" />
              <circle cx="256" cy="54" r="2.8" />
              <circle cx="298" cy="22" r="2.2" />
              <circle cx="106" cy="116" r="2.6" />
              <circle cx="180" cy="132" r="2.4" />
              <circle cx="224" cy="114" r="2.9" />
              <circle cx="290" cy="144" r="2.2" />
              <circle cx="28" cy="158" r="2.4" />
              <circle cx="154" cy="188" r="2.6" />
            </g>
          </svg>`;
      case 'sunburst':
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g stroke="currentColor" stroke-width="1.15" opacity="0.82">
              <line x1="278" y1="26" x2="112" y2="-10" />
              <line x1="278" y1="26" x2="78" y2="24" />
              <line x1="278" y1="26" x2="72" y2="74" />
              <line x1="278" y1="26" x2="104" y2="128" />
              <line x1="278" y1="26" x2="152" y2="178" />
              <line x1="278" y1="26" x2="210" y2="212" />
              <line x1="278" y1="26" x2="274" y2="220" />
              <line x1="278" y1="26" x2="332" y2="180" />
              <circle cx="278" cy="26" r="46" fill="none" stroke-dasharray="3 5" opacity="0.7" />
              <circle cx="278" cy="26" r="88" fill="none" stroke-dasharray="2 6" opacity="0.52" />
            </g>
          </svg>`;
      case 'botanical':
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
              <path d="M-4 14 C36 28 64 56 84 102" />
              <path d="M18 24 C42 12 64 16 74 34 C54 44 32 42 18 24Z" />
              <path d="M40 46 C68 38 92 48 96 68 C74 74 52 66 40 46Z" />
              <path d="M36 52 C14 58 2 76 6 94 C26 92 40 76 36 52Z" />
              <path d="M62 76 C44 92 42 114 54 128 C72 116 76 96 62 76Z" />
              <path d="M324 212 C282 196 254 168 238 124" />
              <path d="M294 196 C272 204 252 196 246 178 C268 172 286 178 294 196Z" />
              <path d="M268 168 C242 174 222 162 220 144 C242 140 262 150 268 168Z" />
            </g>
          </svg>`;
      case 'nebula-rings':
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" opacity="0.82">
              <ellipse cx="164" cy="100" rx="142" ry="52" transform="rotate(-14 164 100)" stroke-width="1.15" stroke-dasharray="5 5" />
              <ellipse cx="164" cy="100" rx="108" ry="36" transform="rotate(-14 164 100)" stroke-width="1.1" />
              <ellipse cx="164" cy="100" rx="158" ry="66" transform="rotate(11 164 100)" stroke-width="0.9" stroke-dasharray="2 6" />
            </g>
            <g fill="currentColor" opacity="0.9">
              <circle cx="52" cy="70" r="2.8" />
              <circle cx="276" cy="126" r="2.6" />
              <circle cx="222" cy="46" r="2.2" />
            </g>
          </svg>`;
      case 'sacred-geo':
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.68">
              <path d="M0 55 L80 0 L160 55 L240 0 L320 55 M0 110 L80 55 L160 110 L240 55 L320 110 M0 165 L80 110 L160 165 L240 110 L320 165 M0 220 L80 165 L160 220 L240 165 L320 220" />
              <path d="M0 0 L80 55 L160 0 L240 55 L320 0 M0 55 L80 110 L160 55 L240 110 L320 55 M0 110 L80 165 L160 110 L240 165 L320 110 M0 165 L80 220 L160 165 L240 220 L320 165" />
            </g>
            <g fill="currentColor" opacity="0.82">
              <path d="M80 49 L82 53 L86 55 L82 57 L80 61 L78 57 L74 55 L78 53 Z" />
              <path d="M240 49 L242 53 L246 55 L242 57 L240 61 L238 57 L234 55 L238 53 Z" />
              <path d="M160 104 L162 108 L166 110 L162 112 L160 116 L158 112 L154 110 L158 108 Z" />
            </g>
          </svg>`;
      case 'aurora-waves':
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.35" opacity="0.78">
              <path d="M-10 42 C58 14, 118 76, 196 42 C252 16, 286 48, 330 28" />
              <path d="M-10 74 C66 44, 126 106, 206 72 C262 46, 294 78, 330 58" opacity="0.88" />
              <path d="M-10 108 C72 78, 134 140, 214 106 C270 80, 298 112, 330 92" opacity="0.74" />
              <path d="M-10 144 C78 114, 142 174, 222 140 C276 116, 304 146, 330 128" opacity="0.6" />
            </g>
          </svg>`;
      case 'compass-rose':
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.15" opacity="0.82">
              <circle cx="242" cy="118" r="56" />
              <circle cx="242" cy="118" r="44" stroke-dasharray="3 4" />
              <circle cx="242" cy="118" r="14" />
              <path d="M242 50 L248 112 L310 118 L248 124 L242 186 L236 124 L174 118 L236 112 Z" />
              <path d="M204 80 L242 118 L280 156 M280 80 L242 118 L204 156" opacity="0.68" />
            </g>
          </svg>`;
      case 'prism-facets':
      default:
        return `
          <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.05" opacity="0.72">
              <polygon points="18,16 112,4 74,78" />
              <polygon points="112,4 214,32 144,94 74,78" />
              <polygon points="214,32 310,14 276,104 144,94" />
              <polygon points="74,78 144,94 98,176 14,142" />
              <polygon points="144,94 276,104 236,196 98,176" />
              <polygon points="276,104 324,186 236,196" />
            </g>
          </svg>`;
    }
  }

  function starBadgeSvg(badgeId, uid) {
    const g1 = `sb1-${uid}`;
    const g2 = `sb2-${uid}`;
    switch (badgeId) {
      case 'crystal-star':
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#c4f5ff" />
                <stop offset="48%" stop-color="#d8b4fe" />
                <stop offset="100%" stop-color="#fbcfe8" />
              </linearGradient>
              <linearGradient id="${g2}" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98" />
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.72" />
              </linearGradient>
            </defs>
            <path d="M22 3 L27.2 14.5 L39.8 16.1 L30.4 24.8 L32.8 37.4 L22 31.2 L11.2 37.4 L13.6 24.8 L4.2 16.1 L16.8 14.5 Z" fill="url(#${g1})" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M22 3 L22 22 L39.8 16.1 Z M22 22 L11.2 37.4 L13.6 24.8 Z" fill="url(#${g2})" opacity="0.75" />
            <path d="M22 11.5 L24 18 L30.5 19 L25.4 23 L26.7 29.5 L22 26.2 L17.3 29.5 L18.6 23 L13.5 19 L20 18 Z" fill="#ffffff" opacity="0.68" />
          </svg>`;
      case 'wax-seal':
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <radialGradient id="${g1}" cx="36%" cy="32%" r="68%">
                <stop offset="0%" stop-color="#e35d47" />
                <stop offset="60%" stop-color="#a12628" />
                <stop offset="100%" stop-color="#691518" />
              </radialGradient>
              <linearGradient id="${g2}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="100%" stop-color="#d9961f" />
              </linearGradient>
            </defs>
            <path d="M22 3.5 C27 3.1 30.6 5.4 34.4 8.2 C38.2 11.4 40.6 15.8 40 21.8 C39.6 27.4 38 32.8 33.4 36.2 C29 39.4 24.8 40.8 19.6 40 C14 39.2 8 36.8 5.6 31 C3.2 25.4 4 18 7 12.2 C10 6.6 16.2 4 22 3.5 Z" fill="url(#${g1})" stroke="#4c1012" stroke-width="1.2" />
            <circle cx="22" cy="22" r="13.5" fill="none" stroke="url(#${g2})" stroke-width="1.5" opacity="0.92" />
            <path d="M22 12.2 L24.8 18.2 L31.2 19 L26.4 23.4 L27.6 29.8 L22 26.6 L16.4 29.8 L17.6 23.4 L12.8 19 L19.2 18.2 Z" fill="url(#${g2})" />
          </svg>`;
      case 'shooting-star':
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${g1}" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="52%" stop-color="#5eead4" />
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="${g2}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="58%" stop-color="#fef08a" />
                <stop offset="100%" stop-color="#34d399" />
              </linearGradient>
            </defs>
            <path d="M41 4 C31 9 23 15 14 24" stroke="url(#${g1})" stroke-width="5" stroke-linecap="round" fill="none" />
            <path d="M39 11 C31 15 25 20 19 27" stroke="url(#${g1})" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.86" />
            <path d="M16.5 14.5 L19.6 22 L27.5 23 L21.5 28.4 L23 36.4 L16.5 32.2 L10 36.4 L11.5 28.4 L5.5 23 L13.4 22 Z" fill="url(#${g2})" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
          </svg>`;
      case 'crescent-crest':
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef9c3" />
                <stop offset="52%" stop-color="#f5c451" />
                <stop offset="100%" stop-color="#b7791f" />
              </linearGradient>
            </defs>
            <circle cx="22" cy="22" r="17.5" fill="rgba(18, 25, 50, 0.90)" stroke="url(#${g1})" stroke-width="1.8" />
            <path d="M24.4 10.8 A11.2 11.2 0 1 0 31.4 29.6 A8.6 8.6 0 1 1 24.4 10.8 Z" fill="url(#${g1})" />
            <path d="M29 13 L30.4 17 L34.4 18 L30.9 20 L30.8 23.8 L28 21 L24.4 21.8 L26.2 18.4 L24.6 15 L28.2 16.2 Z" fill="#fef9c3" />
          </svg>`;
      case 'ribbon-medal':
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef0b8" />
                <stop offset="52%" stop-color="#d48c3e" />
                <stop offset="100%" stop-color="#8c4a18" />
              </linearGradient>
              <linearGradient id="${g2}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#c95f36" />
                <stop offset="100%" stop-color="#7c2e16" />
              </linearGradient>
            </defs>
            <path d="M14 26 L11 41 L17.6 37 L21.2 41.2 L22 28 Z" fill="url(#${g2})" />
            <path d="M30 26 L33 41 L26.4 37 L22.8 41.2 L22 28 Z" fill="url(#${g2})" />
            <circle cx="22" cy="18" r="13.6" fill="url(#${g1})" stroke="#fff8e3" stroke-width="1.4" />
            <circle cx="22" cy="18" r="10.4" fill="none" stroke="#fff4d6" stroke-width="1" stroke-dasharray="2 2" />
            <path d="M22 10.2 L24.2 15.2 L29.6 15.8 L25.6 19.6 L26.7 25 L22 22.2 L17.3 25 L18.4 19.6 L14.4 15.8 L19.8 15.2 Z" fill="#fffaf0" />
          </svg>`;
      case 'enamel-charm':
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffe4e6" />
                <stop offset="52%" stop-color="#f472b6" />
                <stop offset="100%" stop-color="#be185d" />
              </linearGradient>
              <linearGradient id="${g2}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef3c7" />
                <stop offset="100%" stop-color="#c48a37" />
              </linearGradient>
            </defs>
            <circle cx="22" cy="6.6" r="3.6" fill="none" stroke="url(#${g2})" stroke-width="2.2" />
            <path d="M22 10 L26.4 19 L36.4 20.4 L29 27.4 L30.8 37.2 L22 32.6 L13.2 37.2 L15 27.4 L7.6 20.4 L17.6 19 Z" fill="url(#${g1})" stroke="url(#${g2})" stroke-width="2.2" stroke-linejoin="round" />
            <path d="M18 21.2 Q22 18.2 26.8 20.6" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.88" />
          </svg>`;
      case 'prism-diamond':
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="50%" stop-color="#c084fc" />
                <stop offset="100%" stop-color="#38bdf8" />
              </linearGradient>
            </defs>
            <path d="M22 2.5 L26.2 17.8 L41.5 22 L26.2 26.2 L22 41.5 L17.8 26.2 L2.5 22 L17.8 17.8 Z" fill="url(#${g1})" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round" />
            <path d="M22 10.5 L29.5 22 L22 33.5 L14.5 22 Z" fill="#ffffff" opacity="0.62" />
            <circle cx="22" cy="22" r="3.2" fill="#ffffff" />
          </svg>`;
      case 'laurel-star':
      default:
        return `
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="55%" stop-color="#d4a342" />
                <stop offset="100%" stop-color="#8b651f" />
              </linearGradient>
            </defs>
            <circle cx="22" cy="22" r="17.5" fill="rgba(34, 54, 42, 0.92)" stroke="url(#${g1})" stroke-width="1.7" />
            <path d="M14.2 31 C9.2 27 8.8 19.2 13 13.4 M29.8 31 C34.8 27 35.2 19.2 31 13.4" fill="none" stroke="url(#${g1})" stroke-width="2" stroke-linecap="round" />
            <path d="M22 12 L24.5 17.8 L30.8 18.6 L26 22.8 L27.4 29 L22 25.8 L16.6 29 L18 22.8 L13.2 18.6 L19.5 17.8 Z" fill="url(#${g1})" />
          </svg>`;
    }
  }

  const dom = {
    tabs: Array.from(document.querySelectorAll('.showcase-tablist [role="tab"]')),
    panelsWrap: document.getElementById('showcasePanels'),
    panels: Array.from(document.querySelectorAll('#showcasePanels > [role="tabpanel"]')),
    viewport: document.getElementById('showcaseViewport'),
    gridVfx: document.getElementById('gridVfx'),
    gridSpectra: document.getElementById('gridSpectra'),
    gridThemes: document.getElementById('gridThemes'),
    gridPatterns: document.getElementById('gridPatterns'),
    gridBadges: document.getElementById('gridBadges'),
    vfxUniformSpectrum: document.getElementById('vfxUniformSpectrum'),
    spectraUniformVfx: document.getElementById('spectraUniformVfx'),
    vfxDimHeading: document.getElementById('vfxDimHeading'),
    vfxDimSubtitle: document.getElementById('vfxDimSubtitle'),
    vfxAutoPlayBtn: document.getElementById('vfxAutoPlayBtn'),
    vfxBurstAllBtn: document.getElementById('vfxBurstAllBtn'),
    spectraBurstAllBtn: document.getElementById('spectraBurstAllBtn'),
    toggleExpandAll: document.getElementById('toggleExpandAll'),
    toggleExpandAllLabel: document.getElementById('toggleExpandAllLabel'),
    motionToggle: document.getElementById('showcaseMotionToggle'),
    motionLabel: document.getElementById('showcaseMotionLabel'),
    vfxOverlay: document.getElementById('vfxOverlay')
  };

  const state = {
    activePanelId: 'panel-vfx',
    expandedAll: false,
    paused: false,
    autoPlay: true,
    vfxSpectrum: 'native',
    spectraVfx: 'thunder-zeus',
    spectraSurface: 'light',
    patternSurface: 'ivory',
    cycleIdx: 0,
    cycleTimer: null,
    hoveredSpecimen: null,
    engine: null
  };

  function initEngine() {
    if (!window.PulseWallVfxEngine || !dom.vfxOverlay) return;
    state.engine = new window.PulseWallVfxEngine({
      canvas: dom.vfxOverlay,
      wallEl: dom.panelsWrap,
      viewportEl: dom.viewport,
      ambient: false,
      maxEffects: 32
    });
  }

  function populateSelects() {
    if (dom.vfxUniformSpectrum) {
      dom.vfxUniformSpectrum.innerHTML = [
        '<option value="native">原生专属配色（16色分明）</option>',
        ...STAR_SPECTRA.map((s) => `<option value="${s.id}">统一染色 · ${s.label}</option>`)
      ].join('');
      dom.vfxUniformSpectrum.value = state.vfxSpectrum;
    }

    if (dom.spectraUniformVfx) {
      dom.spectraUniformVfx.innerHTML = getArchetypes()
        .map((v) => `<option value="${v.id}">${v.lineageName} · ${v.label}</option>`)
        .join('');
      dom.spectraUniformVfx.value = state.spectraVfx;
    }
  }

  function renderVfxGrid() {
    if (!dom.gridVfx) return;
    const list = getArchetypes();
    const paletteMode = state.vfxSpectrum === 'native' ? 'native' : 'override';
    dom.gridVfx.innerHTML = list.map((item, idx) => {
      const numLabel = String(idx + 1).padStart(2, '0');
      const easterClass = item.id === 'shadow-eminence' ? ' is-easter-egg' : '';
      const dots = Array.isArray(item.swatch)
        ? `<span class="specimen-palette-dots" aria-hidden="true">${item.swatch.map((c) => `<i style="background:${c}"></i>`).join('')}</span>`
        : '';
      return `
      <article
        class="vfx-specimen${easterClass}"
        data-specimen-group="vfx"
        data-star-vfx="${item.id}"
        data-star-vfx-tier="3"
        data-star-spectrum="${state.vfxSpectrum}"
        data-star-palette-mode="${paletteMode}"
        tabindex="0"
        aria-label="${item.lineageName}·${item.label}（点击触发特效）"
      >
        <div class="specimen-top">
          <div class="specimen-title-wrap" style="inline-size:100%">
            <div class="specimen-meta-row">
              <span class="specimen-num">${numLabel} · ${item.family || ''}</span>
              <span class="specimen-tier-badge">${item.lineageName || '顶格专属'}</span>
            </div>
            <h3 class="specimen-title">${item.label}</h3>
            <code class="specimen-code">${item.id}</code>
          </div>
        </div>
        <p class="specimen-desc">${item.desc}</p>
        <div class="specimen-footer">
          <button type="button" class="specimen-trigger" data-fire-card="1">▶ 触发破框特效</button>
          ${dots}
        </div>
      </article>
    `;
    }).join('');
  }

  function renderSpectraGrid() {
    if (!dom.gridSpectra) return;
    const spectraMap = window.PulseWallVfxEngine?.SPECTRA || {};
    const darkClass = state.spectraSurface === 'dark' ? ' is-dark-surface' : '';
    const specVfxId = String(state.spectraVfx || 'thunder-zeus').split(':')[0];

    dom.gridSpectra.innerHTML = STAR_SPECTRA.map((item, idx) => {
      const tok = spectraMap[item.id] || {
        deep: '#1d4ed8', main: '#0ea5e9', bright: '#7dd3fc', core: '#ffffff', spark: '#fde047'
      };
      const swatches = [
        { k: '外晕', c: tok.deep },
        { k: '主光', c: tok.main },
        { k: '高光', c: tok.bright },
        { k: '白核', c: tok.core },
        { k: '火星', c: tok.spark }
      ];

      return `
        <article
          class="vfx-specimen${darkClass}"
          data-specimen-group="spectra"
          data-star-vfx="${specVfxId}"
          data-star-vfx-tier="3"
          data-star-spectrum="${item.id}"
          data-star-palette-mode="override"
          tabindex="0"
          aria-label="${item.label}光谱（点击触发预览）"
        >
          <div class="specimen-top">
            <div class="specimen-title-wrap">
              <span class="specimen-num">0${idx + 1}</span>
              <h3 class="specimen-title">${item.label}</h3>
              <code class="specimen-code">${item.id}</code>
            </div>
          </div>
          <div class="swatch-strip" aria-label="五层着色栈色板">
            ${swatches.map((sw) => `
              <div class="swatch-chip" title="${sw.k}: ${sw.c}">
                <span class="swatch-dot" style="background:${sw.c}"></span>
                <span>${sw.k}</span>
              </div>
            `).join('')}
          </div>
          <div class="specimen-footer">
            <button type="button" class="specimen-trigger" data-fire-card="1">▶ 触发演色</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderThemesGrid() {
    if (!dom.gridThemes) return;
    dom.gridThemes.innerHTML = STAR_THEMES.map((theme, idx) => `
      <article
        class="profile-card is-starred star-tone-${theme.tone} showcase-theme-card"
        data-star-theme="${theme.id}"
        style="--sheen-delay:-${(idx * 0.9).toFixed(2)}s"
      >
        <div class="card-surface" aria-hidden="true">
          <div class="star-foil-layer"></div>
        </div>
        <div class="identity">
          <div class="theme-avatar-glyph" aria-hidden="true">0${idx + 1}</div>
          <div class="identity-meta">
            <h3>${theme.label}</h3>
            <div class="handle-row">
              <span class="handle-link">@${theme.id}</span>
              <span class="city-pill">${theme.tone === 'dark' ? '深色典藏' : '浅色典藏'}</span>
            </div>
          </div>
        </div>
        <p class="motto">${theme.motto}</p>
        <div class="cheers-block" aria-label="材质寄语栏预览">
          <div class="cheers-head">
            <span class="cheers-label"><span>寄语 1 · 配色对比检视</span></span>
          </div>
          <ul class="cheers-list">
            <li>
              <span class="cheer-from">@sample:</span>
              <span class="cheer-message">纯材质预览（无特效 / 无纹理 / 无徽章）</span>
            </li>
          </ul>
        </div>
      </article>
    `).join('');
  }

  function renderPatternsGrid() {
    if (!dom.gridPatterns) return;
    const plateClass = state.patternSurface === 'obsidian' ? ' is-obsidian-plate' : '';
    dom.gridPatterns.innerHTML = STAR_PATTERNS.map((pat, idx) => `
      <article class="pattern-specimen${plateClass}" data-pattern-id="${pat.id}">
        <div class="pattern-canvas-art">${starPatternSvg(pat.id)}</div>
        <div class="pattern-caption">
          <div>
            <strong>0${idx + 1} · ${pat.label}</strong>
            <code>${pat.id}</code>
          </div>
        </div>
      </article>
    `).join('');
  }

  function renderBadgesGrid() {
    if (!dom.gridBadges) return;
    dom.gridBadges.innerHTML = STAR_BADGES.map((badge, idx) => `
      <article class="badge-specimen" data-badge-id="${badge.id}">
        <span class="badge-corner-hint">0${idx + 1} · 右上角 1:1 实装</span>
        <button
          type="button"
          class="star-emblem-btn"
          title="${badge.label}（悬停查看实装动画）"
          aria-label="${badge.label} 右上角实装预览"
        >
          ${starBadgeSvg(badge.id, `corner-${badge.id}`)}
        </button>
        <div class="badge-stage" aria-label="${badge.label} 放大标本">
          ${starBadgeSvg(badge.id, `stage-${badge.id}`)}
        </div>
        <div class="badge-meta">
          <strong>${badge.label}</strong>
          <code>${badge.id}</code>
        </div>
      </article>
    `).join('');
  }

  function getActiveVfxCards() {
    const selector = '.vfx-specimen';
    if (state.expandedAll) {
      return Array.from(dom.panelsWrap.querySelectorAll(selector));
    }
    const panel = document.getElementById(state.activePanelId);
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(selector));
  }

  function clearSpotlight() {
    dom.panelsWrap.querySelectorAll('.vfx-specimen.is-spotlight').forEach((el) => {
      el.classList.remove('is-spotlight');
    });
  }

  function fireGroupBurst(containerEl) {
    if (!state.engine || state.paused || !containerEl) return;
    clearSpotlight();
    const cards = Array.from(containerEl.querySelectorAll('.vfx-specimen'));
    cards.forEach((card, index) => {
      window.setTimeout(() => {
        if (state.paused) return;
        const rect = card.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 20) return;
        state.engine.triggerForCard(card, { intensity: 1.18, unleashed: true });
      }, index * 78);
    });
  }

  function runAutoCycleStep() {
    if (!state.autoPlay || state.paused || state.hoveredSpecimen || !state.engine) return;
    const cards = getActiveVfxCards();
    if (!cards.length) return;

    // Filter to cards currently visible inside scroll viewport
    const vp = dom.viewport.getBoundingClientRect();
    const visible = cards.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.width > 20 && r.bottom > vp.top + 30 && r.top < vp.bottom - 30;
    });
    if (!visible.length) return;

    const card = visible[state.cycleIdx % visible.length];
    state.cycleIdx = (state.cycleIdx + 1) % visible.length;
    clearSpotlight();
    card.classList.add('is-spotlight');
    state.engine.triggerForCard(card, { intensity: 1.18, unleashed: true });
  }

  function restartAutoCycle(immediateDelay = 420) {
    window.clearInterval(state.cycleTimer);
    if (!state.autoPlay || state.paused) return;
    window.setTimeout(() => {
      if (state.autoPlay && !state.paused && !state.hoveredSpecimen) {
        runAutoCycleStep();
      }
    }, immediateDelay);
    state.cycleTimer = window.setInterval(runAutoCycleStep, 1380);
  }

  function selectTab(tabEl, { moveFocus = false } = {}) {
    if (!tabEl) return;
    const targetPanelId = tabEl.dataset.panel;
    state.activePanelId = targetPanelId;

    // Exit expand-all mode when explicitly selecting a single tab
    if (state.expandedAll) {
      setExpandedAll(false, { skipReselect: true });
    }

    for (const tab of dom.tabs) {
      const selected = tab === tabEl;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }

    for (const panel of dom.panels) {
      if (panel.id === targetPanelId) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', 'until-found');
      }
    }

    tabEl.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
    if (moveFocus) tabEl.focus();

    state.engine?.clearAll();
    clearSpotlight();
    state.cycleIdx = 0;

    if (targetPanelId === 'panel-vfx' || targetPanelId === 'panel-spectra') {
      restartAutoCycle(260);
    }
  }

  function setExpandedAll(expanded, { skipReselect = false } = {}) {
    state.expandedAll = Boolean(expanded);
    dom.toggleExpandAll.setAttribute('aria-pressed', String(state.expandedAll));
    dom.toggleExpandAllLabel.textContent = state.expandedAll ? '恢复单维分页' : '展开全部 5 维';
    dom.panelsWrap.classList.toggle('is-expanded', state.expandedAll);

    if (state.expandedAll) {
      for (const panel of dom.panels) {
        panel.removeAttribute('hidden');
      }
      state.engine?.clearAll();
      clearSpotlight();
      restartAutoCycle(360);
    } else if (!skipReselect) {
      const activeTab = dom.tabs.find((t) => t.dataset.panel === state.activePanelId) || dom.tabs[0];
      selectTab(activeTab);
    }
  }

  function bindTabs() {
    dom.tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', (event) => {
        let nextIdx = -1;
        if (event.key === 'ArrowRight') nextIdx = (idx + 1) % dom.tabs.length;
        else if (event.key === 'ArrowLeft') nextIdx = (idx - 1 + dom.tabs.length) % dom.tabs.length;
        else if (event.key === 'Home') nextIdx = 0;
        else if (event.key === 'End') nextIdx = dom.tabs.length - 1;
        if (nextIdx !== -1) {
          event.preventDefault();
          selectTab(dom.tabs[nextIdx], { moveFocus: true });
        }
      });
    });

    // Support browser Find-in-Page revealing hidden="until-found" panels
    dom.panels.forEach((panel) => {
      panel.addEventListener('beforematch', () => {
        const ownerTab = dom.tabs.find((t) => t.dataset.panel === panel.id);
        if (ownerTab) selectTab(ownerTab);
      });
    });

    dom.toggleExpandAll?.addEventListener('click', () => {
      setExpandedAll(!state.expandedAll);
    });
  }

  function bindSpecimenInteractions() {
    // Hover & click on Canvas VFX / Spectra specimen cards
    dom.panelsWrap.addEventListener('pointerover', (event) => {
      const card = event.target.closest('.vfx-specimen');
      if (!card || card === state.hoveredSpecimen) return;
      state.hoveredSpecimen = card;
      clearSpotlight();
      card.classList.add('is-spotlight');
      state.engine?.setHoveredCard(card);
    });

    dom.panelsWrap.addEventListener('pointerout', (event) => {
      const card = event.target.closest('.vfx-specimen');
      if (!card || card !== state.hoveredSpecimen) return;
      if (event.relatedTarget && card.contains(event.relatedTarget)) return;
      state.hoveredSpecimen = null;
      card.classList.remove('is-spotlight');
      state.engine?.setHoveredCard(null);
    });

    dom.panelsWrap.addEventListener('click', (event) => {
      const card = event.target.closest('.vfx-specimen');
      if (!card) return;
      clearSpotlight();
      card.classList.add('is-spotlight');
      state.engine?.triggerSurge(card);
    });

    dom.panelsWrap.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.vfx-specimen');
      if (!card || event.target.closest('button')) return;
      event.preventDefault();
      state.engine?.triggerSurge(card);
    });

    // Pointer-tracked 3D foil tilt for Dimension 3 theme cards
    dom.gridThemes?.addEventListener('pointermove', (event) => {
      if (state.paused) return;
      const card = event.target.closest('.showcase-theme-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = ((event.clientX - r.left) / r.width) * 100;
      const py = ((event.clientY - r.top) / r.height) * 100;
      const tiltX = ((50 - py) / 50) * 6;
      const tiltY = ((px - 50) / 50) * 7;
      card.classList.add('is-tilting');
      card.style.setProperty('--pointer-x', `${px.toFixed(1)}%`);
      card.style.setProperty('--pointer-y', `${py.toFixed(1)}%`);
      card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
      card.style.setProperty('--foil-angle', `${(105 + (px - 50) * 0.7).toFixed(1)}deg`);
    });

    dom.gridThemes?.addEventListener('pointerout', (event) => {
      const card = event.target.closest('.showcase-theme-card');
      if (!card || (event.relatedTarget && card.contains(event.relatedTarget))) return;
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  }

  function bindToolbarControls() {
    dom.vfxUniformSpectrum?.addEventListener('change', (event) => {
      state.vfxSpectrum = event.target.value;
      renderVfxGrid();
      fireGroupBurst(dom.gridVfx);
    });

    dom.spectraUniformVfx?.addEventListener('change', (event) => {
      state.spectraVfx = event.target.value;
      renderSpectraGrid();
      fireGroupBurst(dom.gridSpectra);
    });

    dom.vfxAutoPlayBtn?.addEventListener('click', () => {
      state.autoPlay = !state.autoPlay;
      dom.vfxAutoPlayBtn.classList.toggle('is-active', state.autoPlay);
      dom.vfxAutoPlayBtn.setAttribute('aria-pressed', String(state.autoPlay));
      dom.vfxAutoPlayBtn.textContent = state.autoPlay ? '轮播中' : '开启轮播';
      if (state.autoPlay) {
        restartAutoCycle(160);
      } else {
        window.clearInterval(state.cycleTimer);
        clearSpotlight();
      }
    });

    dom.vfxBurstAllBtn?.addEventListener('click', () => fireGroupBurst(dom.gridVfx));
    dom.spectraBurstAllBtn?.addEventListener('click', () => fireGroupBurst(dom.gridSpectra));

    document.querySelectorAll('[data-spectra-surface]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.spectraSurface = btn.dataset.spectraSurface;
        document.querySelectorAll('[data-spectra-surface]').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        renderSpectraGrid();
        fireGroupBurst(dom.gridSpectra);
      });
    });

    document.querySelectorAll('[data-pattern-surface]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.patternSurface = btn.dataset.patternSurface;
        document.querySelectorAll('[data-pattern-surface]').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        renderPatternsGrid();
      });
    });

    dom.motionToggle?.addEventListener('click', () => {
      state.paused = !state.paused;
      document.body.classList.toggle('is-motion-paused', state.paused);
      dom.gridThemes?.classList.toggle('is-motion-paused', state.paused);
      dom.motionToggle.setAttribute('aria-pressed', String(state.paused));
      dom.motionLabel.textContent = state.paused ? '开启动效' : '暂停动效';
      state.engine?.setPaused(state.paused);
      if (state.paused) {
        window.clearInterval(state.cycleTimer);
        clearSpotlight();
      } else if (state.autoPlay) {
        restartAutoCycle(240);
      }
    });
  }

  function applyInitialQueryParam() {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'all') {
        setExpandedAll(true);
        return;
      }
      if (tabParam) {
        const match = dom.tabs.find((t) => t.dataset.panel === `panel-${tabParam}`);
        if (match) {
          selectTab(match);
          return;
        }
      }
    } catch {
      // ignore invalid query strings
    }
    restartAutoCycle(420);
  }

  initEngine();
  populateSelects();
  renderVfxGrid();
  renderSpectraGrid();
  renderThemesGrid();
  renderPatternsGrid();
  renderBadgesGrid();
  bindTabs();
  bindSpecimenInteractions();
  bindToolbarControls();
  applyInitialQueryParam();
})();

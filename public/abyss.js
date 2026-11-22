import * as THREE from 'three';

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const ABYSS_NOISE_GLSL = `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i + vec3(0, 0, 0)), hash3(i + vec3(1, 0, 0)), f.x),
          mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x),
          mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }

  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }
`;

function createCircularPointMaterial(timeUniform, pixelRatio, minPx, maxPx, baseOpacity) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uPixelRatio: { value: pixelRatio },
      uMinPx: { value: minPx },
      uMaxPx: { value: maxPx },
      uOpacity: { value: baseOpacity }
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      uniform float uPixelRatio;
      uniform float uMinPx;
      uniform float uMaxPx;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        vColor = aColor;
        vPhase = aPhase;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float perspective = clamp(320000.0 / max(1.0, -mvPosition.z), 0.72, 1.35);
        gl_PointSize = clamp(aSize * perspective * uPixelRatio, uMinPx, uMaxPx);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        float core = exp(-d * d * 24.0) + 0.35 * exp(-d * d * 6.5);
        float twinkle = 0.84 + 0.16 * sin(uTime * 1.15 + vPhase);
        float alpha = core * smoothstep(0.5, 0.22, d) * twinkle * uOpacity;
        gl_FragColor = vec4(vColor * alpha, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

function buildSkyDome(skyRoot, renderer) {
  const proceduralMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      ${ABYSS_NOISE_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        vec3 bandN = normalize(vec3(0.28, 1.0, 0.42));
        float b = dot(d, bandN);
        float band = exp(-b * b * 14.0);
        float n1 = fbm3(d * 2.1);
        float n2 = fbm3(d * 4.6 + n1 * 1.7);
        vec3 col = vec3(0.0005, 0.0009, 0.0024);
        col += vec3(0.20, 0.07, 0.36) * smoothstep(0.42, 0.86, n1 * 0.75 + n2 * 0.45) * 0.028;
        col += vec3(0.02, 0.17, 0.27) * smoothstep(0.5, 0.9, fbm3(d * 3.0 + 7.0)) * 0.026;
        col += vec3(0.36, 0.09, 0.11) * smoothstep(0.56, 0.95, fbm3(d * 2.4 - 3.0)) * 0.014;
        col += vec3(0.34, 0.32, 0.46) * band * (0.25 + 0.75 * n2) * 0.036;
        col *= 1.0 - band * smoothstep(0.48, 0.78, fbm3(d * 9.0)) * 0.68;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  // The sky dome is completely static; bake the 5x fbm3 shader ONCE into a CubeTexture
  // so every subsequent frame performs a single cubemap lookup instead of 200 3D hashes/px.
  let skyMat = proceduralMat;
  if (renderer) {
    try {
      const cubeType = renderer.capabilities?.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;
      const cubeRT = new THREE.WebGLCubeRenderTarget(512, {
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: cubeType
      });
      const bakeScene = new THREE.Scene();
      const bakeGeo = new THREE.SphereGeometry(100, 32, 16);
      const bakeMesh = new THREE.Mesh(bakeGeo, proceduralMat);
      bakeScene.add(bakeMesh);

      const prevTarget = renderer.getRenderTarget();
      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = true;
      const cubeCam = new THREE.CubeCamera(1, 500, cubeRT);
      cubeCam.update(renderer, bakeScene);
      renderer.setRenderTarget(prevTarget);
      renderer.autoClear = prevAutoClear;

      bakeGeo.dispose();
      proceduralMat.dispose();

      skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uSkyMap: { value: cubeRT.texture } },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform samplerCube uSkyMap;
          varying vec3 vDir;
          void main() {
            gl_FragColor = textureCube(uSkyMap, normalize(vDir));
          }
        `
      });
    } catch {
      skyMat = proceduralMat;
    }
  }

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(735000, 24, 16),
    skyMat
  );
  sky.renderOrder = -20;
  sky.frustumCulled = false;
  skyRoot.add(sky);
  return sky;
}

function buildStarDome(skyRoot, pointMat) {
  const starCount = 10000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const phases = new Float32Array(starCount);
  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xc7dcff),
    new THREE.Color(0xffebc2),
    new THREE.Color(0xc4b5fd),
    new THREE.Color(0x99f6e4)
  ];
  const rand = mulberry32(0xa11ce);

  for (let i = 0; i < starCount; i += 1) {
    const isBand = i < 3600;
    const radius = 580000 + rand() * 140000;
    const theta = rand() * Math.PI * 2;
    const phi = isBand
      ? Math.PI * 0.5 + (rand() + rand() - 1) * 0.24
      : Math.acos(2 * rand() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const c = palette[Math.floor(rand() * palette.length)];
    const brightness = isBand ? 0.54 + rand() * 0.46 : 0.34 + rand() * 0.56;
    colors[i * 3] = c.r * brightness;
    colors[i * 3 + 1] = c.g * brightness;
    colors[i * 3 + 2] = c.b * brightness;
    sizes[i] = rand() < 0.985 ? 1.15 + rand() * 2.1 : 3.2 + rand() * 1.4;
    phases[i] = rand() * Math.PI * 2;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const stars = new THREE.Points(starGeo, pointMat);
  stars.rotation.z = 0.28;
  stars.rotation.x = -0.14;
  stars.renderOrder = -15;
  stars.frustumCulled = false;
  skyRoot.add(stars);
  return stars;
}

function buildOriginalColossus(skyRoot, helpers = {}) {
  // Original colossal ringed gas giant recovered from pre-eye history, scaled to the expanded solar system
  const giantRadius = 107200;
  const giantPos = new THREE.Vector3(50701, 17980, -386272);
  const { gasGiantCanvas, ringCanvas, canvasTexture, remapRingUVs, scheduleTexture } = helpers;

  const fallbackTex = new THREE.DataTexture(new Uint8Array([185, 135, 90, 255]), 1, 1);
  fallbackTex.needsUpdate = true;

  const hasTextureBuilders = Boolean(gasGiantCanvas && canvasTexture);
  const giantTex = (hasTextureBuilders && !scheduleTexture)
    ? canvasTexture(gasGiantCanvas('#b9875a', 'colossus', 1024, 512, { accent: '#6fb3c8' }), { repeat: true })
    : fallbackTex;
  const lightDir = new THREE.Vector3(-0.92, 0.26, -0.29).normalize();
  const colossusAnchor = new THREE.Group();
  colossusAnchor.position.copy(giantPos);
  skyRoot.add(colossusAnchor);

  const giant = new THREE.Mesh(
    new THREE.SphereGeometry(giantRadius, 72, 40),
    new THREE.ShaderMaterial({
      uniforms: { map: { value: giantTex }, lightDir: { value: lightDir }, time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vViewW;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vViewW = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 lightDir;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vViewW;
        void main() {
          vec3 tex = texture2D(map, vec2(vUv.x + time * 0.002, vUv.y)).rgb;
          tex = pow(tex, vec3(2.2));
          float ndl = dot(vNormalW, lightDir);
          float day = smoothstep(-0.12, 0.45, ndl);
          float fres = pow(1.0 - clamp(dot(vNormalW, vViewW), 0.0, 1.0), 3.0);
          vec3 col = tex * day * 0.5 + tex * 0.01;
          col += vec3(0.95, 0.62, 0.36) * fres * smoothstep(-0.35, 0.35, ndl) * 0.7;
          col += vec3(0.25, 0.45, 0.9) * fres * 0.06;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  giant.rotation.z = 0.32;
  giant.renderOrder = -10;
  colossusAnchor.add(giant);

  const ringInner = giantRadius * 1.32;
  const ringOuter = giantRadius * 2.35;
  const giantRingGeo = new THREE.RingGeometry(ringInner, ringOuter, 128, 1);
  if (remapRingUVs) remapRingUVs(giantRingGeo, ringInner, ringOuter);

  const hasRingBuilder = Boolean(ringCanvas && canvasTexture);
  const ringTex = (hasRingBuilder && !scheduleTexture)
    ? canvasTexture(ringCanvas('colossus-ring', 512))
    : fallbackTex;
  const giantRing = new THREE.Mesh(
    giantRingGeo,
    new THREE.MeshBasicMaterial({
      map: ringTex,
      color: new THREE.Color('#7a6650'),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  giantRing.rotation.set(-Math.PI / 2 + 0.36, 0.18, 0.32);
  giantRing.renderOrder = -9;
  colossusAnchor.add(giantRing);

  if (scheduleTexture && hasTextureBuilders) {
    scheduleTexture(0, () => {
      giant.material.uniforms.map.value = canvasTexture(
        gasGiantCanvas('#b9875a', 'colossus', 1024, 512, { accent: '#6fb3c8' }),
        { repeat: true }
      );
    });
  }
  if (scheduleTexture && hasRingBuilder) {
    scheduleTexture(0, () => {
      giantRing.material.map = canvasTexture(ringCanvas('colossus-ring', 512));
      giantRing.material.needsUpdate = true;
    });
  }

  return { colossusAnchor, giant, giantRing };
}

const DISTANT_GALAXIES = [
  { pos: [-256991, -217253, -409459], radius: 32000, arms: 3, rot: [0.85, -0.40, 0.65], spin: 0.0031, core: '#e0f2fe', arm: '#38bdf8', outer: '#818cf8', seed: 0x303c },
  { pos: [191719, -320542, -354573], radius: 44000, arms: 2, rot: [1.45, 0.28, -0.88], spin: 0.0018, core: '#fef3c7', arm: '#c084fc', outer: '#60a5fa', seed: 0x404d },
  { pos: [-121299, -470275, -199381], radius: 38000, arms: 2, rot: [1.52, -0.25, 0.78], spin: 0.0024, core: '#fde68a', arm: '#fb7185', outer: '#a78bfa', seed: 0x505e },
  { pos: [165000, 105000, 500000], radius: 48000, arms: 2, rot: [0.18, 0.35, 0.42], spin: 0.0019, core: '#f5d0fe', arm: '#a78bfa', outer: '#38bdf8', seed: 0x606f },
  { pos: [-345000, -70000, 405000], radius: 42000, arms: 2, rot: [1.18, -0.40, -0.60], spin: 0.0028, core: '#fef08a', arm: '#5eead4', outer: '#60a5fa', seed: 0x7071 }
];

function createGalaxyNebulaMaterial(cfg, forBake = false) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uArms: { value: cfg.arms },
      uCoreColor: { value: new THREE.Color(cfg.core) },
      uArmColor: { value: new THREE.Color(cfg.arm) },
      uOuterColor: { value: new THREE.Color(cfg.outer) },
      uSeed: { value: (cfg.seed % 97) * 0.37 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv - vec2(0.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uArms;
      uniform vec3 uCoreColor;
      uniform vec3 uArmColor;
      uniform vec3 uOuterColor;
      uniform float uSeed;
      varying vec2 vUv;
      ${ABYSS_NOISE_GLSL}
      void main() {
        float r = length(vUv) * 2.0;
        if (r > 0.96) discard;
        float angle = atan(vUv.y, vUv.x);
        float twist = log(max(r, 0.045)) * 3.1;
        float n = fbm3(vec3(vUv * 5.2, uSeed));

        float armWave = 0.5 + 0.5 * cos(uArms * (angle + twist) + (n - 0.5) * 1.45);
        float armGlow = pow(armWave, 1.5) * exp(-r * 2.4);
        float discHaze = exp(-r * 3.1) * 0.30;
        float bulge = exp(-r * r * 36.0) * 0.62;
        float rimFade = smoothstep(0.95, 0.35, r);

        vec3 col = mix(uOuterColor, uArmColor, smoothstep(0.85, 0.22, r));
        col = mix(col, uCoreColor, clamp(bulge * 1.6, 0.0, 1.0));
        float lum = clamp((bulge + armGlow * 0.28 + discHaze) * rimFade, 0.0, 0.54);

        gl_FragColor = vec4(col * lum, lum);
      }
    `,
    side: THREE.DoubleSide,
    transparent: !forBake,
    depthWrite: false,
    blending: forBake ? THREE.NoBlending : THREE.AdditiveBlending
  });
}

function bakeGalaxyDiscTexture(renderer, cfg) {
  const rtType = renderer.capabilities?.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const rt = new THREE.WebGLRenderTarget(256, 256, {
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: rtType
  });
  const bakeScene = new THREE.Scene();
  const bakeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  bakeCam.position.z = 1;
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadMat = createGalaxyNebulaMaterial(cfg, true);
  bakeScene.add(new THREE.Mesh(quadGeo, quadMat));

  const prevTarget = renderer.getRenderTarget();
  const prevClearColor = new THREE.Color();
  renderer.getClearColor(prevClearColor);
  const prevClearAlpha = renderer.getClearAlpha();
  const prevAutoClear = renderer.autoClear;

  renderer.autoClear = true;
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear(true, false, false);
  renderer.render(bakeScene, bakeCam);

  renderer.setClearColor(prevClearColor, prevClearAlpha);
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = prevAutoClear;

  quadGeo.dispose();
  quadMat.dispose();
  return rt.texture;
}

function buildDistantGalaxies(skyRoot, galaxyStarMat, renderer) {
  const spinners = [];

  for (const cfg of DISTANT_GALAXIES) {
    const holder = new THREE.Group();
    holder.position.set(...cfg.pos);
    holder.rotation.set(...cfg.rot);
    skyRoot.add(holder);

    const spinner = new THREE.Group();
    holder.add(spinner);
    spinners.push({ group: spinner, spin: cfg.spin });

    const planeSize = cfg.radius * 2.2;
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize, 1, 1).rotateX(-Math.PI / 2);
    let nebulaMat;
    if (renderer) {
      try {
        const bakedTex = bakeGalaxyDiscTexture(renderer, cfg);
        nebulaMat = new THREE.MeshBasicMaterial({
          map: bakedTex,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
      } catch {
        nebulaMat = createGalaxyNebulaMaterial(cfg, false);
      }
    } else {
      nebulaMat = createGalaxyNebulaMaterial(cfg, false);
    }
    const discMesh = new THREE.Mesh(planeGeo, nebulaMat);
    discMesh.renderOrder = -12;
    spinner.add(discMesh);

    const rand = mulberry32(cfg.seed);
    const starCount = 950;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);
    const coreCol = new THREE.Color(cfg.core);
    const armCol = new THREE.Color(cfg.arm);
    const outerCol = new THREE.Color(cfg.outer);
    const tmpCol = new THREE.Color();

    for (let i = 0; i < starCount; i += 1) {
      const isBulge = i < 200;
      const normR = isBulge ? Math.pow(rand(), 1.9) * 0.22 : 0.08 + Math.pow(rand(), 0.92) * 0.88;
      const r = normR * cfg.radius;
      const armIndex = i % cfg.arms;
      const baseTheta = isBulge
        ? rand() * Math.PI * 2
        : (armIndex / cfg.arms) * Math.PI * 2 - Math.log(Math.max(normR, 0.045)) * 3.1 + (rand() + rand() - 1) * (0.28 + normR * 0.42);
      const thickness = (isBulge ? 0.08 : 0.03) * cfg.radius * (rand() + rand() - 1);

      positions[i * 3] = Math.cos(baseTheta) * r;
      positions[i * 3 + 1] = thickness;
      positions[i * 3 + 2] = Math.sin(baseTheta) * r;

      if (isBulge) tmpCol.copy(coreCol);
      else tmpCol.copy(armCol).lerp(outerCol, Math.min(1, normR));
      const bri = (isBulge ? 0.58 : 0.38) + rand() * 0.45;
      colors[i * 3] = tmpCol.r * bri;
      colors[i * 3 + 1] = tmpCol.g * bri;
      colors[i * 3 + 2] = tmpCol.b * bri;
      sizes[i] = (isBulge ? 1.6 : 1.15) + (rand() ** 2.2) * 1.9;
      phases[i] = rand() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.computeBoundingSphere();

    const pts = new THREE.Points(geo, galaxyStarMat);
    pts.renderOrder = -11;
    spinner.add(pts);
  }

  return spinners;
}

export function buildAbyss(bg, helpers = {}) {
  const skyRoot = new THREE.Group();
  bg.add(skyRoot);

  const timeUniform = { value: 0 };
  const pixelRatio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.6);

  const domePointMat = createCircularPointMaterial(timeUniform, pixelRatio, 1.1, 4.4, 0.94);
  const galaxyPointMat = createCircularPointMaterial(timeUniform, pixelRatio, 1.0, 3.6, 0.88);
  const renderer = helpers.renderer || null;

  buildSkyDome(skyRoot, renderer);
  const dome = buildStarDome(skyRoot, domePointMat);
  const galaxies = buildDistantGalaxies(skyRoot, galaxyPointMat, renderer);
  const { colossusAnchor, giant } = buildOriginalColossus(skyRoot, helpers);

  return {
    update(dt, time, camera, paused) {
      timeUniform.value = time;
      if (camera) {
        skyRoot.position.copy(camera.position);
        const camDist = camera.position.length();
        const extra = Math.max(0, camDist - 36687);
        const virtualDist = 390000 + extra * 0.45 + Math.pow(extra / 150000, 2.55) * 220000;
        colossusAnchor.scale.setScalar(390000 / virtualDist);
      }
      giant.material.uniforms.time.value = time;
      if (!paused) {
        dome.rotation.y += dt * 0.0008;
        giant.rotation.y += dt * 0.004;
        for (const item of galaxies) {
          item.group.rotation.y += dt * item.spin;
        }
      }
    }
  };
}

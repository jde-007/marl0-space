// marl0 ocean — mar (ocean) + l (level) + 0 (base layer)
// Wave simulation using text from the site directory.
// Characters are the water. The directory is the ocean.

(function () {
  function start() {
    // Create canvas and inject at the start of body, behind everything
    const canvas = document.createElement('canvas');
    canvas.id = 'ocean-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    run(canvas, ctx);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  function run(canvas, ctx) {

  // The directory — words from the site's content
  const DIRECTORY = [
    'RollDeep', 'vacation rentals', 'local experiences', 'intelligence pipeline',
    'Story Stuff', 'non-linear storytelling', 'oral tradition', 'beat definitions',
    'Audiaic', 'meaning-sound bridge', 'language becomes music', 'nouns fall verbs rise',
    'One Shape of Infinity', 'Mandelbrot', 'fractal explorer', 'infinite zoom',
    'Energy Tracker', 'renewable intelligence', 'solar', 'policy', 'briefings',
    'capabilities', 'systems at scale', 'AI-augmented', 'production LLMs',
    'prompt engineering', 'own your compute', 'dual 5090s', 'Ollama', 'local inference',
    'New York Times', 'Coral Project', 'Talk', 'hundreds of news orgs',
    'competitive intelligence', 'Publisher Awards', 'founding engineer',
    'Next.js', 'PostgreSQL', 'WebGPU', 'Three.js', 'Tone.js', 'compromise NLP',
    'Cloudflare Tunnel', 'Mac Mini', 'zero-trust', 'Astro',
    'ship first polish later', 'taste judgment architecture', 'the bottleneck shifted',
    'marl0.space', 'mar', 'level', 'zero', 'base layer', 'ocean',
    'building in public', 'workshop doors open', 'questionable ambition',
    'solo full-stack', '$2.5M transactions', 'two months not twelve',
    'Gerstner waves', 'WGSL shaders', 'classification', '93% accuracy',
    'blog', 'lab', 'projects', 'learnings', 'experiences',
  ];

  // Build a continuous text stream from the directory
  function buildTextStream() {
    let stream = '';
    // Shuffle and repeat to fill
    const shuffled = [...DIRECTORY].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 20; i++) {
      stream += shuffled[i % shuffled.length] + '   ';
    }
    return stream;
  }

  // Grid of characters
  let cols, rows, cells;
  const CHAR_W = 10;
  const CHAR_H = 18;
  let textStreams = [];
  let time = 0;
  let dpr = Math.min(window.devicePixelRatio, 2);

  function resize() {
    dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    cols = Math.ceil(canvas.width / (CHAR_W * dpr)) + 2;
    rows = Math.ceil(canvas.height / (CHAR_H * dpr)) + 2;

    // Build text streams for each row
    textStreams = [];
    for (let r = 0; r < rows; r++) {
      textStreams.push(buildTextStream());
    }
  }

  resize();
  window.addEventListener('resize', resize);

  // Wave functions — same math as the 3D version but applied to text properties
  function waveAt(x, y, t) {
    // Elevation
    const e =
      Math.sin(x * 0.04 + t * 0.4) * Math.cos(y * 0.03 + t * 0.3) * 0.35 +
      Math.sin(x * 0.1 + y * 0.08 + t * 0.7) * 0.15 +
      Math.sin(x * 0.06 - y * 0.12 + t * 0.5) * 0.12 +
      Math.sin(x * 0.25 + t * 1.2) * Math.cos(y * 0.22 + t * 0.9) * 0.04 +
      Math.sin(x * 0.5 + y * 0.45 + t * 2.0) * 0.015;

    // Normal approximation for lighting
    const eps = 0.5;
    const ex =
      Math.sin((x + eps) * 0.04 + t * 0.4) * Math.cos(y * 0.03 + t * 0.3) * 0.35 +
      Math.sin((x + eps) * 0.1 + y * 0.08 + t * 0.7) * 0.15 +
      Math.sin((x + eps) * 0.06 - y * 0.12 + t * 0.5) * 0.12;
    const ez =
      Math.sin(x * 0.04 + t * 0.4) * Math.cos((y + eps) * 0.03 + t * 0.3) * 0.35 +
      Math.sin(x * 0.1 + (y + eps) * 0.08 + t * 0.7) * 0.15 +
      Math.sin(x * 0.06 - (y + eps) * 0.12 + t * 0.5) * 0.12;

    const nx = -(ex - e) / eps;
    const nz = -(ez - e) / eps;
    const ny = 1.0;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

    return {
      elevation: e,
      normal: { x: nx / len, y: ny / len, z: nz / len },
    };
  }

  function animate() {
    requestAnimationFrame(animate);
    time += 0.008;

    // Dark background
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fontSize = Math.round(11 * dpr);
    ctx.font = `${fontSize}px "SF Mono", "Fira Code", "Fira Mono", "Consolas", monospace`;
    ctx.textBaseline = 'top';

    const charW = CHAR_W * dpr;
    const charH = CHAR_H * dpr;

    // Light direction (from above-right)
    const lx = 0.2, ly = 1.0, lz = -0.3;
    const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const lightDir = { x: lx / ll, y: ly / ll, z: lz / ll };

    // View direction (from camera position)
    const camY = 3.5;

    for (let r = 0; r < rows; r++) {
      const stream = textStreams[r];
      const streamLen = stream.length;

      // Scroll offset per row — slight variation for organic feel
      const scrollOffset = time * (12 + r * 0.3 + Math.sin(r * 0.7) * 3);

      for (let c = 0; c < cols; c++) {
        const worldX = c * 3 + scrollOffset;
        const worldY = r * 3;

        const wave = waveAt(worldX, worldY, time);

        // Character index from scrolling stream
        const charIdx = Math.floor(scrollOffset / 1.2 + c) % streamLen;
        const char = stream[Math.abs(charIdx) % streamLen];

        // Y displacement from wave
        const yDisp = wave.elevation * charH * 0.6;

        // Lighting: diffuse + specular
        const n = wave.normal;
        const diff = Math.max(n.x * lightDir.x + n.y * lightDir.y + n.z * lightDir.z, 0);

        // Fresnel approximation — more brightness at glancing angles
        // View vector roughly (0, 1, -0.5) normalized from the 45° camera
        const vx = 0, vy = 0.89, vz = -0.45;
        const viewDotN = Math.max(n.x * vx + n.y * vy + n.z * vz, 0);
        const fresnel = Math.pow(1.0 - viewDotN, 3.0);

        // Half vector for specular
        const hx = lightDir.x + vx, hy = lightDir.y + vy, hz = lightDir.z + vz;
        const hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
        const spec = Math.pow(Math.max((n.x * hx / hl + n.y * hy / hl + n.z * hz / hl), 0), 64) * 0.5;

        // Distance fade (rows further away are dimmer) — perspective
        const distFade = 1.0 - (r / rows) * 0.4;

        // Base brightness
        const brightness = (0.06 + diff * 0.12 + fresnel * 0.08 + spec * fresnel) * distFade;

        // Color: deep blue-purple, brighter on wave peaks and specular
        const peakBoost = Math.max(wave.elevation, 0) * 0.3;
        const rr = Math.round((20 + peakBoost * 40 + spec * fresnel * 120 + fresnel * 25) * distFade);
        const gg = Math.round((20 + peakBoost * 30 + spec * fresnel * 140 + fresnel * 30) * distFade);
        const bb = Math.round((50 + peakBoost * 60 + fresnel * 60 + spec * fresnel * 180) * distFade);

        // Opacity: base visibility + wave and lighting boost
        const alpha = Math.max(0.08, Math.min(0.85, 0.12 + brightness * 1.5 + peakBoost * 0.5));

        ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${alpha})`;

        const px = c * charW;
        const py = r * charH + yDisp;

        ctx.fillText(char, px, py);
      }
    }
  }

  animate();
  } // end run()
})();

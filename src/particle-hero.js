const initParticleHero = () => {
  const portrait = document.querySelector('.hero-portrait');
  const hero = document.querySelector('.hero');
  const title = document.querySelector('.hero-title');
  const eyebrow = document.querySelector('.eyebrow');
  if (!portrait || !hero || portrait.dataset.particleReady === 'true') return false;

  portrait.dataset.particleReady = 'true';
  portrait.classList.add('particle-portrait-shell');
  portrait.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.className = 'particle-portrait-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Digital particle portrait of Jafar Khandu');
  portrait.appendChild(canvas);

  const word = document.createElement('div');
  word.className = 'hero-portfolio-word';
  word.textContent = 'PORTFOLIO';
  word.setAttribute('aria-hidden', 'true');
  portrait.appendChild(word);

  const role = document.createElement('div');
  role.className = 'hero-particle-role';
  role.textContent = 'FULL-STACK SOFTWARE DEVELOPER';
  portrait.appendChild(role);

  if (title) title.classList.add('hero-title-secondary');
  if (eyebrow) eyebrow.classList.add('hero-eyebrow-secondary');

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return false;

  const image = new Image();
  image.src = '/profile.jpg';

  const state = {
    particles: [],
    width: 0,
    height: 0,
    dpr: 1,
    progress: 0,
    intro: 0,
    heroTop: 0,
    heroHeight: 1,
    raf: 0,
    scrollRaf: 0,
    lastWidth: 0,
    startedAt: performance.now()
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateHeroMetrics = () => {
    state.heroTop = hero.getBoundingClientRect().top + window.scrollY;
    state.heroHeight = Math.max(hero.offsetHeight, 1);
  };

  const buildParticles = () => {
    if (!image.naturalWidth) return;

    const mobile = state.width < 700;
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const sampleStep = mobile ? 7 : 5;
    const maxParticles = mobile ? 850 : 1550;
    const ratio = sourceWidth / sourceHeight;
    const targetWidth = Math.min(state.width * (mobile ? 0.76 : 0.64), mobile ? 340 : 690);
    const drawWidth = Math.min(targetWidth, state.height * (mobile ? 0.62 : 0.72) * ratio);
    const drawHeight = drawWidth / ratio;
    const offsetX = (state.width - drawWidth) / 2;
    const offsetY = Math.max(12, (state.height - drawHeight) / 2 - (mobile ? 4 : 12));

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sourceWidth;
    sampleCanvas.height = sourceHeight;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return;
    sampleCtx.drawImage(image, 0, 0);

    const pixels = sampleCtx.getImageData(0, 0, sourceWidth, sourceHeight).data;
    const candidates = [];

    for (let y = 0; y < sourceHeight; y += sampleStep) {
      for (let x = 0; x < sourceWidth; x += sampleStep) {
        const index = (y * sourceWidth + x) * 4;
        const alpha = pixels[index + 3];
        if (alpha < 60) continue;

        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        const contrast = Math.abs(luminance - 0.5);
        if (luminance < 0.035 && contrast < 0.43) continue;

        candidates.push({
          targetX: offsetX + (x / sourceWidth) * drawWidth,
          targetY: offsetY + (y / sourceHeight) * drawHeight,
          brightness: Math.max(0.34, luminance),
          size: 0.6 + contrast * 1.55
        });
      }
    }

    const stride = Math.max(1, Math.ceil(candidates.length / maxParticles));
    state.particles = candidates.filter((_, index) => index % stride === 0).map((point, index) => ({
      ...point,
      seed: ((Math.sin(index * 12.9898) * 43758.5453) % 1 + 1) % 1,
      startX: state.width * (0.12 + ((index * 0.61803398875) % 0.76)),
      startY: state.height * (0.08 + ((index * 0.38196601125) % 0.84)),
      driftX: ((index * 17) % 100) / 100 - 0.5,
      driftY: ((index * 29) % 100) / 100 - 0.5
    }));
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(1, Math.round(rect.width));
    state.height = Math.max(1, Math.round(rect.height));
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    if (state.width !== state.lastWidth) buildParticles();
    state.lastWidth = state.width;
    updateHeroMetrics();
  };

  const render = (now) => {
    state.intro = reducedMotion ? 1 : clamp((now - state.startedAt) / 1500, 0, 1);
    const introEase = 1 - Math.pow(1 - state.intro, 3);
    const disperse = clamp((state.progress - 0.08) / 0.78, 0, 1);
    const disperseEase = disperse * disperse * (3 - 2 * disperse);

    ctx.clearRect(0, 0, state.width, state.height);
    ctx.globalCompositeOperation = 'lighter';

    for (const particle of state.particles) {
      const assembledX = particle.startX + (particle.targetX - particle.startX) * introEase;
      const assembledY = particle.startY + (particle.targetY - particle.startY) * introEase;
      const outwardX = (particle.targetX - state.width / 2) * disperseEase * 0.92;
      const outwardY = (particle.targetY - state.height / 2) * disperseEase * 0.7;
      const drift = Math.sin(now * 0.0013 + particle.seed * 24) * (0.45 + disperseEase * 1.4);
      const x = assembledX + outwardX + particle.driftX * disperseEase * 34 + drift;
      const y = assembledY + outwardY + particle.driftY * disperseEase * 28;
      const scale = 1 + disperseEase * (0.35 + Math.abs(particle.driftX));
      const alpha = (0.28 + particle.brightness * 0.72) * (1 - disperseEase * 0.42);

      ctx.fillStyle = `rgba(242, 239, 250, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, particle.size * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    state.raf = window.requestAnimationFrame(render);
  };

  const renderScroll = () => {
    state.scrollRaf = 0;
    state.progress = clamp((window.scrollY - state.heroTop) / Math.max(state.heroHeight * 0.82, 1), 0, 1.15);
    portrait.style.setProperty('--particle-progress', state.progress.toFixed(4));
  };

  const onScroll = () => {
    if (!state.scrollRaf) state.scrollRaf = window.requestAnimationFrame(renderScroll);
  };

  image.onload = () => {
    resize();
    state.startedAt = performance.now();
    state.raf = window.requestAnimationFrame(render);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  updateHeroMetrics();
  renderScroll();

  portrait._particleCleanup = () => {
    window.cancelAnimationFrame(state.raf);
    window.cancelAnimationFrame(state.scrollRaf);
    resizeObserver.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', onScroll);
  };

  return true;
};

if (!initParticleHero()) {
  const observer = new MutationObserver(() => {
    if (initParticleHero()) observer.disconnect();
  });
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
}

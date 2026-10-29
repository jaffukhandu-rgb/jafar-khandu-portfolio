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

  const image = new Image();
  image.className = 'particle-portrait-fallback';
  image.alt = '';
  image.decoding = 'async';
  image.src = '/profile.jpg';
  portrait.appendChild(image);

  const word = document.createElement('div');
  word.className = 'hero-portfolio-word';
  word.textContent = 'PORTFOLIO';
  word.setAttribute('aria-hidden', 'true');
  portrait.appendChild(word);

  const role = document.createElement('div');
  role.className = 'hero-particle-role';
  role.textContent = 'FULL-STACK DEVELOPER';
  portrait.appendChild(role);

  if (title) title.classList.add('hero-title-secondary');
  if (eyebrow) eyebrow.classList.add('hero-eyebrow-secondary');

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return false;

  const state = {
    particles: [], width: 0, height: 0, dpr: 1,
    progress: 0, intro: 0, raf: 0, scrollRaf: 0,
    lastWidth: 0, startedAt: performance.now(),
    heroTop: 0, heroHeight: 1
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateHeroMetrics = () => {
    state.heroTop = hero.getBoundingClientRect().top + window.scrollY;
    state.heroHeight = Math.max(hero.offsetHeight, 1);
  };

  const buildParticles = () => {
    if (!image.naturalWidth || !state.width || !state.height) return;

    const mobile = state.width < 700;
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const sampleCanvas = document.createElement('canvas');
    const sampleWidth = mobile ? 420 : 620;
    const sampleHeight = Math.max(1, Math.round(sampleWidth * sourceHeight / sourceWidth));
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;

    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return;
    sampleCtx.drawImage(image, 0, 0, sampleWidth, sampleHeight);

    const pixels = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const candidates = [];

    const targetWidth = Math.min(state.width * (mobile ? 0.76 : 0.62), mobile ? 350 : 720);
    const targetHeight = Math.min(state.height * (mobile ? 0.78 : 0.84), mobile ? 330 : 510);
    const ratio = sampleWidth / sampleHeight;
    let drawWidth = targetWidth;
    let drawHeight = drawWidth / ratio;
    if (drawHeight > targetHeight) {
      drawHeight = targetHeight;
      drawWidth = drawHeight * ratio;
    }

    const offsetX = (state.width - drawWidth) / 2;
    const offsetY = Math.max(0, (state.height - drawHeight) / 2 - 8);
    const step = mobile ? 4 : 3;

    for (let y = 0; y < sampleHeight; y += step) {
      for (let x = 0; x < sampleWidth; x += step) {
        const p = (y * sampleWidth + x) * 4;
        const alpha = pixels[p + 3] / 255;
        if (alpha < 0.08) continue;

        const r = pixels[p];
        const g = pixels[p + 1];
        const b = pixels[p + 2];
        const luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
        const neighborX = Math.min(sampleWidth - 1, x + step);
        const neighbor = (y * sampleWidth + neighborX) * 4;
        const neighborLum = (pixels[neighbor] * 0.2126 + pixels[neighbor + 1] * 0.7152 + pixels[neighbor + 2] * 0.0722) / 255;
        const edge = Math.abs(luminance - neighborLum);

        const signal = luminance * 0.82 + edge * 1.35;
        if (signal < 0.18) continue;

        candidates.push({
          targetX: offsetX + (x / sampleWidth) * drawWidth,
          targetY: offsetY + (y / sampleHeight) * drawHeight,
          brightness: clamp(luminance + edge * 0.7, 0.2, 1),
          size: 0.65 + clamp(signal, 0, 1) * 1.7,
          seed: Math.abs(Math.sin((x + 17) * 12.9898 + (y + 31) * 78.233))
        });
      }
    }

    const maxParticles = mobile ? 1200 : 2600;
    const stride = Math.max(1, Math.ceil(candidates.length / maxParticles));
    state.particles = candidates.filter((_, i) => i % stride === 0).map((point, index) => ({
      ...point,
      startX: state.width * (0.08 + ((index * 0.754877666) % 0.84)),
      startY: state.height * (0.04 + ((index * 0.569840291) % 0.92)),
      driftX: Math.sin(index * 3.17) * 0.5,
      driftY: Math.cos(index * 2.41) * 0.5
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
    state.intro = reducedMotion ? 1 : clamp((now - state.startedAt) / 1800, 0, 1);
    const introEase = 1 - Math.pow(1 - state.intro, 3);
    const disperse = clamp((state.progress - 0.16) / 0.68, 0, 1);
    const disperseEase = disperse * disperse * (3 - 2 * disperse);

    ctx.clearRect(0, 0, state.width, state.height);
    ctx.globalCompositeOperation = 'screen';

    for (const particle of state.particles) {
      const assembledX = particle.startX + (particle.targetX - particle.startX) * introEase;
      const assembledY = particle.startY + (particle.targetY - particle.startY) * introEase;
      const outwardX = (particle.targetX - state.width / 2) * disperseEase * 1.15;
      const outwardY = (particle.targetY - state.height / 2) * disperseEase * 0.88;
      const drift = Math.sin(now * 0.0011 + particle.seed * 30) * (0.35 + disperseEase * 1.8);
      const x = assembledX + outwardX + particle.driftX * disperseEase * 46 + drift;
      const y = assembledY + outwardY + particle.driftY * disperseEase * 38;
      const size = particle.size * (1 + disperseEase * 0.55);
      const alpha = (0.38 + particle.brightness * 0.62) * (1 - disperseEase * 0.38);

      ctx.fillStyle = `rgba(242, 239, 250, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    state.raf = window.requestAnimationFrame(render);
  };

  const renderScroll = () => {
    state.scrollRaf = 0;
    state.progress = clamp((window.scrollY - state.heroTop) / Math.max(state.heroHeight * 0.72, 1), 0, 1.15);
    portrait.style.setProperty('--particle-progress', state.progress.toFixed(4));
    portrait.style.setProperty('--particle-y', `${(-42 * state.progress).toFixed(2)}px`);
  };

  const onScroll = () => {
    if (!state.scrollRaf) state.scrollRaf = window.requestAnimationFrame(renderScroll);
  };

  const start = () => {
    resize();
    state.startedAt = performance.now();
    state.raf = window.requestAnimationFrame(render);
    renderScroll();
  };

  if (image.complete && image.naturalWidth) start();
  else image.onload = start;

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  updateHeroMetrics();

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

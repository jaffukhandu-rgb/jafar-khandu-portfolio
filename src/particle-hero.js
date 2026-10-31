(() => {
  const boot = () => {
    const portrait = document.querySelector('.hero-portrait');
    const hero = document.querySelector('.hero');
    if (!portrait || !hero || portrait.dataset.dotPortraitReady === 'true') return false;

    portrait.dataset.dotPortraitReady = 'true';
    portrait.classList.add('dot-portrait-shell');
    portrait.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.className = 'dot-portrait-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Jafar Khandu portrait rendered as digital particles');
    portrait.appendChild(canvas);

    const word = document.createElement('div');
    word.className = 'dot-portrait-word';
    word.textContent = 'PORTFOLIO';
    word.setAttribute('aria-hidden', 'true');
    portrait.appendChild(word);

    const role = document.createElement('div');
    role.className = 'dot-portrait-role';
    role.textContent = 'FULL-STACK DEVELOPER';
    portrait.appendChild(role);

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return false;

    const image = new Image();
    image.decoding = 'async';
    image.src = '/profile.jpg';

    const state = {
      particles: [], width: 1, height: 1, dpr: 1,
      progress: 0, intro: 0, raf: 0, scrollRaf: 0,
      startedAt: performance.now(), lastWidth: 0,
      heroTop: 0, heroHeight: 1
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    const hash = (n) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };

    const updateMetrics = () => {
      const rect = hero.getBoundingClientRect();
      state.heroTop = rect.top + window.scrollY;
      state.heroHeight = Math.max(hero.offsetHeight, 1);
    };

    const buildParticles = () => {
      if (!image.naturalWidth) return;

      const mobile = state.width < 700;
      const sourceW = image.naturalWidth;
      const sourceH = image.naturalHeight;
      const sample = document.createElement('canvas');
      const sampleW = mobile ? 420 : 720;
      const sampleH = Math.max(1, Math.round(sampleW * sourceH / sourceW));
      sample.width = sampleW;
      sample.height = sampleH;

      const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
      if (!sampleCtx) return;
      sampleCtx.drawImage(image, 0, 0, sampleW, sampleH);
      const pixels = sampleCtx.getImageData(0, 0, sampleW, sampleH).data;

      const targetW = Math.min(state.width * (mobile ? 0.58 : 0.47), mobile ? 300 : 560);
      const targetH = Math.min(state.height * (mobile ? 0.78 : 0.88), mobile ? 360 : 560);
      const ratio = sampleW / sampleH;
      let drawW = targetW;
      let drawH = drawW / ratio;
      if (drawH > targetH) {
        drawH = targetH;
        drawW = drawH * ratio;
      }

      const ox = (state.width - drawW) / 2;
      const oy = Math.max(0, (state.height - drawH) / 2 - state.height * 0.025);
      const candidates = [];
      const step = mobile ? 4 : 3;

      for (let y = 0; y < sampleH; y += step) {
        for (let x = 0; x < sampleW; x += step) {
          const i = (y * sampleW + x) * 4;
          const alpha = pixels[i + 3] / 255;
          if (alpha < 0.2) continue;

          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const subject = 1 - lum;
          const localDetail = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
          const score = subject * 0.72 + clamp(localDetail / 255, 0, 1) * 0.28;
          if (score < 0.14) continue;

          candidates.push({
            x: ox + (x / sampleW) * drawW,
            y: oy + (y / sampleH) * drawH,
            score
          });
        }
      }

      if (!candidates.length) return;
      const maxParticles = mobile ? 1200 : 2400;
      const stride = Math.max(1, Math.ceil(candidates.length / maxParticles));
      state.particles = [];

      for (let i = 0; i < candidates.length; i += stride) {
        const p = candidates[i];
        const angle = hash(i + 7) * Math.PI * 2;
        const radius = 0.35 + hash(i + 19) * 0.65;
        state.particles.push({
          tx: p.x, ty: p.y,
          sx: state.width * (0.16 + hash(i + 31) * 0.68),
          sy: state.height * (0.08 + hash(i + 47) * 0.84),
          score: p.score,
          size: 0.55 + p.score * 1.35,
          seed: hash(i + 71),
          burstX: Math.cos(angle) * radius,
          burstY: Math.sin(angle) * radius
        });
      }
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
      updateMetrics();
    };

    const render = (now) => {
      state.intro = reducedMotion ? 1 : clamp((now - state.startedAt) / 1800, 0, 1);
      const introEase = 1 - Math.pow(1 - state.intro, 4);
      const dispersion = clamp((state.progress - 0.06) / 0.78, 0, 1);
      const dispersionEase = dispersion * dispersion * (3 - 2 * dispersion);

      ctx.clearRect(0, 0, state.width, state.height);
      ctx.globalCompositeOperation = 'source-over';

      for (const p of state.particles) {
        const x0 = p.sx + (p.tx - p.sx) * introEase;
        const y0 = p.sy + (p.ty - p.sy) * introEase;
        const distance = 120 + dispersionEase * 380;
        const pulse = Math.sin(now * 0.0017 + p.seed * 20) * (0.25 + dispersionEase * 0.8);
        const x = x0 + p.burstX * distance + pulse;
        const y = y0 + p.burstY * distance * 0.78;
        const alpha = (0.38 + p.score * 0.72) * (1 - dispersionEase * 0.58);
        const radius = p.size * (1 + dispersionEase * (0.5 + p.seed * 0.65));

        ctx.fillStyle = `rgba(245, 242, 250, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      state.raf = requestAnimationFrame(render);
    };

    const updateScroll = () => {
      state.scrollRaf = 0;
      state.progress = clamp(
        (window.scrollY - state.heroTop) / Math.max(state.heroHeight * 0.78, 1),
        0,
        1
      );
      portrait.style.setProperty('--dot-progress', state.progress.toFixed(4));
    };

    const onScroll = () => {
      if (!state.scrollRaf) state.scrollRaf = requestAnimationFrame(updateScroll);
    };

    image.onload = () => {
      resize();
      state.startedAt = performance.now();
      state.raf = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    updateMetrics();
    updateScroll();

    portrait._particleCleanup = () => {
      cancelAnimationFrame(state.raf);
      cancelAnimationFrame(state.scrollRaf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };

    return true;
  };

  if (boot()) return;

  const observer = new MutationObserver(() => {
    if (boot()) observer.disconnect();
  });
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
})();

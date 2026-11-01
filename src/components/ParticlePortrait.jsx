import { useEffect, useRef } from 'react';

const BASE_URL = import.meta.env.BASE_URL;
const IMAGE_SRC = `${BASE_URL}profile-cutout.png`;
const FALLBACK_SRC = `${BASE_URL}profile.jpg`;
const DESKTOP_GAP = 4;
const MOBILE_GAP = 6;
const MAX_DESKTOP_PARTICLES = 14000;
const MAX_MOBILE_PARTICLES = 5500;
const HEADING_SETTLE = 1.8;
const PORTRAIT_DURATION = 2.5;
const FINAL_TIME = HEADING_SETTLE + PORTRAIT_DURATION;
const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
const easeOutBack = (value) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
};
const getRandomChar = () => RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];

export default function ParticlePortrait() {
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const headingRef = useRef(null);
  const fallbackRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    const heading = headingRef.current;
    const fallback = fallbackRef.current;
    if (!hero || !canvas || !heading) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileQuery = window.matchMedia('(max-width: 699px)');
    const letters = Array.from(heading.querySelectorAll('.portfolio-letter'));

    let width = 1;
    let height = 1;
    let dpr = 1;
    let image = null;
    let particles = [];
    let targets = [];
    let frameId = 0;
    let resizeTimer = 0;
    let startedAt = performance.now();
    let lastScramble = 0;
    let skipped = reduceMotion;
    let imageFailed = false;
    let pointer = { x: -1000, y: -1000, active: false };

    const setLettersRevealed = () => {
      letters.forEach((letter) => letter.classList.add('is-revealed'));
    };

    const markFinal = () => {
      skipped = true;
      hero.dataset.stage = 'final';
      document.documentElement.classList.add('portfolio-intro-complete');
    };

    const lockLetters = (elapsed) => {
      const lockStart = 1.08;
      if (elapsed < lockStart) return;
      setLettersRevealed();

      if (elapsed - lastScramble < 0.045) return;
      lastScramble = elapsed;

      letters.forEach((letter, index) => {
        const lockAt = lockStart + index * 0.07;
        if (elapsed >= lockAt) {
          letter.textContent = letter.dataset.letter;
          letter.classList.add('is-locked');
        } else {
          letter.textContent = getRandomChar();
        }
      });
    };

    const createTargets = () => {
      if (!image || imageFailed) return [];

      const gap = mobileQuery.matches ? MOBILE_GAP : DESKTOP_GAP;
      const maxParticles = mobileQuery.matches ? MAX_MOBILE_PARTICLES : MAX_DESKTOP_PARTICLES;
      const availableHeight = Math.max(180, height * 0.8);
      const availableWidth = Math.min(width * 0.86, availableHeight * 0.93);
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (!sourceWidth || !sourceHeight) return [];

      const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
      const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
      const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = drawWidth;
      sampleCanvas.height = drawHeight;
      const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
      if (!sampleContext) return [];

      sampleContext.clearRect(0, 0, drawWidth, drawHeight);
      sampleContext.drawImage(image, 0, 0, drawWidth, drawHeight);
      const pixels = sampleContext.getImageData(0, 0, drawWidth, drawHeight).data;
      const offsetX = (width - drawWidth) / 2;
      const offsetY = height - drawHeight;
      const sampled = [];

      for (let y = 0; y < drawHeight; y += gap) {
        for (let x = 0; x < drawWidth; x += gap) {
          const index = (y * drawWidth + x) * 4;
          if (pixels[index + 3] < 128) continue;

          const r = pixels[index] / 255;
          const g = pixels[index + 1] / 255;
          const b = pixels[index + 2] / 255;
          const rawLum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const lum = clamp(Math.pow((rawLum - 0.04) * 1.35, 0.6), 0, 1);
          if (lum < 0.07) continue;

          sampled.push({
            x: offsetX + x,
            y: offsetY + y,
            radius: gap * 0.5 * lum,
            alpha: 0.35 + lum * 0.65,
            delay: Math.random()
          });
        }
      }

      if (sampled.length <= maxParticles) return sampled;
      const stride = sampled.length / maxParticles;
      return Array.from({ length: maxParticles }, (_, index) => sampled[Math.floor(index * stride)]);
    };

    const createParticles = () => {
      particles = targets.map((target) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        targetX: target.x,
        targetY: target.y,
        radius: target.radius,
        alpha: target.alpha,
        delay: target.delay
      }));

      if (skipped) {
        particles.forEach((particle) => {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
        });
      }
    };

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      targets = createTargets();
      createParticles();
    };

    const settleInstantly = () => {
      markFinal();
      setLettersRevealed();
      letters.forEach((letter) => {
        letter.textContent = letter.dataset.letter;
        letter.classList.add('is-locked');
      });
      particles.forEach((particle) => {
        particle.x = particle.targetX;
        particle.y = particle.targetY;
      });
      if (fallback) fallback.classList.toggle('is-visible', imageFailed);
    };

    const animate = (now) => {
      const elapsed = skipped ? FINAL_TIME : (now - startedAt) / 1000;
      const portraitProgress = clamp((elapsed - HEADING_SETTLE) / PORTRAIT_DURATION, 0, 1);
      const portraitEase = easeOutCubic(portraitProgress);

      if (!skipped) {
        lockLetters(elapsed);
        if (elapsed < 1.08) hero.dataset.stage = 'drop';
        else if (elapsed < HEADING_SETTLE) hero.dataset.stage = 'scramble';
        else if (elapsed < 4.5) hero.dataset.stage = 'portrait';
        else markFinal();
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';

      particles.forEach((particle) => {
        const delayed = clamp((portraitProgress - particle.delay * 0.22) / 0.78, 0, 1);
        const eased = skipped ? 1 : easeOutBack(delayed);
        let targetX = particle.targetX;
        let targetY = particle.targetY;
        let nextX = particle.x + (targetX - particle.x) * eased;
        let nextY = particle.y + (targetY - particle.y) * eased;

        if (skipped || portraitProgress >= 1) {
          nextX += Math.sin(now * 0.002 + particle.delay * 9) * 0.7;
          nextY += Math.cos(now * 0.0018 + particle.delay * 7) * 0.7;
        }

        if (!mobileQuery.matches && pointer.active && (skipped || portraitProgress >= 1)) {
          const dx = nextX - pointer.x;
          const dy = nextY - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 80 && distance > 0.01) {
            const force = (1 - distance / 80) * 18;
            targetX = nextX + (dx / distance) * force;
            targetY = nextY + (dy / distance) * force;
          }
        }

        particle.vx += (targetX - particle.x) * 0.08;
        particle.vy += (targetY - particle.y) * 0.08;
        particle.vx *= 0.78;
        particle.vy *= 0.78;
        particle.x += particle.vx;
        particle.y += particle.vy;

        context.globalAlpha = particle.alpha * (0.08 + portraitEase * 0.92);
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      context.globalAlpha = 1;
      if (fallback) fallback.classList.toggle('is-visible', imageFailed);
      frameId = window.requestAnimationFrame(animate);
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
    };
    const onPointerLeave = () => { pointer.active = false; };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };
    const onSkip = () => { if (!skipped) settleInstantly(); };

    document.documentElement.classList.remove('portfolio-intro-complete');
    image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      imageFailed = false;
      resize();
      if (reduceMotion) settleInstantly();
    };
    image.onerror = () => {
      imageFailed = true;
      resize();
      settleInstantly();
    };
    image.src = IMAGE_SRC;

    resize();
    hero.dataset.stage = reduceMotion ? 'final' : 'drop';
    letters.forEach((letter) => { letter.textContent = getRandomChar(); });

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('keydown', onSkip, { passive: true });
    window.addEventListener('scroll', onSkip, { passive: true });
    window.addEventListener('click', onSkip, { passive: true });

    startedAt = performance.now();
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.clearTimeout(resizeTimer);
      if (frameId) window.cancelAnimationFrame(frameId);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onSkip);
      window.removeEventListener('scroll', onSkip);
      window.removeEventListener('click', onSkip);
      document.documentElement.classList.remove('portfolio-intro-complete');
    };
  }, []);

  return (
    <div ref={heroRef} className="portfolio-hero-visual" data-stage="drop">
      <div className="portfolio-particle-glow" aria-hidden="true" />
      <div className="portfolio-intro-dot" aria-hidden="true" />
      <canvas ref={canvasRef} className="portfolio-particle-canvas" aria-hidden="true" />

      <h1 ref={headingRef} className="portfolio-heading" aria-label="Portfolio">
        {'PORTFOLIO'.split('').map((letter, index) => (
          <span
            className="portfolio-letter"
            data-letter={letter}
            style={{ '--letter-index': index, '--start-rotate': `${(Math.random() * 18 - 9).toFixed(2)}deg` }}
            key={`${letter}-${index}`}
          >
            {letter}
          </span>
        ))}
      </h1>

      <p className="portfolio-tagline">Full-Stack .NET <em>Developer</em></p>
      <div ref={fallbackRef} className="portfolio-fallback" aria-hidden="true">
        <img src={FALLBACK_SRC} alt="" loading="eager" decoding="async" />
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const IMAGE_SRC = '/profile-cutout.png';
const DESKTOP_GAP = 5;
const MOBILE_GAP = 7;
const DESKTOP_MAX_PARTICLES = 12000;
const MOBILE_MAX_PARTICLES = 5000;
const INTRO_DURATION = 2.5;
const REPEL_RADIUS = 110;
const REPEL_STRENGTH = 30;

export default function ParticlePortrait() {
  const shellRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    if (!shell || !canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 700px)');

    let frameId = 0;
    let resizeTimer = 0;
    let image = null;
    let particles = [];
    let width = 1;
    let height = 1;
    let dpr = 1;
    let startedAt = performance.now();
    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;
    let imageReady = false;

    const setIntroState = (state) => {
      const site = shell.closest('.site-shell');
      if (site) site.dataset.heroIntro = state;
    };

    const getConfig = () => ({
      mobile: mobileQuery.matches,
      gap: mobileQuery.matches ? MOBILE_GAP : DESKTOP_GAP,
      maxParticles: mobileQuery.matches ? MOBILE_MAX_PARTICLES : DESKTOP_MAX_PARTICLES
    });

    const resizeCanvas = () => {
      const rect = shell.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (imageReady) buildParticles();
    };

    const buildParticles = () => {
      if (!image) return;

      const { mobile, gap, maxParticles } = getConfig();
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (!sourceWidth || !sourceHeight) return;

      const maxPortraitWidth = Math.min(width * (mobile ? 0.92 : 0.78), mobile ? 560 : 820);
      const maxPortraitHeight = height * (mobile ? 0.56 : 0.74);
      const scale = Math.min(maxPortraitWidth / sourceWidth, maxPortraitHeight / sourceHeight);
      const portraitWidth = Math.max(1, Math.round(sourceWidth * scale));
      const portraitHeight = Math.max(1, Math.round(sourceHeight * scale));
      const portraitLeft = Math.round((width - portraitWidth) / 2);
      const portraitTop = Math.round(height - portraitHeight);

      const sampleScale = Math.min(1, 760 / sourceWidth);
      const sampleWidth = Math.max(1, Math.round(sourceWidth * sampleScale));
      const sampleHeight = Math.max(1, Math.round(sourceHeight * sampleScale));
      const offscreen = document.createElement('canvas');
      offscreen.width = sampleWidth;
      offscreen.height = sampleHeight;

      const offscreenContext = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offscreenContext) return;

      offscreenContext.clearRect(0, 0, sampleWidth, sampleHeight);
      offscreenContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const pixels = offscreenContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const sampleStep = Math.max(1, Math.round(gap / Math.max(scale, 0.01)));
      const candidates = [];

      for (let y = 0; y < sampleHeight; y += sampleStep) {
        for (let x = 0; x < sampleWidth; x += sampleStep) {
          const pixelIndex = (y * sampleWidth + x) * 4;
          const alpha = pixels[pixelIndex + 3];
          if (alpha <= 128) continue;

          const r = pixels[pixelIndex] / 255;
          const g = pixels[pixelIndex + 1] / 255;
          const b = pixels[pixelIndex + 2] / 255;
          const rawLum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const lum = clamp(Math.pow((rawLum - 0.05) * 1.4, 0.7), 0, 1);
          if (lum < 0.06) continue;

          const sourceX = x / sampleScale;
          const sourceY = y / sampleScale;
          const targetX = portraitLeft + sourceX * scale;
          const targetY = portraitTop + sourceY * scale;

          candidates.push({
            tx: targetX,
            ty: targetY,
            radius: gap * 0.55 * lum,
            alpha: 0.3 + lum * 0.7,
            seed: Math.random() * Math.PI * 2,
            delay: Math.random() * INTRO_DURATION,
            x: width / 2,
            y: height / 2
          });
        }
      }

      if (candidates.length > maxParticles) {
        const stride = candidates.length / maxParticles;
        const reduced = [];
        for (let index = 0; index < maxParticles; index += 1) {
          reduced.push(candidates[Math.floor(index * stride)]);
        }
        particles = reduced;
      } else {
        particles = candidates;
      }

      for (const particle of particles) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) * (0.18 + Math.random() * 0.65);
        particle.x = width / 2 + Math.cos(angle) * distance;
        particle.y = height / 2 + Math.sin(angle) * distance;
      }
    };

    const drawParticle = (particle, radius, alpha) => {
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      context.fill();
    };

    const drawFinal = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#ffffff';
      context.globalAlpha = 1;

      for (const particle of particles) {
        particle.x = particle.tx;
        particle.y = particle.ty;
        drawParticle(particle, particle.radius, particle.alpha);
      }

      context.globalAlpha = 1;
      setIntroState('complete');
    };

    const render = (now) => {
      if (reduceMotionQuery.matches) {
        drawFinal();
        return;
      }

      const elapsed = (now - startedAt) / 1000;
      const progress = clamp(elapsed / INTRO_DURATION, 0, 1);
      const introEase = easeOutCubic(progress);

      if (elapsed < 0.25) setIntroState('loading');
      else if (progress < 1) setIntroState('assembling');
      else setIntroState('complete');

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#ffffff';
      context.globalAlpha = 1;

      const desktop = !mobileQuery.matches;
      const mouseStrength = desktop && mouseActive ? 1 : 0;

      for (const particle of particles) {
        const localProgress = clamp((progress - particle.delay / INTRO_DURATION * 0.38) / 0.62, 0, 1);
        const localEase = easeOutCubic(localProgress);

        let targetX = particle.tx;
        let targetY = particle.ty;

        if (mouseStrength) {
          const dx = particle.x - mouseX;
          const dy = particle.y - mouseY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.001 && distance < REPEL_RADIUS) {
            const force = Math.pow(1 - distance / REPEL_RADIUS, 2) * REPEL_STRENGTH;
            targetX += (dx / distance) * force;
            targetY += (dy / distance) * force;
          }
        }

        particle.x += (targetX - particle.x) * (0.055 + localEase * 0.075);
        particle.y += (targetY - particle.y) * (0.055 + localEase * 0.075);

        const shimmer = 0.92 + Math.sin(now * 0.0015 + particle.seed) * 0.08;
        const radius = particle.radius * (0.72 + localEase * 0.28);
        const alpha = particle.alpha * shimmer * (progress <= 0 ? 0 : 0.35 + introEase * 0.65);
        drawParticle(particle, radius, alpha);
      }

      context.globalAlpha = 1;
      frameId = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event) => {
      if (mobileQuery.matches) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
      mouseActive = true;
    };

    const onPointerLeave = () => {
      mouseActive = false;
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        if (reduceMotionQuery.matches) drawFinal();
      }, 100);
    };

    const onMotionChange = () => {
      if (reduceMotionQuery.matches) {
        if (frameId) window.cancelAnimationFrame(frameId);
        resizeCanvas();
        drawFinal();
      } else {
        startedAt = performance.now();
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(render);
      }
    };

    image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      imageReady = true;
      resizeCanvas();
      if (reduceMotionQuery.matches) {
        drawFinal();
        return;
      }

      startedAt = performance.now();
      setIntroState('assembling');
      frameId = window.requestAnimationFrame(render);
    };
    image.onerror = () => {
      setIntroState('error');
    };
    image.src = IMAGE_SRC;

    resizeCanvas();
    setIntroState('loading');

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
    reduceMotionQuery.addEventListener?.('change', onMotionChange);

    return () => {
      window.clearTimeout(resizeTimer);
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      reduceMotionQuery.removeEventListener?.('change', onMotionChange);
    };
  }, []);

  return (
    <div ref={shellRef} className="particle-hero-intro">
      <canvas ref={canvasRef} className="particle-hero-canvas" aria-label="Animated halftone portrait of Jafar Khandu" />
      <div className="particle-hero-name">JAFAR KHANDU</div>
      <div className="particle-hero-tagline">Full-Stack .NET Developer</div>
      <div className="particle-hero-word" aria-hidden="true">
        {'PORTFOLIO'.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ '--char-index': index }}>{letter}</span>
        ))}
      </div>
    </div>
  );
}

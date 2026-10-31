import { useEffect, useRef } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const IMAGE_SRC = '/profile.jpg';
const PARTICLE_GAP = 2.8;
const INTRO_DURATION = 2.2;
const REPEL_RADIUS = 34;
const REPEL_STRENGTH = 12;

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
      shell.dataset.introState = state;
    };

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

      const size = Math.min(width, height);
      const sampleSize = Math.max(48, Math.min(160, Math.round(size * 1.45)));
      const offscreen = document.createElement('canvas');
      offscreen.width = sampleSize;
      offscreen.height = sampleSize;
      const offscreenContext = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offscreenContext) return;

      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (!sourceWidth || !sourceHeight) return;

      const scale = Math.max(sampleSize / sourceWidth, sampleSize / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      const drawX = (sampleSize - drawWidth) / 2;
      const drawY = (sampleSize - drawHeight) * 0.38;

      offscreenContext.clearRect(0, 0, sampleSize, sampleSize);
      offscreenContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      const pixels = offscreenContext.getImageData(0, 0, sampleSize, sampleSize).data;
      const step = Math.max(2, Math.round(PARTICLE_GAP * sampleSize / Math.max(size, 1)));
      const candidates = [];

      for (let y = 0; y < sampleSize; y += step) {
        for (let x = 0; x < sampleSize; x += step) {
          const nx = (x + 0.5) / sampleSize - 0.5;
          const ny = (y + 0.5) / sampleSize - 0.5;
          if (Math.hypot(nx, ny) > 0.5) continue;

          const pixelIndex = (y * sampleSize + x) * 4;
          const alpha = pixels[pixelIndex + 3];
          if (alpha < 80) continue;

          const r = pixels[pixelIndex] / 255;
          const g = pixels[pixelIndex + 1] / 255;
          const b = pixels[pixelIndex + 2] / 255;
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const radius = mobileQuery.matches ? 0.9 + luminance * 0.7 : 0.85 + luminance * 0.85;

          candidates.push({
            tx: (x / sampleSize) * size,
            ty: (y / sampleSize) * size,
            radius,
            alpha: 0.35 + luminance * 0.65,
            seed: Math.random() * Math.PI * 2,
            delay: Math.random() * INTRO_DURATION * 0.45,
            x: width / 2,
            y: height / 2
          });
        }
      }

      particles = candidates;
      for (const particle of particles) {
        const angle = Math.random() * Math.PI * 2;
        const distance = size * (0.35 + Math.random() * 0.65);
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

      setIntroState(progress < 1 ? 'assembling' : 'complete');
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#ffffff';

      const desktop = !mobileQuery.matches;
      for (const particle of particles) {
        const localProgress = clamp((progress - particle.delay / INTRO_DURATION) / 0.72, 0, 1);
        const localEase = easeOutCubic(localProgress);
        let targetX = particle.tx;
        let targetY = particle.ty;

        if (desktop && mouseActive) {
          const dx = particle.x - mouseX;
          const dy = particle.y - mouseY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.001 && distance < REPEL_RADIUS) {
            const force = Math.pow(1 - distance / REPEL_RADIUS, 2) * REPEL_STRENGTH;
            targetX += (dx / distance) * force;
            targetY += (dy / distance) * force;
          }
        }

        particle.x += (targetX - particle.x) * (0.07 + localEase * 0.13);
        particle.y += (targetY - particle.y) * (0.07 + localEase * 0.13);

        const shimmer = 0.9 + Math.sin(now * 0.0018 + particle.seed) * 0.1;
        const radius = particle.radius * (0.7 + localEase * 0.3);
        const alpha = particle.alpha * shimmer * (0.35 + introEase * 0.65);
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

    image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      imageReady = true;
      resizeCanvas();
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

    return () => {
      window.clearTimeout(resizeTimer);
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div className="hero-content">
      <div ref={shellRef} className="hero-portrait particle-portrait-shell" data-intro-state="loading" aria-label="Animated particle portrait of Jafar Khandu">
        <canvas ref={canvasRef} className="particle-portrait-canvas" aria-hidden="true" />
        <div className="portrait-orbit" aria-hidden="true" />
      </div>

      <p className="eyebrow"><span /> FULL-STACK SOFTWARE DEVELOPER · PUNE</p>
      <h1 className="hero-title">I build web products<br /><em>that feel considered.</em></h1>
      <p className="hero-subtitle">Reliable backend systems, responsive interfaces and real-time experiences — built<br className="desktop-break" /> from idea to production.</p>
      <div className="hero-actions">
        <a className="pill-button filled" href="#work">View work <ArrowUpRight size={17} /></a>
        <a className="text-button" href="#about">About me <ArrowUpRight size={15} /></a>
        <a className="text-button" href="/resume.html" target="_blank" rel="noreferrer">Download résumé <Download size={15} /></a>
      </div>
    </div>
  );
}

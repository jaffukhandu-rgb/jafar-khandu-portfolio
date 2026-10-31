import { useEffect, useRef } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const IMAGE_SRC = '/profile.jpg';
const INTRO_DURATION = 6.1;
const TEXT_PARTICLES = 720;
const FACE_PARTICLES = 760;

const createParticleGroup = (count, width, height) => Array.from({ length: count }, () => ({
  x: width / 2 + (Math.random() - 0.5) * width * 0.9,
  y: height / 2 + (Math.random() - 0.5) * height * 1.4,
  radius: 0.7 + Math.random() * 1.1,
  seed: Math.random() * Math.PI * 2
}));

export default function ParticlePortrait() {
  const introRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const intro = introRef.current;
    const canvas = canvasRef.current;
    if (!intro || !canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 700px)');

    let frameId = 0;
    let resizeTimer = 0;
    let image = null;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let startedAt = performance.now();
    let bangTargets = [];
    let textTargets = [];
    let faceTargets = [];
    let textParticles = [];
    let faceParticles = [];

    const createTextTargets = (text) => {
      const targetWidth = Math.min(width * 0.82, mobile.matches ? 330 : 720);
      const targetHeight = mobile.matches ? 100 : 150;
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.max(1, Math.round(targetWidth));
      offscreen.height = targetHeight;
      const offscreenContext = offscreen.getContext('2d');
      if (!offscreenContext) return [];

      offscreenContext.clearRect(0, 0, offscreen.width, offscreen.height);
      offscreenContext.fillStyle = '#fff';
      offscreenContext.textAlign = 'center';
      offscreenContext.textBaseline = 'middle';
      offscreenContext.font = `900 ${mobile.matches ? 50 : 104}px Arial, sans-serif`;
      offscreenContext.fillText(text, offscreen.width / 2, offscreen.height / 2 + 2);

      const pixels = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const step = mobile.matches ? 4 : 5;
      const targets = [];

      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = pixels[(y * offscreen.width + x) * 4 + 3];
          if (alpha < 100) continue;
          targets.push({
            x: width / 2 - offscreen.width / 2 + x,
            y: height * 0.64 - offscreen.height / 2 + y
          });
        }
      }

      return targets;
    };

    const createFaceTargets = () => {
      if (!image) return [];

      const targetSize = Math.min(width * 0.48, mobile.matches ? 165 : 250);
      const sampleSize = Math.max(80, Math.round(targetSize));
      const offscreen = document.createElement('canvas');
      offscreen.width = sampleSize;
      offscreen.height = sampleSize;
      const offscreenContext = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offscreenContext) return [];

      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (!sourceWidth || !sourceHeight) return [];

      const scale = Math.max(sampleSize / sourceWidth, sampleSize / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      const drawX = (sampleSize - drawWidth) / 2;
      const drawY = (sampleSize - drawHeight) * 0.16;

      offscreenContext.clearRect(0, 0, sampleSize, sampleSize);
      offscreenContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      const pixels = offscreenContext.getImageData(0, 0, sampleSize, sampleSize).data;
      const step = mobile.matches ? 4 : 5;
      const targets = [];

      for (let y = 0; y < sampleSize; y += step) {
        for (let x = 0; x < sampleSize; x += step) {
          const nx = (x + 0.5) / sampleSize - 0.5;
          const ny = (y + 0.5) / sampleSize - 0.5;
          if (Math.hypot(nx, ny) > 0.5) continue;

          const pixelIndex = (y * sampleSize + x) * 4;
          const r = pixels[pixelIndex] / 255;
          const g = pixels[pixelIndex + 1] / 255;
          const b = pixels[pixelIndex + 2] / 255;
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const saturation = Math.max(r, g, b) - Math.min(r, g, b);
          const background = luminance > 0.92 && saturation < 0.1;

          if (background && ny < 0.2) continue;
          if (luminance > 0.975 && ny < 0.38) continue;

          targets.push({
            x: width / 2 - sampleSize / 2 + x,
            y: height * 0.37 - sampleSize / 2 + y,
            alpha: clamp(0.28 + (1 - luminance) * 0.9, 0.3, 1)
          });
        }
      }

      return targets;
    };

    const resize = () => {
      const rect = intro.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      bangTargets = createTextTargets('!');
      textTargets = createTextTargets('PORTFOLIO');
      faceTargets = createFaceTargets();
      textParticles = createParticleGroup(TEXT_PARTICLES, width, height);
      faceParticles = createParticleGroup(FACE_PARTICLES, width, height);
    };

    const drawParticle = (particle, alpha, radiusScale = 1) => {
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * radiusScale, 0, Math.PI * 2);
      context.fill();
    };

    const getTarget = (particle, targets) => {
      if (!targets.length) return { x: width / 2, y: height / 2, alpha: 1 };
      return targets[Math.floor(particle.seed * 1000) % targets.length];
    };

    const moveGroup = (particles, targets, progress, scatter = 0, speed = 0.1) => {
      const ease = easeOutCubic(clamp(progress, 0, 1));
      for (const particle of particles) {
        const target = getTarget(particle, targets);
        const angle = particle.seed + performance.now() * 0.00035;
        const tx = target.x + Math.cos(angle) * scatter * (1 - ease);
        const ty = target.y + Math.sin(angle) * scatter * (1 - ease) * 0.65;
        particle.x += (tx - particle.x) * speed;
        particle.y += (ty - particle.y) * speed;
        drawParticle(particle, clamp(0.12 + ease * 0.88, 0, 1), 0.72 + ease * 0.38);
      }
    };

    const animate = (now) => {
      const elapsed = (now - startedAt) / 1000;
      const progress = clamp(elapsed / INTRO_DURATION, 0, 1);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';

      if (progress < 0.16) {
        moveGroup(textParticles, bangTargets, progress / 0.16, 90, 0.11);
        moveGroup(faceParticles, faceTargets, 0, 240, 0.025);
      } else if (progress < 0.44) {
        moveGroup(textParticles, textTargets, (progress - 0.16) / 0.28, 150, 0.12);
        moveGroup(faceParticles, faceTargets, 0, 190, 0.03);
      } else if (progress < 0.63) {
        moveGroup(textParticles, textTargets, 1, 0, 0.12);
        moveGroup(faceParticles, faceTargets, 0, 150, 0.045);
      } else if (progress < 0.9) {
        moveGroup(textParticles, textTargets, 1, 0, 0.1);
        moveGroup(faceParticles, faceTargets, (progress - 0.63) / 0.27, 100, 0.11);
      } else {
        moveGroup(textParticles, textTargets, 1, 0, 0.08);
        moveGroup(faceParticles, faceTargets, 1, 0, 0.08);
      }

      context.globalAlpha = 1;

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        intro.dataset.state = 'complete';
      }
    };

    const start = () => {
      resize();
      startedAt = performance.now();
      if (reduceMotion) {
        intro.dataset.state = 'complete';
        return;
      }
      intro.dataset.state = 'active';
      frameId = window.requestAnimationFrame(animate);
    };

    image = new Image();
    image.decoding = 'async';
    image.onload = start;
    image.onerror = () => {
      intro.dataset.state = 'complete';
    };
    image.src = IMAGE_SRC;

    resize();
    intro.dataset.state = reduceMotion ? 'complete' : 'loading';

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };

    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.clearTimeout(resizeTimer);
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="hero-content">
      <div ref={introRef} className="portfolio-particle-intro" data-state="loading" aria-hidden="true">
        <div className="portfolio-particle-glow" />
        <canvas ref={canvasRef} className="portfolio-particle-canvas" />
      </div>

      <div className="hero-main-content">
        <div className="hero-portrait particle-portrait-shell">
          <img src="/profile.jpg" alt="Jafar Khandu" loading="eager" decoding="async" />
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
    </div>
  );
}

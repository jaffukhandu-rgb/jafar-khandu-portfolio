import { useEffect, useRef } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const IMAGE_SRC = '/profile.jpg';
const INTRO_DURATION = 6.1;
const PARTICLE_COUNT = 1100;

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
    let textTargets = [];
    let faceTargets = [];
    let particles = [];

    const createTextTargets = (text) => {
      const targetWidth = Math.min(width * 0.82, mobile.matches ? 330 : 720);
      const targetHeight = mobile.matches ? 110 : 180;
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.max(1, Math.round(targetWidth));
      offscreen.height = targetHeight;
      const offscreenContext = offscreen.getContext('2d');
      if (!offscreenContext) return [];

      offscreenContext.clearRect(0, 0, offscreen.width, offscreen.height);
      offscreenContext.fillStyle = '#fff';
      offscreenContext.textAlign = 'center';
      offscreenContext.textBaseline = 'middle';
      offscreenContext.font = `900 ${mobile.matches ? 52 : 112}px Arial, sans-serif`;
      offscreenContext.fillText(text, offscreen.width / 2, offscreen.height / 2 + 4);

      const pixels = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const step = mobile.matches ? 4 : 5;
      const targets = [];

      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = pixels[(y * offscreen.width + x) * 4 + 3];
          if (alpha < 100) continue;
          targets.push({
            x: width / 2 - offscreen.width / 2 + x,
            y: height * 0.47 - offscreen.height / 2 + y
          });
        }
      }

      return targets;
    };

    const createFaceTargets = () => {
      if (!image) return [];

      const targetSize = Math.min(width * 0.72, mobile.matches ? 210 : 330);
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
      const drawY = (sampleSize - drawHeight) * 0.28;

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

          if (background && ny < 0.15) continue;
          if (luminance > 0.975 && ny < 0.35) continue;

          targets.push({
            x: width / 2 - sampleSize / 2 + x,
            y: height * 0.49 - sampleSize / 2 + y,
            alpha: clamp(0.25 + (1 - luminance) * 0.9, 0.28, 1)
          });
        }
      }

      return targets;
    };

    const resetParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
        x: width / 2 + (Math.random() - 0.5) * width * 0.8,
        y: height / 2 + (Math.random() - 0.5) * height * 1.2,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: mobile.matches ? 0.7 + Math.random() * 0.65 : 0.8 + Math.random() * 0.9,
        seed: Math.random() * Math.PI * 2,
        index
      }));
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
      textTargets = createTextTargets('PORTFOLIO');
      faceTargets = createFaceTargets();
      resetParticles();
    };

    const drawParticle = (particle, alpha = 1, radius = particle.radius) => {
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      context.fill();
    };

    const targetFor = (particle, targets) => {
      if (!targets.length) return { x: width / 2, y: height / 2, alpha: 1 };
      return targets[particle.index % targets.length];
    };

    const animate = (now) => {
      const elapsed = (now - startedAt) / 1000;
      const progress = clamp(elapsed / INTRO_DURATION, 0, 1);
      const textProgress = clamp((progress - 0.08) / 0.27, 0, 1);
      const faceProgress = clamp((progress - 0.61) / 0.25, 0, 1);
      const introEase = easeOutCubic(progress);

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';

      if (progress < 0.08) {
        const pulse = 1 + Math.sin(now * 0.012) * 0.08;
        for (const particle of particles) {
          particle.x += (width / 2 - particle.x) * 0.08;
          particle.y += (height / 2 - particle.y) * 0.08;
          drawParticle(particle, 0.08, particle.radius * 0.55 * pulse);
        }
      } else if (progress < 0.61) {
        const ease = easeOutCubic(textProgress);
        for (const particle of particles) {
          const target = targetFor(particle, textTargets);
          const scatter = (1 - ease) * 180;
          const angle = particle.seed + now * 0.00035;
          const tx = target.x + Math.cos(angle) * scatter;
          const ty = target.y + Math.sin(angle) * scatter * 0.55;
          particle.x += (tx - particle.x) * 0.09;
          particle.y += (ty - particle.y) * 0.09;
          const alpha = clamp(0.15 + ease * 0.85, 0, 1);
          drawParticle(particle, alpha, particle.radius * (0.65 + ease * 0.4));
        }
      } else {
        const morph = easeOutCubic(faceProgress);
        for (const particle of particles) {
          const textTarget = targetFor(particle, textTargets);
          const faceTarget = targetFor(particle, faceTargets);
          const angle = particle.seed + now * 0.0004;
          const swirl = (1 - morph) * 34;
          const tx = textTarget.x * (1 - morph) + faceTarget.x * morph + Math.cos(angle) * swirl;
          const ty = textTarget.y * (1 - morph) + faceTarget.y * morph + Math.sin(angle) * swirl;
          particle.x += (tx - particle.x) * (0.08 + morph * 0.05);
          particle.y += (ty - particle.y) * (0.08 + morph * 0.05);
          const alpha = clamp(0.85 + (faceTarget.alpha || 1) * 0.15, 0, 1);
          drawParticle(particle, alpha, particle.radius * (0.72 + morph * 0.35));
        }
      }

      context.globalAlpha = 1;

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        intro.dataset.state = 'complete';
      }
    };

    image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      resize();
      startedAt = performance.now();
      intro.dataset.state = 'active';
      frameId = window.requestAnimationFrame(animate);
    };
    image.onerror = () => {
      intro.dataset.state = 'complete';
    };
    image.src = IMAGE_SRC;

    resize();
    intro.dataset.state = 'loading';

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };

    window.addEventListener('resize', onResize, { passive: true });

    if (reduceMotion) {
      intro.dataset.state = 'complete';
    }

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

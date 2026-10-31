import { useEffect, useRef } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

export default function ParticlePortrait() {
  const canvasRef = useRef(null);
  const shellRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 701px)');

    let frameId = 0;
    let resizeTimer = 0;
    let scrambleTimer = 0;
    let particles = [];
    let image = null;
    let imageReady = false;
    let startedAt = performance.now();
    let width = 1;
    let height = 1;
    let dpr = 1;
    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;

    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    const setIntroState = (state) => {
      const site = shell.closest('.site-shell');
      if (site) site.dataset.heroIntro = state;
    };

    const runHeadingScramble = () => {
      const letters = shell.querySelectorAll('.particle-hero-word span');
      letters.forEach((letter, index) => {
        letter.textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        letter.style.setProperty('--char-index', index);
      });

      let ticks = 0;
      const settle = () => {
        ticks += 1;
        letters.forEach((letter, index) => {
          if (ticks > index * 2 + 4) {
            letter.textContent = 'PORTFOLIO'[index];
          } else {
            letter.textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        });

        if (ticks < 22) {
          scrambleTimer = window.setTimeout(settle, 55);
        } else {
          letters.forEach((letter, index) => { letter.textContent = 'PORTFOLIO'[index]; });
        }
      };

      scrambleTimer = window.setTimeout(settle, 55);
    };

    const setCanvasSize = () => {
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

      const offscreen = document.createElement('canvas');
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (!sourceWidth || !sourceHeight) return;

      const maxParticles = desktop.matches ? 12000 : 5000;
      const sampleStep = desktop.matches ? 4 : 6;
      const sampleWidth = Math.min(620, Math.max(280, Math.round(width * (desktop.matches ? 0.62 : 0.82))));
      const scale = sampleWidth / sourceWidth;
      const sampleHeight = Math.max(1, Math.round(sourceHeight * scale));

      offscreen.width = sampleWidth;
      offscreen.height = sampleHeight;

      const offscreenContext = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offscreenContext) return;

      offscreenContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const pixels = offscreenContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const candidates = [];

      for (let y = 0; y < sampleHeight; y += sampleStep) {
        for (let x = 0; x < sampleWidth; x += sampleStep) {
          const index = (y * sampleWidth + x) * 4;
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          const alpha = pixels[index + 3] / 255;
          if (alpha < 0.2) continue;

          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          if (brightness < 0.39) continue;

          const xNorm = x / sampleWidth;
          const yNorm = y / sampleHeight;
          if (xNorm < 0.08 || xNorm > 0.92 || yNorm < 0.03 || yNorm > 0.98) continue;

          candidates.push({
            x: xNorm,
            y: yNorm,
            brightness,
            weight: Math.pow(brightness, 1.8)
          });
        }
      }

      if (!candidates.length) return;

      candidates.sort((a, b) => b.weight - a.weight);
      const selected = candidates.slice(0, maxParticles);
      const portraitWidth = Math.min(width * (desktop.matches ? 0.72 : 0.86), 820);
      const aspectRatio = sampleHeight / sampleWidth;
      const rawPortraitHeight = portraitWidth * aspectRatio;
      const portraitHeight = desktop.matches
        ? rawPortraitHeight
        : Math.min(rawPortraitHeight, height * 0.5);
      const portraitTop = desktop.matches
        ? Math.max(20, height * 0.02)
        : Math.max(18, height * 0.025);
      const portraitLeft = (width - portraitWidth) / 2;

      particles = selected.map((point) => {
        const targetX = portraitLeft + point.x * portraitWidth;
        const targetY = portraitTop + point.y * portraitHeight;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) * (0.25 + Math.random() * 0.8);

        return {
          tx: targetX,
          ty: targetY,
          x: width / 2 + Math.cos(angle) * distance,
          y: height / 2 + Math.sin(angle) * distance,
          size: desktop.matches ? 0.65 + point.brightness * 1.45 : 0.65 + point.brightness * 1.2,
          alpha: 0.35 + point.brightness * 0.65,
          delay: Math.random() * 0.7,
          seed: Math.random() * Math.PI * 2
        };
      });
    };

    const drawFinalState = () => {
      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1;
      context.fillStyle = '#ffffff';

      for (const particle of particles) {
        particle.x = particle.tx;
        particle.y = particle.ty;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      setIntroState('complete');
    };

    const draw = (now) => {
      if (reduceMotionQuery.matches) {
        drawFinalState();
        return;
      }

      const elapsed = (now - startedAt) / 1000;
      const portraitProgress = clamp((elapsed - 1.5) / 3, 0, 1);
      const introComplete = elapsed >= 4.5;

      if (introComplete) setIntroState('complete');
      else if (elapsed >= 1.5) setIntroState('portrait');
      else setIntroState('heading');

      context.clearRect(0, 0, width, height);

      const mouseStrength = desktop.matches && mouseActive ? 1 : 0;
      const repelRadius = 110;
      const easedPortrait = easeOutCubic(portraitProgress);

      for (const particle of particles) {
        let targetX = particle.tx;
        let targetY = particle.ty;

        if (mouseStrength) {
          const dx = targetX - mouseX;
          const dy = targetY - mouseY;
          const distance = Math.hypot(dx, dy);
          if (distance < repelRadius && distance > 0.001) {
            const force = Math.pow(1 - distance / repelRadius, 2) * 34;
            targetX += (dx / distance) * force;
            targetY += (dy / distance) * force;
          }
        }

        const localProgress = clamp((portraitProgress - particle.delay * 0.35) / 0.65, 0, 1);
        const particleEase = easeOutCubic(localProgress);

        if (portraitProgress > 0) {
          particle.x += (targetX - particle.x) * (0.075 + particleEase * 0.035);
          particle.y += (targetY - particle.y) * (0.075 + particleEase * 0.035);
        }

        const shimmer = 0.9 + Math.sin(now * 0.0014 + particle.seed) * 0.1;
        const alpha = portraitProgress > 0 ? particle.alpha * shimmer : 0;
        const size = particle.size * (0.82 + particleEase * 0.18);

        context.globalAlpha = alpha;
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      shell.style.setProperty('--portrait-fade', `${1 - easedPortrait * 0.08}`);
      shell.style.setProperty('--portrait-lift', `${clamp((elapsed - 4.5) / 1.1, 0, 1) * -18}px`);
      frameId = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event) => {
      if (!desktop.matches) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
      mouseActive = true;
    };

    const onPointerLeave = () => { mouseActive = false; };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setCanvasSize, 120);
    };

    const onMotionPreferenceChange = () => {
      if (reduceMotionQuery.matches) {
        window.cancelAnimationFrame(frameId);
        setIntroState('complete');
        if (imageReady) drawFinalState();
      } else {
        startedAt = performance.now();
        frameId = window.requestAnimationFrame(draw);
      }
    };

    setIntroState('heading');
    setCanvasSize();
    runHeadingScramble();

    image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      imageReady = true;
      buildParticles();
      if (reduceMotionQuery.matches) drawFinalState();
    };
    image.onerror = () => {
      if (image.src.endsWith('/profile.png')) image.src = '/profile.jpg';
    };
    image.src = '/profile.png';

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    reduceMotionQuery.addEventListener?.('change', onMotionPreferenceChange);

    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(scrambleTimer);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      reduceMotionQuery.removeEventListener?.('change', onMotionPreferenceChange);
      setIntroState('');
    };
  }, []);

  return (
    <div className="particle-hero-intro" ref={shellRef}>
      <div className="particle-hero-dot" aria-hidden="true" />
      <div className="particle-hero-word" aria-hidden="true">
        {'PORTFOLIO'.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ '--char-index': index }}>{letter}</span>
        ))}
      </div>
      <canvas ref={canvasRef} className="particle-hero-canvas" aria-label="Animated halftone portrait of Jafar Khandu" />
      <div className="particle-hero-name">JAFAR KHANDU</div>
      <div className="particle-hero-tagline">Full-Stack .NET Developer</div>
    </div>
  );
}

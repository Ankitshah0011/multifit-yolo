// Golden particle burst + logo reveal animation
const MeltEffect = (() => {
  const MAX_DIM = 400;

  function run(sourceCanvas, targetCanvas, duration = 3500) {
    return new Promise((resolve) => {
      let w = sourceCanvas.width;
      let h = sourceCanvas.height;
      const scale = Math.min(1, MAX_DIM / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      targetCanvas.width = w;
      targetCanvas.height = h;
      const ctx = targetCanvas.getContext('2d');

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = 'img/logo/M-Logo.png';

      const cx = w / 2;
      const cy = h / 2;

      // --- Particle system ---
      const MAX_P = 200;
      const px = new Float32Array(MAX_P);
      const py = new Float32Array(MAX_P);
      const pvx = new Float32Array(MAX_P);
      const pvy = new Float32Array(MAX_P);
      const plife = new Float32Array(MAX_P);
      const pdecay = new Float32Array(MAX_P);
      const psize = new Float32Array(MAX_P);
      const ptype = new Uint8Array(MAX_P); // 0=glow, 1=spark, 2=ring
      let pCount = 0;

      function spawn(x, y, type) {
        if (pCount >= MAX_P) return;
        const i = pCount++;
        const angle = Math.random() * Math.PI * 2;
        const speed = type === 1 ? 3 + Math.random() * 5
          : type === 2 ? 1 + Math.random() * 2
          : 0.5 + Math.random() * 3;
        px[i] = x;
        py[i] = y;
        pvx[i] = Math.cos(angle) * speed;
        pvy[i] = Math.sin(angle) * speed;
        plife[i] = 1;
        pdecay[i] = type === 1 ? 0.02 + Math.random() * 0.025
          : type === 2 ? 0.008 + Math.random() * 0.01
          : 0.012 + Math.random() * 0.015;
        psize[i] = type === 1 ? 1 + Math.random() * 1.5
          : type === 2 ? 1 + Math.random() * 2
          : 2 + Math.random() * 5;
        ptype[i] = type;
      }

      // Gold/yellow themed colors
      function getColor(type, life) {
        if (type === 1) {
          // Sparks: bright white-gold
          return `rgb(255,${Math.round(220 + life * 35)},${Math.round(100 + life * 100)})`;
        }
        if (type === 2) {
          // Ring particles: warm gold
          return `rgb(255,${Math.round(180 + life * 30)},${Math.round(life * 30)})`;
        }
        // Glow: gold to amber
        return `rgb(255,${Math.round(170 + life * 40)},${Math.round(life * 20)})`;
      }

      let hasBurst = false;
      let burstTime = 0;
      // Expanding ring radius
      let ringRadius = 0;

      const startTime = performance.now();

      function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        // Phase 1: Captured image dissolves with golden tint
        if (progress < 0.12) {
          const alpha = 1 - progress / 0.12;
          ctx.globalAlpha = alpha;
          ctx.drawImage(sourceCanvas, 0, 0, w, h);
          ctx.globalAlpha = 1;
          // Gold overlay on image
          ctx.fillStyle = `rgba(255, 210, 1, ${(1 - alpha) * 0.3})`;
          ctx.fillRect(0, 0, w, h);
          requestAnimationFrame(frame);
          return;
        }

        // Golden flash at burst
        if (!hasBurst) {
          hasBurst = true;
          burstTime = now;
          for (let i = 0; i < 50; i++) spawn(cx, cy, 0);
          for (let i = 0; i < 40; i++) spawn(cx, cy, 1);
          for (let i = 0; i < 20; i++) spawn(cx, cy, 2);
        }

        const burstElapsed = now - burstTime;

        // Golden flash
        if (burstElapsed < 250) {
          const flashAlpha = Math.max(0, 1 - burstElapsed / 250);
          ctx.fillStyle = `rgba(255, 210, 1, ${flashAlpha * 0.6})`;
          ctx.fillRect(0, 0, w, h);
        }

        // Expanding golden ring
        if (progress > 0.12 && progress < 0.6) {
          ringRadius = ((progress - 0.12) / 0.48) * Math.max(w, h) * 0.8;
          const ringAlpha = Math.max(0, 1 - (progress - 0.12) / 0.48) * 0.5;
          ctx.strokeStyle = `rgba(255, 210, 1, ${ringAlpha})`;
          ctx.lineWidth = 3 + (1 - ringAlpha) * 4;
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
          // Second ring, slightly delayed
          if (progress > 0.18) {
            const r2 = ((progress - 0.18) / 0.42) * Math.max(w, h) * 0.7;
            const a2 = Math.max(0, 1 - (progress - 0.18) / 0.42) * 0.3;
            ctx.strokeStyle = `rgba(255, 210, 1, ${a2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Continuous gold particle spawning
        if (progress > 0.12 && progress < 0.5) {
          const intensity = Math.sin((progress - 0.12) / 0.38 * Math.PI);
          if (Math.random() < intensity * 0.5) spawn(cx + (Math.random() - 0.5) * 30, cy + (Math.random() - 0.5) * 30, 0);
          if (Math.random() < intensity * 0.3) spawn(cx + (Math.random() - 0.5) * 15, cy + (Math.random() - 0.5) * 15, 1);
        }

        // Central golden glow
        if (progress > 0.1 && progress < 0.75) {
          const glowP = progress < 0.4
            ? Math.min((progress - 0.1) / 0.15, 1)
            : Math.max(0, (0.75 - progress) / 0.35);
          const glowR = Math.min(w, h) * 0.25;
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
          glow.addColorStop(0, `rgba(255, 210, 1, ${glowP * 0.35})`);
          glow.addColorStop(0.5, `rgba(255, 180, 0, ${glowP * 0.15})`);
          glow.addColorStop(1, 'rgba(255, 150, 0, 0)');
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }

        // Update and draw particles
        ctx.globalCompositeOperation = 'lighter';
        for (let i = pCount - 1; i >= 0; i--) {
          px[i] += pvx[i];
          py[i] += pvy[i];
          pvx[i] *= 0.98;
          pvy[i] *= 0.98;
          plife[i] -= pdecay[i];

          if (plife[i] <= 0) {
            pCount--;
            if (i < pCount) {
              px[i] = px[pCount]; py[i] = py[pCount];
              pvx[i] = pvx[pCount]; pvy[i] = pvy[pCount];
              plife[i] = plife[pCount]; pdecay[i] = pdecay[pCount];
              psize[i] = psize[pCount]; ptype[i] = ptype[pCount];
            }
            continue;
          }

          const color = getColor(ptype[i], plife[i]);
          const size = psize[i] * plife[i];
          ctx.globalAlpha = plife[i] * 0.8;
          ctx.fillStyle = color;

          if (ptype[i] === 1) {
            // Sparks: tiny squares
            ctx.fillRect(px[i] - size / 2, py[i] - size / 2, size, size);
          } else {
            ctx.beginPath();
            ctx.arc(px[i], py[i], size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        // Logo reveal with golden glow
        if (progress > 0.3 && logo.complete && logo.naturalWidth > 0) {
          const lp = Math.min((progress - 0.3) / 0.35, 1);
          const ep = 1 - Math.pow(1 - lp, 3);

          const maxSize = Math.min(w, h) * 0.5;
          const logoSize = maxSize * (0.4 + ep * 0.6);
          const logoAlpha = Math.min(lp / 0.3, 1);

          // Logo golden aura
          if (logoAlpha > 0.1) {
            const aura = ctx.createRadialGradient(cx, cy, logoSize * 0.2, cx, cy, logoSize * 0.8);
            aura.addColorStop(0, `rgba(255, 210, 1, ${logoAlpha * 0.25})`);
            aura.addColorStop(1, 'rgba(255, 210, 1, 0)');
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = aura;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
          }

          ctx.globalAlpha = logoAlpha;
          ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
          ctx.globalAlpha = 1;
        }

        // Fade out
        if (progress > 0.85) {
          const fadeAlpha = (progress - 0.85) / 0.15;
          ctx.fillStyle = `rgba(10, 10, 10, ${fadeAlpha})`;
          ctx.fillRect(0, 0, w, h);
        }

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }

      ctx.drawImage(sourceCanvas, 0, 0, w, h);
      requestAnimationFrame(frame);
    });
  }

  return { run };
})();

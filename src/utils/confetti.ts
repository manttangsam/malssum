/**
 * Lightweight canvas confetti burst implementation (Zero external dependency)
 */
export function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316'];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRotation: number;
    alpha: number;
  }

  const particles: Particle[] = Array.from({ length: 80 }, () => ({
    x: width / 2,
    y: height * 0.6,
    vx: (Math.random() - 0.5) * 16,
    vy: (Math.random() - 0.8) * 18,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    vRotation: (Math.random() - 0.5) * 12,
    alpha: 1.0
  }));

  let animationFrameId: number;

  function render() {
    ctx?.clearRect(0, 0, width, height);

    let activeCount = 0;

    particles.forEach(p => {
      if (p.alpha <= 0) return;
      activeCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.rotation += p.vRotation;
      p.alpha -= 0.012;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.globalAlpha = Math.max(0, p.alpha);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx!.restore();
    });

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      document.body.removeChild(canvas);
    }
  }

  render();
}

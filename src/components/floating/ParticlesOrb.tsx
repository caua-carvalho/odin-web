import { useEffect, useRef } from 'react';

/**
 * Simple particle orb visualisation using HTML5 Canvas.
 * Mirrors the visual from https://voiceorbs.vercel.app/orbs/particles-orb.
 */
export default function ParticlesOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = 400);
    const height = (canvas.height = 400);

    const particleCount = 200;
    const particles: Array<{ theta: number; phi: number; radius: number; size: number }> = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 100 + Math.random() * 20;
      particles.push({ theta, phi, radius, size: Math.random() * 2 + 1 });
    }

    let angle = 0;
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angle += 0.01;

      for (const p of particles) {
        const currentTheta = p.theta + angle;
        const x = width / 2 + p.radius * Math.sin(p.phi) * Math.cos(currentTheta);
        const y = height / 2 + p.radius * Math.cos(p.phi);
        const z = p.radius * Math.sin(p.phi) * Math.sin(currentTheta);
        const scale = (z + 150) / 250;
        const alpha = Math.max(0.1, scale);
        ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="flex justify-center items-center bg-slate-950 p-4 rounded-2xl">
      <canvas ref={canvasRef} className="w-[400px] h-[400px]" />
    </div>
  );
}

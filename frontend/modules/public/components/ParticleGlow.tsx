"use client";

import { useEffect, useRef } from "react";

const FALLBACK_COLOR = "rgb(56 224 255)";
const PARTICLE_COUNT = 72;

type Particle = {
  x: number;
  y: number;
  size: number;
  drift: number;
  speed: number;
  alpha: number;
  alphaSpeed: number;
  life: number;
  maxLife: number;
};

function createParticle(width: number, height: number): Particle {
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;
  if (edge === 0) {
    x = Math.random() * width;
    y = -2 + Math.random() * 4;
  } else if (edge === 1) {
    x = width - 2 + Math.random() * 4;
    y = Math.random() * height;
  } else if (edge === 2) {
    x = Math.random() * width;
    y = height - 2 + Math.random() * 4;
  } else {
    x = -2 + Math.random() * 4;
    y = Math.random() * height;
  }
  return {
    x,
    y,
    size: 0.9 + Math.random() * 2.4,
    drift: (Math.random() - 0.5) * 0.6,
    speed: 0.28 + Math.random() * 0.85,
    alpha: 0,
    alphaSpeed: 0.03 + Math.random() * 0.06,
    life: 0,
    maxLife: 110 + Math.random() * 150,
  };
}

export default function ParticleGlow({ color }: Readonly<{ color?: string | null }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color ?? FALLBACK_COLOR);

  useEffect(() => {
    colorRef.current = color ?? FALLBACK_COLOR;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(rect.width * window.devicePixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * window.devicePixelRatio));
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const spawn = () => {
      while (particles.length < PARTICLE_COUNT) {
        particles.push(createParticle(width, height));
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = colorRef.current;
      ctx.shadowColor = colorRef.current;
      ctx.shadowBlur = 14;

      particles = particles.filter((p) => p.life < p.maxLife && p.y > -8);
      spawn();

      for (const p of particles) {
        p.life += 1;
        p.y -= p.speed;
        p.x += p.drift;
        const fadeIn = Math.min(1, p.life * p.alphaSpeed);
        const fadeOut = Math.min(1, (p.maxLife - p.life) / 40);
        p.alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * (0.5 + 0.5 * Math.sin(p.life * 0.12));
        ctx.globalAlpha = Math.min(1, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(step);
    };

    resize();
    spawn();
    raf = requestAnimationFrame(step);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="home-flow-particles" aria-hidden="true" />;
}

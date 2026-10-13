"use client";

import { useEffect, useRef } from "react";

const FALLBACK_COLOR = "rgb(56 224 255)";
const PARTICLE_COUNT = 110;
const PADDING = 32;
function luminousColor(color?: string | null) {
  const channels = color?.match(/\d+(?:\.\d+)?/g);
  return channels?.length === 3
    ? `rgb(${channels.map(value => Math.round(Number(value) * 0.45 + 255 * 0.55)).join(" ")})`
    : FALLBACK_COLOR;
}

type Particle = {
  x: number;
  y: number;
  size: number;
  velocityX: number;
  velocityY: number;
  phase: number;
  sway: number;
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
    x = PADDING + Math.random() * (width - PADDING * 2);
    y = PADDING - 3 + Math.random() * 6;
  } else if (edge === 1) {
    x = width - PADDING - 3 + Math.random() * 6;
    y = PADDING + Math.random() * (height - PADDING * 2);
  } else if (edge === 2) {
    x = PADDING + Math.random() * (width - PADDING * 2);
    y = height - PADDING - 3 + Math.random() * 6;
  } else {
    x = PADDING - 3 + Math.random() * 6;
    y = PADDING + Math.random() * (height - PADDING * 2);
  }
  // Each edge emits outward, with a broad spread rather than a shared upward wind.
  const angle = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][edge]
    + (Math.random() - 0.5) * Math.PI * 0.65;
  const speed = 0.18 + Math.random() * 0.3;
  return {
    x,
    y,
    size: 1.1 + Math.random() * 2.1,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    phase: Math.random() * Math.PI * 2,
    sway: 0.04 + Math.random() * 0.08,
    alpha: 0,
    alphaSpeed: 0.03 + Math.random() * 0.06,
    life: 0,
    maxLife: 110 + Math.random() * 150,
  };
}

export default function ParticleGlow({ color }: Readonly<{ color?: string | null }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(luminousColor(color));

  useEffect(() => {
    colorRef.current = luminousColor(color);
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
    let lastTime: number | undefined;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const spawn = () => {
      while (particles.length < PARTICLE_COUNT) {
        particles.push(createParticle(width, height));
      }
    };

    const step = (time: number) => {
      const elapsed = lastTime === undefined ? 1 : Math.min(3, (time - lastTime) / (1000 / 60));
      lastTime = time;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = colorRef.current;
      ctx.shadowColor = colorRef.current;
      ctx.shadowBlur = 18;

      particles = particles.filter((p) => p.life < p.maxLife
        && p.x > -8 && p.x < width + 8 && p.y > -8 && p.y < height + 8);
      spawn();

      for (const p of particles) {
        p.life += elapsed;
        const sway = Math.sin(p.life * 0.035 + p.phase) * p.sway;
        p.x += (p.velocityX - Math.sin(p.phase) * sway) * elapsed;
        p.y += (p.velocityY + Math.cos(p.phase) * sway) * elapsed;
        const fadeIn = Math.min(1, p.life * p.alphaSpeed);
        const fadeOut = Math.min(1, (p.maxLife - p.life) / 40);
        p.alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * (0.75 + 0.25 * Math.sin(p.life * 0.12));
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

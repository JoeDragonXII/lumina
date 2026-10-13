"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export function AuroraBackground({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create flowing aurora effect
      for (let i = 0; i < 3; i++) {
        const gradient = ctx.createLinearGradient(
          0,
          canvas.height * 0.3 * i,
          canvas.width,
          canvas.height * 0.7 * (i + 1),
        );

        const colors = [
          ["rgba(127, 150, 146, 0.12)", "rgba(110, 125, 155, 0.08)", "rgba(195, 144, 89, 0.05)"],
          ["rgba(127, 150, 146, 0.08)", "rgba(110, 125, 155, 0.08)", "rgba(127, 150, 146, 0.06)"],
          ["rgba(195, 144, 89, 0.06)", "rgba(127, 150, 146, 0.08)", "rgba(110, 125, 155, 0.10)"],
        ];

        gradient.addColorStop(0, colors[i][0]);
        gradient.addColorStop(0.5, colors[i][1]);
        gradient.addColorStop(1, colors[i][2]);

        ctx.beginPath();
        const amplitude = 100 + i * 40;
        const freq = 0.003 + i * 0.002;
        const phase = time * (1 + i * 0.5);
        const yBase = canvas.height * (0.3 + i * 0.25);

        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 2) {
          const y =
            yBase +
            Math.sin(x * freq + phase) * amplitude +
            Math.cos(x * freq * 1.7 + phase * 0.7) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      if (!motion.matches && !document.hidden) animationId = requestAnimationFrame(draw);
    };
    draw();
    const restart = () => { cancelAnimationFrame(animationId); draw(); };
    motion.addEventListener("change", restart);
    document.addEventListener("visibilitychange", restart);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", restart);
      document.removeEventListener("visibilitychange", restart);
    };
  }, []);

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ filter: "blur(60px)" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

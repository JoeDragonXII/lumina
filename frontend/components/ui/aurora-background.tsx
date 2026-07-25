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

    let animationId: number;
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
          ["rgba(59, 130, 246, 0.15)", "rgba(147, 51, 234, 0.1)", "rgba(236, 72, 153, 0.05)"],
          ["rgba(16, 185, 129, 0.1)", "rgba(59, 130, 246, 0.1)", "rgba(99, 102, 241, 0.08)"],
          ["rgba(236, 72, 153, 0.08)", "rgba(168, 85, 247, 0.1)", "rgba(59, 130, 246, 0.12)"],
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

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
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

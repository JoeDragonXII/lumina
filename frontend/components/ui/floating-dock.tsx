"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { type MotionValue, m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef, useState } from "react";

type DockItem = {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
};

export function FloatingDock({
  items,
  className,
  orientation = "horizontal",
  magnify = true,
}: {
  items: DockItem[];
  className?: string;
  orientation?: "horizontal" | "vertical";
  magnify?: boolean;
}) {
  const mouseAxis = useMotionValue(Infinity);
  const vertical = orientation === "vertical";
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      onMouseMove={(e) => mouseAxis.set(reduceMotion ? Infinity : vertical ? e.clientY : e.clientX)}
      onMouseLeave={() => mouseAxis.set(Infinity)}
      className={cn(
        "floating-dock mx-auto flex items-center gap-4 rounded-2xl backdrop-blur-sm",
        vertical ? "flex-col px-3 py-4" : "h-16 items-end px-4 pb-3",
        className,
      )}
    >
      {items.map((item) => (
        <DockIcon key={item.href || item.label} mouseAxis={mouseAxis} vertical={vertical} magnify={magnify} {...item} />
      ))}
    </m.div>
  );
}

function DockIcon({
  mouseAxis,
  vertical,
  icon,
  label,
  href,
  onClick,
  active,
  magnify,
}: {
  mouseAxis: MotionValue<number>;
  vertical: boolean;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  magnify: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseAxis, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    return vertical
      ? val - bounds.y - bounds.height / 2
      : val - bounds.x - bounds.width / 2;
  });

  const sizeSync = useTransform(distance, [-120, 0, 120], [44, magnify ? 56 : 44, 44]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const controlClass = cn("floating-dock-icon flex h-full w-full items-center justify-center rounded-xl transition-colors", active && "floating-dock-icon-active");

  return (
    <m.div
      ref={ref}
      style={vertical ? { height: size, width: size } : { height: 44, width: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="relative flex aspect-square items-center justify-center"
    >
      {href ? <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={controlClass}>{icon}</Link>
        : <button type="button" onClick={onClick} aria-label={label} aria-pressed={active} className={controlClass}>{icon}</button>}
      {hovered && (
        <m.div
          initial={{ opacity: 0, ...(vertical ? { x: 10 } : { y: 10 }) }}
          animate={{ opacity: 1, ...(vertical ? { x: 0 } : { y: 0 }) }}
          className={cn(
            "floating-dock-tip absolute whitespace-nowrap rounded-md z-50 px-2 py-0.5 text-xs",
            vertical
              ? "left-full top-1/2 ml-3 -translate-y-1/2"
              : "-top-8 left-1/2 -translate-x-1/2",
          )}
        >
          {label}
        </m.div>
      )}
    </m.div>
  );
}

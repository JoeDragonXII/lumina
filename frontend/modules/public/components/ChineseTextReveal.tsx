"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";

/**
 * 中文逐字渐入动画组件。
 * 对中文字符（或任意字符）逐个施加 whileInView 渐入效果。
 */
export function ChineseTextReveal({
  text,
  className,
  delay = 0,
  charDelay = 0.04,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  charDelay?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) {
  const chars = [...text];

  return (
    <Tag className={cn("inline-block", className)}>
      {chars.map((char, idx) => (
        <m.span
          key={idx}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: delay + idx * charDelay }}
          style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char === " " ? "\u00A0" : char}
        </m.span>
      ))}
    </Tag>
  );
}

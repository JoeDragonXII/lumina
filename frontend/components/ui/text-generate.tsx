"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";

export function TextGenerate({
  words,
  className,
  delay = 0,
}: {
  words: string;
  className?: string;
  delay?: number;
}) {
  const wordsArray = words.split(" ");

  return (
    <span className={cn("inline-block", className)}>
      {wordsArray.map((word, idx) => (
        <m.span
          key={idx}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: delay + idx * 0.05 }}
          className="inline-block"
        >
          {word}&nbsp;
        </m.span>
      ))}
    </span>
  );
}

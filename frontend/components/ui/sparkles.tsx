"use client";

import { cn } from "@/lib/utils";
import { Button } from "./controls";

export function SparklesButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Button variant="primary"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden px-6",
        className,
      )}
    >
      {/* Sparkle effect */}
      {children}
    </Button>
  );
}

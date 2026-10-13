"use client";

import { m, useReducedMotion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  return <div className={cn("ui-segments", className)} role="group" aria-label={label}>
    {options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
      {value === option.value && <m.span aria-hidden="true" className="ui-segment-selection" layoutId={reduceMotion ? undefined : id} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
      <span>{option.label}</span>
    </button>)}
  </div>;
}

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Native controls with the shared Aceternity-inspired border/inner-highlight treatment.
// Keep browser semantics, autofill, keyboard support and form submission intact.
export function Button({ className, variant = "secondary", type = "button", ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button type={type} className={cn("ui-button", `ui-button-${variant}`, className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("ui-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("ui-input", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("ui-input", className)} {...props} />;
}

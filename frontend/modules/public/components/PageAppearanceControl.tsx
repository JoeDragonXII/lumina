"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/controls";
import { useBackgroundMode } from "./BackgroundContext";

export default function PageAppearanceControl() {
  const { mode, toggleMode } = useBackgroundMode();
  return <Button className="page-appearance-action" variant="secondary" aria-label="切换背景" title="切换背景" aria-pressed={mode === "aurora"} onClick={toggleMode}><Palette size={18} aria-hidden="true" /></Button>;
}

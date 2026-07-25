"use client";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { HERO_IMAGE } from "@/modules/core/site";
import { useBackgroundMode } from "./BackgroundContext";

/**
 * 统一背景组件 — 根据用户偏好自动切换：
 * - "image"：全屏照片 + 暗色渐变遮罩（home-flow-background 模式）
 * - "aurora"：AuroraBackground Canvas 极光动画
 */
export function GlobalBackground() {
  const { mode } = useBackgroundMode();

  if (mode === "aurora") {
    return <AuroraBackground className="fixed inset-0 z-0" />;
  }

  return (
    <div className="home-flow-background" aria-hidden="true">
      <img alt="" className="home-flow-background-media" src={HERO_IMAGE} />
      <div className="home-flow-background-shade" />
    </div>
  );
}

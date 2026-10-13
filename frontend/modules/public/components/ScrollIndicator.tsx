"use client";

import { m } from "motion/react";

/**
 * 向下滚动指示器 —— 在 Hero 区域底部显示一个微妙的动画箭头，
 * 提示用户可以向下滚动查看更多内容。
 */
export function ScrollIndicator() {
  return (
    <div className="pointer-events-none absolute top-[85vh] inset-x-0 z-[20] flex justify-center">
      <m.div
        className="flex flex-col items-center gap-2 text-white/40"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <m.span
          className="text-xs tracking-[0.2em] uppercase text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.6 }}
        >
          scroll
        </m.span>
        <m.div
          className="flex flex-col items-center gap-0.5"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="20"
            height="10"
            viewBox="0 0 20 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white/40"
          >
            <path
              d="M2 2L10 8L18 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </m.div>
      </m.div>
    </div>
  );
}

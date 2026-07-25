"use client";

import { ChineseTextReveal } from "@/modules/public/components/ChineseTextReveal";
import { PageHeroBackground } from "@/modules/public/components/PageHeroBackground";

/**
 * 首页 Hero 区域 - Aceternity 风格。
 * AuroraBackground 动态极光背景 + 中文字符逐字渐入 + 闪光 CTA 按钮。
 */
export function HomeHeroClient({
  coverUrl,
  coverAlt,
}: {
  coverUrl?: string | null;
  coverAlt?: string;
}) {
  return (
    <PageHeroBackground coverUrl={coverUrl} coverAlt={coverAlt} heroHeightClass="h-[85vh]">
      <div className="public-page-container flex flex-col items-center text-center px-4">
        <ChineseTextReveal
          text="照片留下，"
          className="text-4xl font-bold tracking-wide text-white sm:text-5xl md:text-6xl lg:text-7xl"
          as="h1"
        />

        <ChineseTextReveal
          text="时间继续。"
          className="my-3 text-4xl font-bold tracking-wide text-white sm:text-5xl md:text-6xl lg:text-7xl"
          as="h1"
        />

        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-neutral-300 sm:text-lg md:mt-8 md:max-w-xl">
          把那些对你们来说最重要的地点串成一条路线，
          <br />
          像一本安放在地图上的相册，一页一页翻过去。
        </p>
      </div>
    </PageHeroBackground>
  );
}

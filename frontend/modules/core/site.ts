export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Lumina",
  description: "用图集、时间线和地图整理值得留下的照片。",
  owner: process.env.NEXT_PUBLIC_SITE_OWNER || "",
  port: 3002,
} as const;

export const archiveCategories = ["摄影作品", "旅行", "日常", "人物", "Love", "其他"] as const;

/** 全站共享的默认背景图片 URL，首页、图集等页面共用同一张 */
export const HERO_IMAGE = "https://picsum.photos/id/1015/2400/1600";

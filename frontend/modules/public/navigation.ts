import { Home, Images, Map, Timer } from "lucide-react";
import type { PublicNavItem, PublicSceneId } from "@/modules/public/types";

export const publicNavItems: PublicNavItem[] = [
  { id: "home", href: "/", label: "首页", labelEn: "Home", index: "01", icon: Home },
  { id: "works", href: "/works", label: "作品", labelEn: "Works", index: "02", icon: Images },
  { id: "timeline", href: "/timeline", label: "时间线", labelEn: "Timeline", index: "03", icon: Timer },
  { id: "map", href: "/map", label: "足迹", labelEn: "Places", index: "04", icon: Map },
];

export function getPublicSceneId(pathname: string): PublicSceneId {
  if (pathname.startsWith("/works")) return "works";
  if (pathname.startsWith("/timeline")) return "timeline";
  if (pathname.startsWith("/map") || pathname.startsWith("/province")) return "map";
  return "home";
}

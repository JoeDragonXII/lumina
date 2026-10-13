"use client";

import { usePathname } from "next/navigation";
import { Clock3, Home, Images, MapPin, SlidersHorizontal } from "lucide-react";
import { FloatingDock } from "@/components/ui/floating-dock";

export default function HomeDockNav() {
  const pathname = usePathname();
  const items = [
    { icon: <Home size={22} />, label: "首页", href: "/" },
    { icon: <Images size={22} />, label: "图集", href: "/archive" },
    { icon: <MapPin size={22} />, label: "地图", href: "/map" },
    { icon: <Clock3 size={22} />, label: "时间线", href: "/timeline" },
    { icon: <SlidersHorizontal size={22} />, label: "Studio", href: "/studio" },
  ].map(item => ({
    ...item,
    active: item.href === "/" ? pathname === "/" :
      pathname === item.href || pathname.startsWith(item.href + "/") ||
      (item.href === "/archive" && (pathname === "/works" || pathname.startsWith("/works/"))) ||
      (item.href === "/map" && (pathname.startsWith("/province/") || pathname === "/preview/map-legacy")),
  }));
  return <>
    <nav aria-label="全站导航" className="site-dock site-dock-desktop" data-global-nav>
      <FloatingDock items={items} orientation="vertical" />
    </nav>
    <nav aria-label="全站导航" className="site-dock site-dock-mobile" data-global-nav>
      <FloatingDock items={items} orientation="horizontal" />
    </nav>
  </>;
}

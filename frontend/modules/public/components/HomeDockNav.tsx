"use client";

import { usePathname } from "next/navigation";
import { Clock3, Home, Images, MapPin, Palette, SlidersHorizontal } from "lucide-react";

import { FloatingDock } from "@/components/ui/floating-dock";
import { useBackgroundMode } from "./BackgroundContext";

export default function HomeDockNav({
  mapPaletteAction,
}: {
  mapPaletteAction?: {
    active: boolean;
    onClick: () => void;
  };
}) {
  const pathname = usePathname();
  const { toggleMode } = useBackgroundMode();

  const navItems = [
    { icon: <Home size={22} />, label: "首页", href: "/" },
    { icon: <Images size={22} />, label: "图集", href: "/archive" },
    { icon: <MapPin size={22} />, label: "地图", href: "/map" },
    { icon: <Clock3 size={22} />, label: "时间线", href: "/timeline" },
    { icon: <SlidersHorizontal size={22} />, label: "Studio", href: "/studio" },
    {
      icon: <Palette size={22} />,
      label: mapPaletteAction ? "地图配色" : "切换背景",
      onClick: mapPaletteAction?.onClick ?? toggleMode,
      active: mapPaletteAction?.active,
    },
  ];

  const items = navItems.map((item) => ({
    ...item,
    active:
      item.active ??
      (item.href
        ? item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href)
        : false),
  }));

  return (
    <>
      <nav
        aria-label="全站导航"
        className="home-flow-dock fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 md:block"
      >
        <FloatingDock items={items} orientation="vertical" />
      </nav>

      <nav
        aria-label="全站导航"
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:hidden"
      >
        <FloatingDock items={items} orientation="horizontal" />
      </nav>
    </>
  );
}

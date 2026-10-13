"use client";

import { Home, Images, LogOut, Plus, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FloatingDock } from "@/components/ui/floating-dock";

export default function StudioNav({ showLogout = true }: { showLogout?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const response = await fetch("/api/studio/auth/logout", { method: "POST" });
    if (!response.ok) return;
    router.replace("/studio/login");
    router.refresh();
  }

  const items = [
    { href: "/", label: "查看公开网站", icon: <Home size={22} />, active: false },
    { href: "/studio", label: "图集", icon: <Images size={22} />, active: pathname === "/studio" || /^\/studio\/[a-f0-9-]+$/.test(pathname) },
    { href: "/studio/new", label: "新建", icon: <Plus size={22} />, active: pathname === "/studio/new" },
    { href: "/studio/settings", label: "设置", icon: <Settings size={22} />, active: pathname === "/studio/settings" },
    ...(showLogout ? [{ label: "退出登录", icon: <LogOut size={22} />, onClick: logout, active: false }] : []),
  ];

  return <>
    <nav aria-label="Studio 导航" className="site-dock site-dock-desktop"><FloatingDock items={items} orientation="vertical" magnify={false} /></nav>
    <nav aria-label="Studio 导航" className="site-dock site-dock-mobile"><FloatingDock items={items} orientation="horizontal" magnify={false} /></nav>
  </>;
}

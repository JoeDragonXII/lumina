"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, Images, LogOut, Plus, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/studio", label: "图集", icon: Images },
  { href: "/studio/new", label: "新建", icon: Plus },
  { href: "/studio/settings", label: "设置", icon: Settings },
];

export default function StudioNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/studio/auth/logout", { method: "POST" });
    router.replace("/studio/login");
    router.refresh();
  }

  return (
    <aside className="studio-sidebar border-b border-neutral-200 bg-white lg:min-h-dvh lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-6 lg:py-8">
        <Link className="flex items-center gap-3 text-sm font-semibold text-neutral-950" href="/studio">
          <BookOpen className="h-5 w-5" />
          Lumina Studio
        </Link>
        <Link aria-label="查看公开网站" className="text-neutral-500 hover:text-neutral-950 lg:hidden" href="/">
          <ExternalLink className="h-5 w-5" />
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/studio" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm font-medium transition ${
                active ? "on-dark bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden px-4 py-8 lg:block">
        <Link className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-950" href="/">
          <ExternalLink className="h-4 w-4" />
          查看公开网站
        </Link>
        <button className="mt-1 flex w-full items-center gap-3 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-950" onClick={logout}>
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}

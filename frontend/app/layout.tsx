import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/modules/core/site";
import "./globals.css";
import UIProvider from "@/components/ui/UIProvider";
import "./unified-surfaces.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  icons: { icon: "/icons/icon-192.svg" },
};

export const viewport: Viewport = { themeColor: "#0b101a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" data-scroll-behavior="smooth"><body><UIProvider>{children}</UIProvider></body></html>;
}

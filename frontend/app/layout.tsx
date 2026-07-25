import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/modules/core/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  icons: { icon: "/icons/icon-192.svg" },
};

export const viewport: Viewport = { themeColor: "#07110f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

import type { LucideIcon } from "lucide-react";

export type PublicSceneId = "home" | "works" | "timeline" | "map";

export interface PublicNavItem {
  id: PublicSceneId;
  href: string;
  label: string;
  labelEn: string;
  index: string;
  icon: LucideIcon;
}

export interface GalleryViewerState {
  activeIndex: number | null;
  direction: -1 | 0 | 1;
}

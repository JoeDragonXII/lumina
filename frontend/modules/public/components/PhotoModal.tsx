"use client";
import PhotoCardDialog from "@/components/ui/PhotoCardDialog";
import type { FlowPhoto } from "./MasonryFlowWall";

export type PhotoDetail = FlowPhoto & {
  date?: string; location?: string; description?: string; camera?: string; lens?: string;
  settings?: string; photographer?: string; tags?: string[];
};
type Props = { photo: PhotoDetail | null; onClose: () => void; onPrev?: () => void; onNext?: () => void; hasPrev?: boolean; hasNext?: boolean };
export default function PhotoModal(props: Props) {
  return <PhotoCardDialog {...props} />;
}

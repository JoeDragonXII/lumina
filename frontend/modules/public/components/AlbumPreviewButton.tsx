"use client";

import { useState } from "react";
import { ScanEye } from "lucide-react";
import PhotoCardDialog, { type CardPhoto } from "@/components/ui/PhotoCardDialog";
import { Button } from "@/components/ui/controls";
import styles from "./PhotoLibrary.module.css";

export default function AlbumPreviewButton({ photo, title }: { photo: CardPhoto; title: string }) {
  const [open, setOpen] = useState(false);
  return <><Button className={styles.previewButton} variant="ghost" aria-label={`预览 ${title} 封面`} title="预览封面" onClick={() => setOpen(true)}><ScanEye size={18} strokeWidth={1.5} /></Button>
    <PhotoCardDialog photo={open ? photo : null} onClose={() => setOpen(false)} />
  </>;
}

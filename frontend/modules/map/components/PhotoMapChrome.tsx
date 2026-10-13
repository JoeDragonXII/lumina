"use client";

import { Crosshair, LocateFixed, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/controls";
import styles from "./PhotoMapChrome.module.css";

export default function PhotoMapChrome({ count, center, onZoom, onReset }: {
  count: number;
  center: [number, number];
  onZoom: (direction: 1 | -1) => void;
  onReset: () => void;
}) {
  const latitude = `${Math.abs(center[1]).toFixed(4)}° ${center[1] < 0 ? "S" : "N"}`;
  const longitude = `${Math.abs(center[0]).toFixed(4)}° ${center[0] < 0 ? "W" : "E"}`;
  return <>
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="返回 Lumina 首页"><Sparkles size={18} strokeWidth={1.5} /><span>LUMINA</span></Link>
      <span className={styles.count}>影像地图 <i />{count} 张照片</span>
    </header>

    <div className={styles.coordinates}><Crosshair size={13} /><span>{latitude} · {longitude}</span></div>
    <div className={styles.controls} aria-label="地图控制" data-map-controls>
      <Button variant="ghost" aria-label="放大地图" title="放大地图" onClick={() => onZoom(1)}><ZoomIn size={18} /></Button>
      <Button variant="ghost" aria-label="缩小地图" title="缩小地图" onClick={() => onZoom(-1)}><ZoomOut size={18} /></Button>
      <Button variant="ghost" aria-label="回到当前摄影范围" title="回到当前摄影范围" onClick={onReset}><LocateFixed size={18} /></Button>
    </div>
  </>;
}

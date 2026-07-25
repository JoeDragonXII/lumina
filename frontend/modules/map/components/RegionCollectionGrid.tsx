"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CollectionCard from "@/modules/public/components/CollectionCard";
import type { CollectionRecord } from "@backend/modules/library/types";

export default function RegionCollectionGrid({
  regionName,
  backHref,
  collections,
}: {
  regionName: string;
  backHref: string;
  collections: CollectionRecord[];
}) {
  return (
    <div className="region-collection-shell">
      {/* Header */}
      <div className="region-collection-header">
        <Link href={backHref} className="country-map-back">
          <ArrowLeft size={16} />
          <span>返回上级</span>
        </Link>
        <h2 className="country-map-title">
          {regionName}
          <span className="country-map-count">{collections.length} 个图集</span>
        </h2>
      </div>

      {/* Cards */}
      {collections.length === 0 ? (
        <div className="country-map-empty">
          <p className="public-kicker">暂无图集</p>
          <p style={{ color: "var(--public-muted)" }}>
            该区域下暂无公开图集。
          </p>
        </div>
      ) : (
        <div className="archive-grid">
          {collections.map((col, idx) => (
            <CollectionCard key={col.id} collection={col} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

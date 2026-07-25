"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { m } from "motion/react";
import { collectionCover, collectionDateLabel } from "@/modules/library/format";
import type { CollectionRecord } from "@backend/modules/library/types";
import { mediaUrl } from "@/modules/media/urls";
import { publicMotion } from "@/modules/public/motion";

export default function CollectionCard({ collection, priority = false, index = 0 }: Readonly<{ collection: CollectionRecord; priority?: boolean; index?: number }>) {
  const cover = collectionCover(collection);
  return (
    <m.article className="archive-card" initial={{ opacity: 0, y: 24 }} transition={{ duration: publicMotion.duration.slow, delay: Math.min(index, 5) * 0.055, ease: publicMotion.ease }} viewport={{ amount: 0.12, once: true }} whileInView={{ opacity: 1, y: 0 }}>
      <Link className="archive-card-link" href={`/works/${collection.slug}`}>
        <div className="archive-card-media">
          {cover ? <Image alt={collection.title} className="archive-card-image" height={cover.height} priority={priority} sizes="(max-width: 639px) 100vw, (max-width: 1099px) 50vw, 33vw" src={mediaUrl(cover.id, "display")} width={cover.width} /> : <div className="archive-card-missing">No cover image</div>}
          <div className="archive-card-overlay" />
          <span className="archive-card-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="archive-card-open"><ArrowUpRight className="h-4 w-4" /></span>
          <div className="archive-card-copy">
            <div><p>{collection.category}</p><h2>{collection.title}</h2></div>
            <div className="archive-card-meta"><time>{collectionDateLabel(collection)}</time>{collection.location ? <span><MapPin className="h-3.5 w-3.5" />{collection.location.displayName}</span> : null}</div>
          </div>
        </div>
      </Link>
    </m.article>
  );
}

"use client";

import Image from "next/image";
import { m } from "motion/react";
import { MapPin } from "lucide-react";
import { collectionDateLabel } from "@/modules/library/format";
import type { CollectionRecord } from "@backend/modules/library/types";
import { mediaUrl } from "@/modules/media/urls";
import { publicMotion } from "@/modules/public/motion";

export default function FloatingCollectionWall({ collections }: Readonly<{ collections: CollectionRecord[] }>) {
  const photos = collections
    .flatMap((collection) => collection.photos.map((photo) => ({ collection, photo })))
    .slice(0, 18);

  return (
    <div className="masonry-stream">
      {photos.map(({ collection, photo }, index) => {
        return (
          <m.div
            className="masonry-stream-item"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            key={`${collection.id}-${photo.id}`}
            transition={{ duration: publicMotion.duration.slow, delay: index * 0.07, ease: publicMotion.ease }}
            viewport={{ amount: 0.25, once: true }}
            whileHover={{ y: -4 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className="masonry-stream-link">
              <Image alt={photo.alt || collection.title} className="masonry-stream-image" height={photo.height} priority={index < 3} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" src={mediaUrl(photo.id, "display")} width={photo.width} />
              <span className="masonry-stream-caption">
                <span>
                  <strong>{collection.title}</strong>
                  <small>{collectionDateLabel(collection)}{collection.location ? <><i aria-hidden="true">·</i><MapPin className="h-3 w-3" />{collection.location.displayName}</> : null}</small>
                </span>
              </span>
            </div>
          </m.div>
        );
      })}
    </div>
  );
}

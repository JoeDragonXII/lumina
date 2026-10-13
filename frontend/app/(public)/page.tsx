import { libraryRepository } from "@backend/modules/library/server/repository";
import { selectHomePhotos } from "@/modules/library/homePhotos";
import { timelineDay } from "@/modules/library/timeline";
import { mediaUrl } from "@/modules/media/urls";
import { GlobalBackground } from "@/modules/public/components/GlobalBackground";
import MasonryFlowWall from "@/modules/public/components/MasonryFlowWall";
import { randomInt } from "node:crypto";

export const dynamic = "force-dynamic";

function photoName(value: string) {
  const name = value.trim().replace(/\.(arw|cr2|cr3|nef|dng|raw|jpe?g|png|heic|tiff?)$/i, "");
  return /^(?:ARW|RAW)(?:$|\b|[ _-])/i.test(name) || /^(?:DSC|IMG|DSCF|DSCN|PXL|_DSC)[_ -]?\d/i.test(name) ? "" : name;
}

export default function HomePage() {
  const collections = libraryRepository.listCollections();
  const layoutSeed = randomInt(0, 0x100000000);
  const photos = selectHomePhotos(collections, 48, layoutSeed).map(({ photo, collection }) => ({
    id: photo.id,
    src: mediaUrl(photo.id, "thumb"),
    srcSet: `${mediaUrl(photo.id, "thumb")} ${photo.variants.find(v => v.variant === "thumb")?.width || Math.round(photo.width * Math.min(1, 480 / Math.max(photo.width, photo.height)))}w, ${mediaUrl(photo.id, "display")} ${photo.variants.find(v => v.variant === "display")?.width || Math.round(photo.width * Math.min(1, 1600 / Math.max(photo.width, photo.height)))}w`,
    sizes: "(min-width: 768px) 24vw, 48vw",
    width: photo.width,
    height: photo.height,
    title: photoName(photo.alt) || collection.location?.displayName?.trim() || collection.location?.city?.trim() || photoName(photo.originalName) || undefined,
    date: timelineDay(photo.takenAt) || timelineDay(collection.dateStart) || undefined,
    href: `/map?collection=${encodeURIComponent(collection.slug)}`,
  }));

  return (
    <main className="home-flow" data-theme="dark">
      <GlobalBackground />
      <section className="home-flow-stream" aria-label="首页照片墙">
        <MasonryFlowWall photos={photos} layoutSeed={layoutSeed} />
      </section>
    </main>
  );
}

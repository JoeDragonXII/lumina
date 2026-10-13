import { libraryRepository } from "@backend/modules/library/server/repository";
import { mediaUrl } from "@/modules/media/urls";
import type { FlowPhoto } from "@/modules/public/components/MasonryFlowWall";
import PreviewHomeClient from "./PreviewHomeClient";

export const dynamic = "force-dynamic";

const DEMO_IMAGE_IDS = [
  1011, 1018, 1025, 1035, 1040, 1043, 1050, 1056, 1067, 1074, 1084, 1080,
  1081, 1003, 1015, 1020, 1027, 1039, 1047, 1060, 1069, 1076, 1082, 1083,
];

const DEMO_RATIOS: Array<[number, number]> = [
  [4, 5],
  [3, 4],
  [4, 3],
  [1, 1],
  [3, 4],
  [4, 5],
];

function previewContent() {
  const collections = libraryRepository.listCollections().filter((collection) => collection.photos.length > 0);
  const photos: FlowPhoto[] = [];
  const seenAssets = new Set<string>();
  const maxPhotos = Math.max(0, ...collections.map((collection) => collection.photos.length));

  for (let photoIndex = 0; photoIndex < maxPhotos && photos.length < 24; photoIndex += 1) {
    for (const collection of collections) {
      const photo = collection.photos[photoIndex];
      if (!photo || seenAssets.has(photo.id)) continue;
      seenAssets.add(photo.id);
      photos.push({
        id: `${collection.id}-${photo.id}-${photoIndex}`,
        src: mediaUrl(photo.id, "display"),
        width: photo.width,
        height: photo.height,
        title: collection.title,
        href: `/works/${encodeURIComponent(collection.slug)}`,
      });
      if (photos.length === 24) break;
    }
  }

  if (photos.length < 12) {
    DEMO_IMAGE_IDS.slice(0, 24 - photos.length).forEach((imageId, index) => {
      const [widthRatio, heightRatio] = DEMO_RATIOS[index % DEMO_RATIOS.length];
      const width = 900;
      const height = Math.round((width * heightRatio) / widthRatio);
      photos.push({
        id: `preview-demo-${imageId}`,
        src: `https://picsum.photos/id/${imageId}/${width}/${height}`,
        width,
        height,
        href: "/archive",
      });
    });
  }

  return { photos, collectionCount: collections.length };
}

export default function PreviewHomePage() {
  const { photos, collectionCount } = previewContent();

  return <PreviewHomeClient collectionCount={collectionCount} photos={photos} />;
}

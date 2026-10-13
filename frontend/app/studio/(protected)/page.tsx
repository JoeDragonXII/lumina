import { libraryRepository } from "@backend/modules/library/server/repository";
import { mediaUrl } from "@/modules/media/urls";
import CollectionLibrary from "@/modules/studio/components/CollectionLibrary";

export const dynamic = "force-dynamic";
export default function StudioPage() {
  const items = libraryRepository.listCollections({ visibility: "all" }).map((item) => {
    const cover = item.photos.find((photo) => photo.id === item.coverAssetId) || item.photos[0];
    return { id: item.id, title: item.title, category: item.category, count: item.photos.length, cover: cover ? mediaUrl(cover.id, "display") : null, location: item.location?.displayName || "", visibility: item.visibility };
  });
  return <CollectionLibrary items={items} />;
}

import { libraryRepository } from "@backend/modules/library/server/repository";
import MapPageUI from "./map-page-ui";
import { type PhotoPlace } from "@/modules/map/components/PrintedPhotoMap";
import MapCollectionExperience from "@/modules/map/components/MapCollectionExperience";
import { listPublicCollectionSummaries } from "@backend/modules/library/server/publicRead";
import { mediaUrl } from "@/modules/media/urls";


export const dynamic = "force-dynamic";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{
    display?: string | string[];
    view?: string | string[];
    theme?: string | string[];
  }>;
}) {
  const { display, theme, view } = await searchParams;
  const requestedView = Array.isArray(view) ? view[0] : view;
  const isLegacyView = requestedView === "legacy" || requestedView === "flat" || requestedView === "globe" || display !== undefined || theme !== undefined;
  if (!isLegacyView) {
    const collections = listPublicCollectionSummaries();
    const places: PhotoPlace[] = collections.flatMap(collection => {
      if (!collection.cover || !collection.position) return [];
      return [{ id: collection.id, label: collection.title, note: "", count: collection.count,
        ...collection.position, imageUrl: mediaUrl(collection.cover.id, "thumb"), href: `/works/${encodeURIComponent(collection.slug)}` }];
    });
    return <MapCollectionExperience places={places} albumSummaries={collections.map(({id,slug,title})=>({id,slug,title}))} />;
  }
  const { counts } = libraryRepository.getMapSummary();
  return (
    <MapPageUI
      counts={counts}
      display={Array.isArray(display) ? display[0] : display}
      theme={Array.isArray(theme) ? theme[0] : theme}
      view={Array.isArray(view) ? view[0] : view}
    />
  );
}

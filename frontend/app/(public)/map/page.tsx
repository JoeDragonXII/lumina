import { libraryRepository } from "@backend/modules/library/server/repository";
import MapPageUI from "./map-page-ui";

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

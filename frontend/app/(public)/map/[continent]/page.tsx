import { notFound, redirect } from "next/navigation";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { GLOBAL_REGIONS } from "@/modules/map/data/globalRegions";
import MapPageUI from "../map-page-ui";

const VALID_CONTINENTS = new Set(GLOBAL_REGIONS.map((r) => r.key));

export default async function ContinentPage({
  params,
  searchParams,
}: {
  params: Promise<{ continent: string }>;
  searchParams: Promise<{
    display?: string | string[];
    view?: string | string[];
    theme?: string | string[];
  }>;
}) {
  const { continent } = await params;
  const { display, theme, view } = await searchParams;
  const normalizedDisplay = Array.isArray(display) ? display[0] : display;
  const normalizedView = Array.isArray(view) ? view[0] : view;
  const normalizedTheme = Array.isArray(theme) ? theme[0] : theme;
  const redirectQuery = new URLSearchParams();
  if (normalizedDisplay === "classic") redirectQuery.set("display", "classic");
  if (normalizedTheme === "daylight") redirectQuery.set("theme", "daylight");
  if (normalizedTheme === "night-gold") redirectQuery.set("theme", "night-gold");
  const redirectQueryString = redirectQuery.toString();
  const redirectSuffix = redirectQueryString ? `?${redirectQueryString}` : "";

  // /map/world redirects to /map
  if (continent === "world") {
    redirect(`/map${redirectSuffix}`);
  }

  // Validate continent exists
  if (!VALID_CONTINENTS.has(continent)) {
    notFound();
  }

  if (normalizedView === "globe") {
    redirect(`/map/${continent}${redirectSuffix}`);
  }

  const { counts } = libraryRepository.getMapSummary();
  return (
    <MapPageUI
      counts={counts}
      continent={continent}
      display={normalizedDisplay}
      theme={normalizedTheme}
    />
  );
}

import MapPageUI from "../../map/map-page-ui";

export default async function LegacyPreviewMapPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => Array.isArray(params[key]) ? params[key][0] : params[key];
  return <MapPageUI continent={value("continent")} counts={{}} display={value("display")} photoGridPreview routeRoot="/preview/map-legacy" theme={value("theme")} view={value("view")} />;
}

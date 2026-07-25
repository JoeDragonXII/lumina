import { notFound } from "next/navigation";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { GLOBAL_REGIONS } from "@/modules/map/data/globalRegions";
import { worldCountryByCode } from "@backend/modules/map/data/worldCountries";
import RegionCollectionGrid from "@/modules/map/components/RegionCollectionGrid";

export const dynamic = "force-dynamic";

const VALID_CONTINENTS = new Set(GLOBAL_REGIONS.map((r) => r.key));

export default async function RegionPage({
  params,
}: {
  params: Promise<{ continent: string; country: string; region: string }>;
}) {
  const { continent, country, region } = await params;
  if (!VALID_CONTINENTS.has(continent)) notFound();

  const countryCode = country.toUpperCase();
  const countryInfo = worldCountryByCode[countryCode];
  if (!countryInfo) notFound();

  const regionName = decodeURIComponent(region);

  // For China: match by province ID or name
  let collections;
  if (countryCode === "CN") {
    const allCn = libraryRepository.listCollections({
      country: "CN",
      visibility: "public",
    });
    collections = allCn.filter(
      (col) =>
        col.location?.regionCode === regionName ||
        col.location?.regionName === regionName ||
        col.location?.city?.toLowerCase() === regionName.toLowerCase(),
    );
  } else {
    collections = libraryRepository.listCollections({
      country: countryCode,
      city: regionName,
      visibility: "public",
    });
  }

  return (
    <main className="public-map-page" data-theme="dark">
      <RegionCollectionGrid
        regionName={regionName}
        backHref={`/map/${continent}/${country.toLowerCase()}`}
        collections={collections}
      />
    </main>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { GLOBAL_REGIONS } from "@/modules/map/data/globalRegions";
import { worldCountryByCode } from "@backend/modules/map/data/worldCountries";
import ChinaArchiveMap from "@/modules/map/components/ChinaArchiveMap";
import CountryMapView from "@/modules/map/components/CountryMapView";
import type { MapMarker } from "@/modules/map/components/AsiaMap";
import SceneMeta from "@/modules/public/components/SceneMeta";
import SectionReveal from "@/modules/public/components/SectionReveal";

export const dynamic = "force-dynamic";

const VALID_CONTINENTS = new Set(GLOBAL_REGIONS.map((r) => r.key));

export default async function CountryPage({
  params,
}: {
  params: Promise<{ continent: string; country: string }>;
}) {
  const { continent, country } = await params;
  if (!VALID_CONTINENTS.has(continent)) notFound();

  const countryCode = country.toUpperCase();
  const countryInfo = worldCountryByCode[countryCode];
  if (!countryInfo) notFound();

  const countryName = countryInfo.name;

  // Fetch collections for this country
  const collections = libraryRepository.listCollections({
    country: countryCode,
    visibility: "public",
  });

  if (collections.length === 0) {
    return (
      <main className="public-map-page" data-theme="dark">
        <header className="place-map-header">
          <div className="public-page-container">
            <Link
              className="place-back-link"
              href={`/map/${continent}`}
            >
              <ArrowLeft className="h-4 w-4" />
              返回{GLOBAL_REGIONS.find((r) => r.key === continent)?.label ?? continent}
            </Link>
            <SectionReveal>
              <SceneMeta index="04" label={countryCode} />
              <h1>{countryName}</h1>
              <p>该国家暂无公开图集。</p>
            </SectionReveal>
          </div>
        </header>
        <section className="public-page-container">
          <div className="map-empty-state">
            <p style={{ color: "var(--public-muted)" }}>
              暂无公开图集。上传包含地理位置信息的照片后，地图将自动更新。
            </p>
          </div>
        </section>
      </main>
    );
  }

  // For China, use the provincial map
  if (countryCode === "CN") {
    const counts: Record<string, number> = {};
    const markers: MapMarker[] = [];

    for (const col of collections) {
      const loc = col.location;
      if (!loc) continue;
      if (loc.regionCode) {
        counts[loc.regionCode] = (counts[loc.regionCode] || 0) + 1;
      }
      if (
        typeof loc.latitude === "number" &&
        typeof loc.longitude === "number"
      ) {
        markers.push({
          id: col.id,
          title: col.title,
          countryCode: "CN",
          latitude: loc.latitude,
          longitude: loc.longitude,
          href: `/works/${col.slug}`,
        });
      }
    }

    return (
      <main className="public-map-page" data-theme="dark">
        <header className="place-map-header">
          <div className="public-page-container">
            <Link className="place-back-link" href={`/map/${continent}`}>
              <ArrowLeft className="h-4 w-4" />
              返回
              {GLOBAL_REGIONS.find((r) => r.key === continent)?.label ?? continent}
            </Link>
            <SectionReveal>
              <SceneMeta index="04" label="China" />
              <h1>中国足迹</h1>
              <p>选择省份或照片坐标，继续进入关联的摄影档案。</p>
            </SectionReveal>
          </div>
        </header>
        <section className="public-page-container map-stage-section china-stage-section">
          <ChinaArchiveMap counts={counts} markers={markers} />
        </section>
      </main>
    );
  }

  // For other countries, render single-country map + collection cards
  return (
    <main className="public-map-page" data-theme="dark">
      <CountryMapView
        countryCode={countryCode}
        countryName={countryName}
        collections={collections}
      />
    </main>
  );
}

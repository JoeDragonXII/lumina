import { publicRegionFeatures } from "@backend/modules/map/server/cityLabels";

export function GET() {
  return Response.json(publicRegionFeatures(), {
    headers: { "cache-control": "public, max-age=86400, s-maxage=604800" },
  });
}

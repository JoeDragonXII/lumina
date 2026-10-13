import type { NextRequest } from "next/server";
import type { StyleSpecification } from "maplibre-gl";
import { simplifyPublicMapStyle } from "@backend/modules/map/server/publicMapStyle";

const OPENFREEMAP_ORIGIN = "https://tiles.openfreemap.org";
const LOCAL_PROXY_PREFIX = "/api/openfreemap/";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ path: string[] }>;
  },
) {
  const { path } = await params;
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const upstreamUrl = new URL(encodedPath, `${OPENFREEMAP_ORIGIN}/`);
  upstreamUrl.search = request.nextUrl.search;
  const simplifyStyle = path.join("/") === "styles/positron" && request.nextUrl.searchParams.get("detail") === "photo";
  upstreamUrl.searchParams.delete("detail");
  upstreamUrl.searchParams.delete("styleVersion");

  const upstreamResponse = await fetch(upstreamUrl, {
    cache: "force-cache",
    signal: request.signal,
  });

  if (!upstreamResponse.ok) {
    return new Response("OpenFreeMap resource is unavailable", {
      status: upstreamResponse.status,
    });
  }

  const contentType =
    upstreamResponse.headers.get("content-type") ?? "application/octet-stream";
  const headers = new Headers({
    "access-control-allow-origin": "*",
    "cache-control": simplifyStyle && process.env.NODE_ENV === "development"
      ? "no-store"
      : "public, max-age=3600, s-maxage=86400",
    "content-type": contentType,
  });

  if (contentType.includes("json")) {
    const body = (await upstreamResponse.text()).replaceAll(
      `${OPENFREEMAP_ORIGIN}/`,
      `${request.nextUrl.origin}${LOCAL_PROXY_PREFIX}`,
    );
    return new Response(simplifyStyle
      ? JSON.stringify(simplifyPublicMapStyle(JSON.parse(body) as StyleSpecification))
      : body, { headers });
  }

  return new Response(upstreamResponse.body, { headers });
}

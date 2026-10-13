import "server-only";
export type PlaceSearchResult = { id: string; name: string; address: string; latitude: number; longitude: number };
export function normalizePlaceResults(value: unknown): PlaceSearchResult[] {
  const features = (value as { features?: unknown[] } | null)?.features;
  if (!Array.isArray(features)) return [];
  return features.flatMap((feature, index) => {
    const f = feature as { geometry?: { type?: string; coordinates?: unknown[] }; properties?: Record<string, unknown> };
    const [lng, lat] = Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates : [];
    if (f?.geometry?.type !== 'Point' || typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) return [];
    const properties = f.properties || {};
    const text = (key: string) => typeof properties[key] === 'string' ? properties[key] as string : '';
    return [{ id: `${properties.osm_type || ''}-${properties.osm_id || index}`, name: text('name') || text('street') || text('city') || '地图位置', address: [...new Set(['country','state','city','district','street','housenumber'].map(text).filter(Boolean))].join(' · '), latitude: lat, longitude: lng }];
  }).slice(0, 6);
}
export async function searchPlaces(query: string, city = '') {
  const place = query.trim();
  if (!place || place.length > 160) throw new Error('请输入 1–160 个字符的地点名称。');
  if (city.trim().length > 64) throw new Error('城市名称不能超过 64 个字符。');
  const q = [city.trim(), place].filter(Boolean).join(' ');
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q); url.searchParams.set('limit', '6');
  const response = await fetch(url, { headers: { 'Accept-Language': 'zh,en;q=0.8' }, signal: AbortSignal.timeout(12000), cache: 'no-store' });
  if (!response.ok) throw new Error('地点搜索暂不可用，请稍后重试。');
  return normalizePlaceResults(await response.json());
}

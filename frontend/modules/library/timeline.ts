import type { CollectionRecord } from "@backend/modules/library/types";

export type TimelineQuery = { year?: string; category?: string; country?: string; city?: string };
export type TimelineEntry = { collection: CollectionRecord; start: string | null; end: string | null; source: "collection" | "photo" | "unknown" };

// Keep the recorded calendar day, rather than shifting it into the viewer's timezone.
export function timelineDay(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  const day = value.slice(0, 10);
  const parsed = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day || Number(day.slice(0, 4)) < 1000) return null;
  if (value.length > 10 && !Number.isFinite(Date.parse(value))) return null;
  return day;
}

export function timelineEntry(collection: CollectionRecord): TimelineEntry {
  const explicit = timelineDay(collection.dateStart);
  if (explicit) {
    const end = timelineDay(collection.dateEnd);
    return { collection, start: explicit, end: end && end >= explicit ? end : explicit, source: "collection" };
  }
  const days = collection.photos.map(photo => timelineDay(photo.takenAt)).filter((day): day is string => Boolean(day)).sort();
  return { collection, start: days[0] ?? null, end: days.at(-1) ?? null, source: days.length ? "photo" : "unknown" };
}

export function timelineYears(entries: TimelineEntry[]): string[] {
  const years = new Set<string>();
  for (const entry of entries) {
    if (!entry.start) continue;
    for (let year = Number(entry.start.slice(0, 4)); year <= Number((entry.end || entry.start).slice(0, 4)); year++) years.add(String(year));
  }
  return [...years].sort().reverse();
}

export function filterTimeline(entries: TimelineEntry[], query: TimelineQuery): TimelineEntry[] {
  return entries.filter(({ collection, start, end }) => {
    if (query.year === "undated" ? start !== null : query.year && (!start || query.year < start.slice(0, 4) || query.year > (end || start).slice(0, 4))) return false;
    if (query.category && collection.category !== query.category) return false;
    if (query.country && collection.location?.countryCode.toUpperCase() !== query.country.toUpperCase()) return false;
    if (query.city && collection.location?.city?.toLocaleLowerCase() !== query.city.toLocaleLowerCase()) return false;
    return true;
  }).sort((a, b) => (b.start || "").localeCompare(a.start || "") || a.collection.id.localeCompare(b.collection.id));
}

export function groupTimeline(entries: TimelineEntry[], selectedYear?: string) {
  const years = new Map<string, Map<string, TimelineEntry[]>>();
  for (const entry of entries) {
    // A collection crossing New Year is shown once, at the start of the selected year.
    const day = entry.start && selectedYear && /^\d{4}$/.test(selectedYear) && entry.start < `${selectedYear}-01-01` ? `${selectedYear}-01-01` : entry.start;
    const year = day?.slice(0, 4) || "undated";
    const month = day?.slice(5, 7) || "unknown";
    if (!years.has(year)) years.set(year, new Map());
    const months = years.get(year)!;
    months.set(month, [...(months.get(month) || []), entry]);
  }
  return [...years].map(([year, months]) => ({ year, months: [...months].map(([month, items]) => ({ month, items })) }));
}

export function timelineHref(query: TimelineQuery): string {
  const params = new URLSearchParams();
  for (const key of ["year", "category", "country", "city"] as const) if (query[key]) params.set(key, query[key]!);
  return `/timeline${params.size ? `?${params}` : ""}`;
}

export function timelineDateLabel(entry: TimelineEntry): string {
  if (!entry.start) return "日期未标注";
  const start = entry.start.replaceAll("-", ".");
  return entry.end && entry.end !== entry.start ? `${start} — ${entry.end.replaceAll("-", ".")}` : start;
}

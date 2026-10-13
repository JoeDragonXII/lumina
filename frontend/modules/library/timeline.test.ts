import { describe, expect, it } from "vitest";
import type { CollectionRecord } from "@backend/modules/library/types";
import { filterTimeline, groupTimeline, timelineDateLabel, timelineDay, timelineEntry, timelineHref, timelineYears } from "./timeline";

function collection(overrides: Partial<CollectionRecord> = {}): CollectionRecord {
  return { id: "a", slug: "a", title: "A", story: "", category: "旅行", tags: [], visibility: "public", featured: false, dateStart: null, dateEnd: null, location: null, coverAssetId: null, photos: [], createdAt: "2026-09-19T00:00:00Z", updatedAt: "2026-09-19T00:00:00Z", deletedAt: null, ...overrides };
}

describe("photographic timeline", () => {
  it("validates dates and preserves the recorded calendar day across timezones", () => {
    expect(timelineDay("2024-02-29T23:45:00-08:00")).toBe("2024-02-29");
    for (const date of ["2026-02-29", "2026-02-30", "2026-13-01", "invalid", "2026-01-01Tbad", "2026-01", ""]) expect(timelineDay(date)).toBeNull();
  });
  it("prioritizes collection dates and ignores reversed or invalid end dates", () => {
    const entry = timelineEntry(collection({ dateStart: "2025-05-02", dateEnd: "2024-01-01", photos: [{ takenAt: "2020-01-01" }] as CollectionRecord["photos"] }));
    expect(entry).toMatchObject({ start: "2025-05-02", end: "2025-05-02", source: "collection" });
  });
  it("falls back to actual photo dates, never upload or creation dates", () => {
    const entry = timelineEntry(collection({ photos: [{ takenAt: null }, { takenAt: "bad" }, { takenAt: "2020-02-03T00:00:00Z" }, { takenAt: "2020-01-02" }] as CollectionRecord["photos"] }));
    expect(entry).toMatchObject({ start: "2020-01-02", end: "2020-02-03", source: "photo" });
    expect(timelineEntry(collection())).toMatchObject({ start: null, end: null, source: "unknown" });
  });
  it("sorts newest first with undated last and groups into years and months", () => {
    const entries = [collection(), collection({ id: "b", dateStart: "2025-02-01" }), collection({ id: "c", dateStart: "2026-01-01" })].map(timelineEntry);
    const sorted = filterTimeline(entries, {});
    expect(sorted.map(entry => entry.collection.id)).toEqual(["c", "b", "a"]);
    expect(groupTimeline(sorted).map(group => group.year)).toEqual(["2026", "2025", "undated"]);
    expect(groupTimeline(sorted)[1].months[0].month).toBe("02");
    expect(filterTimeline(entries, { year: "undated" }).map(entry => entry.collection.id)).toEqual(["a"]);
    expect(filterTimeline(entries, { year: "wrong" })).toEqual([]);
  });
  it("retains cross-year collections in year filtering without duplicating them", () => {
    const entries = [timelineEntry(collection({ dateStart: "2024-12-20", dateEnd: "2026-01-04" }))];
    expect(timelineYears(entries)).toEqual(["2026", "2025", "2024"]);
    const filtered = filterTimeline(entries, { year: "2025" });
    expect(filtered).toHaveLength(1);
    expect(groupTimeline(filtered, "2025")[0]).toMatchObject({ year: "2025", months: [{ month: "01" }] });
    expect(timelineDateLabel(entries[0])).toBe("2024.12.20 — 2026.01.04");
  });
  it("preserves other URL filters when changing a year and filters exact cities case-insensitively", () => {
    expect(timelineHref({ year: "2020", city: "New York", country: "US", category: undefined })).toBe("/timeline?year=2020&country=US&city=New+York");
    expect(timelineHref({})).toBe("/timeline");
    const entries = [timelineEntry(collection({ location: { countryCode: "US", city: "New York" } as CollectionRecord["location"] }))];
    expect(filterTimeline(entries, { country: "us", city: "new york", category: "旅行" })).toHaveLength(1);
    expect(filterTimeline(entries, { city: "York" })).toHaveLength(0);
    expect(filterTimeline(entries, { category: "日常" })).toHaveLength(0);
  });
});

import Link from "next/link";
import { Images, X } from "lucide-react";
import { archiveCategories } from "@/modules/core/site";
import { collectionCover } from "@/modules/library/format";
import { filterTimeline, groupTimeline, timelineDateLabel, timelineEntry, timelineHref, timelineYears, type TimelineQuery } from "@/modules/library/timeline";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { mediaUrl } from "@/modules/media/urls";
import { BeamCard } from "@/components/ui/beam-card";
import { Button, Input, Select } from "@/components/ui/controls";
import TimelineCover from "@/modules/public/components/TimelineCover";
import TimelineFilters from "@/modules/public/components/TimelineFilters";
import styles from "./timeline.module.css";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<keyof TimelineQuery, string | string[] | undefined>>;

export default async function TimelinePage({ searchParams }: Readonly<{ searchParams: SearchParams }>) {
  const raw = await searchParams;
  const query: TimelineQuery = {};
  for (const key of ["year", "category", "country", "city"] as const) {
    const value = raw[key];
    query[key] = (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  }
  // Only public, non-deleted records reach this page. Timeline date interpretation
  // stays local to this view; repository filters and other routes are unchanged.
  const all = libraryRepository.listCollections().map(timelineEntry);
  const entries = filterTimeline(all, query);
  const groups = groupTimeline(entries, query.year);
  const years = timelineYears(all);
  const countries = [...new Map(all.flatMap(({ collection }) => collection.location ? [[collection.location.countryCode, collection.location.countryName] as const] : [])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "zh-CN"));
  const filtered = Object.values(query).some(Boolean);
  const filterCount = [query.category, query.country, query.city].filter(Boolean).length;
  const chips = (["year", "category", "country", "city"] as const).flatMap(key => {
    const value = query[key];
    if (!value) return [];
    const label = key === "country" ? countries.find(([code]) => code === value)?.[1] || value : value === "undated" ? "日期未标注" : value;
    return [{ key, label }];
  });
  const totalPhotos = entries.reduce((total, { collection }) => total + collection.photos.length, 0);
  let imageIndex = 0;
  return <main className={styles.page} data-timeline>
    <header className={styles.header}>
      <div className={styles.heading}><h1>时间线</h1><span className={styles.eyebrow}>TIMELINE</span></div>
      <p className={styles.total}>{entries.length} 图集 · {totalPhotos} 张照片</p>
    </header>
    <div className={styles.toolbar}>
      <div className={styles.toolbarRow}>
        <nav className={styles.years} aria-label="时间线年份">
          <Link href={timelineHref({ ...query, year: undefined })} aria-current={!query.year ? "page" : undefined}>全部</Link>
          {years.map(year => <Link key={year} href={timelineHref({ ...query, year })} aria-current={query.year === year ? "page" : undefined}>{year}</Link>)}
          {all.some(entry => !entry.start) && <Link href={timelineHref({ ...query, year: "undated" })} aria-current={query.year === "undated" ? "page" : undefined}>未标注</Link>}
        </nav>
        <TimelineFilters className={styles.filters} countClassName={styles.filterCount} count={filterCount} key={timelineHref(query)}>
          <form action="/timeline" aria-label="时间线筛选" className={styles.filterPanel} method="get">
            {query.year && <input type="hidden" name="year" value={query.year} />}
            <label>分类<Select defaultValue={query.category || ""} name="category"><option value="">全部分类</option>{archiveCategories.map(item => <option key={item}>{item}</option>)}</Select></label>
            <label>国家<Select defaultValue={query.country || ""} name="country"><option value="">全部国家</option>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</Select></label>
            <label>城市<Input defaultValue={query.city || ""} name="city" placeholder="城市名称" /></label>
            <div className={styles.filterActions}><Link href={timelineHref({ year: query.year })}>重置条件</Link><Button variant="primary" type="submit">应用筛选</Button></div>
          </form>
        </TimelineFilters>
      </div>
      {filtered && <div className={styles.activeFilters} aria-label="已选筛选">
        {chips.map(({ key, label }) => <Link key={key} href={timelineHref({ ...query, [key]: undefined })} aria-label={`移除筛选：${label}`}>{label}<X size={12} aria-hidden="true" /></Link>)}
        <Link href="/timeline">清除筛选</Link>
      </div>}
    </div>
    {entries.length ? <div>{groups.map(({ year, months }) => <section className={styles.yearGroup} key={year} aria-labelledby={`timeline-year-${year}`} data-timeline-year={year}>
      <div className={styles.yearRail}><div><h2 id={`timeline-year-${year}`} data-undated={year === "undated"}>{year === "undated" ? "日期未标注" : year}</h2><p>{months.reduce((sum, month) => sum + month.items.length, 0)} 个图集</p></div></div>
      <div className={styles.months}>{months.map(({ month, items }) => <section className={styles.month} key={month} aria-label={month === "unknown" ? "未标注日期的图集" : `${year} 年 ${Number(month)} 月`}>
        {month !== "unknown" && <div className={styles.monthHeading}><h3>{Number(month)} 月</h3><span>{String(items.length).padStart(2, "0")}</span></div>}
        <div className={styles.grid}>{items.map(entry => {
          const { collection } = entry;
          const cover = collectionCover(collection);
          const priority = Boolean(cover) && imageIndex++ < 3;
          return <article key={collection.id} data-timeline-entry={collection.slug}><BeamCard className={styles.card}>
            <Link className={styles.cardLink} href={`/works/${collection.slug}`} aria-label={`打开 ${collection.title}`}>
              <div className={styles.cover}><TimelineCover src={cover ? mediaUrl(cover.id, "display") : null} priority={priority} /><span className={styles.photoCount}><Images size={12} aria-hidden="true" /><span aria-label={`${collection.photos.length} 张照片`}>{collection.photos.length}</span></span></div>
              <div className={styles.caption}><h4>{collection.title}</h4><p title={entry.source === "photo" ? "来自照片拍摄时间" : undefined}>{entry.start ? <time dateTime={entry.start}>{timelineDateLabel(entry)}</time> : "日期未标注"}</p></div>
            </Link>
          </BeamCard></article>;
        })}</div>
      </section>)}</div>
    </section>)}</div> : <section className={styles.empty}>
      <Images size={28} strokeWidth={1.2} aria-hidden="true" /><h2>{filtered ? "没有符合条件的图集" : "还没有公开图集"}</h2>
      {filtered ? <Link className="ui-button ui-button-secondary" href="/timeline">清除筛选</Link> : <Link className="ui-button ui-button-secondary" href="/archive">浏览图集</Link>}
    </section>}
  </main>;
}

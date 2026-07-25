import Link from "next/link";
import { ArrowRight, Filter, X } from "lucide-react";
import { archiveCategories } from "@/modules/core/site";
import { collectionCover, collectionDateLabel, collectionMonth, collectionYear } from "@/modules/library/format";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { mediaUrl } from "@/modules/media/urls";
import Image from "next/image";
import SceneMeta from "@/modules/public/components/SceneMeta";
import SectionReveal from "@/modules/public/components/SectionReveal";

export const dynamic = "force-dynamic";
type SearchParams = Promise<{ year?: string; category?: string; country?: string; city?: string }>;

export default async function TimelinePage({ searchParams }: Readonly<{ searchParams: SearchParams }>) {
  const query = await searchParams;
  const all = libraryRepository.listCollections();
  const items = libraryRepository.listCollections({ year: query.year, category: query.category, country: query.country, city: query.city });
  const years = [...new Set(all.map(collectionYear))].sort().reverse();
  const countries = [...new Map(all.flatMap((item) => item.location ? [[item.location.countryCode, item.location.countryName] as const] : [])).entries()];
  const groups = Map.groupBy(items, collectionYear);
  const filtered = Boolean(query.year || query.category || query.country || query.city);
  const atmosphereSource = items[0] || all[0] || null;
  const atmosphere = atmosphereSource ? collectionCover(atmosphereSource) : null;
  const atmosphereId = atmosphere?.id;
  const atmosphereUrl = atmosphereId ? mediaUrl(atmosphereId as string, "large") : undefined;
  return <main className="public-timeline-page">
    <header className="timeline-page-hero">
      {atmosphereUrl ? <Image alt="" aria-hidden="true" className="scene-background-image timeline-page-atmosphere" fill priority sizes="100vw" src={atmosphereUrl as string} /> : null}
      <div className="timeline-page-shade" />
      <div className="public-page-container timeline-page-hero-inner"><SectionReveal><SceneMeta index="03" label="Chronology" /><p className="public-kicker">Through the years</p><h1>时间线</h1><p>以拍摄时间为顺序，让作品、旅行和日常回到它们发生的时刻。</p></SectionReveal><SectionReveal className="timeline-year-hero" delay={0.1}>{years.slice(0, 4).map((year, index) => <span className={index === 0 ? "is-current" : ""} key={year}>{year}</span>)}</SectionReveal></div>
    </header>
    <section className="public-page-container timeline-page-content">
      <form aria-label="时间线筛选" className="public-filter-bar timeline-filter-bar" method="get">
        <label><span>年份 / Year</span><select defaultValue={query.year || ""} name="year"><option value="">全部年份</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
        <label><span>分类 / Category</span><select defaultValue={query.category || ""} name="category"><option value="">全部分类</option>{archiveCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>国家 / Country</span><select defaultValue={query.country || ""} name="country"><option value="">全部国家</option>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <label><span>城市 / City</span><input defaultValue={query.city || ""} name="city" placeholder="城市名称" /></label>
        <button className="public-filter-submit" type="submit"><Filter className="h-4 w-4" />应用筛选</button>
        {filtered ? <Link aria-label="清除筛选" className="public-filter-clear" href="/timeline"><X className="h-4 w-4" /></Link> : null}
      </form>
      {items.length > 0 ? <div className="timeline-year-groups">{Array.from(groups.entries()).map(([year, yearItems], yearIndex) => <SectionReveal className="timeline-year-group" delay={Math.min(yearIndex, 3) * 0.05} key={year}><div className="timeline-year-heading"><span>{year}</span><p>{yearItems.length} Collections</p></div><div className="timeline-reel">{yearItems.map((item, index) => { const cover = collectionCover(item); return <article className="timeline-reel-item" key={item.id}>{cover ? <Link className="timeline-reel-photo" href={`/works/${item.slug}`}><Image alt={item.title} fill sizes="(max-width: 640px) 78vw, 24vw" src={mediaUrl(cover.id, "display")} /><span>{String(index + 1).padStart(2, "0")}</span></Link> : <div className="timeline-reel-photo timeline-reel-missing" />}<p>{collectionMonth(item)} / {item.category}</p><h2>{item.title}</h2><div><span>{collectionDateLabel(item)}</span>{item.location ? <span>{item.location.displayName}</span> : null}</div><Link aria-label={`打开 ${item.title}`} className="timeline-reel-open" href={`/works/${item.slug}`}><ArrowRight className="h-4 w-4" /></Link></article>; })}</div></SectionReveal>)}</div> : <div className="timeline-empty"><span>00 / Empty</span><h2>这段时间还没有公开图集</h2><Link href="/timeline">清除筛选</Link></div>}
    </section>
  </main>;
}

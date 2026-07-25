import Link from "next/link";
import { Filter, X } from "lucide-react";
import { archiveCategories } from "@/modules/core/site";
import { collectionCover, collectionYear } from "@/modules/library/format";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { mediaUrl } from "@/modules/media/urls";
import CollectionCard from "@/modules/public/components/CollectionCard";
import { PageHeroBackground } from "@/modules/public/components/PageHeroBackground";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; category?: string; tag?: string }>;

export default async function WorksPage({ searchParams }: Readonly<{ searchParams: SearchParams }>) {
  const query = await searchParams;
  const all = libraryRepository.listCollections();
  const items = libraryRepository.listCollections({ year: query.year, category: query.category, tag: query.tag });
  const years = [...new Set(all.map(collectionYear))].sort().reverse();
  const tags = [...new Set(all.flatMap((item) => item.tags))].sort();
  const filtered = Boolean(query.year || query.category || query.tag);
  const atmosphereSource = items[0] || all[0] || null;
  const atmosphere = atmosphereSource ? collectionCover(atmosphereSource) : null;
  const atmosphereId = atmosphere?.id;
  const atmosphereUrl = atmosphereId ? mediaUrl(atmosphereId as string, "large") : undefined;

  return <main className="works-page">
    <PageHeroBackground
      coverUrl={atmosphereUrl ?? null}
      coverAlt=""
      heroHeightClass="min-h-[50vh]"
    >
      <div className="flex flex-col items-center text-center px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Photo Archive</p>
        <h1 className="mt-4 text-4xl font-bold tracking-wide text-white sm:text-5xl md:text-6xl">所有图集</h1>
        <div className="mt-4 flex gap-6 text-sm text-neutral-400">
          <span>{items.length} 组照片</span>
          <span>{filtered ? "已应用筛选" : "最新在前"}</span>
        </div>
      </div>
    </PageHeroBackground>
    <section className="public-page-container works-content">
      <form aria-label="作品筛选" className="public-filter-bar" method="get">
        <label><span>年份</span><select defaultValue={query.year || ""} name="year"><option value="">全部年份</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
        <label><span>分类</span><select defaultValue={query.category || ""} name="category"><option value="">全部分类</option>{archiveCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>标签</span><select defaultValue={query.tag || ""} name="tag"><option value="">全部标签</option>{tags.map((tag) => <option key={tag}>{tag}</option>)}</select></label>
        <button className="public-filter-submit" type="submit"><Filter className="h-4 w-4" />筛选</button>
        {filtered ? <Link aria-label="清除筛选" className="public-filter-clear" href="/works"><X className="h-4 w-4" /></Link> : null}
      </form>
      {items.length > 0 ? <div className="archive-grid">{items.map((item, index) => <CollectionCard collection={item} index={index} key={item.id} priority={index < 2} />)}</div> : <div className="works-empty"><span>00</span><h2>没有符合条件的图集</h2><p>换一个年份、分类或标签继续观看。</p><Link href="/works">清除筛选</Link></div>}
    </section>
  </main>;
}

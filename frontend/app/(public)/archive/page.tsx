import Link from "next/link";
import { Images } from "lucide-react";
import { listPublicCollectionSummaries, publicCategoryCounts } from "@backend/modules/library/server/publicRead";
import { timelineDay } from "@/modules/library/timeline";
import { mediaUrl, mediaSrcSet } from "@/modules/media/urls";
import { BeamCard } from "@/components/ui/beam-card";
import PhotoLibraryShell from "@/modules/public/components/PhotoLibraryShell";
import AlbumPreviewButton from "@/modules/public/components/AlbumPreviewButton";
import TimelineCover from "@/modules/public/components/TimelineCover";
import styles from "@/modules/public/components/PhotoLibrary.module.css";

export const dynamic = "force-dynamic";
export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ category?: string | string[]; page?: string }> }) {
  const params = await searchParams;
  const raw = params.category;
  const category = (Array.isArray(raw) ? raw[0] : raw)?.trim() || "";
  const categories = publicCategoryCounts();
  const total = categories.reduce((sum,item)=>sum+item.count,0);
  const filteredCount = category ? categories.find(item=>item.category===category)?.count || 0 : total;
  const pageCount = Math.max(1,Math.ceil(filteredCount/24));
  const page = Math.min(pageCount, Math.max(1,Number.isFinite(Number(params.page)) ? Math.floor(Number(params.page)) || 1 : 1));
  const collections = listPublicCollectionSummaries(category,24,(Math.floor(page)-1)*24);
  const pageLink = (value: number) => `/archive?${new URLSearchParams({...category ? {category} : {},page:String(value)})}`;
  return <PhotoLibraryShell title="图集" meta={`${filteredCount} 个图集`}>
    <div className={styles.toolbar}>
      <nav className={styles.categories} aria-label="图集分类">
        <Link href="/archive" aria-current={!category ? "page" : undefined}>全部<small>{total}</small></Link>
        {categories.map(({category:value,count}) => <Link key={value} href={`/archive?category=${encodeURIComponent(value)}`} aria-current={category === value ? "page" : undefined}>{value}<small>{count}</small></Link>)}
      </nav>
      {category && <Link className="ui-button ui-button-ghost" href="/archive">清除筛选</Link>}
    </div>
    {collections.length ? <section className={styles.albumGrid} aria-label="公开图集">
      {collections.map((collection, index) => {
        const cover = collection.cover;
        const date = timelineDay(collection.dateStart) || timelineDay(cover?.takenAt);
        return <article className={styles.album} data-album={collection.slug} key={collection.id}><BeamCard>
          <Link prefetch={false} className={styles.albumCover} href={`/works/${collection.slug}`} aria-label={`打开图集 ${collection.title}`}>
            <TimelineCover src={cover ? mediaUrl(cover.id, "thumb") : null} srcSet={cover ? mediaSrcSet(cover) : undefined} priority={index < 3} /><span className={styles.count}>{collection.count} 张</span>
          </Link>
          <div className={styles.albumInfo}>
            <Link prefetch={false} className={styles.albumTitle} href={`/works/${collection.slug}`}><h2>{collection.title}</h2><p>{[date?.replaceAll("-", "."), collection.category].filter(Boolean).join(" · ")}</p></Link>
            {cover && <AlbumPreviewButton title={collection.title} photo={{
              id: cover.id, src: mediaUrl(cover.id, "display"), title: cover.alt || collection.title,
              width: cover.width, height: cover.height, date: cover.takenAt || undefined,
              camera: [cover.cameraMake, cover.cameraModel].filter(Boolean).join(" ") || undefined,
              lens: cover.lens || undefined, latitude: cover.latitude, longitude: cover.longitude,
              location: collection.location?.displayName,
              settings: [cover.focalLength ? cover.focalLength + "mm" : "", cover.aperture ? "ƒ/" + cover.aperture : "", cover.shutterSpeed || "", cover.iso ? "ISO " + cover.iso : ""].filter(Boolean).join(" · "),
            }} />}
          </div>
        </BeamCard></article>;
      })}
    </section> : <section className={styles.empty}><Images size={28} strokeWidth={1.3} /><h2>{category ? "没有符合条件的图集" : "还没有公开图集"}</h2>
      <Link className="ui-button ui-button-secondary" href={category ? "/archive" : "/"}>{category ? "清除筛选" : "返回首页"}</Link>
    </section>}
  {pageCount > 1 && <nav className={styles.toolbar} aria-label="图集分页">
      {page > 1 ? <Link href={pageLink(page-1)}>上一页</Link> : <span />}
      <span>{page} / {pageCount}</span>
      {page < pageCount ? <Link href={pageLink(page+1)}>下一页</Link> : <span />}
    </nav>}
  </PhotoLibraryShell>;
}

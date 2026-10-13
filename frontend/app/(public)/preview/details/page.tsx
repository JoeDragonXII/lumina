import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { collectionCover, collectionDateLabel } from "@/modules/library/format";
import { mediaUrl } from "@/modules/media/urls";
import styles from "./page.module.css";
import PhotoCardLayer from "./PhotoCardLayer";

export default async function DetailStudies({ searchParams }: {
  searchParams: Promise<{ view?: string; collection?: string; photo?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "collection" || params.view === "place" ? params.view : "photo";
  const collections = libraryRepository.listCollections({ visibility: "public" }).filter(c => c.photos.length);
  const collection = collections.find(c => c.id === params.collection) ?? collections.find(c => c.location && c.photos.length >= 3) ?? collections[0];
  const url = (nextView: string, photo?: string, id = collection?.id) => `/preview/details?${new URLSearchParams({ view: nextView, ...(id ? { collection: id } : {}), ...(photo ? { photo } : {}) })}`;
  const tabs = [{ id: "photo", label: "单张照片" }, { id: "collection", label: "图集" }, { id: "place", label: "地点" }];
  if (!collection) return <main className={styles.page}><Link href="/map">返回地图</Link><h1>还没有公开照片</h1><p>添加公开图集后，可在这里预览三种详情布局。</p></main>;
  const photo = collection.photos.find(p => p.id === params.photo) ?? collectionCover(collection)!;
  const location = collection.location;
  const related = location ? collections.filter(c => c.location?.id === location.id || c.location?.displayName === location.displayName) : [collection];
  const cover = collectionCover(collection)!;
  const image = (id: string, alt: string, className?: string, priority = false) => <Image src={mediaUrl(id, "display")} alt={alt} fill sizes="(max-width: 760px) 100vw, 70vw" className={className} priority={priority} />;
  return <PhotoCardLayer photos={collection.photos.map(p => ({ id: p.id, src: mediaUrl(p.id, "display"), title: p.alt || collection.title, date: p.takenAt?.slice(0, 10) || collectionDateLabel(collection), camera: p.cameraModel || p.cameraMake || undefined, exposure: [p.focalLength ? `${p.focalLength}mm` : "", p.aperture ? `ƒ/${p.aperture}` : "", p.shutterSpeed || "", p.iso ? `ISO ${p.iso}` : ""].filter(Boolean).join(" · ") }))} location={location?.displayName} description={collection.story} initiallyOpen={view === "photo" ? photo.id : undefined}><main className={styles.page}>
    <header className={styles.header}>
      <Link href="/map" className={styles.brand} aria-label="返回地图"><ArrowLeft size={16} /> LUMINA</Link>
      <nav className={styles.switcher} aria-label="详情页方案">{tabs.map(tab => <Link key={tab.id} href={url(tab.id)} aria-current={view === tab.id ? "page" : undefined}>{tab.label}</Link>)}</nav>
      <span className={styles.study}>详情页预览</span>
    </header>

    {view !== "place" ? <>
      <section className={styles.collectionHero}>
        <div><span className={styles.eyebrow}>{collection.category || "图集"} / {collection.photos.length} 张</span><h1>{collection.title}</h1><p>{collectionDateLabel(collection)}</p>{location ? <Link className={styles.placeLink} href={url("place")}><MapPin size={14}/>{location.displayName}</Link> : null}</div>
        <Link href={url("photo", cover.id)} className={styles.cover} aria-label="查看封面照片">{image(cover.id, collection.title, undefined, true)}</Link>
      </section>
      <section className={styles.collectionIntro}><h2>关于这组照片</h2><p>{collection.story || "文字留白，先从照片开始。"}</p></section>
      <section className={styles.photoGrid} aria-label="图集照片">{collection.photos.map((item, i) => <Link href={url("photo", item.id)} key={item.id} className={styles.gridPhoto}><div>{image(item.id, item.alt || `${collection.title} · ${i + 1}`)}</div><span>{String(i + 1).padStart(2, "0")}</span></Link>)}</section>
    </> : null}

    {view === "place" ? <>
      <section className={styles.placeHero}>
        <div className={styles.placeCover}>{image(cover.id, location?.displayName || collection.title, undefined, true)}</div>
        <div className={styles.placeInfo}><span className={styles.eyebrow}>地点档案</span><h1>{location?.displayName || "地点未记录"}</h1><p className={styles.placeDescription}>{location ? `在${location.displayName}留下的照片与图集。` : "这组照片尚未记录拍摄地点。"}</p>
          <dl className={styles.placeStats}><div><dd>{related.length}</dd><dt>图集</dt></div><div><dd>{related.reduce((sum, c) => sum + c.photos.length, 0)}</dd><dt>照片</dt></div></dl>
          {typeof location?.latitude === "number" && typeof location.longitude === "number" ? <span className={styles.coordinates}>{location.latitude.toFixed(4)}° {location.latitude >= 0 ? "N" : "S"} / {Math.abs(location.longitude).toFixed(4)}° {location.longitude >= 0 ? "E" : "W"}</span> : null}
          <Link className={styles.mapLink} href="/map"><MapPin size={16}/>返回地图<ArrowUpRight size={16}/></Link>
        </div>
      </section>
      <section className={styles.related}><header><h2>在这里拍摄</h2><span>{related.length} 组记忆</span></header><div>{related.map(c => <Link key={c.id} href={url("collection", undefined, c.id)} className={styles.relatedCard}><div>{image(collectionCover(c)!.id, c.title)}</div><h3>{c.title}</h3><span>{collectionDateLabel(c)} · {c.photos.length} 张</span></Link>)}</div></section>
    </> : null}
  </main></PhotoCardLayer>;
}

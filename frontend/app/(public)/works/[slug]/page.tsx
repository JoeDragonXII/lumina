import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowLeft, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { hasAdminPageSession } from "@backend/lib/server/auth";
import { collectionCover, collectionDateLabel } from "@/modules/library/format";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { mediaUrl } from "@/modules/media/urls";
import CollectionGallery from "@/modules/public/components/CollectionGallery";
import { PageHeroBackground } from "@/modules/public/components/PageHeroBackground";
import SceneMeta from "@/modules/public/components/SceneMeta";
import SectionReveal from "@/modules/public/components/SectionReveal";
import type { CollectionRecord } from "@backend/modules/library/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

function decodedSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = libraryRepository.getCollectionBySlug(decodedSlug((await params).slug), await hasAdminPageSession());
  return { title: collection?.title || "图集" };
}

export default async function CollectionPage({ params }: Props) {
  const foundCollection = libraryRepository.getCollectionBySlug(decodedSlug((await params).slug), await hasAdminPageSession());
  if (!foundCollection) return notFound();
  const collection = foundCollection as CollectionRecord;
  const cover = collectionCover(collection);
  return <main className="collection-page">
    <PageHeroBackground
      coverUrl={cover ? mediaUrl(cover.id, "large") : null}
      coverAlt={collection.title}
    >
      <Link
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
        href="/works"
      >
        <ArrowLeft className="h-4 w-4" />返回作品
      </Link>
      <div className="flex flex-col items-center text-center px-4">
        <SceneMeta index="02" label={collection.category} />
        <h1 className="mt-4 text-4xl font-bold tracking-wide text-white sm:text-5xl md:text-6xl">
          {collection.title}
        </h1>
        <p className="mt-4 text-base text-neutral-300">
          {collectionDateLabel(collection)}
          {collection.location ? ` / ${collection.location!.displayName}` : ""}
        </p>
      </div>
      <a
        aria-label="向下查看图集"
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-neutral-400 transition-colors hover:text-white"
        href="#collection-story"
      >
        <ArrowDown className="h-5 w-5" />
      </a>
    </PageHeroBackground>
    <section className="public-page-container collection-story" id="collection-story">
      <SectionReveal><p className="public-kicker">About this collection</p><h2>关于这组照片</h2></SectionReveal>
      <SectionReveal className="collection-story-copy" delay={0.08}><p>{collection.story || "这组照片还没有文字说明，先让画面自己说话。"}</p><dl><div><dt>拍摄时间</dt><dd>{collectionDateLabel(collection)}</dd></div>{collection.location ? <div><dt>地点</dt><dd><MapPin className="h-4 w-4" />{collection.location.displayName}</dd></div> : null}<div><dt>照片数量</dt><dd>{collection.photos.length} 张</dd></div>{collection.tags.length > 0 ? <div><dt>标签</dt><dd className="collection-tags">{collection.tags.map((tag) => <span key={tag}>{tag}</span>)}</dd></div> : null}</dl></SectionReveal>
    </section>
    <section className="public-page-container collection-gallery-section"><CollectionGallery photos={collection.photos} title={collection.title} /></section>
  </main>;
}

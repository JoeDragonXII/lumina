import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { mediaUrl } from "@/modules/media/urls";

export const dynamic = "force-dynamic";

const visibilityLabel = { draft: "草稿", private: "私有", public: "公开" } as const;

export default function StudioPage() {
  const items = libraryRepository.listCollections({ visibility: "all" });
  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex items-end justify-between border-b border-neutral-200 pb-6">
        <div><p className="text-xs font-semibold uppercase text-neutral-500">Library</p><h1 className="mt-2 text-3xl font-semibold">图集</h1><p className="mt-2 text-sm text-neutral-600">{items.length} 个有效图集</p></div>
        <Link className="on-dark inline-flex items-center gap-2 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white" href="/studio/new"><Plus className="h-4 w-4" />新建图集</Link>
      </header>
      {items.length === 0 ? (
        <div className="mt-14 border border-dashed border-neutral-300 px-6 py-16 text-center"><h2 className="font-semibold">资料库还是空的</h2><p className="mt-2 text-sm text-neutral-600">导入第一组照片，创建你的第一个图集。</p></div>
      ) : (
        <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const cover = item.photos.find((photo) => photo.id === item.coverAssetId) || item.photos[0];
            return <Link className="group" href={`/studio/${item.id}`} key={item.id}>
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">{cover ? <Image alt={item.title} className="object-cover transition duration-300 group-hover:scale-[1.02]" fill loading={index === 0 ? "eager" : "lazy"} sizes="(max-width: 640px) 100vw, 33vw" src={mediaUrl(cover.id, "thumb")} /> : null}</div>
              <div className="mt-3 flex items-start justify-between gap-4"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-xs text-neutral-500">{item.category} · {item.photos.length} 张</p></div><span className="border border-neutral-300 px-2 py-1 text-[11px] text-neutral-600">{visibilityLabel[item.visibility]}</span></div>
            </Link>;
          })}
        </div>
      )}
    </div>
  );
}

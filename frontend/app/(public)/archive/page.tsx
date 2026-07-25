"use client";

import { useMemo, useState } from "react";
import HomeDockNav from "@/modules/public/components/HomeDockNav";
import PhotoModal, { type PhotoDetail } from "@/modules/public/components/PhotoModal";
import { GlobalBackground } from "@/modules/public/components/GlobalBackground";
import { archiveCategories } from "@/modules/core/site";
import { BeamCard } from "@/components/ui/beam-card";
import { cn } from "@/lib/utils";

/* ---------- 静态 Demo 照片数据 ---------- */

const TITLES = [
  "江边的晚风", "山城的台阶", "海边的午后", "老城的光影", "雨后的街道", "桥上的落日",
  "巷口的小店", "山顶的云海", "冬日的车站", "春天的河岸", "夜市的烟火", "清晨的码头",
];

const RATIOS: Array<[number, number]> = [
  [4, 3], [3, 4], [1, 1], [4, 3], [3, 4], [4, 3],
  [3, 4], [4, 5], [4, 3], [1, 1], [3, 4], [4, 3],
];

const DETAILS: Array<Omit<PhotoDetail, "id" | "src" | "width" | "height" | "title">> = [
  { date: "2026-07-15", location: "重庆 · 南滨路", description: "江风裹着夏日的湿热穿过发梢，远处大桥灯光倒映江面，像碎掉的银河。", camera: "Sony A7IV", lens: "FE 24-70mm f/2.8 GM II", settings: "f/4 · 1/320s · ISO 800", photographer: "阿星", tags: ["夕阳", "江景", "城市"] },
  { date: "2026-06-28", location: "重庆 · 十八梯", description: "青石板路一级一级往上，老茶馆里飘出茉莉花香——山城的故事就在这些台阶里。", camera: "Fujifilm X-T5", lens: "XF 23mm f/1.4", settings: "f/2 · 1/500s · ISO 400", photographer: "阿星", tags: ["老街", "人文", "台阶"] },
  { date: "2026-07-02", location: "厦门 · 鼓浪屿", description: "午后三点钟的日光穿过百叶窗，在地板上画出一排金色条纹。海风咸咸的，时间很慢。", camera: "Sony A7IV", lens: "FE 50mm f/1.2 GM", settings: "f/1.4 · 1/2000s · ISO 100", photographer: "小鹿", tags: ["海岛", "光影", "午后"] },
  { date: "2026-05-20", location: "成都 · 宽窄巷子", description: "青砖黛瓦间透出红灯笼的暖光，一只橘猫正趴在门槛上打盹。", camera: "Leica Q3", lens: "Summilux 28mm f/1.7", settings: "f/2.8 · 1/125s · ISO 1600", photographer: "阿星", tags: ["古镇", "猫", "夜色"] },
  { date: "2026-07-10", location: "杭州 · 西湖", description: "雨刚停，湖面还泛着薄雾。断桥上撑着伞的情侣慢慢走过，像一幅水墨画活了过来。", camera: "Nikon Z8", lens: "Z 70-200mm f/2.8", settings: "f/5.6 · 1/250s · ISO 640", photographer: "小鹿", tags: ["雨景", "西湖", "水墨"] },
  { date: "2026-06-15", location: "武汉 · 长江大桥", description: "落日把整座大桥烧成橘红色，江面波光粼粼，货轮缓缓穿过桥洞。", camera: "Sony A7IV", lens: "FE 16-35mm f/2.8 GM II", settings: "f/8 · 1/60s · ISO 200", photographer: "阿星", tags: ["落日", "桥梁", "长江"] },
  { date: "2026-07-01", location: "苏州 · 平江路", description: "窄巷子两边是白墙黛瓦的老宅，摇橹船从窗下经过，船娘用吴语哼着小调。", camera: "Fujifilm X-T5", lens: "XF 35mm f/1.4", settings: "f/2 · 1/1000s · ISO 200", photographer: "小鹿", tags: ["江南", "水乡", "人文"] },
  { date: "2026-06-20", location: "黄山 · 光明顶", description: "凌晨四点爬到山顶，云海在脚下翻涌，第一缕阳光刺破天际，所有疲惫烟消云散。", camera: "Sony A7IV", lens: "FE 14mm f/1.8 GM", settings: "f/5.6 · 1/15s · ISO 100", photographer: "阿星", tags: ["日出", "云海", "登山"] },
  { date: "2026-07-12", location: "哈尔滨 · 中央大街", description: "零下二十度的冬夜，呵出的白气在睫毛上结成霜。街灯昏黄，脚踩雪地发出咯吱声。", camera: "Nikon Z8", lens: "Z 24-70mm f/2.8", settings: "f/2.8 · 1/60s · ISO 3200", photographer: "小鹿", tags: ["雪景", "冬夜", "街拍"] },
  { date: "2026-03-28", location: "昆明 · 滇池", description: "春天来得早，湖边的樱花全开了。海鸥还没北归，在花丛间穿梭嬉闹。", camera: "Fujifilm X-T5", lens: "XF 56mm f/1.2", settings: "f/1.4 · 1/4000s · ISO 200", photographer: "阿星", tags: ["春天", "樱花", "滇池"] },
  { date: "2026-07-05", location: "台北 · 士林夜市", description: "烤鱿鱼的焦香混着臭豆腐的味道，霓虹招牌下人头攒动，摊主的吆喝声此起彼伏。", camera: "Leica Q3", lens: "Summilux 28mm f/1.7", settings: "f/2 · 1/125s · ISO 3200", photographer: "小鹿", tags: ["夜市", "烟火气", "街拍"] },
  { date: "2026-04-12", location: "青岛 · 小港码头", description: "清晨五点半，渔船陆续出海。晨雾中海鸥盘旋，码头上买鱼的人已经排起了队。", camera: "Sony A7IV", lens: "FE 24-70mm f/2.8 GM II", settings: "f/5.6 · 1/500s · ISO 400", photographer: "阿星", tags: ["清晨", "渔港", "码头"] },
];

/* 将分类循环分配给 24 张照片，模拟真实分类 */
const categoryCycle = [...archiveCategories] as string[];

export interface ArchivePhoto extends PhotoDetail {
  category: string;
}

const allPhotos: ArchivePhoto[] = Array.from({ length: 24 }, (_, i) => {
  const [w, h] = RATIOS[i % RATIOS.length];
  const detail = DETAILS[i % DETAILS.length];
  const width = 600;
  const height = Math.round((width * h) / w);
  return {
    id: `archive-${i}`,
    src: `https://picsum.photos/id/${1011 + i * 7}/${width}/${height}`,
    width,
    height,
    title: TITLES[i % TITLES.length],
    category: categoryCycle[i % categoryCycle.length],
    ...detail,
  };
});

const FILTERS = ["全部", ...(archiveCategories as unknown as string[])] as const;

/* ---------- 页面组件 ---------- */

export default function ArchivePage() {
  const [activeCategory, setActiveCategory] = useState<string>("全部");
  const [selected, setSelected] = useState<ArchivePhoto | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "全部") return allPhotos;
    return allPhotos.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="archive-page" data-theme="dark">
      <GlobalBackground />
      <HomeDockNav />

      {/* ---------- Hero 标题区 ---------- */}
      <section className="archive-hero relative z-10 flex flex-col items-center justify-center px-6 pt-32 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          图集
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/60">
          每一张照片，都是值得留下的时光切片
        </p>
      </section>

      {/* ---------- 分类筛选标签 ---------- */}
      <section className="archive-filters relative z-10 mx-auto mb-10 flex max-w-6xl flex-wrap items-center justify-center gap-2 px-6">
        {FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
              activeCategory === cat
                ? "bg-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.06)] ring-1 ring-white/20"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80",
            )}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* ---------- 照片网格 ---------- */}
      <section className="archive-grid relative z-10 mx-auto max-w-6xl px-6 pb-20">
        {filtered.length === 0 ? (
          <p className="py-20 text-center text-white/30">该分类下暂无照片</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
            {filtered.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => setSelected(photo)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- PhotoModal 弹窗 ---------- */}
      <PhotoModal photo={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

/* ---------- 照片卡片子组件 ---------- */

function PhotoCard({ photo, onClick }: { photo: ArchivePhoto; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="archive-photo-card group relative w-full cursor-pointer overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <BeamCard>
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={photo.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            src={photo.src}
          />

          {/* 悬停渐变遮罩 + 元数据 */}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/15 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <h3 className="text-base font-semibold text-white">{photo.title}</h3>
            <p className="mt-1 text-xs text-white/60">
              {photo.date} · {photo.location}
            </p>
          </div>
        </div>
      </BeamCard>
    </button>
  );
}

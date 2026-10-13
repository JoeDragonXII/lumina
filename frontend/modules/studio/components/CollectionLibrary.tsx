"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Images, MapPin, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { BeamCard } from "@/components/ui/beam-card";
import styles from "./studio-paper.module.css";

type Item = { id: string; title: string; category: string; count: number; cover: string | null; location: string; visibility: "draft" | "private" | "public" };
const labels = { all: "全部", public: "公开", private: "私有", draft: "草稿" } as const;
export default function CollectionLibrary({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<keyof typeof labels>("all");
  const visible = items.filter((item) => (filter === "all" || item.visibility === filter) && `${item.title} ${item.category} ${item.location}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className={styles.library}>
    <header className={styles.header}><div><h1>图集</h1><p>{items.length} 个图集 · {items.reduce((total, item) => total + item.count, 0)} 张照片</p></div><Link className={styles.primary} href="/studio/new"><Plus size={17} />新建图集</Link></header>
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="图集状态">{(Object.keys(labels) as Array<keyof typeof labels>).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{labels[value]}<small>{value === "all" ? items.length : items.filter(item => item.visibility === value).length}</small></button>)}</div>
      <div className={styles.search}><Search size={17} aria-hidden="true" /><input aria-label="搜索图集" placeholder="搜索图集、地点" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button aria-label="清除搜索" type="button" onClick={() => setQuery("")}><X size={16} /></button>}</div>
    </div>
    <div className={styles.grid}>{visible.map((item, index) => <BeamCard className={styles.card} key={item.id}><Link href={`/studio/${item.id}`}>
      <div className={styles.cover}>{item.cover ? <Image alt="" fill loading={index < 3 ? "eager" : "lazy"} sizes="(max-width: 639px) 100vw, (max-width: 1100px) 50vw, 33vw" src={item.cover} /> : <Images size={32} strokeWidth={1.3} />}<span className={styles.status}>{labels[item.visibility]}</span><span className={styles.count}>{item.count} 张</span></div>
      <div className={styles.caption}><div><h2>{item.title}</h2><p>{item.category}<span>·</span><MapPin size={12} aria-hidden="true" /><span>{item.location || "待补充地点"}</span></p></div><ArrowUpRight size={17} aria-hidden="true" /></div>
    </Link></BeamCard>)}</div>
    {visible.length === 0 && <div className={styles.empty}><Images size={32} strokeWidth={1.3} /><h2>{items.length ? "没有找到图集" : "收藏第一段回忆"}</h2>{items.length ? <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>清除筛选</button> : <Link href="/studio/new">导入照片，创建图集</Link>}</div>}
  </div>;
}

"use client";

import { ChangeEvent, DragEvent, FormEvent, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CalendarClock, Camera, ImagePlus, MapPin, Save, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { archiveCategories } from "@/modules/core/site";
import type { CollectionVisibility, LocationInput } from "@backend/modules/core/types";
import type { CollectionRecord, PhotoAssetRecord } from "@backend/modules/library/types";
import type { ImportedPhoto } from "@backend/modules/media/types";
import { mediaUrl } from "@/modules/media/urls";
import { isRawPhotoName, studioPhotoAccept, supportedUploadLabel } from "@backend/modules/media/formats";
import { Input, Select, Textarea } from "@/components/ui/controls";
import styles from "./studio-paper.module.css";
import PhotoEditDialog, { PhotoMetadataEditor } from "./PhotoEditDialog";
import LocationPicker from "./LocationPicker";

function slugFromTitle(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const PHOTO_PAGE_SIZE = 60;
const takenAtFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
});
function formatTakenAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return takenAtFormatter.format(date);
}

function importSummary(items: PhotoAssetRecord[], hasLocationSuggestion: boolean) {
  const dated = items.filter((photo) => photo.takenAt).length;
  const located = items.filter((photo) => photo.latitude !== null && photo.longitude !== null).length;
  const parts = [`${items.length} 张照片已就绪`, `拍摄时间 ${dated}/${items.length}`, `GPS ${located}/${items.length}`];
  if (located > 0 && hasLocationSuggestion) parts.push("已填入地点建议，请确认");
  if (located === 0) parts.push("原件未记录定位，地点只需按图集填写一次");
  return `${parts.join("；")}。`;
}

export default function CollectionEditor({ initial = null }: Readonly<{ initial?: CollectionRecord | null }>) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [story, setStory] = useState(initial?.story || "");
  const [category, setCategory] = useState(initial?.category || archiveCategories[0]);
  const [tags, setTags] = useState(initial?.tags.join(", ") || "");
  const [visibility, setVisibility] = useState<CollectionVisibility>(initial?.visibility || "draft");
  const [featured, setFeatured] = useState(initial?.featured || false);
  const [dateStart, setDateStart] = useState(initial?.dateStart || "");
  const [dateEnd, setDateEnd] = useState(initial?.dateEnd || "");
  const [countryCode, setCountryCode] = useState(initial?.location?.countryCode || "");
  const [countryName, setCountryName] = useState(initial?.location?.countryName || "");
  const [regionCode, setRegionCode] = useState(initial?.location?.regionCode || "");
  const [regionName, setRegionName] = useState(initial?.location?.regionName || "");
  const [city, setCity] = useState(initial?.location?.city || "");
  const [displayName, setDisplayName] = useState(initial?.location?.displayName || "");
  const [latitude, setLatitude] = useState(initial?.location?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(initial?.location?.longitude?.toString() || "");
  const [locationSource, setLocationSource] = useState<"manual" | "exif">(initial?.location?.source || "manual");
  const [locationConfirmed, setLocationConfirmed] = useState(initial?.location?.confirmed || false);
  const [photos, setPhotos] = useState<PhotoAssetRecord[]>(initial?.photos || []);
  const [coverAssetId, setCoverAssetId] = useState(initial?.coverAssetId || initial?.photos[0]?.id || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const batchDirty = useRef(false);
  const [photoPage, setPhotoPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(photos.length / PHOTO_PAGE_SIZE));
  const currentPage = Math.min(photoPage, pageCount - 1);
  const pageStart = currentPage * PHOTO_PAGE_SIZE;
  const visiblePhotos = useMemo(() => photos.slice(pageStart, pageStart + PHOTO_PAGE_SIZE), [photos, pageStart]);
  const selectedIds = useMemo(() => new Set(selected), [selected]);
  const selectedPhotos = useMemo(() => photos.filter(photo => selectedIds.has(photo.id)), [photos, selectedIds]);
  function changeSelection(ids: string[]) {
    if (batchDirty.current && !window.confirm("放弃尚未保存的批量修改？")) return;
    batchDirty.current = false;
    setSelected(ids);
  }
  function updatePhotos(updated: PhotoAssetRecord[]) {
    const updates = new Map(updated.map(photo => [photo.id, photo]));
    setPhotos(current => current.map(photo => updates.has(photo.id) ? { ...photo, ...updates.get(photo.id), alt: photo.alt, position: photo.position } : photo));
    router.refresh();
  }

  function changeTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugFromTitle(value));
  }

  function applyExifSuggestions(items: PhotoAssetRecord[], locationSuggestion: LocationInput | null) {
    const dates = items.map((photo) => photo.takenAt?.slice(0, 10)).filter((value): value is string => Boolean(value)).sort();
    if (!dateStart && dates[0]) setDateStart(dates[0]);
    if (!dateEnd && dates.at(-1)) setDateEnd(dates.at(-1)!);
    const gpsPhoto = items.find((photo) => photo.latitude !== null && photo.longitude !== null);
    if (gpsPhoto && !latitude && !longitude) {
      setLatitude(String(gpsPhoto.latitude));
      setLongitude(String(gpsPhoto.longitude));
      setLocationSource("exif");
      setLocationConfirmed(false);
    }
    if (locationSuggestion) {
      setCountryCode((current) => current || locationSuggestion.countryCode);
      setCountryName((current) => current || locationSuggestion.countryName);
      setRegionCode((current) => current || locationSuggestion.regionCode || "");
      setRegionName((current) => current || locationSuggestion.regionName || "");
      setCity((current) => current || locationSuggestion.city || "");
      setDisplayName((current) => current || locationSuggestion.displayName);
      setLatitude((current) => current || String(locationSuggestion.latitude ?? ""));
      setLongitude((current) => current || String(locationSuggestion.longitude ?? ""));
      setLocationSource("exif");
      setLocationConfirmed(false);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await fetch("/api/studio/assets", { method: "POST", body: formData });
    const payload = (await response.json().catch(() => null)) as
      | { assets?: ImportedPhoto[]; errors?: Array<{ name: string; error: string }>; locationSuggestion?: LocationInput | null; error?: string }
      | null;
    const imported = payload?.assets?.map((item) => item.asset) || [];
    setPhotos((current) => {
      const ids = new Set(current.map((photo) => photo.id));
      return [...current, ...imported.filter((photo) => !ids.has(photo.id))];
    });
    if (!coverAssetId && imported[0]) setCoverAssetId(imported[0].id);
    applyExifSuggestions(imported, payload?.locationSuggestion || null);
    const errors = payload?.errors || [];
    const successMessage = imported.length > 0 ? importSummary(imported, Boolean(payload?.locationSuggestion)) : "";
    const errorMessage = errors.map((item) => `${item.name}: ${item.error}`).join("；");
    setMessage([successMessage, errorMessage].filter(Boolean).join(" "));
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(id: string) {
    if (selected.includes(id)) { changeSelection(selected.filter(value => value !== id)); if (batchDirty.current) return; }
    setPhotos((current) => current.filter((photo) => photo.id !== id));
    if (coverAssetId === id) setCoverAssetId(photos.find((photo) => photo.id !== id)?.id || "");
  }

  function reorder(from: number, to: number) {
    setPhotos((current) => moveItem(current, from, to));
  }

  function drop(event: DragEvent<HTMLDivElement>, to: number) {
    event.preventDefault();
    if (dragIndex.current !== null) reorder(dragIndex.current, to);
    dragIndex.current = null;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const hasLocation = Boolean(countryCode.trim() && countryName.trim() && displayName.trim());
    const body = {
      title,
      slug,
      story,
      category,
      tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
      visibility,
      featured,
      dateStart: dateStart || null,
      dateEnd: dateEnd || dateStart || null,
      location: hasLocation
        ? {
            countryCode,
            countryName,
            regionCode: regionCode || null,
            regionName: regionName || null,
            city: city || null,
            displayName,
            latitude: latitude || null,
            longitude: longitude || null,
            source: locationSource,
            confirmed: locationConfirmed,
          }
        : null,
      assetIds: photos.map((photo) => photo.id),
      coverAssetId: coverAssetId || photos[0]?.id || null,
    };
    const response = await fetch(initial ? `/api/studio/collections/${initial.id}` : "/api/studio/collections", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { collection?: CollectionRecord; error?: string } | null;
    setSaving(false);
    if (!response.ok || !payload?.collection) {
      setMessage(payload?.error || "保存失败。");
      return;
    }
    setMessage("图集已保存。");
    if (!initial) router.replace(`/studio/${payload.collection.id}`);
    router.refresh();
  }

  async function removeCollection() {
    if (!initial || !window.confirm("将这个图集移入回收站？")) return;
    const response = await fetch(`/api/studio/collections/${initial.id}`, { method: "DELETE" });
    if (response.ok) {
      router.replace("/studio");
      router.refresh();
    }
  }

  return (
    <><form className={styles.editor} onSubmit={save}>
      <div className={styles.editorHeader}>
        <div>
          <Link className={styles.back} href="/studio"><ArrowLeft size={13} />图集</Link>
          <h1>{initial?.title || "新建图集"}</h1>
        </div>
        <div className="flex gap-2">
          <a className="ui-button ui-button-ghost" href={selected.length ? "#photo-batch-editor" : "#collection-location"}><MapPin size={16} />{selected.length ? "编辑所选" : "地点"}</a>
          {initial ? (
            <button className={`icon-button ${styles.danger}`} aria-label="移入回收站" onClick={removeCollection} title="移入回收站" type="button">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
          <button className={styles.primary} disabled={saving || uploading} type="submit">
            <Save className="h-4 w-4" />
            {saving ? "保存中" : "保存图集"}
          </button>
        </div>
      </div>

      {message ? <p className={styles.feedback} role="status">{message}</p> : null}
      <div className={styles.editorLayout}>
        <section>
          <div className={styles.fields}>
            <div className={styles.fieldRow}>
              <label className="form-label">标题<Input className="form-input" value={title} onChange={(event) => changeTitle(event.target.value)} /></label>
              <label className="form-label">链接标识<Input className="form-input" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }} /></label>
            </div>
            <details open={story ? true : undefined}>
              <summary>图集故事</summary>
              <label className="form-label">故事<Textarea className="form-input min-h-32 resize-y" value={story} onChange={(event) => setStory(event.target.value)} /></label>
            </details>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="section-heading">照片 <span className="ml-2 text-xs text-[var(--ui-muted)]">{photos.length}</span></h2>
            <label className={`${styles.upload} inline-flex cursor-pointer items-center gap-2 border border-[var(--ui-line)] bg-[var(--ui-surface)] px-3 py-2 text-sm font-medium hover:border-[var(--ui-accent)]`}>
              <ImagePlus className="h-4 w-4" />
              {uploading ? "处理中..." : "导入照片"}
              <input ref={fileInput} className="sr-only" type="file" accept={studioPhotoAccept} multiple disabled={uploading} onChange={upload} />
            </label>
          </div>
          {photos.length > 0 && <div className={styles.selectionBar}>
            <span>{selected.length ? `已选 ${selected.length} 张` : "点击照片编辑，勾选后批量修改"}</span>
            <button type="button" onClick={() => changeSelection(photos.map(photo => photo.id))}>全选</button>
            {selected.length > 0 && <><button type="button" onClick={() => changeSelection([])}>取消选择</button><a href="#photo-batch-editor">编辑所选</a></>}
          </div>}
          {pageCount > 1 && <nav className={styles.selectionBar} aria-label="照片分页">
            <button type="button" disabled={currentPage === 0} onClick={() => setPhotoPage(currentPage - 1)}>上一页</button>
            <span role="status">第 {currentPage + 1} / {pageCount} 页 · {pageStart + 1}–{Math.min(pageStart + PHOTO_PAGE_SIZE, photos.length)} 张</span>
            <button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPhotoPage(currentPage + 1)}>下一页</button>
          </nav>}
          {photos.length === 0 ? (
            <label className={`${styles.upload} mt-4 grid min-h-64 cursor-pointer place-items-center border border-dashed border-[var(--ui-line)] bg-[var(--ui-surface)] p-6 text-center hover:border-[var(--ui-accent)]`}>
              <span>
                <ImagePlus className="mx-auto h-7 w-7 text-[var(--ui-muted)]" />
                <span className="mt-3 block text-sm font-semibold">选择一张或多张照片</span>
                <span className="mt-1 block text-xs text-[var(--ui-muted)]">{supportedUploadLabel}，原件会保存在本机</span>
              </span>
              <input className="sr-only" type="file" accept={studioPhotoAccept} multiple disabled={uploading} onChange={upload} />
            </label>
          ) : (
            <div className={styles.photoGrid}>
              {visiblePhotos.map((photo, offset) => {
                const index = pageStart + offset;
                return (
                <div
                  className={`${styles.photo} group border bg-[var(--ui-surface)] ${coverAssetId === photo.id ? "border-[var(--ui-accent)]" : "border-[var(--ui-line)]"}`}
                  data-selected={selectedIds.has(photo.id)}
                  draggable
                  key={photo.id}
                  onDragStart={() => { dragIndex.current = index; }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => drop(event, index)}
                >
                  <div className="relative overflow-hidden bg-[var(--ui-input)]">
                    <button type="button" className={styles.photoOpen} aria-label={`编辑照片 ${photo.originalName}`} onClick={() => setEditingId(photo.id)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" width={480} height={360} alt={photo.alt || photo.originalName} className="aspect-[4/3] w-full object-contain" src={mediaUrl(photo.id, "thumb")} />
                    </button>
                    <div className={`${styles.actions} absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/65 p-1.5 text-white transition-opacity`}>
                      <div className="flex">
                        <button aria-label="前移" className="icon-button-dark" onClick={() => reorder(index, index - 1)} type="button"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button aria-label="后移" className="icon-button-dark" onClick={() => reorder(index, index + 1)} type="button"><ArrowDown className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex">
                        <button aria-label="设为封面" className="icon-button-dark" onClick={() => setCoverAssetId(photo.id)} type="button"><Star className={`h-3.5 w-3.5 ${coverAssetId === photo.id ? "fill-current" : ""}`} /></button>
                        <button aria-label="从图集中移除" className="icon-button-dark" onClick={() => removePhoto(photo.id)} type="button"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {coverAssetId === photo.id ? <span className="absolute left-2 top-2 bg-[var(--ui-surface)] px-2 py-1 text-[11px] font-semibold text-[var(--ui-ink)]">封面</span> : null}
                    {isRawPhotoName(photo.originalName) ? <span className="absolute right-2 top-2 bg-neutral-950 px-2 py-1 text-[11px] font-semibold text-white">RAW</span> : null}
                  </div>
                  <div className="space-y-1.5 p-2.5 text-xs text-[var(--ui-muted)]">
                    <label className={styles.selectPhoto}><input type="checkbox" aria-label={`选择照片 ${photo.originalName}`} checked={selectedIds.has(photo.id)} onChange={e => changeSelection(e.target.checked ? [...selected, photo.id] : selected.filter(id => id !== photo.id))} />选择</label>
                    <p className="truncate font-semibold text-[var(--ui-ink)]" title={photo.originalName}>{photo.originalName}</p>
                    <p className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 shrink-0" />{photo.takenAt ? formatTakenAt(photo.takenAt) : "未读取拍摄时间"}</p>
                    <p className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{[photo.cameraModel, photo.lens].filter(Boolean).join(" · ") || "未读取相机信息"}</span></p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{photo.latitude !== null && photo.longitude !== null ? "已设置坐标" : "未设置坐标"}</p>
                  </div>
                </div>
              );})}
            </div>
          )}
        </section>

        <aside aria-label="图集信息">
          {selectedPhotos.length > 0 ? <section id="photo-batch-editor" className={styles.batchPanel}>
            <h2 className="section-heading mb-4">编辑所选 · {selectedPhotos.length} 张</h2>
            <PhotoMetadataEditor key={selected.join(',')} photos={selectedPhotos} onSaved={updatePhotos} onDirty={dirty => { batchDirty.current = dirty; }} />
          </section> : <>
          <section className="border-t border-[var(--ui-line)] pt-5">
            <h2 className="section-heading">发布</h2>
            <label className="form-label mt-4">状态<Select className="form-input" value={visibility} onChange={(event) => setVisibility(event.target.value as CollectionVisibility)}><option value="draft">草稿</option><option value="private">私有</option><option value="public">公开</option></Select></label>
            <label className="mt-4 flex items-center gap-3 text-sm"><input checked={featured} type="checkbox" onChange={(event) => setFeatured(event.target.checked)} />首页精选</label>
          </section>
          <section className="border-t border-[var(--ui-line)] pt-5">
            <h2 className="section-heading">整理</h2>
            <label className="form-label mt-4">分类<Select className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>{archiveCategories.map((item) => <option key={item}>{item}</option>)}</Select></label>
            <label className="form-label mt-4">标签<Input className="form-input" placeholder="夜景, 城市, 胶片" value={tags} onChange={(event) => setTags(event.target.value)} /></label>
          </section>
          <section className="border-t border-[var(--ui-line)] pt-5">
            <h2 className="section-heading">时间</h2>
            <div className="mt-4 grid grid-cols-2 gap-3"><label className="form-label">开始<Input className="form-input" type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} /></label><label className="form-label">结束<Input className="form-input" type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} /></label></div>
          </section>
          <section id="collection-location" tabIndex={-1} className={styles.locationSection}>
            <h2 className="section-heading">地点</h2>
            <LocationPicker latitude={latitude} longitude={longitude} disabled={saving} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); setLocationSource("manual"); setLocationConfirmed(false); }} />
            <div className="mt-4 grid grid-cols-2 gap-3"><label className="form-label">国家代码<Input className="form-input" placeholder="CN / JP" value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} /></label><label className="form-label">国家<Input className="form-input" placeholder="中国" value={countryName} onChange={(event) => setCountryName(event.target.value)} /></label></div>
            <div className="mt-3 grid grid-cols-2 gap-3"><label className="form-label">省份代码<Input className="form-input" placeholder="henan" value={regionCode} onChange={(event) => setRegionCode(event.target.value)} /></label><label className="form-label">省份<Input className="form-input" placeholder="河南" value={regionName} onChange={(event) => setRegionName(event.target.value)} /></label></div>
            <label className="form-label mt-3">城市<Input className="form-input" value={city} onChange={(event) => setCity(event.target.value)} /></label>
            <label className="form-label mt-3">展示名称<Input className="form-input" placeholder="中国 · 河南 · 郑州" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
            <div className="mt-3 grid grid-cols-2 gap-3"><label className="form-label">纬度<Input className="form-input" inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label><label className="form-label">经度<Input className="form-input" inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label></div>
            {locationSource === "exif" ? <p className="mt-3 text-xs leading-5 text-[var(--ui-accent-soft)]">坐标来自 EXIF，请确认国家、城市与坐标后再发布。</p> : null}
            <label className="mt-3 flex items-start gap-2 text-sm"><input className="mt-1" checked={locationConfirmed} type="checkbox" onChange={(event) => setLocationConfirmed(event.target.checked)} />地点信息已经确认</label>
          </section>
          </>}
        </aside>
      </div>
    </form>
    {editingId && photos.find(photo => photo.id === editingId) && <PhotoEditDialog key={editingId} photo={photos.find(photo => photo.id === editingId)!} onClose={() => setEditingId(null)} onSaved={updatePhotos} />}
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { PhotoAssetRecord } from '@backend/modules/library/types';
import { mediaUrl } from '@/modules/media/urls';
import styles from './photo-editor.module.css';
import LocationPicker from './LocationPicker';

const fields = [
  ['takenAt', '拍摄时间', 'text'], ['latitude', '纬度', 'number'], ['longitude', '经度', 'number'],
  ['cameraMake', '相机品牌', 'text'], ['cameraModel', '相机型号', 'text'], ['lens', '镜头', 'text'],
  ['focalLength', '焦距 (mm)', 'number'], ['aperture', '光圈', 'number'], ['shutterSpeed', '快门', 'text'], ['iso', 'ISO', 'number'],
] as const;
type Field = typeof fields[number][0];

export function PhotoMetadataEditor({ photos, onSaved, onDirty }: { photos: PhotoAssetRecord[]; onSaved: (photos: PhotoAssetRecord[]) => void; onDirty: (dirty: boolean) => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([key]) => [key, photos.every(p => p[key] === photos[0][key]) ? String(photos[0][key] ?? '') : ''])));
  const [dirty, setDirty] = useState<Set<Field>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    if (busy || !dirty.size) return;
    setBusy(true); setMessage('');
    try {
      const patch = Object.fromEntries(fields.filter(([key]) => dirty.has(key)).map(([key, , type]) => [key, values[key].trim() === '' ? null : type === 'number' ? Number(values[key]) : values[key]]));
      const response = await fetch('/api/studio/assets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: photos.map(p => p.id), patch }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '保存失败。');
      onSaved(result.assets); setDirty(new Set()); onDirty(false); setMessage(`已保存 ${photos.length} 张照片。`);
    } catch (error) { setMessage(error instanceof Error ? error.message : '网络异常，请重试。'); }
    finally { setBusy(false); }
  }
  return <div className={styles.fields} onKeyDown={e => { if (e.key === 'Enter' && e.target instanceof HTMLInputElement) { e.preventDefault(); void save(); } }}>
    <p className={styles.hint}>{photos.length > 1 ? '只应用修改过的字段；清空字段会删除原值。' : '修改保存到照片资料，不改动原片。'}</p>
    <LocationPicker latitude={values.latitude} longitude={values.longitude} disabled={busy} onChange={(latitude, longitude) => {
      setValues(value => ({ ...value, latitude, longitude }));
      setDirty(value => new Set(value).add('latitude').add('longitude'));
      onDirty(true); setMessage('');
    }} />
    <fieldset disabled={busy} className={styles.grid}>
      {fields.map(([key, label, type]) => <label key={key}>{label}
        <input className="ui-input" type={type} step={key === 'iso' ? '1' : 'any'} value={values[key]} placeholder={!photos.every(p => p[key] === photos[0][key]) ? '多个值（保持原值）' : key === 'takenAt' ? '2026-10-11T14:30:00+08:00' : ''} onChange={e => { setValues(v => ({ ...v, [key]: e.target.value })); setDirty(d => new Set(d).add(key)); onDirty(true); setMessage(''); }} />
      </label>)}
    </fieldset>
    <button type="button" className="ui-button ui-button-primary" disabled={busy || !dirty.size} onClick={save}>{busy ? '保存中…' : photos.length > 1 ? `应用到 ${photos.length} 张照片` : '保存照片'}</button>
    {message && <p role="status" className={styles.hint}>{message}</p>}
  </div>;
}

export default function PhotoEditDialog({ photo, onClose, onSaved }: { photo: PhotoAssetRecord; onClose: () => void; onSaved: (photos: PhotoAssetRecord[]) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const dirty = useRef(false);
  useEffect(() => {
    const element = ref.current!;
    const trigger = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; trigger?.focus(); };
  }, []);
  function close() { if (!dirty.current || window.confirm('放弃尚未保存的照片修改？')) onClose(); }
  return createPortal(<dialog ref={ref} className={styles.dialog} aria-label="编辑照片数据" onCancel={e => { e.preventDefault(); close(); }}>
    <header><div><h2>编辑照片</h2><p>{photo.originalName}</p></div><button type="button" className="ui-button" aria-label="关闭照片编辑" onClick={close}><X size={18} /></button></header>
    <div className={styles.body}>
      <div className={styles.preview}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(photo.id, 'display')} alt={photo.originalName} />
      </div>
      <PhotoMetadataEditor photos={[photo]} onSaved={onSaved} onDirty={value => { dirty.current = value; }} />
    </div>
  </dialog>, document.body);
}

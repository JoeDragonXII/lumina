"use client";
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { Map as MapInstance, Marker as MapMarker } from 'maplibre-gl';
import styles from './location-picker.module.css';
import type { PlaceSearchResult } from '@backend/modules/map/server/searchPlaces';

type Props = { latitude: string; longitude: string; disabled?: boolean; onChange: (latitude: string, longitude: string) => void };
function coordinate(latitude: string, longitude: string): [number, number] | null {
  const lat = Number(latitude), lng = Number(longitude);
  return latitude.trim() && longitude.trim() && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85.051129 && Math.abs(lng) <= 180 ? [lng, lat] : null;
}
export default function LocationPicker({ latitude, longitude, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('正在加载地图…');
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const searchRequest = useRef<AbortController | null>(null);
  useEffect(() => () => searchRequest.current?.abort(), []);
  async function search() {
    if (!query.trim() || disabled) return;
    searchRequest.current?.abort();
    const controller = new AbortController(); searchRequest.current = controller;
    setSearching(true); setResults([]); setSearchMessage('');
    try {
      const params = new URLSearchParams({ q: query.trim() });
      if (city.trim()) params.set('city', city.trim());
      const response = await fetch(`/api/studio/places?${params}`, { signal: controller.signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '搜索失败，请重试。');
      if (controller.signal.aborted) return;
      setResults(payload.results);
      setSearchMessage(payload.results.length ? `找到 ${payload.results.length} 个地点，点击选择` : city.trim() ? '未找到地点，试试地点的正式名称或简称。' : '未找到地点，试试填写城市。');
    } catch (error) { if (!controller.signal.aborted) setSearchMessage(error instanceof Error ? error.message : '搜索失败，请重试。'); }
    finally { if (!controller.signal.aborted) setSearching(false); }
  }
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const marker = useRef<MapMarker | null>(null);
  const current = useRef({ latitude, longitude, disabled, onChange });
  useEffect(() => { current.current = { latitude, longitude, disabled, onChange }; }, [latitude, longitude, disabled, onChange]);
  useEffect(() => {
    if (!open) return;
    let disposed = false;
    let instance: MapInstance | undefined;
    let resize: ResizeObserver | undefined;
    const timeout = setTimeout(() => { if (!disposed) setStatus('地图加载较慢，可重试或直接填写坐标。'); }, 15000);
    async function initialize() {
      try {
        const lib = await import('maplibre-gl');
        if (disposed || !container.current) return;
        const point = coordinate(current.current.latitude, current.current.longitude);
        instance = new lib.Map({ container: container.current, style: '/api/openfreemap/styles/positron', center: point || [104, 35], zoom: point ? 13 : 3, attributionControl: { compact: true } });
        map.current = instance;
        instance.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
        marker.current = new lib.Marker({ color: '#c39059', draggable: !current.current.disabled });
        if (point) marker.current.setLngLat(point).addTo(instance);
        function choose(lng: number, lat: number) {
          if (current.current.disabled || !instance) return;
          const normalized = ((lng + 180) % 360 + 360) % 360 - 180;
          marker.current?.setLngLat([normalized, lat]).addTo(instance);
          current.current.onChange(lat.toFixed(6), normalized.toFixed(6));
        }
        instance.on('click', event => choose(event.lngLat.lng, event.lngLat.lat));
        marker.current.on('dragend', () => { const point = marker.current!.getLngLat(); choose(point.lng, point.lat); });
        instance.on('load', () => { if (!disposed) { clearTimeout(timeout); setReady(true); setStatus('点击地图或拖动标记选点'); } });
        instance.on('error', () => { if (!disposed) setStatus('部分地图未加载，可重试或直接填写坐标。'); });
        instance.getCanvas().setAttribute('aria-label', '位置地图，可用方向键平移');
        resize = new ResizeObserver(() => instance?.resize());
        resize.observe(container.current);
      } catch { if (!disposed) setStatus('地图暂不可用，请重试或直接填写坐标。'); }
    }
    void initialize();
    return () => { disposed = true; clearTimeout(timeout); resize?.disconnect(); marker.current?.remove(); marker.current = null; instance?.remove(); map.current = null; };
  }, [open, attempt]);
  useEffect(() => {
    const point = coordinate(latitude, longitude);
    if (!map.current || !marker.current) return;
    marker.current.setDraggable(!disabled);
    if (point) { marker.current.setLngLat(point).addTo(map.current); if (!map.current.getBounds().contains(point)) map.current.jumpTo({ center: point }); }
    else marker.current.remove();
  }, [latitude, longitude, disabled]);
  return <div className={styles.picker}>
    <button type="button" className="ui-button ui-button-ghost" aria-expanded={open} disabled={disabled} onClick={() => { setReady(false); setStatus('正在加载地图…'); setOpen(value => !value); }}>{open ? '收起地图' : '在地图上选位置'}</button>
    {open && <>
      <div className={styles.search} role="search" aria-label="地点搜索" onKeyDown={event => { if (event.key === 'Enter' && event.target instanceof HTMLInputElement) { event.stopPropagation(); if (!event.nativeEvent.isComposing) { event.preventDefault(); void search(); } } }}>
        <label className={styles.city}>城市（选填）<input className="ui-input" placeholder="如：哈尔滨" maxLength={64} value={city} disabled={disabled} onChange={event => {
          searchRequest.current?.abort(); setSearching(false); setResults([]); setSearchMessage(''); setCity(event.target.value);
        }} /></label>
        <label>地点<input className="ui-input" aria-label="搜索地点" placeholder="景点、建筑或地址" maxLength={160} value={query} disabled={disabled} onChange={event => {
          searchRequest.current?.abort(); setSearching(false); setResults([]); setSearchMessage(''); setQuery(event.target.value);
        }} /></label>
        <button type="button" className="ui-button" disabled={disabled || searching || !query.trim()} onClick={search}>{searching ? '搜索中…' : '搜索'}</button>
      </div>
      {searchMessage && <p role="status">{searchMessage}</p>}
      {results.length > 0 && <ul className={styles.results} aria-label="地点搜索结果">{results.map((result, index) => <li key={`${result.id}-${index}`}><button type="button" disabled={disabled} onClick={() => {
        onChange(result.latitude.toFixed(6), result.longitude.toFixed(6));
        map.current?.jumpTo({ center: [result.longitude, result.latitude], zoom: 14 });
        setResults([]); setSearchMessage(`已选择 ${result.name}，保存后生效`);
      }}><strong>{result.name}</strong><span>{result.address}</span></button></li>)}</ul>}
      <div ref={container} className={styles.map} aria-label="地图选点" />
      <p className={styles.credit}>地点搜索：<a href="https://photon.komoot.io" target="_blank" rel="noreferrer">Photon</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></p>
      <p role="status">{status}</p><div className={styles.actions}>
        <button type="button" className="ui-button" disabled={!ready || disabled} onClick={() => { const point = map.current?.getCenter().wrap(); if (point) onChange(point.lat.toFixed(6), point.lng.toFixed(6)); }}>使用地图中心</button>
        <button type="button" className="ui-button ui-button-ghost" disabled={disabled} onClick={() => { setReady(false); setStatus('正在加载地图…'); setAttempt(value => value + 1); }}>重新加载</button>
      </div></>}
  </div>;
}

"use client";

import { Moon, RotateCcw, Sun, X } from "lucide-react";

import {
  MAP_COLOR_PRESETS,
  type MapPaletteColors,
  type MapPaletteTheme,
  isHexColor,
} from "@/modules/map/mapPalette";

const colorFields: Array<{
  key: keyof MapPaletteColors;
  label: string;
  description: string;
}> = [
  { key: "accent", label: "足迹色", description: "已访问国家与路线" },
  { key: "focus", label: "焦点色", description: "中国与主要定位点" },
  { key: "land", label: "基础色", description: "普通国家与地图方格" },
];

export default function MapColorCustomizer({
  colors,
  isOpen,
  onClose,
  onColorsChange,
  onReset,
  onThemeChange,
  theme,
}: {
  colors: MapPaletteColors;
  isOpen: boolean;
  onClose: () => void;
  onColorsChange: (colors: MapPaletteColors) => void;
  onReset: () => void;
  onThemeChange: (theme: MapPaletteTheme) => void;
  theme: MapPaletteTheme;
}) {
  if (!isOpen) return null;

  const updateColor = (key: keyof MapPaletteColors, value: string) => {
    const normalized = value.toUpperCase();
    if (!isHexColor(normalized)) return;
    onColorsChange({ ...colors, [key]: normalized });
  };

  return (
    <section
      className="map-color-customizer"
      aria-label="地图自定义配色"
      data-theme-mode={theme}
    >
      <header className="map-color-customizer-header">
        <div>
          <p className="map-color-customizer-eyebrow">MAP PALETTE</p>
          <h2>地图配色</h2>
        </div>
        <button type="button" aria-label="关闭地图配色" onClick={onClose}>
          <X size={17} strokeWidth={1.7} />
        </button>
      </header>

      <div className="map-color-theme-switch" role="group" aria-label="地图昼夜主题">
        <button
          type="button"
          className={theme === "night-violet" ? "is-active" : ""}
          aria-pressed={theme === "night-violet"}
          onClick={() => onThemeChange("night-violet")}
        >
          <Moon size={15} />
          黑夜
        </button>
        <button
          type="button"
          className={theme === "daylight" ? "is-active" : ""}
          aria-pressed={theme === "daylight"}
          onClick={() => onThemeChange("daylight")}
        >
          <Sun size={15} />
          白天
        </button>
      </div>

      <div className="map-color-field-list">
        {colorFields.map((field) => (
          <label className="map-color-field" key={field.key}>
            <input
              type="color"
              aria-label={`${field.label}颜色选择器`}
              value={colors[field.key]}
              onChange={(event) => updateColor(field.key, event.target.value)}
            />
            <span className="map-color-field-copy">
              <strong>{field.label}</strong>
              <small>{field.description}</small>
            </span>
            <input
              className="map-color-hex-input"
              aria-label={`${field.label}色号`}
              defaultValue={colors[field.key]}
              key={`${theme}-${field.key}-${colors[field.key]}`}
              maxLength={7}
              spellCheck={false}
              onBlur={(event) => {
                if (isHexColor(event.target.value)) {
                  updateColor(field.key, event.target.value);
                } else {
                  event.target.value = colors[field.key];
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          </label>
        ))}
      </div>

      <footer className="map-color-customizer-footer">
        <div className="map-color-preset-preview" aria-label="当前三色预览">
          {(["accent", "focus", "land"] as const).map((key) => (
            <span key={key} style={{ backgroundColor: colors[key] }} />
          ))}
        </div>
        <button type="button" className="map-color-reset" onClick={onReset}>
          <RotateCcw size={14} />
          恢复参考色
        </button>
      </footer>

      <p className="map-color-reference">
        参考色：{Object.values(MAP_COLOR_PRESETS[theme]).join(" · ")}
      </p>
    </section>
  );
}

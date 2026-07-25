export type MapPaletteTheme = "night-violet" | "daylight";

export type MapPaletteColors = {
  accent: string;
  focus: string;
  land: string;
};

export const MAP_COLOR_PRESETS: Record<MapPaletteTheme, MapPaletteColors> = {
  "night-violet": {
    accent: "#FE6CB7",
    focus: "#FFD9D1",
    land: "#00489D",
  },
  daylight: {
    accent: "#97FE98",
    focus: "#FFF2DF",
    land: "#363531",
  },
};

export const MAP_COLOR_STORAGE_KEY = "lumina-map-colors-v1";

export const isHexColor = (value: string) => /^#[0-9A-F]{6}$/i.test(value);

const parseHex = (value: string) => [
  Number.parseInt(value.slice(1, 3), 16),
  Number.parseInt(value.slice(3, 5), 16),
  Number.parseInt(value.slice(5, 7), 16),
];

export const mixHexColors = (first: string, second: string, amount: number) => {
  const firstRgb = parseHex(first);
  const secondRgb = parseHex(second);
  const mixed = firstRgb.map((channel, index) =>
    Math.round(channel + (secondRgb[index] - channel) * amount),
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
};

export const createMapRenderPalette = (
  colors: MapPaletteColors,
  theme: MapPaletteTheme,
) => {
  const surface = theme === "daylight" ? "#ECEEF6" : "#050813";
  return {
    land: colors.land,
    active: colors.land,
    muted: mixHexColors(colors.land, surface, theme === "daylight" ? 0.58 : 0.46),
    visited: colors.accent,
    focus: colors.focus,
    hover: mixHexColors(colors.land, colors.focus, 0.42),
    visitedHover: mixHexColors(colors.accent, "#FFFFFF", 0.24),
    focusHover: mixHexColors(colors.focus, "#FFFFFF", 0.22),
  };
};

export const isMapPaletteColors = (value: unknown): value is MapPaletteColors => {
  if (!value || typeof value !== "object") return false;
  const colors = value as Partial<MapPaletteColors>;
  return Boolean(
    colors.accent &&
      colors.focus &&
      colors.land &&
      isHexColor(colors.accent) &&
      isHexColor(colors.focus) &&
      isHexColor(colors.land),
  );
};

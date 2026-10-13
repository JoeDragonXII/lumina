export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type WallPhoto = { id: string; width: number; height: number };
export type WallBlock<T> = { kind: "solo" | "stack" | "duo"; photos: T[] };

export function composePhotoWall<T extends WallPhoto>(photos: T[], columns: number, seed: number) {
  const random = seededRandom(seed);
  const lanes: WallBlock<T>[][] = Array.from({ length: Math.max(1, columns) }, () => []);
  const heights = lanes.map(() => 0);
  const patterns = shuffled<WallBlock<T>["kind"]>(["solo", "solo", "stack", "duo"], random);
  let index = 0;
  let blockIndex = 0;
  while (index < photos.length) {
    const lane = heights.indexOf(Math.min(...heights));
    let kind = patterns[blockIndex++ % patterns.length];
    const first = photos[index];
    const next = photos[index + 1];
    if (!next && (kind === "stack" || kind === "duo")) kind = "solo";
    // Paired portraits remain upright; unlike orientations work better stacked.
    if (kind === "duo" && next && (first.height > first.width) !== (next.height > next.width)) kind = "stack";
    const group = photos.slice(index, index + (kind === "stack" || kind === "duo" ? 2 : 1));
    index += group.length;
    lanes[lane].push({ kind, photos: group });
    const ratios = group.map(photo => photo.height / Math.max(1, photo.width));
    heights[lane] += (kind === "duo" ? Math.max(...ratios) / 2 : ratios.reduce((a, b) => a + b, 0)) + .12;
  }
  return lanes;
}

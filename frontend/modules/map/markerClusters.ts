import type { Map as MapLibreMap } from "maplibre-gl";

export interface MarkerSubject {
  count: number;
  id: string;
  imageUrl: string;
  kind: "collection" | "photo";
  label: string;
  latitude: number;
  longitude: number;
  note: string;
}

export interface ProjectedCluster extends MarkerSubject {
  memberIds: string[];
  rotation: number;
  x: number;
  y: number;
}

function clusterRotation(memberIds: string[]) {
  const hash = memberIds
    .join("")
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  return (hash % 7) - 3;
}

export function projectAndCluster(
  map: MapLibreMap,
  subjects: MarkerSubject[],
  kind: MarkerSubject["kind"],
): ProjectedCluster[] {
  const viewport = map.getContainer();
  const projected = subjects.map((subject) => {
    const point = map.project([subject.longitude, subject.latitude]);
    return { ...subject, memberIds: [subject.id], rotation: 0, x: point.x, y: point.y };
  }).filter(point => point.x >= -160 && point.y >= -180 && point.x <= viewport.clientWidth + 160 && point.y <= viewport.clientHeight + 180);
  const isCompact = map.getContainer().clientWidth < 720;
  const collisionWidth = isCompact ? 80 : 100;
  const collisionHeight = isCompact ? 100 : 120;
  const parent = projected.map((_, index) => index);
  const groupSizes = projected.map(() => 1);

  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index] ?? index);
    return parent[index] ?? index;
  };
  const union = (left: number, right: number) => {
    let leftRoot = find(left);
    let rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    if (groupSizes[leftRoot]! < groupSizes[rightRoot]!) [leftRoot,rightRoot]=[rightRoot,leftRoot];
    parent[rightRoot] = leftRoot;
    groupSizes[leftRoot] = groupSizes[leftRoot]! + groupSizes[rightRoot]!;
  };
  const spatialBuckets = new Map<string, number[]>();

  projected.forEach((subject, index) => {
    const cellX = Math.floor(subject.x / collisionWidth);
    const cellY = Math.floor(subject.y / collisionHeight);
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        const nearby = spatialBuckets.get(`${cellX + xOffset}:${cellY + yOffset}`) ?? [];
        for (const nearbyIndex of nearby) {
          const nearbySubject = projected[nearbyIndex];
          if (
            nearbySubject &&
            Math.abs(subject.x - nearbySubject.x) < collisionWidth &&
            Math.abs(subject.y - nearbySubject.y) < collisionHeight
          ) {
            union(index, nearbyIndex);
            // Each bucket is internally connected; one matching member links the whole bucket.
            break;
          }
        }
      }
    }
    const bucketKey = `${cellX}:${cellY}`;
    const bucket = spatialBuckets.get(bucketKey) || [];
    bucket.push(index); spatialBuckets.set(bucketKey, bucket);
  });

  const groups = new Map<number, typeof projected>();
  projected.forEach((subject, index) => {
    const root = find(index);
    const group = groups.get(root) || [];
    group.push(subject); groups.set(root, group);
  });

  return Array.from(groups.values(), (group) => {
    const representative = group.toSorted((left, right) => right.count - left.count)[0]!;
    const memberIds = group.map((subject) => subject.id).toSorted();
    return {
      ...representative,
      count: group.reduce((total, subject) => total + subject.count, 0),
      id: `${kind}:${memberIds.join("--")}`,
      label: group.length === 1
        ? representative.label
        : kind === "photo"
          ? `${group.length} 个拍摄位置`
          : `${representative.label}等 ${group.length} 地`,
      latitude: group.reduce((total, subject) => total + subject.latitude, 0) / group.length,
      longitude: group.reduce((total, subject) => total + subject.longitude, 0) / group.length,
      memberIds,
      note: group.length === 1
        ? representative.note
        : kind === "photo"
          ? "放大查看重叠的照片位置"
          : `附近 ${group.length} 个地点的影像合辑`,
      rotation: clusterRotation(memberIds),
      x: group.reduce((total, subject) => total + subject.x, 0) / group.length,
      y: group.reduce((total, subject) => total + subject.y, 0) / group.length,
    };
  });
}

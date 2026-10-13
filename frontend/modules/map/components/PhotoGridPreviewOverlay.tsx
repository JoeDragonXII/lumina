"use client";

import { m, useReducedMotion } from "motion/react";
import { useMemo } from "react";

import {
  MAP_GRID_GEOMETRY,
  type MapOverlayRenderContext,
} from "./SimpleWorldMap";
import styles from "./PhotoGridPreviewOverlay.module.css";

interface PhotoPoint {
  group: string;
  id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  title: string;
}

interface PhotoCluster {
  count: number;
  groups: Map<string, number>;
  id: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
  memberIds: string[];
  primaryGroup: string;
  title: string;
  x: number;
  y: number;
}

const FALLBACK_PHOTOS = [
  "/photos/guangzhou-1.png",
  "/photos/hangzhou-1.png",
  "/photos/hongkong-1.png",
  "/photos/qingdao-1.png",
  "/photos/shanghai-1.png",
] as const;

const COVER_HEIGHT = 62;
const COVER_RADIUS = 7;
const COVER_WIDTH = 62;
const COVER_X = -COVER_WIDTH / 2;
const COVER_Y = -56;
const COVER_COLLISION_GAP = 8;

const DEMO_GROUPS = [
  {
    count: 101,
    group: "east-asia",
    latitude: 35,
    longitude: 105,
    spreadLatitude: 2.1,
    spreadLongitude: 2.7,
    title: "东亚影像",
  },
  {
    count: 10,
    group: "north-america",
    latitude: 45,
    longitude: -102,
    spreadLatitude: 1.4,
    spreadLongitude: 1.8,
    title: "北美影像",
  },
  {
    count: 4,
    group: "south-america",
    latitude: -23,
    longitude: -57,
    spreadLatitude: 1,
    spreadLongitude: 1.2,
    title: "南美影像",
  },
] as const;

function createDemoPoints() {
  return DEMO_GROUPS.flatMap((group, groupIndex) =>
    Array.from({ length: group.count }, (_, index): PhotoPoint => {
      const angle = index * 2.399963229728653;
      const radius =
        0.22 + (((index * 37 + groupIndex * 19) % 97) / 97) * 0.78;

      return {
        group: group.group,
        id: `${group.group}-${index}`,
        imageUrl: FALLBACK_PHOTOS[(index + groupIndex) % FALLBACK_PHOTOS.length],
        latitude:
          group.latitude + Math.sin(angle) * radius * group.spreadLatitude,
        longitude:
          group.longitude + Math.cos(angle) * radius * group.spreadLongitude,
        title: group.title,
      };
    }),
  );
}

const DEMO_POINTS = createDemoPoints();

function cellDegreesForZoom(zoom: number) {
  if (zoom < 1.45) return 12;
  if (zoom < 2.05) return 6;
  return 3;
}

function safeClipId(value: string) {
  return `preview-photo-${value.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export default function PhotoGridPreviewOverlay({
  context,
}: {
  context: MapOverlayRenderContext;
}) {
  const prefersReducedMotion = useReducedMotion();

  const clusters = useMemo(() => {
    const cellDegrees = cellDegreesForZoom(context.camera.zoom);
    const buckets = new Map<
      string,
      {
        groups: Map<string, number>;
        imageUrls: string[];
        points: PhotoPoint[];
      }
    >();

    for (const point of DEMO_POINTS) {
      const longitudeCell = Math.floor((point.longitude + 180) / cellDegrees);
      const latitudeCell = Math.floor((point.latitude + 90) / cellDegrees);
      const id = `${cellDegrees}-${longitudeCell}-${latitudeCell}`;
      const current = buckets.get(id) ?? {
        groups: new Map<string, number>(),
        imageUrls: [],
        points: [],
      };

      current.points.push(point);
      current.groups.set(
        point.group,
        (current.groups.get(point.group) ?? 0) + 1,
      );
      if (!current.imageUrls.includes(point.imageUrl)) {
        current.imageUrls.push(point.imageUrl);
      }
      buckets.set(id, current);
    }

    const baseClusters = Array.from(buckets, ([, bucket]) => {
      const longitude =
        bucket.points.reduce((total, point) => total + point.longitude, 0) /
        bucket.points.length;
      const latitude =
        bucket.points.reduce((total, point) => total + point.latitude, 0) /
        bucket.points.length;
      const projected = context.project([longitude, latitude]);
      if (!projected) return null;

      const [rawX, rawY] = projected;
      if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;

      const primaryGroup =
        [...bucket.groups.entries()].toSorted(([, a], [, b]) => b - a)[0]?.[0] ??
        "";
      const title =
        bucket.points.find((point) => point.group === primaryGroup)?.title ??
        "照片聚类";
      const memberIds = bucket.points
        .map((point) => point.id)
        .toSorted();
      const id = `${primaryGroup}-${memberIds.length}-${memberIds[0]}-${memberIds.at(-1)}`;

      return {
        count: bucket.points.length,
        groups: bucket.groups,
        id,
        imageUrls: bucket.imageUrls,
        latitude,
        longitude,
        memberIds,
        primaryGroup,
        title,
        x:
          Math.floor(rawX / MAP_GRID_GEOMETRY.cellSize) *
            MAP_GRID_GEOMETRY.cellSize +
          MAP_GRID_GEOMETRY.cellSize / 2,
        y:
          Math.floor(rawY / MAP_GRID_GEOMETRY.cellSize) *
            MAP_GRID_GEOMETRY.cellSize +
          MAP_GRID_GEOMETRY.cellSize / 2,
      } satisfies PhotoCluster;
    }).filter((cluster): cluster is PhotoCluster => cluster !== null);

    const cardsOverlap = (left: PhotoCluster, right: PhotoCluster) => {
      const screenDeltaX =
        Math.abs(left.x - right.x) * context.camera.zoom;
      const screenDeltaY =
        Math.abs(left.y - right.y) * context.camera.zoom;

      return (
        screenDeltaX < COVER_WIDTH + COVER_COLLISION_GAP &&
        screenDeltaY < COVER_HEIGHT + COVER_COLLISION_GAP
      );
    };

    const mergeClusters = (
      left: PhotoCluster,
      right: PhotoCluster,
    ): PhotoCluster => {
      const count = left.count + right.count;
      const groups = new Map(left.groups);
      for (const [group, groupCount] of right.groups) {
        groups.set(group, (groups.get(group) ?? 0) + groupCount);
      }

      const primaryGroup =
        [...groups.entries()].toSorted(([, a], [, b]) => b - a)[0]?.[0] ?? "";
      const memberIds = [...left.memberIds, ...right.memberIds].toSorted();
      const latitude =
        (left.latitude * left.count + right.latitude * right.count) / count;
      const longitude =
        (left.longitude * left.count + right.longitude * right.count) / count;
      const projected = context.project([longitude, latitude]);
      const rawX =
        projected?.[0] ??
        (left.x * left.count + right.x * right.count) / count;
      const rawY =
        projected?.[1] ??
        (left.y * left.count + right.y * right.count) / count;
      const primarySource = [left, right].find(
        (cluster) => cluster.primaryGroup === primaryGroup,
      );

      return {
        count,
        groups,
        id: `${primaryGroup}-${memberIds.length}-${memberIds[0]}-${memberIds.at(-1)}`,
        imageUrls: [...new Set([...left.imageUrls, ...right.imageUrls])],
        latitude,
        longitude,
        memberIds,
        primaryGroup,
        title: primarySource?.title ?? "照片聚类",
        x:
          Math.floor(rawX / MAP_GRID_GEOMETRY.cellSize) *
            MAP_GRID_GEOMETRY.cellSize +
          MAP_GRID_GEOMETRY.cellSize / 2,
        y:
          Math.floor(rawY / MAP_GRID_GEOMETRY.cellSize) *
            MAP_GRID_GEOMETRY.cellSize +
          MAP_GRID_GEOMETRY.cellSize / 2,
      };
    };

    const mergedClusters = [...baseClusters];
    let didMerge = true;

    while (didMerge) {
      didMerge = false;

      mergeSearch: for (
        let leftIndex = 0;
        leftIndex < mergedClusters.length;
        leftIndex += 1
      ) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < mergedClusters.length;
          rightIndex += 1
        ) {
          const left = mergedClusters[leftIndex];
          const right = mergedClusters[rightIndex];
          if (!left || !right || !cardsOverlap(left, right)) continue;

          mergedClusters[leftIndex] = mergeClusters(left, right);
          mergedClusters.splice(rightIndex, 1);
          didMerge = true;
          break mergeSearch;
        }
      }
    }

    return mergedClusters;
  }, [context]);

  const inverseZoom = 1 / context.camera.zoom;

  return (
    <g
      className={styles.overlay}
      data-cell-degrees={cellDegreesForZoom(context.camera.zoom)}
      data-cluster-count={clusters.length}
    >
      {clusters.map((cluster) => {
        const coverBadgeWidth = 14 + String(cluster.count).length * 5.5;
        const coverClipId = safeClipId(cluster.id);
        const coverImageUrl = cluster.imageUrls[0] ?? FALLBACK_PHOTOS[0];

        return (
          <g
            key={cluster.id}
            className="map-preview-interactive"
            data-cluster-id={cluster.id}
            role="img"
            aria-label={`${cluster.title}，${cluster.count} 张照片`}
            transform={`translate(${cluster.x} ${cluster.y})`}
          >
            <g transform={`scale(${inverseZoom})`}>
              <m.g
                className={styles.photoFan}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.94, y: 6 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.12 }
                    : { type: "spring", stiffness: 520, damping: 42 }
                }
              >
                  <g className={styles.photo}>
                    <defs>
                      <clipPath id={coverClipId}>
                        <rect
                          height={COVER_HEIGHT}
                          rx={COVER_RADIUS}
                          width={COVER_WIDTH}
                          x={COVER_X}
                          y={COVER_Y}
                        />
                      </clipPath>
                    </defs>
                    <rect
                      className={styles.photoFrame}
                      height={COVER_HEIGHT + 4}
                      rx={COVER_RADIUS + 2}
                      width={COVER_WIDTH + 4}
                      x={COVER_X - 2}
                      y={COVER_Y - 2}
                    />
                    <image
                      clipPath={`url(#${coverClipId})`}
                      height={COVER_HEIGHT}
                      href={coverImageUrl}
                      preserveAspectRatio="xMidYMid slice"
                      width={COVER_WIDTH}
                      x={COVER_X}
                      y={COVER_Y}
                    />
                    <g
                      className={styles.coverCountBadge}
                      transform={`translate(${
                        COVER_X + COVER_WIDTH - coverBadgeWidth / 2 + 3
                      } ${COVER_Y - 7})`}
                    >
                      <rect height="19" rx="9.5" width={coverBadgeWidth} />
                      <text x={coverBadgeWidth / 2} y="12.7">
                        {cluster.count}
                      </text>
                    </g>
                  </g>
              </m.g>
            </g>
          </g>
        );
      })}
    </g>
  );
}

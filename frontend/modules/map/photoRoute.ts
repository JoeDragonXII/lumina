export interface PositionedPhoto {
  id: string;
  latitude: number | null;
  longitude: number | null;
  position: number;
  takenAt?: string;
}

export interface PhotoRoutePoint {
  id: string;
  latitude: number;
  longitude: number;
}

export function hasValidPhotoCoordinates<
  T extends Pick<PositionedPhoto, "latitude" | "longitude">,
>(photo: T): photo is T & { latitude: number; longitude: number } {
  return (
    typeof photo.latitude === "number" &&
    Number.isFinite(photo.latitude) &&
    Math.abs(photo.latitude) <= 85 &&
    typeof photo.longitude === "number" &&
    Number.isFinite(photo.longitude) &&
    Math.abs(photo.longitude) <= 180
  );
}

function photoTime(photo: PositionedPhoto) {
  if (!photo.takenAt) return null;
  const time = Date.parse(photo.takenAt);
  return Number.isFinite(time) ? time : null;
}

export function buildPhotoRoute(photos: PositionedPhoto[]): PhotoRoutePoint[] {
  const ordered = photos
    .filter(hasValidPhotoCoordinates)
    .toSorted((left, right) => {
      const leftTime = photoTime(left);
      const rightTime = photoTime(right);
      if (leftTime !== null && rightTime !== null && leftTime !== rightTime) {
        return leftTime - rightTime;
      }
      if (leftTime !== null && rightTime === null) return -1;
      if (leftTime === null && rightTime !== null) return 1;
      return left.position - right.position;
    });

  return ordered.reduce<PhotoRoutePoint[]>((route, photo) => {
    const previous = route.at(-1);
    if (
      previous?.latitude === photo.latitude &&
      previous.longitude === photo.longitude
    ) {
      return route;
    }
    route.push({
      id: photo.id,
      latitude: photo.latitude,
      longitude: photo.longitude,
    });
    return route;
  }, []);
}

import type { Location } from '../../models/domain';
export const isStale = (location: Location, now = Date.now()) =>
  now - new Date(location.at).getTime() > 120000;
export const coordinates = (location: Pick<Location, 'lng' | 'lat'>): [number, number] => [
  location.lng,
  location.lat,
];
// Schematic projection only. This is not a road map or navigation system.
export function project(location: Location, all: Location[]) {
  const lngs = all.map((l) => l.lng),
    lats = all.map((l) => l.lat);
  const minX = Math.min(...lngs) - 0.003,
    maxX = Math.max(...lngs) + 0.003,
    minY = Math.min(...lats) - 0.003,
    maxY = Math.max(...lats) + 0.003;
  return {
    left: `${15 + (70 * (location.lng - minX)) / (maxX - minX)}%`,
    top: `${15 + (60 * (maxY - location.lat)) / (maxY - minY)}%`,
  };
}

export type MapPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  stale: boolean;
  /** Plain-text lines for the marker popup (address, recorded time). */
  details?: string[];
};
const validPoint = (p: Pick<MapPoint, 'lat' | 'lng'>) =>
  Number.isFinite(p.lat) &&
  Number.isFinite(p.lng) &&
  Math.abs(p.lat) <= 90 &&
  Math.abs(p.lng) <= 180;
/** Drops out-of-range coordinates so a bad server value never moves the map off the world. */
export const mapPoints = (points: MapPoint[]) => points.filter(validPoint);
/** Camera for the points: none → null, one → its centre, several → [[w, s], [e, n]] bounds. */
export function mapView(points: Pick<MapPoint, 'lat' | 'lng'>[]) {
  const valid = points.filter(validPoint);
  if (!valid.length) return null;
  if (valid.length === 1) return { center: coordinates(valid[0]) };
  const lngs = valid.map((p) => p.lng);
  const lats = valid.map((p) => p.lat);
  return {
    bounds: [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ] as [[number, number], [number, number]],
  };
}

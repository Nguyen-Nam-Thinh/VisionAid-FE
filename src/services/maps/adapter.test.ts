import { expect, it } from 'vitest';
import { mapPoints, mapView } from './adapter';

const point = (id: string, lat: number, lng: number) => ({
  id,
  label: id,
  lat,
  lng,
  stale: false,
});

it('drops out-of-range or non-finite coordinates before placing markers', () => {
  expect(
    mapPoints([
      point('ok', 10.78, 106.7),
      point('lat', 91, 106.7),
      point('lng', 10.78, -181),
      point('nan', Number.NaN, 106.7),
      point('edge', -90, 180),
    ]).map((p) => p.id),
  ).toEqual(['ok', 'edge']);
});

it('frames one point by centre and several by [lng, lat] bounds', () => {
  expect(mapView([])).toBeNull();
  expect(mapView([point('bad', 100, 0)])).toBeNull();
  expect(mapView([point('a', 10.78, 106.7)])).toEqual({ center: [106.7, 10.78] });
  expect(mapView([point('a', 10.7, 106.6), point('b', 10.9, 106.8), point('bad', 95, 0)])).toEqual({
    bounds: [
      [106.6, 10.7],
      [106.8, 10.9],
    ],
  });
});

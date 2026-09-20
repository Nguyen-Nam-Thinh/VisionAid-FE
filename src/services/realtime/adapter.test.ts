import { expect, it } from 'vitest';
import { acceptVersion } from './adapter';
import { isStale, coordinates } from '../maps/adapter';
it('rejects duplicate/out-of-order event versions', () => {
  const seen = new Map<string, number>();
  expect(acceptVersion(seen, 'alert', 2)).toBe(true);
  expect(acceptVersion(seen, 'alert', 1)).toBe(false);
  expect(acceptVersion(seen, 'alert', 2)).toBe(false);
  expect(acceptVersion(seen, 'alert', 3)).toBe(true);
});
it('uses recorded time for stale state and longitude-first SDK coordinates', () => {
  const l = {
    viuId: 'a',
    lat: 10,
    lng: 106,
    at: new Date(0).toISOString(),
    battery: null,
    accuracy: null,
    network: null,
  };
  expect(isStale(l, 121000)).toBe(true);
  expect(coordinates(l)).toEqual([106, 10]);
});

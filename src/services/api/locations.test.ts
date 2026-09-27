import { expect, it, vi } from 'vitest';
import { createLocationsApi, historyRange, locationAge } from './locations';
const id = '01900000-0000-7000-8000-000000000001';
const other = '01900000-0000-7000-8000-000000000002';
const actor = { role: 'Caregiver' as const, orgId: '' };
const live = {
  userId: id,
  latitude: 0,
  longitude: 0,
  formattedAddress: '',
  street: null,
  district: null,
  city: null,
  geocodeProvider: null,
  cachedAt: '2026-09-26T00:00:00Z',
  updatedAt: '2026-09-26T01:00:00Z',
};
it('preserves zero coordinates, forwards cancellation and rejects wrong user or malformed points', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLocationsApi>[0]>>(async () => live);
  const api = createLocationsApi(get);
  const signal = new AbortController().signal;
  expect((await api.live(actor, id, signal)).latitude).toBe(0);
  expect(get).toHaveBeenCalledWith('/api/locations/live?viuId=' + id, signal);
  get.mockResolvedValue({ ...live, userId: other });
  await expect(api.live(actor, id)).rejects.toMatchObject({ status: 403 });
  get.mockResolvedValue({ ...live, latitude: null });
  await expect(api.live(actor, id)).rejects.toMatchObject({ status: 502 });
});
it('blocks unsupported roles and invalid IDs before requesting GPS', async () => {
  const get = vi.fn();
  const api = createLocationsApi(get);
  await expect(api.live({ role: 'Admin', orgId: '' }, id)).rejects.toMatchObject({ status: 403 });
  await expect(api.live({ role: 'CenterAdmin', orgId: '' }, id)).rejects.toMatchObject({
    status: 403,
  });
  await expect(api.live(actor, 'bad')).rejects.toMatchObject({ status: 400 });
  expect(get).not.toHaveBeenCalled();
});
it('converts dates to UTC, pages history and preserves null and zero telemetry', async () => {
  const item = {
    id,
    latitude: 0,
    longitude: 0,
    accuracyMeters: null,
    altitude: -2,
    speedMps: 0,
    heading: null,
    batteryLevel: 0,
    networkStatus: null,
    recordedAt: live.cachedAt,
    sessionId: null,
  };
  const get = vi.fn<NonNullable<Parameters<typeof createLocationsApi>[0]>>(async () => ({
    items: [item],
    page: 2,
    pageSize: 20,
    totalCount: 21,
    totalPages: 2,
    hasPreviousPage: true,
    hasNextPage: false,
  }));
  const api = createLocationsApi(get);
  const range = historyRange('2026-09-26T07:00:00+07:00', '2026-09-26T08:00:00+07:00');
  expect(range.dateFrom).toBe('2026-09-26T00:00:00.000Z');
  expect((await api.history(actor, id, 2, range)).items[0]).toEqual(item);
  const url = new URL(get.mock.calls[0][0], 'http://test');
  expect(url.searchParams.get('pageSize')).toBe('20');
  expect(url.searchParams.get('dateFrom')).toBe(range.dateFrom);
  await expect(api.history(actor, id, 0, range)).rejects.toMatchObject({ status: 400 });
  expect(() => historyRange(range.dateTo, range.dateFrom)).toThrow();
  expect(() => historyRange('bad', '')).toThrow();
});
it('marks old recorded GPS stale even if server update is recent', () => {
  expect(locationAge(live.cachedAt, Date.parse(live.updatedAt))).toContain('Dữ liệu cũ');
  expect(locationAge(live.cachedAt, Date.parse(live.cachedAt))).toContain('Ghi nhận');
  expect(locationAge(live.updatedAt, Date.parse(live.cachedAt))).toContain('kiểm tra');
});

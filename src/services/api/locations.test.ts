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
  expect(url.searchParams.get('pageSize')).toBe('10');
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
it('pages boundary events with type and UTC dates and rejects events of another VIU', async () => {
  const event = {
    id: other,
    visuallyImpairedUserId: id,
    eventType: 'Exited',
    geofenceId: other,
    geofenceName: 'Nhà',
    savedLocationId: null,
    savedLocationName: null,
    latitude: 0,
    longitude: 0,
    alertSent: true,
    occurredAt: live.cachedAt,
  };
  const page = {
    items: [event],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
  const get = vi.fn<NonNullable<Parameters<typeof createLocationsApi>[0]>>(async () => page);
  const api = createLocationsApi(get);
  const range = historyRange('2026-09-26T07:00:00+07:00', '');
  expect(
    (await api.boundaryEvents(actor, id, { ...range, eventType: 'Exited', page: 1 })).items[0],
  ).toEqual(event);
  const url = new URL(get.mock.calls[0][0], 'http://test');
  expect(url.pathname).toBe('/api/locations/boundary-events');
  expect(url.searchParams.get('viuId')).toBe(id);
  expect(url.searchParams.get('eventType')).toBe('Exited');
  expect(url.searchParams.get('dateFrom')).toBe('2026-09-26T00:00:00.000Z');
  expect(url.searchParams.has('dateTo')).toBe(false);
  get.mockResolvedValue({ ...page, items: [{ ...event, visuallyImpairedUserId: other }] });
  await expect(
    api.boundaryEvents(actor, id, { ...range, eventType: '', page: 1 }),
  ).rejects.toMatchObject({
    status: 403,
  });
  get.mockResolvedValue({ ...page, items: [{ ...event, eventType: 'Breached' }] });
  await expect(
    api.boundaryEvents(actor, id, { ...range, eventType: '', page: 1 }),
  ).rejects.toMatchObject({
    status: 502,
  });
  get.mockClear();
  await expect(
    api.boundaryEvents({ role: 'Admin', orgId: '' }, id, { ...range, eventType: '', page: 1 }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    api.boundaryEvents(actor, id, { ...range, eventType: '', page: 0 }),
  ).rejects.toMatchObject({
    status: 400,
  });
  expect(get).not.toHaveBeenCalled();
});

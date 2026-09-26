import { expect, it, vi } from 'vitest';
import { createCaregivingApi } from './caregiving';
const caregiverId = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const id = '01900000-0000-7000-8000-000000000003';
const link = {
  id,
  caregiverId,
  visuallyImpairedUserId: viuId,
  viuFullName: 'VIU',
  isPrimary: false,
  linkType: 'Personal',
  canReceiveAlerts: true,
  canManageRegistry: false,
  canManageLocations: false,
  linkedAt: '2026-09-26T00:00:00Z',
  unlinkedAt: null,
};
const page = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 10,
  totalCount: items.length,
  totalPages: items.length ? 1 : 0,
  hasNextPage: false,
  hasPreviousPage: false,
});
it('uses paged server filters and forwards cancellation without using user detail endpoint', async () => {
  const read = vi.fn<Parameters<typeof createCaregivingApi>[0]>(async () => page([]));
  const api = createCaregivingApi(read);
  const signal = new AbortController().signal;
  await api.users(2, 'A & B', signal);
  const url = new URL(read.mock.calls[0][0] as string, 'http://example.test');
  expect(url.pathname).toBe('/api/users');
  expect(url.searchParams.get('page')).toBe('2');
  expect(url.searchParams.get('search')).toBe('A & B');
  expect(url.searchParams.get('role')).toBe('VisuallyImpaired');
  expect(read.mock.calls[0][1]).toBe(signal);
  await api.links(caregiverId, viuId, 1, signal);
  expect(String(read.mock.calls[1][0])).toContain('viuId=' + viuId);
});
it('rejects malformed data and links outside the selected user/account scope', async () => {
  const read = vi.fn<Parameters<typeof createCaregivingApi>[0]>(async () => link as unknown);
  const api = createCaregivingApi(read);
  expect((await api.detail(id, caregiverId, viuId)).canManageRegistry).toBe(false);
  await expect(api.detail(id, viuId, caregiverId)).rejects.toMatchObject({ status: 403 });
  read.mockResolvedValue({ ...link, canManageRegistry: 'true' });
  await expect(api.detail(id, caregiverId, viuId)).rejects.toMatchObject({ status: 502 });
  read.mockResolvedValue(page([{ ...link, caregiverId: viuId }]));
  await expect(api.links(caregiverId, viuId, 1)).rejects.toMatchObject({ status: 403 });
});

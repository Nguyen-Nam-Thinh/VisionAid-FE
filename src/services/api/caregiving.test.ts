import { expect, it, vi } from 'vitest';
import { createCaregivingApi } from './caregiving';
import { ServiceError } from '../contracts';
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
it('creates only a VIU and prevents account creation when caregiver quota is full', async () => {
  const read = vi.fn(async () => page([]));
  const person = {
    id: viuId,
    fullName: 'VIU',
    email: 'viu@example.com',
    phoneNumber: '',
    role: 'VisuallyImpaired',
    organizationId: null,
    isActive: true,
  };
  const write = vi.fn<NonNullable<Parameters<typeof createCaregivingApi>[1]>>(async () => person);
  const api = createCaregivingApi(read, write);
  const input = { fullName: 'VIU', email: person.email, phoneNumber: '', password: 'Test123!' };
  await api.createUser(input, caregiverId);
  expect(write.mock.calls[0][0]).toBe('/api/users');
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({
    ...input,
    role: 'VisuallyImpaired',
    organizationId: null,
  });
  read.mockResolvedValue({ ...page([]), totalCount: 3 });
  await expect(api.createUser(input, caregiverId)).rejects.toMatchObject({ status: 422 });
  expect(write).toHaveBeenCalledTimes(1);
});
it('reconciles a duplicate link with a scoped read without replaying POST', async () => {
  const read = vi.fn(async () => page([link]));
  const write = vi.fn(async () => {
    throw new ServiceError('Duplicate', 409);
  });
  const api = createCaregivingApi(read, write);
  expect(
    await api.createLink(viuId, caregiverId, {
      canReceiveAlerts: true,
      canManageRegistry: false,
      canManageLocations: false,
    }),
  ).toEqual(link);
  expect(write).toHaveBeenCalledTimes(1);
  read.mockResolvedValue(page([]));
  await expect(
    api.createLink(viuId, caregiverId, {
      canReceiveAlerts: true,
      canManageRegistry: false,
      canManageLocations: false,
    }),
  ).rejects.toMatchObject({ status: 409 });
});
it('checks ownership and type immediately before unlink and handles 204', async () => {
  const read = vi.fn(async () => link);
  const write = vi.fn(async () => undefined);
  const api = createCaregivingApi(read, write);
  await api.unlink(id, caregiverId, viuId);
  expect(write).toHaveBeenCalledWith('/api/caregiver-links/' + id, { method: 'DELETE' });
  read.mockResolvedValue({ ...link, linkType: 'Organization' });
  await expect(api.unlink(id, caregiverId, viuId)).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(1);
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

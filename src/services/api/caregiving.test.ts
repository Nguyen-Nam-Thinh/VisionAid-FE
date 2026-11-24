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
/** An active link of `owner` to the VIU numbered `viu`. */
const linkOf = (owner: string, viu: number, n: number) => ({
  ...link,
  id: '01900000-0000-7000-8000-0000000001' + String(n).padStart(2, '0'),
  caregiverId: owner,
  visuallyImpairedUserId: '01900000-0000-7000-8000-0000000002' + String(viu).padStart(2, '0'),
});
const own = (count: number) => Array.from({ length: count }, (_, i) => linkOf(caregiverId, i, i));
const otherId = '01900000-0000-7000-8000-000000000009';
const others = (count: number) =>
  Array.from({ length: count }, (_, i) => linkOf(otherId, i, 50 + i));
it.each([
  { mine: 1, theirs: 1, allowed: true },
  { mine: 3, theirs: 2, allowed: false },
  { mine: 2, theirs: 3, allowed: true },
])(
  'counts only own links: $mine own, $theirs of co-caregivers, allowed $allowed',
  async ({ mine, theirs, allowed }) => {
    // Co-caregivers' links come first, as staging returns them.
    const read = vi.fn(async (path: string) =>
      path.startsWith('/api/system-configs/public')
        ? page([{ configKey: 'caregiving.max_vius_per_caregiver', configValue: '3' }])
        : page([...others(theirs), ...own(mine)]),
    );
    const write = vi.fn(async () => ({
      id: viuId,
      fullName: 'VIU',
      email: 'viu@example.com',
      phoneNumber: '',
      role: 'VisuallyImpaired',
      organizationId: null,
      isActive: true,
    }));
    const result = createCaregivingApi(read, write).createUser(
      { fullName: 'VIU', email: 'viu@example.com', phoneNumber: '', password: 'Test123!' },
      caregiverId,
    );
    if (allowed) {
      await result;
      expect(write).toHaveBeenCalledWith('/api/users', expect.anything());
    } else {
      await expect(result).rejects.toMatchObject({
        status: 422,
        message: expect.stringContaining('tối đa 3'),
      });
      expect(write).not.toHaveBeenCalled();
    }
  },
);
it('creates only a VIU and prevents account creation when caregiver quota is full', async () => {
  const read = vi.fn(async () => page([] as unknown[]));
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
  read.mockResolvedValue(page(own(3)));
  await expect(api.createUser(input, caregiverId)).rejects.toMatchObject({ status: 422 });
  expect(write).toHaveBeenCalledTimes(1);
  // BR-10: names need at least 2 characters after trimming.
  await expect(api.createUser({ ...input, fullName: ' A ' }, caregiverId)).rejects.toMatchObject({
    status: 400,
  });
  expect(write).toHaveBeenCalledTimes(1);
});
it('uses the Admin-configured VIU limit before creating an account', async () => {
  const read = vi.fn(async (path: string) =>
    path.startsWith('/api/system-configs/public')
      ? page([{ configKey: 'caregiving.max_vius_per_caregiver', configValue: '2' }])
      : page(own(2)),
  );
  const write = vi.fn();
  const api = createCaregivingApi(read, write);
  const input = {
    fullName: 'VIU',
    email: 'viu@example.com',
    phoneNumber: '',
    password: 'Test123!',
  };
  await expect(api.createUser(input, caregiverId)).rejects.toMatchObject({
    status: 422,
    message: expect.stringContaining('tối đa 2'),
  });
  expect(write).not.toHaveBeenCalled();
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
  expect(String(read.mock.calls.at(-1)![0])).toContain('viuId=' + viuId);
});
it('rejects malformed data and links outside the selected user/account scope', async () => {
  const read = vi.fn<Parameters<typeof createCaregivingApi>[0]>(async () => link as unknown);
  const api = createCaregivingApi(read);
  expect((await api.detail(id, caregiverId, viuId)).canManageRegistry).toBe(false);
  await expect(api.detail(id, viuId, caregiverId)).rejects.toMatchObject({ status: 403 });
  read.mockResolvedValue({ ...link, canManageRegistry: 'true' });
  await expect(api.detail(id, caregiverId, viuId)).rejects.toMatchObject({ status: 502 });
  // A primary also receives secondaries' links; links() keeps only the caller's own link.
  read.mockResolvedValue(page([link, { ...link, id: viuId, caregiverId: viuId }]));
  expect((await api.links(caregiverId, viuId, 1)).items).toEqual([link]);
  read.mockResolvedValue(page([{ ...link, visuallyImpairedUserId: caregiverId }]));
  await expect(api.links(caregiverId, viuId, 1)).rejects.toMatchObject({ status: 403 });
});

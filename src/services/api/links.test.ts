import { expect, it, vi } from 'vitest';
import { createLinksApi } from './links';
const cg = '01900000-0000-7000-8000-000000000001';
const viu = '01900000-0000-7000-8000-000000000002';
const id = '01900000-0000-7000-8000-000000000003';
const org = '01900000-0000-7000-8000-000000000004';
const admin = { id: org, role: 'Admin' as const, orgId: '' };
const center = { ...admin, role: 'CenterAdmin' as const, orgId: org };
const caregiver = { id: cg, role: 'Caregiver' as const, orgId: '' };
const flags = { canReceiveAlerts: true, canManageRegistry: false, canManageLocations: false };
const link = {
  id,
  caregiverId: cg,
  visuallyImpairedUserId: viu,
  caregiverFullName: 'CG',
  caregiverEmail: 'cg@test.test',
  viuFullName: 'VIU',
  viuEmail: 'viu@test.test',
  linkType: 'Personal',
  isPrimary: false,
  ...flags,
  linkedAt: '2026-09-26',
  unlinkedAt: null,
};
it('Caregiver can only manage own Personal link and cannot promote', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLinksApi>[0]>>(async () => link);
  const write = vi.fn(async () => link);
  const api = createLinksApi(get, write);
  await api.permissions(caregiver, id, flags);
  await expect(api.promote(caregiver, id)).rejects.toMatchObject({ status: 403 });
  get.mockResolvedValue({ ...link, linkType: 'Organization' });
  await expect(api.remove(caregiver, id)).rejects.toMatchObject({ status: 403 });
  get.mockResolvedValue({ ...link, caregiverId: viu });
  await expect(api.detail(caregiver, id)).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(1);
});
it('CenterAdmin checks both users in own organization before mutation', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLinksApi>[0]>>(async (path) =>
    path.startsWith('/api/users/')
      ? {
          id: path.endsWith(cg) ? cg : viu,
          role: path.endsWith(cg) ? 'Caregiver' : 'VisuallyImpaired',
          organizationId: path.endsWith(cg) ? org : id,
          isActive: true,
          deletedAt: null,
        }
      : { ...link, linkType: 'Organization' },
  );
  const write = vi.fn(async () => link);
  const api = createLinksApi(get, write);
  await expect(api.permissions(center, id, flags)).rejects.toMatchObject({ status: 403 });
  await expect(
    api.create(center, { caregiverId: cg, viuId: viu, linkType: 'Personal', ...flags }),
  ).rejects.toMatchObject({ status: 403 });
  expect(write).not.toHaveBeenCalled();
});
it('forces self Personal creation, preserves false permissions and never requests forced primary', async () => {
  const get = vi.fn(async () => link);
  const write = vi.fn<NonNullable<Parameters<typeof createLinksApi>[1]>>(async () => link);
  const api = createLinksApi(get, write);
  await api.create(caregiver, { caregiverId: viu, viuId: viu, linkType: 'Organization', ...flags });
  expect(get).not.toHaveBeenCalled();
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({
    caregiverId: cg,
    visuallyImpairedUserId: viu,
    linkType: 'Personal',
    isPrimary: false,
    ...flags,
  });
});
it('rejects inactive mutations and sends promote without body, unlink handles 204', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLinksApi>[0]>>(async () => ({
    ...link,
    unlinkedAt: '2026-09-26',
  }));
  const write = vi.fn<NonNullable<Parameters<typeof createLinksApi>[1]>>(async () => ({
    ...link,
    isPrimary: true,
  }));
  const api = createLinksApi(get, write);
  await expect(api.promote(admin, id)).rejects.toMatchObject({ status: 403 });
  expect(write).not.toHaveBeenCalled();
  get.mockResolvedValue(link);
  await api.promote(admin, id);
  expect(write).toHaveBeenCalledWith('/api/caregiver-links/' + id + '/promote-primary', {
    method: 'PATCH',
  });
  write.mockResolvedValue(undefined);
  await api.remove(admin, id);
  expect(write).toHaveBeenLastCalledWith('/api/caregiver-links/' + id, { method: 'DELETE' });
});
it('uses paged filters and cancellation, forces Organization for center list', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLinksApi>[0]>>(async () => ({
    items: [],
    page: 2,
    pageSize: 10,
    totalCount: 11,
    totalPages: 2,
    hasNextPage: false,
    hasPreviousPage: true,
  }));
  const api = createLinksApi(get);
  const signal = new AbortController().signal;
  await api.list(
    center,
    { page: 2, caregiverId: cg, viuId: viu, linkType: 'Personal', active: 'false' },
    signal,
  );
  expect(
    Object.fromEntries(new URL(get.mock.calls[0][0], 'http://test').searchParams),
  ).toMatchObject({
    page: '2',
    caregiverId: cg,
    viuId: viu,
    linkType: 'Organization',
    isActive: 'false',
  });
  expect(get.mock.calls[0][1]).toBe(signal);
});

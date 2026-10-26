import { expect, it, vi } from 'vitest';
import { createLinksApi, linkAccess, type CareLink } from './links';
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
  linkType: 'Personal' as const,
  isPrimary: false,
  ...flags,
  linkedAt: '2026-09-26',
  unlinkedAt: null,
};
const other = '01900000-0000-7000-8000-000000000005';
const linkPage = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 50,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
it('UC-32–34: primary edits/removes a secondary, secondary only cancels own link', async () => {
  const secondary = { ...link, caregiverId: other, caregiverEmail: 'sub@test.test' };
  let target: CareLink = secondary;
  let mine = { ...link, id: other, isPrimary: true };
  const get = vi.fn<NonNullable<Parameters<typeof createLinksApi>[0]>>(async (path) =>
    path.startsWith('/api/caregiver-links?') ? linkPage([mine, secondary]) : target,
  );
  const write = vi.fn(async () => secondary);
  const api = createLinksApi(get, write);
  // Primary manages the secondary's Personal link.
  await api.permissions(caregiver, id, flags);
  await api.remove(caregiver, id);
  await expect(api.promote(caregiver, id)).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(2);
  const list = await api.list(caregiver, {
    page: 1,
    caregiverId: '',
    viuId: '',
    linkType: '',
    active: '',
  });
  expect(list.items).toHaveLength(2);
  expect(get.mock.calls.some(([path]) => path.includes('caregiverId='))).toBe(false);
  // As a secondary: own link can be cancelled but not edited; others' links are hidden.
  mine = { ...mine, isPrimary: false };
  target = link;
  await expect(api.permissions(caregiver, id, flags)).rejects.toMatchObject({ status: 403 });
  await api.remove(caregiver, id);
  target = secondary;
  await expect(api.detail(caregiver, id)).rejects.toMatchObject({ status: 403 });
  target = { ...link, linkType: 'Organization' };
  await expect(api.remove(caregiver, id)).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(3);
});
it('linkAccess never lets a caregiver edit a primary link or promote', () => {
  const primary = new Set([viu]);
  expect(linkAccess(caregiver, { ...link, caregiverId: other, isPrimary: true }, primary)).toEqual({
    edit: false,
    remove: false,
    promote: false,
  });
  expect(linkAccess(caregiver, { ...link, isPrimary: true }, primary)).toEqual({
    edit: false,
    remove: true,
    promote: false,
  });
  expect(linkAccess(admin, link, new Set()).promote).toBe(true);
  expect(linkAccess(center, link, new Set())).toEqual({
    edit: false,
    remove: false,
    promote: false,
  });
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
it('BR-04/BR-33: a primary caregiver adds a secondary by email; non-primary is blocked before writing', async () => {
  const primary = { ...link, id: other, isPrimary: true };
  const added = { ...link, caregiverId: other, caregiverEmail: 'Sub@Test.test', ...flags };
  let mine = [primary];
  const get = vi.fn<NonNullable<Parameters<typeof createLinksApi>[0]>>(async () => linkPage(mine));
  const write = vi.fn<NonNullable<Parameters<typeof createLinksApi>[1]>>(async () => added);
  const api = createLinksApi(get, write);
  const values = { caregiverId: '', viuId: viu, linkType: '', ...flags };
  await expect(
    api.create(caregiver, { ...values, caregiverEmail: ' sub@test.test ' }),
  ).resolves.toMatchObject({ caregiverId: other });
  // Email instead of a UUID; never asks for primary; no caregiverId in the body.
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({
    caregiverEmail: 'sub@test.test',
    visuallyImpairedUserId: viu,
    linkType: 'Personal',
    isPrimary: false,
    ...flags,
  });
  await expect(
    api.create(caregiver, { ...values, caregiverEmail: 'not-an-email' }),
  ).rejects.toMatchObject({ status: 400 });
  // BE answering with the caller's own link (or another email) is not accepted as success.
  write.mockResolvedValueOnce({ ...link, isPrimary: false });
  await expect(
    api.create(caregiver, { ...values, caregiverEmail: 'sub@test.test' }),
  ).rejects.toMatchObject({ status: 502 });
  mine = [{ ...primary, isPrimary: false }];
  await expect(
    api.create(caregiver, { ...values, caregiverEmail: 'sub@test.test' }),
  ).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(2);
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

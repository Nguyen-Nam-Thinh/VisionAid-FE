import { expect, it, vi } from 'vitest';
import { createOrganizationsApi } from './organizations';
const id = '01900000-0000-7000-8000-000000000001';
const other = '01900000-0000-7000-8000-000000000002';
const admin = { role: 'Admin' as const, orgId: '' };
const center = { role: 'CenterAdmin' as const, orgId: id };
const org = {
  id,
  name: 'Center',
  taxCode: null,
  address: null,
  phoneNumber: null,
  contactEmail: null,
  isActive: true,
  deletedAt: null,
  createdAt: '2026-09-26',
  updatedAt: '2026-09-26',
  staffCount: 0,
  viuCount: 0,
  centerAdminName: null,
};
const input = { name: ' Center ', taxCode: '123', address: '', phoneNumber: '', contactEmail: '' };
it('enforces own organization and Admin-only mutations before any HTTP request', async () => {
  const get = vi.fn(async () => org);
  const write = vi.fn(async () => org);
  const api = createOrganizationsApi(get, write);
  await expect(api.detail(center, other)).rejects.toMatchObject({ status: 403 });
  await expect(api.update(center, other, input)).rejects.toMatchObject({ status: 403 });
  await expect(api.create(center, input)).rejects.toMatchObject({ status: 403 });
  await expect(api.status(center, id, false)).rejects.toMatchObject({ status: 403 });
  await expect(api.remove(center, id)).rejects.toMatchObject({ status: 403 });
  await expect(api.list(center, 1, '', '', '')).rejects.toMatchObject({ status: 403 });
  await expect(api.me({ ...center, orgId: '' })).rejects.toMatchObject({ status: 403 });
  expect(get).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  get.mockResolvedValue({ ...org, id: other });
  await expect(api.me(center)).rejects.toMatchObject({ status: 403 });
  await expect(api.detail(admin, id)).rejects.toMatchObject({ status: 403 });
});
it('maps create/update separately and accepts empty optional contact fields; delete accepts 204', async () => {
  const write = vi.fn<NonNullable<Parameters<typeof createOrganizationsApi>[1]>>(async () => org);
  const api = createOrganizationsApi(async () => org, write);
  await api.create(admin, input);
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({ ...input, name: 'Center' });
  await api.update(center, id, input);
  expect(JSON.parse(String(write.mock.calls[1][1].body))).toEqual({
    name: 'Center',
    address: '',
    phoneNumber: '',
    contactEmail: '',
  });
  await expect(api.create(admin, { ...input, contactEmail: 'bad' })).rejects.toMatchObject({
    status: 400,
  });
  expect(write).toHaveBeenCalledTimes(2);
  write.mockResolvedValue(undefined);
  await api.remove(admin, id);
  expect(write).toHaveBeenLastCalledWith('/api/organizations/' + id, { method: 'DELETE' });
  await api.status(admin, id, false);
  expect(JSON.parse(String(write.mock.calls[3][1].body))).toEqual({ isActive: false });
});
it('sends server filters, forwards cancellation and rejects malformed result data', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createOrganizationsApi>[0]>>(async () => ({
    items: [],
    page: 2,
    pageSize: 10,
    totalCount: 11,
    totalPages: 2,
    hasPreviousPage: true,
    hasNextPage: false,
  }));
  const api = createOrganizationsApi(get);
  const signal = new AbortController().signal;
  await api.list(admin, 2, 'A & B', 'false', 'true', signal);
  const url = new URL(get.mock.calls[0][0], 'http://test');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    page: '2',
    search: 'A & B',
    isActive: 'false',
    isDeleted: 'true',
  });
  expect(get.mock.calls[0][1]).toBe(signal);
  await api.members(center, id, 2, 'test', 'Caregiver', 'false', signal);
  expect(get.mock.calls[1][0]).toContain('/' + id + '/members?');
  expect(get.mock.calls[1][0]).toContain('role=Caregiver&isActive=false');
  get.mockResolvedValue({ ...org, isActive: 'true' });
  await expect(api.me(center)).rejects.toMatchObject({ status: 502 });
});

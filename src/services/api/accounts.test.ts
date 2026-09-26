import { expect, it, vi } from 'vitest';
import { createAccountsApi } from './accounts';
const id = '01900000-0000-7000-8000-000000000001';
const orgId = '01900000-0000-7000-8000-000000000002';
const targetId = '01900000-0000-7000-8000-000000000003';
const admin = { id, role: 'Admin' as const, orgId: '' };
const center = { id, role: 'CenterAdmin' as const, orgId };
const target = {
  id: targetId,
  fullName: 'Test',
  email: 'test@example.test',
  role: 'Caregiver',
  organizationId: orgId,
  phoneNumber: null,
  avatarUrl: null,
  isActive: true,
  deletedAt: null,
  lastLoginAt: null,
  createdAt: '2026-09-26',
  updatedAt: '2026-09-26',
};
const values = {
  fullName: 'Test',
  phoneNumber: '',
  avatarUrl: '',
  email: target.email,
  password: 'Password@1',
  role: 'Caregiver' as const,
  organizationId: orgId,
};
it('checks fresh scope and soft deletion before writes, and blocks self-delete/deactivation', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createAccountsApi>[0]>>(async () => ({
    ...target,
    organizationId: id,
  }));
  const write = vi.fn(async () => target);
  const api = createAccountsApi(get, write);
  await expect(api.update(center, targetId, values)).rejects.toMatchObject({ status: 403 });
  await expect(api.remove(center, targetId)).rejects.toMatchObject({ status: 403 });
  await expect(api.remove(admin, id)).rejects.toMatchObject({ status: 422 });
  await expect(api.status(admin, id, false)).rejects.toMatchObject({ status: 422 });
  get.mockResolvedValue({ ...target, deletedAt: '2026-09-26' });
  await expect(api.resetPassword(admin, targetId, values.password)).rejects.toMatchObject({
    status: 422,
  });
  expect(write).not.toHaveBeenCalled();
});
it('limits CenterAdmin create roles and forces own active organization', async () => {
  const get = vi.fn(async () => ({ id: orgId, isActive: true, deletedAt: null }));
  const write = vi.fn<NonNullable<Parameters<typeof createAccountsApi>[1]>>(async () => target);
  const api = createAccountsApi(get, write);
  await expect(api.create(center, { ...values, role: 'Admin' })).rejects.toMatchObject({
    status: 403,
  });
  await expect(api.create(admin, { ...values, organizationId: '' })).rejects.toMatchObject({
    status: 400,
  });
  await api.create(center, { ...values, organizationId: id });
  expect(get).toHaveBeenCalledWith('/api/organizations/me');
  expect(JSON.parse(String(write.mock.calls[0][1].body)).organizationId).toBe(orgId);
  get.mockResolvedValue({ id: orgId, isActive: false, deletedAt: null });
  await expect(api.create(center, values)).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(1);
});
it('maps update/reset separately, validates passwords, and handles delete 204 without retries', async () => {
  const write = vi.fn<NonNullable<Parameters<typeof createAccountsApi>[1]>>(async () => target);
  const api = createAccountsApi(async () => target, write);
  await api.update(admin, targetId, values);
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({
    fullName: 'Test',
    phoneNumber: '',
    avatarUrl: '',
  });
  await expect(api.resetPassword(admin, targetId, 'weak')).rejects.toMatchObject({ status: 400 });
  write.mockResolvedValue(undefined);
  await api.resetPassword(center, targetId, values.password);
  expect(JSON.parse(String(write.mock.calls[1][1].body))).toEqual({ newPassword: values.password });
  await api.remove(admin, targetId);
  expect(write).toHaveBeenLastCalledWith('/api/users/' + targetId, { method: 'DELETE' });
});
it('sends pagination/filters and rejects a CenterAdmin list from another organization', async () => {
  const data = {
    items: [target],
    page: 2,
    pageSize: 10,
    totalCount: 11,
    totalPages: 2,
    hasPreviousPage: true,
    hasNextPage: false,
  };
  const get = vi.fn<NonNullable<Parameters<typeof createAccountsApi>[0]>>(async () => data);
  const api = createAccountsApi(get);
  const signal = new AbortController().signal;
  const filters = {
    page: 2,
    search: 'A & B',
    role: 'Caregiver',
    active: 'false',
    deleted: 'false',
    organizationId: id,
  };
  await api.list(center, filters, signal);
  const query = new URL(get.mock.calls[0][0], 'http://test').searchParams;
  expect(Object.fromEntries(query)).toMatchObject({
    page: '2',
    search: 'A & B',
    organizationId: orgId,
    isActive: 'false',
  });
  expect(get.mock.calls[0][1]).toBe(signal);
  get.mockResolvedValue({ ...data, items: [{ ...target, organizationId: id }] });
  await expect(api.list(center, filters)).rejects.toMatchObject({ status: 403 });
});

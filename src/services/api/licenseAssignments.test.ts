import { expect, it, vi } from 'vitest';
import { createLicenseAssignmentsApi } from './licenseAssignments';
import type { Person } from '../../models/domain';
import { ServiceError } from '../contracts';

const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const actor: Person = {
  id,
  orgId: id,
  role: 'CenterAdmin',
  name: 'Center',
  email: 'a@example.test',
  phone: '',
  active: true,
};
const user = {
  id: viuId,
  organizationId: id,
  fullName: 'VIU',
  email: 'v@example.test',
  phoneNumber: null,
  avatarUrl: null,
  role: 'VisuallyImpaired',
  isActive: true,
  deletedAt: null,
  lastLoginAt: null,
  createdAt: '',
  updatedAt: '',
};
const pool = {
  id,
  organizationId: id,
  package: { id, name: 'Business', code: 'B', packageType: 'Business' },
  totalLicenses: 1,
  usedLicenses: 0,
  availableLicenses: 1,
  status: 'Active',
  purchasedAt: '2026-10-01T00:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
};

it('checks target tenant/role and current quota; writes exact assign/revoke contracts without deleting accounts', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLicenseAssignmentsApi>[0]>>(async (path) =>
    path === '/api/licenses/pool' ? pool : user,
  );
  const write = vi.fn(async () => id);
  const api = createLicenseAssignmentsApi(get, write);
  await api.assign(actor, viuId);
  expect(write).toHaveBeenLastCalledWith(`/api/licenses/assignments/${viuId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poolId: id }),
  });
  await api.revoke(actor, viuId);
  expect(write).toHaveBeenLastCalledWith(`/api/licenses/assignments/${viuId}/revoke`, {
    method: 'POST',
  });
  for (const bad of [
    { ...user, organizationId: viuId },
    { ...user, role: 'Caregiver' },
  ]) {
    get.mockResolvedValue(bad);
    await expect(api.assign(actor, viuId)).rejects.toMatchObject({ status: 403 });
    await expect(api.revoke(actor, viuId)).rejects.toMatchObject({ status: 403 });
  }
  for (const bad of [
    { ...pool, availableLicenses: 0 },
    { ...pool, status: 'Expired' },
    { ...pool, expiresAt: '2020-01-01T00:00:00Z' },
  ]) {
    get.mockImplementation(async (path) => (path === '/api/licenses/pool' ? bad : user));
    await expect(api.assign(actor, viuId)).rejects.toMatchObject({ status: 422 });
  }
  await expect(api.assign({ ...actor, role: 'Caregiver' }, viuId)).rejects.toMatchObject({
    status: 403,
  });
  expect(write).toHaveBeenCalledTimes(2);
  get.mockImplementation(async (path) => (path === '/api/licenses/pool' ? pool : user));
  write.mockRejectedValue(new ServiceError('Last slot taken', 422));
  await expect(api.assign(actor, viuId)).rejects.toMatchObject({ status: 422 });
  expect(write).toHaveBeenCalledTimes(3); // no automatic retry of a contested write
});

it('validates assignment pagination/status and disallows non-center access before reading', async () => {
  const item = {
    id,
    viuUser: { id: viuId, fullName: 'VIU', email: 'v@example.test' },
    assignedAt: '2026-10-01T00:00:00Z',
    assignedBy: id,
    revokedAt: null,
    isActive: true,
  };
  const page = {
    items: [item],
    page: 2,
    pageSize: 20,
    totalCount: 21,
    totalPages: 2,
    hasPreviousPage: true,
    hasNextPage: false,
  };
  const get = vi.fn(async () => page);
  const api = createLicenseAssignmentsApi(get);
  await expect(api.list({ ...actor, role: 'Admin' }, 2, 'true')).rejects.toMatchObject({
    status: 403,
  });
  expect(get).not.toHaveBeenCalled();
  expect(await api.list(actor, 2, 'true')).toEqual(page);
  expect(get).toHaveBeenCalledWith(
    '/api/licenses/assignments?page=2&pageSize=20&isActive=true',
    undefined,
  );
  await expect(api.list(actor, 1, 'true')).rejects.toMatchObject({ status: 502 });
  await expect(api.list(actor, 2, 'false')).rejects.toMatchObject({ status: 502 });
});

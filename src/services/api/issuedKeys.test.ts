import { expect, it, vi } from 'vitest';
import { createLicenseKeysApi, type IssuedKey } from './licenseKeys';
import { createAccountsApi } from './accounts';
import { createMonitoringApi } from './monitoring';
import { isProtectedAvatar } from './avatar';
import type { Person } from '../../models/domain';

const id = '01900000-0000-7000-8000-000000000001';
const center = { id, role: 'CenterAdmin', orgId: id } as Person;
const caregiver = { id, role: 'Caregiver', orgId: '' } as Person;
const key: IssuedKey = {
  id,
  poolId: id,
  licenseKey: 'ABCD-1234-EFAB-5678',
  state: 'Unused',
  note: 'Gia đình A',
  createdAt: '2026-11-01T00:00:00Z',
  keyExpiresAt: '2026-12-01T00:00:00Z',
  activatedAt: null,
  activatedBy: null,
  periodEnd: null,
  revokedAt: null,
};
const page = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 10,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

it('lists issued keys with server filters and revokes only unused keys of a center admin', async () => {
  const get = vi.fn(async () => page([key]));
  const write = vi.fn(async () => ({ ...key, state: 'Revoked', revokedAt: key.createdAt }));
  const api = createLicenseKeysApi(get, write);
  const result = await api.list(center, { state: 'Unused', search: ' A ', page: 2 });
  expect(result.items[0].licenseKey).toBe(key.licenseKey);
  expect(get).toHaveBeenCalledWith(
    '/api/licenses/keys?page=2&pageSize=10&state=Unused&search=A',
    undefined,
  );
  await expect(api.list(caregiver, {})).rejects.toMatchObject({ status: 403 });
  expect((await api.revoke(center, key))?.state).toBe('Revoked');
  expect(write).toHaveBeenCalledWith('/api/licenses/keys/' + id + '/revoke', { method: 'POST' });
  await expect(api.revoke(center, { ...key, state: 'Activated' })).rejects.toMatchObject({
    status: 422,
  });
  expect(write).toHaveBeenCalledTimes(1);
});

it('restores a deleted account for Admin only and checks the returned identity', async () => {
  const user = {
    id,
    fullName: 'Nguyễn A',
    email: 'a@example.test',
    phoneNumber: null,
    role: 'VisuallyImpaired',
    organizationId: id,
    isActive: true,
    avatarUrl: null,
    deletedAt: null,
    lastLoginAt: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  };
  const write = vi.fn(async () => ({ user, needsLicense: true, notes: [] }));
  const api = createAccountsApi(vi.fn(), write);
  await expect(api.restore({ id, role: 'CenterAdmin', orgId: id }, id)).rejects.toMatchObject({
    status: 403,
  });
  const admin = { id: '01900000-0000-7000-8000-000000000009', role: 'Admin' as const, orgId: '' };
  expect((await api.restore(admin, id)).needsLicense).toBe(true);
  expect(write).toHaveBeenCalledWith('/api/users/' + id + '/restore', { method: 'PATCH' });
  write.mockResolvedValueOnce({
    user: { ...user, id: admin.id },
    needsLicense: false,
    notes: [],
  });
  await expect(api.restore(admin, id)).rejects.toMatchObject({ status: 502 });
});

it('resends a failed notification for Admin only', async () => {
  const sent = {
    id,
    sourceType: 'Emergency',
    emergencyEventId: id,
    locationBoundaryEventId: null,
    recipientId: id,
    notificationType: 'EmergencyAlert',
    channel: 'Fcm',
    status: 'Sent',
    failureReason: null,
    createdAt: '2026-11-01T00:00:00Z',
    retryCount: 1,
    canRetry: false,
    retryBlockedCode: 'NOT_FAILED',
  };
  const write = vi.fn(async () => sent);
  const api = createMonitoringApi(vi.fn(), write);
  await expect(api.retry({ role: 'CenterAdmin' }, id)).rejects.toMatchObject({ status: 403 });
  expect((await api.retry({ role: 'Admin' }, id)).status).toBe('Sent');
  expect(write).toHaveBeenCalledWith('/api/notifications/failed/' + id + '/retry', {
    method: 'POST',
  });
});

it('fetches only the BE avatar route with the session token', () => {
  expect(isProtectedAvatar('/api/users/' + id + '/avatar?v=1762300000000')).toBe(true);
  expect(isProtectedAvatar('/api/users/' + id + '/avatar')).toBe(true);
  for (const url of ['https://evil.test/a.png', '/api/users/x/avatar', 'data:image/png;base64,AA'])
    expect(isProtectedAvatar(url)).toBe(false);
});

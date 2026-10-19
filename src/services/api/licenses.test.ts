import { expect, it, vi } from 'vitest';
import { getMySubscription, getOrganizationPool, licenseSummary } from './licenses';
import type { Person } from '../../models/domain';
const actor: Person = {
  id: '01900000-0000-7000-8000-000000000001',
  name: 'Test',
  email: 'a@example.test',
  phone: '',
  role: 'Caregiver',
  orgId: '',
  active: true,
};
const now = Date.parse('2026-10-03T00:00:00Z');
it('pool is organization-scoped, validates data and preserves missing/error responses', async () => {
  const center = { ...actor, role: 'CenterAdmin' as const, orgId: actor.id };
  const data = {
    id: actor.id,
    organizationId: actor.id,
    package: { id: actor.id, name: 'Business', code: 'BUSINESS', packageType: 'Business' },
    totalLicenses: 50,
    usedLicenses: 3,
    availableLicenses: 47,
    status: 'Active',
    purchasedAt: '2026-10-06T00:00:00Z',
    expiresAt: null,
  };
  const get = vi.fn().mockResolvedValue(data);
  await expect(getOrganizationPool(actor, undefined, get)).rejects.toMatchObject({ status: 403 });
  await expect(getOrganizationPool({ ...center, orgId: '' }, undefined, get)).rejects.toMatchObject(
    { status: 403 },
  );
  expect(get).not.toHaveBeenCalled();
  await expect(getOrganizationPool(center, undefined, get)).resolves.toEqual(data);
  get.mockResolvedValueOnce({ ...data, organizationId: '01900000-0000-7000-8000-000000000002' });
  await expect(getOrganizationPool(center, undefined, get)).rejects.toMatchObject({ status: 403 });
  get.mockResolvedValueOnce({ ...data, totalLicenses: -1 });
  await expect(getOrganizationPool(center, undefined, get)).rejects.toMatchObject({ status: 502 });
  const missing = { status: 404 };
  get.mockRejectedValueOnce(missing);
  await expect(getOrganizationPool(center, undefined, get)).rejects.toBe(missing);
});
it('distinguishes missing status, expiry boundaries and organization exemption without granting access', () => {
  expect(licenseSummary(actor, now)).toContain('Chưa xác định');
  expect(licenseSummary({ ...actor, licenseStatus: 'Unexpected' }, now)).toContain('Chưa xác định');
  expect(licenseSummary({ ...actor, licenseStatus: 'None' }, now)).toContain('Chưa có license');
  expect(
    licenseSummary(
      { ...actor, licenseStatus: 'Trial', licenseExpiresAt: '2026-10-04T00:00:00Z' },
      now,
    ),
  ).toContain('Còn 1 ngày');
  expect(
    licenseSummary(
      { ...actor, licenseStatus: 'Expired', licenseExpiresAt: '2026-09-30T00:00:00Z' },
      now,
    ),
  ).toContain('gia hạn 3 ngày');
  expect(
    licenseSummary(
      { ...actor, licenseStatus: 'Expired', licenseExpiresAt: '2026-09-29T23:59:59Z' },
      now,
    ),
  ).toContain('có thể bị giới hạn');
  expect(
    licenseSummary({ ...actor, licenseStatus: 'Expired', licenseExpiresAt: null }, now),
  ).not.toContain('gia hạn 3 ngày');
  expect(licenseSummary({ ...actor, orgId: actor.id, licenseStatus: 'None' }, now)).toContain(
    'Nhân viên thuộc tổ chức',
  );
  expect(licenseSummary({ ...actor, role: 'CenterAdmin', licenseStatus: 'None' }, now)).toContain(
    'Tài khoản quản trị',
  );
});
it('reads subscription only for a personal caregiver and rejects malformed data', async () => {
  const get = vi
    .fn<NonNullable<Parameters<typeof getMySubscription>[2]>>()
    .mockResolvedValue({ status: 'Active' });
  await expect(
    getMySubscription({ ...actor, orgId: actor.id }, undefined, get),
  ).rejects.toMatchObject({ status: 403 });
  expect(get).not.toHaveBeenCalled();
  await expect(getMySubscription(actor, undefined, get)).rejects.toMatchObject({ status: 502 });
  get.mockResolvedValue({
    id: actor.id,
    status: 'Trial',
    package: { id: actor.id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
    startedAt: '2026-10-01T00:00:00Z',
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    autoRenew: false,
    daysRemaining: null,
  });
  expect((await getMySubscription(actor, undefined, get)).status).toBe('Trial');
});

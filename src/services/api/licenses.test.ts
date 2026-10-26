import { expect, it, vi } from 'vitest';
import {
  autoRenewBlock,
  cancelMySubscription,
  canCancelRenewal,
  getAdminOrganizationPool,
  getMySubscription,
  getOrganizationPool,
  licenseSummary,
  personalLicenseBlock,
  renewPool,
  setMyAutoRenew,
  setPoolAutoRenew,
  setPoolSuspended,
} from './licenses';
import type { MySubscription, OrganizationPool } from './licenses';
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

it('blocks licensed screens only for personal caregivers without license or past grace', () => {
  const day = 86400000;
  expect(personalLicenseBlock(actor, now)).toBeNull(); // field absent: unknown, do not guess
  expect(personalLicenseBlock({ ...actor, licenseStatus: null }, now)).toBe('none');
  expect(personalLicenseBlock({ ...actor, licenseStatus: 'None' }, now)).toBe('none');
  expect(personalLicenseBlock({ ...actor, licenseStatus: 'Trial' }, now)).toBeNull();
  expect(personalLicenseBlock({ ...actor, licenseStatus: 'Active' }, now)).toBeNull();
  const expired = (daysAgo: number) => ({
    ...actor,
    licenseStatus: 'Expired',
    licenseExpiresAt: new Date(now - daysAgo * day).toISOString(),
  });
  expect(personalLicenseBlock(expired(2), now)).toBeNull(); // grace period
  expect(personalLicenseBlock(expired(4), now)).toBe('expired');
  expect(personalLicenseBlock({ ...actor, licenseStatus: null, orgId: actor.id }, now)).toBeNull();
  expect(
    personalLicenseBlock({ ...actor, role: 'CenterAdmin', licenseStatus: null }, now),
  ).toBeNull();
});
it('UC-130: only Admin suspends with an encoded reason or reactivates a valid pool', async () => {
  const admin = { ...actor, role: 'Admin' as const };
  const poolId = '01900000-0000-7000-8000-000000000009';
  const write = vi.fn(async () => undefined);
  await setPoolSuspended(admin, poolId, true, '  Nợ phí & vi phạm  ', write);
  expect(write).toHaveBeenLastCalledWith(
    `/api/licenses/pool/${poolId}/suspend?reason=N%E1%BB%A3+ph%C3%AD+%26+vi+ph%E1%BA%A1m`,
    { method: 'POST' },
  );
  await setPoolSuspended(admin, poolId, true, '   ', write);
  expect(write).toHaveBeenLastCalledWith(`/api/licenses/pool/${poolId}/suspend`, {
    method: 'POST',
  });
  await setPoolSuspended(admin, poolId, false, 'ignored', write);
  expect(write).toHaveBeenLastCalledWith(`/api/licenses/pool/${poolId}/reactivate`, {
    method: 'POST',
  });
  const center = { ...actor, role: 'CenterAdmin' as const, orgId: actor.id };
  await expect(setPoolSuspended(center, poolId, true, '', write)).rejects.toMatchObject({
    status: 403,
  });
  await expect(setPoolSuspended(admin, 'not-an-id', true, '', write)).rejects.toMatchObject({
    status: 400,
  });
  await expect(setPoolSuspended(admin, poolId, true, 'x'.repeat(501), write)).rejects.toMatchObject(
    { status: 400 },
  );
  expect(write).toHaveBeenCalledTimes(3);
});
it('UC-130: Admin reads a chosen organization pool with suspension details', async () => {
  const admin = { ...actor, role: 'Admin' as const };
  const orgId = '01900000-0000-7000-8000-000000000021';
  const data = {
    id: actor.id,
    organizationId: orgId,
    package: { id: actor.id, name: 'Business', code: 'BUSINESS', packageType: 'Business' },
    totalLicenses: 50,
    usedLicenses: 3,
    availableLicenses: 47,
    status: 'Suspended',
    purchasedAt: '2026-10-06T00:00:00Z',
    expiresAt: '2026-11-06T00:00:00Z',
    suspendedReason: 'Chưa thanh toán',
    suspendedAt: '2026-10-20T00:00:00Z',
  };
  const get = vi.fn().mockResolvedValue(data);
  await expect(getAdminOrganizationPool(admin, orgId, undefined, get)).resolves.toEqual(data);
  expect(get).toHaveBeenCalledWith('/api/licenses/pool?organizationId=' + orgId, undefined);
  get.mockResolvedValueOnce({ ...data, organizationId: actor.id });
  await expect(getAdminOrganizationPool(admin, orgId, undefined, get)).rejects.toMatchObject({
    status: 502,
  });
  const center = { ...actor, role: 'CenterAdmin' as const, orgId };
  await expect(getAdminOrganizationPool(center, orgId, undefined, get)).rejects.toMatchObject({
    status: 403,
  });
  await expect(getAdminOrganizationPool(admin, 'bad', undefined, get)).rejects.toMatchObject({
    status: 400,
  });
  expect(get).toHaveBeenCalledTimes(2);
});
it('UC-80: only a personal caregiver sends the cancel request', async () => {
  const write = vi.fn(async () => undefined);
  await cancelMySubscription(actor, write);
  expect(write).toHaveBeenCalledWith('/api/licenses/subscription', { method: 'DELETE' });
  const staff = { ...actor, orgId: '01900000-0000-7000-8000-000000000021' };
  await expect(cancelMySubscription(staff, write)).rejects.toMatchObject({ status: 403 });
  await expect(
    cancelMySubscription({ ...actor, role: 'CenterAdmin' as const }, write),
  ).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(1);
});
it('UC-80: cancel-renewal button only for an active, uncancelled personal plan', () => {
  const sub: MySubscription = {
    id: actor.id,
    status: 'Active',
    package: { id: actor.id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
    startedAt: '2026-10-01T00:00:00Z',
    trialEndsAt: null,
    currentPeriodStart: '2026-10-01T00:00:00Z',
    currentPeriodEnd: '2026-11-01T00:00:00Z',
    autoRenew: true,
    daysRemaining: 20,
    cancelledAt: null,
    isOrgIssued: false,
  };
  expect(canCancelRenewal(sub)).toBe(true);
  // Older deploys without the UC-80 fields still allow the request; BE decides.
  expect(canCancelRenewal({ ...sub, cancelledAt: undefined, isOrgIssued: undefined })).toBe(true);
  expect(canCancelRenewal({ ...sub, cancelledAt: '2026-10-20T00:00:00Z' })).toBe(false);
  expect(canCancelRenewal({ ...sub, isOrgIssued: true })).toBe(false);
  expect(canCancelRenewal({ ...sub, status: 'Trial' })).toBe(false);
  expect(canCancelRenewal({ ...sub, status: 'Expired' })).toBe(false);
  expect(canCancelRenewal({ ...sub, package: { ...sub.package, packageType: 'Business' } })).toBe(
    false,
  );
});
it('UC-80: subscription parses cancelledAt and isOrgIssued from BE', async () => {
  const get = vi.fn(async () => ({
    id: actor.id,
    status: 'Active',
    package: { id: actor.id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
    startedAt: '2026-10-01T00:00:00Z',
    trialEndsAt: null,
    currentPeriodStart: '2026-10-01T00:00:00Z',
    currentPeriodEnd: '2026-11-01T00:00:00Z',
    autoRenew: false,
    daysRemaining: 20,
    cancelledAt: '2026-10-20T03:00:00Z',
    isOrgIssued: false,
  }));
  await expect(getMySubscription(actor, undefined, get)).resolves.toMatchObject({
    cancelledAt: '2026-10-20T03:00:00Z',
    isOrgIssued: false,
  });
});
it('WF-04: only Admin renews a non-suspended pool with a valid date and seat count', async () => {
  const admin = { ...actor, role: 'Admin' as const };
  const current: OrganizationPool = {
    id: '01900000-0000-7000-8000-000000000009',
    organizationId: '01900000-0000-7000-8000-000000000021',
    package: { id: actor.id, name: 'Business', code: 'BUSINESS', packageType: 'Business' },
    totalLicenses: 50,
    usedLicenses: 3,
    availableLicenses: 47,
    status: 'Active',
    purchasedAt: '2026-09-01T00:00:00Z',
    expiresAt: '2026-11-01T00:00:00Z',
  };
  const renewed = {
    ...current,
    totalLicenses: 60,
    availableLicenses: 57,
    expiresAt: '2026-12-31T16:59:59Z',
  };
  const write = vi.fn(async () => renewed);
  await expect(renewPool(admin, current, '2026-12-31T16:59:59Z', 10, write, now)).resolves.toEqual(
    renewed,
  );
  expect(write).toHaveBeenCalledWith(`/api/licenses/pool/${current.id}/renew`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newExpiresAt: '2026-12-31T16:59:59.000Z', additionalSeats: 10 }),
  });
  // A reply that is not the same pool is not trusted; the page reloads instead.
  write.mockResolvedValueOnce({ ...renewed, id: actor.id });
  await expect(
    renewPool(admin, current, '2026-12-31T16:59:59Z', 0, write, now),
  ).resolves.toBeUndefined();
  const rejects = (
    user: Person,
    pool: OrganizationPool,
    date: string,
    seats: number,
    status: number,
  ) => expect(renewPool(user, pool, date, seats, write, now)).rejects.toMatchObject({ status });
  await rejects(
    { ...actor, role: 'CenterAdmin' as const },
    current,
    '2026-12-31T00:00:00Z',
    0,
    403,
  );
  await rejects(admin, { ...current, status: 'Suspended' }, '2026-12-31T00:00:00Z', 0, 422);
  await rejects(admin, current, 'bad', 0, 400);
  await rejects(admin, { ...current, expiresAt: null }, '2026-10-02T00:00:00Z', 0, 400);
  await rejects(admin, current, '2032-01-01T00:00:00Z', 0, 400);
  await rejects(admin, current, '2026-10-20T00:00:00Z', 0, 400);
  await rejects(admin, current, '2026-12-31T00:00:00Z', -1, 400);
  await rejects(admin, current, '2026-12-31T00:00:00Z', 1.5, 400);
  await rejects(admin, current, '2026-12-31T00:00:00Z', 10001, 400);
  expect(write).toHaveBeenCalledTimes(2);
});
it('auto-renew: Active toggles both ways, Trial only off, org-issued and expired never', async () => {
  const sub: MySubscription = {
    id: actor.id,
    status: 'Active',
    package: { id: actor.id, name: 'Personal', code: 'PERSONAL', packageType: 'Personal' },
    startedAt: '2026-10-01T00:00:00Z',
    trialEndsAt: null,
    currentPeriodStart: '2026-10-01T00:00:00Z',
    currentPeriodEnd: '2026-11-01T00:00:00Z',
    autoRenew: false,
    daysRemaining: 20,
    cancelledAt: '2026-10-20T00:00:00Z',
    isOrgIssued: false,
  };
  const resumed = { ...sub, autoRenew: true, cancelledAt: null };
  const write = vi.fn(async () => resumed);
  await expect(setMyAutoRenew(actor, sub, true, write)).resolves.toEqual(resumed);
  expect(write).toHaveBeenCalledWith(`/api/licenses/subscription/${sub.id}/auto-renew`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoRenew: true }),
  });
  write.mockResolvedValueOnce({ ...resumed, id: '01900000-0000-7000-8000-000000000099' });
  await expect(setMyAutoRenew(actor, resumed, false, write)).resolves.toBeUndefined();
  const trial = { ...sub, status: 'Trial' as const, cancelledAt: null };
  expect(autoRenewBlock(trial)).toContain('dùng thử');
  expect(autoRenewBlock({ ...trial, autoRenew: true })).toBeNull();
  await expect(
    setMyAutoRenew(actor, { ...trial, autoRenew: true }, true, write),
  ).rejects.toMatchObject({ status: 422 });
  expect(autoRenewBlock({ ...sub, isOrgIssued: true })).toContain('trung tâm');
  expect(autoRenewBlock({ ...sub, status: 'Expired' })).toContain('không còn hiệu lực');
  await expect(setMyAutoRenew(actor, trial, true, write)).rejects.toMatchObject({ status: 422 });
  await expect(
    setMyAutoRenew(actor, { ...sub, isOrgIssued: true }, false, write),
  ).rejects.toMatchObject({ status: 422 });
  await expect(
    setMyAutoRenew({ ...actor, orgId: actor.id }, sub, true, write),
  ).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(2);
});
it('BR-57: Admin or the own-org CenterAdmin toggles pool auto-renew', async () => {
  const orgId = '01900000-0000-7000-8000-000000000021';
  const current: OrganizationPool = {
    id: '01900000-0000-7000-8000-000000000009',
    organizationId: orgId,
    package: { id: actor.id, name: 'Business', code: 'BUSINESS', packageType: 'Business' },
    totalLicenses: 50,
    usedLicenses: 3,
    availableLicenses: 47,
    status: 'Active',
    purchasedAt: '2026-09-01T00:00:00Z',
    expiresAt: '2026-11-01T00:00:00Z',
    autoRenew: false,
  };
  const write = vi.fn(async () => ({ ...current, autoRenew: true }));
  const center = { ...actor, role: 'CenterAdmin' as const, orgId };
  await expect(setPoolAutoRenew(center, current, true, write)).resolves.toMatchObject({
    autoRenew: true,
  });
  expect(write).toHaveBeenCalledWith(`/api/licenses/pool/${current.id}/auto-renew`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoRenew: true }),
  });
  await setPoolAutoRenew({ ...actor, role: 'Admin' as const }, current, false, write);
  for (const user of [{ ...center, orgId: actor.id }, { ...center, orgId: '' }, actor])
    await expect(setPoolAutoRenew(user, current, true, write)).rejects.toMatchObject({
      status: 403,
    });
  expect(write).toHaveBeenCalledTimes(2);
});

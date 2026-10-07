import { expect, it, vi } from 'vitest';
import { createLicenseKeysApi, keyOutcomeUnknown } from './licenseKeys';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';
const id = '01900000-0000-7000-8000-000000000001';
const actor: Person = {
  id,
  name: 'Test',
  email: 'a@example.test',
  phone: '',
  role: 'CenterAdmin',
  orgId: id,
  active: true,
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
const issued = { subscriptionId: id, licenseKey: 'ABCD-1234-EFAB-5678', expiresAt: pool.expiresAt };
const active = {
  id,
  status: 'Active',
  package: pool.package,
  startedAt: '2026-10-07T00:00:00Z',
  trialEndsAt: null,
  currentPeriodStart: '2026-10-07T00:00:00Z',
  currentPeriodEnd: pool.expiresAt,
  autoRenew: false,
  daysRemaining: 10,
};

it('distributes only from own active pool with capacity and validates the returned key', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLicenseKeysApi>[0]>>(async () => pool);
  const write = vi.fn<NonNullable<Parameters<typeof createLicenseKeysApi>[1]>>(async () => issued);
  const api = createLicenseKeysApi(get, write);
  expect(await api.distribute(actor, ' family ')).toEqual(issued);
  expect(write).toHaveBeenCalledWith('/api/licenses/distribute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poolId: id, note: 'family' }),
  });
  await expect(api.distribute({ ...actor, role: 'Admin' }, '')).rejects.toMatchObject({
    status: 403,
  });
  for (const bad of [
    { ...pool, availableLicenses: 0 },
    { ...pool, status: 'Expired' },
    { ...pool, expiresAt: '2020-01-01T00:00:00Z' },
  ]) {
    get.mockResolvedValue(bad);
    await expect(api.distribute(actor, '')).rejects.toMatchObject({ status: 422 });
  }
  get.mockResolvedValue({ ...pool, organizationId: '01900000-0000-7000-8000-000000000002' });
  await expect(api.distribute(actor, '')).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(1);
  get.mockResolvedValue(pool);
  write.mockResolvedValue({ licenseKey: 'malformed' });
  await expect(api.distribute(actor, '')).rejects.toMatchObject({ status: 502 });
});

it('activates only for personal caregivers; preserves server expiry, sanitizes errors and never retries writes', async () => {
  const personal = { ...actor, role: 'Caregiver' as const, orgId: '' };
  const write = vi.fn<NonNullable<Parameters<typeof createLicenseKeysApi>[1]>>(async () => active);
  const api = createLicenseKeysApi(undefined, write);
  await expect(api.activate(actor, issued.licenseKey)).rejects.toMatchObject({ status: 403 });
  await expect(api.activate({ ...personal, orgId: id }, issued.licenseKey)).rejects.toMatchObject({
    status: 403,
  });
  expect(write).not.toHaveBeenCalled();
  expect(await api.activate(personal, '  abcd-1234-efab-5678 ')).toEqual(active);
  expect(write).toHaveBeenCalledWith('/api/licenses/activate-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey: issued.licenseKey }),
  });
  write.mockRejectedValue(new ServiceError('Invalid ' + issued.licenseKey, 422));
  const error = await api.activate(personal, issued.licenseKey).catch((e: unknown) => e);
  expect(error).toMatchObject({ status: 422 });
  expect((error as Error).message).not.toContain(issued.licenseKey);
  expect(keyOutcomeUnknown(error)).toBe(false);
  write.mockRejectedValue(new TypeError('network'));
  expect(
    keyOutcomeUnknown(await api.activate(personal, issued.licenseKey).catch((e: unknown) => e)),
  ).toBe(true);
  expect(write).toHaveBeenCalledTimes(3);
});

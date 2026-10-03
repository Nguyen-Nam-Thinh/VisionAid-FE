import { expect, it, vi } from 'vitest';
import { createPackagesApi, packageInput, packageForActor, type LicensePackage } from './packages';
const admin = { role: 'Admin' as const, orgId: '' };
const id = '01900000-0000-7000-8000-000000000001';
const values = {
  name: 'Personal',
  code: 'PERSONAL',
  packageType: 'Personal',
  priceMonthly: 99000,
  priceYearly: '',
  currency: 'VND',
  maxViuPerLicense: 1,
  includedLicenses: 1,
  trialDays: 7,
  durationDays: 30,
  featureFlags: '{"webrtc":true}',
  isActive: false,
};
const item: LicensePackage = {
  ...values,
  packageType: 'Personal',
  id,
  priceYearly: null,
  featureFlags: { webrtc: true },
  createdAt: '2026-10-03T00:00:00Z',
  updatedAt: '2026-10-03T00:00:00Z',
};
it('validates money, integer limits and boolean flags; update excludes immutable fields and cannot silently erase annual price', () => {
  expect(packageInput(values)).not.toHaveProperty('isActive');
  const update = packageInput(values, item);
  expect(update).not.toHaveProperty('code');
  expect(update).not.toHaveProperty('packageType');
  expect(update).toMatchObject({
    isActive: false,
    priceYearly: null,
    featureFlags: { webrtc: true },
  });
  for (const invalid of [
    { code: 'bad code' },
    { priceMonthly: -1 },
    { priceMonthly: 10000000000 },
    { priceMonthly: 1.234 },
    { durationDays: 1.5 },
    { includedLicenses: 0 },
    { priceYearly: 'oops' },
    { featureFlags: '{"secret":"abc"}' },
    { featureFlags: '[]' },
  ]) {
    expect(() => packageInput({ ...values, ...invalid })).toThrow();
  }
  expect(() => packageInput(values, { ...item, priceYearly: 1000000 })).toThrow(/xóa giá năm/);
});
it('rejects non-admin writes before transport, checks detail identity and filters package visibility', async () => {
  const get = vi.fn().mockResolvedValue(item);
  const write = vi.fn().mockResolvedValue(item);
  const api = createPackagesApi(get, write);
  const personal = { role: 'Caregiver' as const, orgId: '' };
  await expect(api.save(personal, values)).rejects.toMatchObject({ status: 403 });
  await expect(api.detail(personal, id)).rejects.toMatchObject({ status: 403 });
  await expect(api.list({ ...personal, orgId: id }, 1, '')).rejects.toMatchObject({ status: 403 });
  expect(get).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  await api.save(admin, values, item);
  expect(JSON.parse(write.mock.calls[0][1].body)).not.toHaveProperty('code');
  get.mockResolvedValueOnce({ ...item, id: '01900000-0000-7000-8000-000000000002' });
  await expect(api.detail(admin, id)).rejects.toMatchObject({ status: 502 });
  expect(packageForActor(personal, item)).toBe(false);
  expect(packageForActor(personal, { ...item, isActive: true })).toBe(true);
  expect(packageForActor({ role: 'CenterAdmin', orgId: id }, { ...item, isActive: true })).toBe(
    false,
  );
});

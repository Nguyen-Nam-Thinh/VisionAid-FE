import { expect, it, vi } from 'vitest';
import { createPackagesApi, packageInput, packageForActor, type LicensePackage } from './packages';
import { ServiceError } from '../contracts';
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
  // An empty yearly price is sent as null so the BE clears the stored one.
  expect(
    packageInput({ ...values, priceYearly: '', isActive: true }, { ...item, priceYearly: 1000000 })
      .priceYearly,
  ).toBeNull();
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
it('deletes only never-used, non-system packages and explains a package that is in use', async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  const api = createPackagesApi(vi.fn(), write);
  const custom = { ...item, code: 'PROMO_TET' };
  await api.remove(admin, custom);
  expect(write).toHaveBeenCalledWith('/api/licenses/packages/' + id, { method: 'DELETE' });
  await expect(api.remove(admin, item)).rejects.toMatchObject({ status: 422 });
  expect(write).toHaveBeenCalledTimes(1);
  await expect(api.remove({ role: 'CenterAdmin', orgId: id }, custom)).rejects.toMatchObject({
    status: 403,
  });
  write.mockRejectedValueOnce(new ServiceError('in use', 409, {}, 'PACKAGE_IN_USE'));
  await expect(api.remove(admin, custom)).rejects.toMatchObject({
    status: 409,
    code: 'PACKAGE_IN_USE',
    message: expect.stringContaining('ngừng bán'),
  });
});

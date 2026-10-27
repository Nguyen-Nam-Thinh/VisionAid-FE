import { expect, it, vi } from 'vitest';
import { createLicensePoolsApi } from './licensePools';

const id = '01900000-0000-7000-8000-000000000001';
const overview = {
  summary: {
    totalPools: 1,
    activePools: 1,
    suspendedPools: 0,
    expiredPools: 0,
    expiringSoonPools: 1,
    totalSeats: 50,
    usedSeats: 10,
    seatUtilizationPercent: 20,
    organizationsWithoutPool: 2,
  },
  pools: {
    items: [
      {
        poolId: id,
        organizationId: id,
        organizationName: 'HCM',
        organizationIsActive: true,
        package: { id, name: 'Business', code: 'BUSINESS', packageType: 'Business' },
        totalLicenses: 50,
        usedLicenses: 10,
        availableLicenses: 40,
        utilizationPercent: 20,
        status: 'Active',
        purchasedAt: '2026-10-01T00:00:00Z',
        expiresAt: '2026-11-01T00:00:00Z',
        daysUntilExpiry: 4,
        isExpiringSoon: true,
        autoRenew: false,
        suspendedReason: null,
        suspendedAt: null,
      },
    ],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};
const admin = { role: 'Admin' as const };
const none = { status: '', search: '', expiringWithinDays: '' };

it('sends the Admin filters and parses the overview', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLicensePoolsApi>[0]>>(async () => overview);
  const api = createLicensePoolsApi(get);
  const result = await api.list(admin, 2, {
    status: 'Active',
    search: ' HCM ',
    expiringWithinDays: '7',
  });
  expect(get.mock.calls[0]?.[0]).toBe(
    '/api/licenses/pools?page=2&pageSize=10&status=Active&search=HCM&expiringWithinDays=7',
  );
  expect(result.pools.items[0]?.availableLicenses).toBe(40);
});

it('rejects other roles, bad filters and malformed responses before showing data', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createLicensePoolsApi>[0]>>(async () => overview);
  const api = createLicensePoolsApi(get);
  await expect(api.list({ role: 'CenterAdmin' }, 1, none)).rejects.toMatchObject({ status: 403 });
  await expect(api.list(admin, 1, { ...none, status: 'Unknown' })).rejects.toMatchObject({
    status: 400,
  });
  await expect(api.list(admin, 1, { ...none, expiringWithinDays: '366' })).rejects.toMatchObject({
    status: 400,
  });
  expect(get).not.toHaveBeenCalled();
  get.mockResolvedValueOnce({ ...overview, pools: { ...overview.pools, items: [{}] } });
  await expect(api.list(admin, 1, none)).rejects.toMatchObject({ status: 502 });
});

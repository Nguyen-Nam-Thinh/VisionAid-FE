import { expect, it, vi } from 'vitest';
import { createRevenueApi } from './revenue';

const admin = { role: 'Admin' as const };
const report = {
  dateFrom: '2026-01-01',
  dateTo: '2026-10-27',
  groupBy: 'Month',
  currency: 'VND',
  summary: {
    grossRevenue: 4599000,
    refundedAmount: 0,
    netRevenue: 4599000,
    paidTransactions: 2,
    pendingTransactions: 1,
    failedTransactions: 0,
    cancelledTransactions: 0,
    payingCaregivers: 1,
    payingOrganizations: 1,
    averageOrderValue: 2299500,
  },
  byChannel: [
    { channel: 'B2C', revenue: 99000, transactions: 1 },
    { channel: 'B2B', revenue: 4500000, transactions: 1 },
  ],
  byTransactionType: [{ transactionType: 'LicensePurchase', revenue: 4500000, transactions: 1 }],
  byPackage: [
    {
      packageId: '01900000-0000-7000-8000-000000000001',
      packageName: 'Business',
      packageType: 'Business',
      revenue: 4500000,
      transactions: 1,
    },
  ],
  timeline: [{ period: '2026-10', periodStart: '2026-10-01', revenue: 4599000, transactions: 2 }],
  topOrganizations: [
    {
      organizationId: '01900000-0000-7000-8000-000000000002',
      organizationName: 'Trung tâm A',
      revenue: 4500000,
      transactions: 1,
    },
  ],
};

it('FE-35: Admin reads the revenue report with Vietnam-day filters', async () => {
  const get = vi.fn(async () => report);
  const api = createRevenueApi(get);
  await expect(
    api.report(admin, { dateFrom: '2026-01-01', dateTo: '2026-10-27', groupBy: 'Month' }),
  ).resolves.toMatchObject({ summary: { netRevenue: 4599000 } });
  expect(get).toHaveBeenCalledWith(
    '/api/payments/revenue-report?groupBy=Month&topOrganizations=10&dateFrom=2026-01-01&dateTo=2026-10-27',
    undefined,
  );
  await api.report(admin, { dateFrom: '', dateTo: '', groupBy: 'Day' });
  expect(get).toHaveBeenLastCalledWith(
    '/api/payments/revenue-report?groupBy=Day&topOrganizations=10',
    undefined,
  );
});

it('rejects other roles, bad ranges and malformed data before showing numbers', async () => {
  const get = vi.fn(async (): Promise<unknown> => report);
  const api = createRevenueApi(get);
  const all = { dateFrom: '', dateTo: '', groupBy: 'Month' as const };
  await expect(api.report({ role: 'CenterAdmin' }, all)).rejects.toMatchObject({ status: 403 });
  await expect(
    api.report(admin, { ...all, dateFrom: '2026-10-02', dateTo: '2026-10-01' }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    api.report(admin, { dateFrom: '2025-01-01', dateTo: '2026-06-01', groupBy: 'Day' }),
  ).rejects.toMatchObject({ status: 400 });
  expect(get).not.toHaveBeenCalled();
  get.mockResolvedValueOnce({ ...report, summary: { ...report.summary, netRevenue: 'x' } });
  await expect(api.report(admin, all)).rejects.toMatchObject({ status: 502 });
});

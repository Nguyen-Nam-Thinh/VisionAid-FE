import { t, msg, labelMap } from '../../i18n';
import { z } from 'zod';
import { apiGet } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

// FE-35 / UC-132: GET /api/payments/revenue-report (BE 4a3266e), Admin only.
// Days are Vietnam local days (UTC+7) as yyyy-MM-dd; groupBy = Day | Month.
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.number().finite();
const count = z.number().int().nonnegative();
const transactionType = z.enum([
  'SubscriptionNew',
  'SubscriptionRenew',
  'LicensePurchase',
  'LicenseTopup',
  'Refund',
]);
const reportSchema = z.object({
  dateFrom: day,
  dateTo: day,
  groupBy: z.enum(['Day', 'Month']),
  currency: z.string(),
  summary: z.object({
    grossRevenue: money,
    refundedAmount: money,
    netRevenue: money,
    paidTransactions: count,
    pendingTransactions: count,
    failedTransactions: count,
    cancelledTransactions: count,
    payingCaregivers: count,
    payingOrganizations: count,
    averageOrderValue: money,
  }),
  byChannel: z.array(z.object({ channel: z.string(), revenue: money, transactions: count })),
  byTransactionType: z.array(z.object({ transactionType, revenue: money, transactions: count })),
  byPackage: z.array(
    z.object({
      packageId: z.string().uuid().nullable(),
      packageName: z.string(),
      packageType: z.enum(['Personal', 'Business']).nullable(),
      revenue: money,
      transactions: count,
    }),
  ),
  timeline: z.array(
    z.object({ period: z.string(), periodStart: day, revenue: money, transactions: count }),
  ),
  topOrganizations: z.array(
    z.object({
      organizationId: z.string().uuid(),
      organizationName: z.string(),
      revenue: money,
      transactions: count,
    }),
  ),
});
export type RevenueReport = z.infer<typeof reportSchema>;
export type RevenueFilters = { dateFrom: string; dateTo: string; groupBy: 'Day' | 'Month' };

export const transactionTypeLabels: Record<z.infer<typeof transactionType>, string> = labelMap({
  SubscriptionNew: msg('Mua gói Personal'),
  SubscriptionRenew: msg('Gia hạn gói Personal'),
  LicensePurchase: msg('Mua gói Business'),
  LicenseTopup: msg('Mua thêm license Business'),
  Refund: msg('Hoàn tiền'),
});
export const channelLabels: Record<string, string> = labelMap({
  B2C: msg('Gia đình (B2C)'),
  B2B: msg('Trung tâm (B2B)'),
});

// Mirrors GetRevenueReportValidator so a bad range is explained before calling the BE.
const MAX_DAYS = { Day: 366, Month: 5 * 366 } as const;
function checkFilters(filters: RevenueFilters) {
  for (const value of [filters.dateFrom, filters.dateTo])
    if (value && !day.safeParse(value).success)
      throw new ServiceError(t('Ngày không hợp lệ.'), 400);
  if (filters.dateFrom && filters.dateTo) {
    const from = Date.parse(filters.dateFrom + 'T00:00:00Z');
    const to = Date.parse(filters.dateTo + 'T00:00:00Z');
    if (from > to)
      throw new ServiceError(t('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'), 400);
    if ((to - from) / 86400000 >= MAX_DAYS[filters.groupBy])
      throw new ServiceError(
        filters.groupBy === 'Day'
          ? t('Báo cáo theo ngày tối đa 366 ngày. Chọn khoảng ngắn hơn hoặc xem theo tháng.')
          : t('Báo cáo theo tháng tối đa 5 năm.'),
        400,
      );
  }
}

export function createRevenueApi(get = apiGet) {
  return {
    async report(actor: Pick<Person, 'role'>, filters: RevenueFilters, signal?: AbortSignal) {
      if (actor.role !== 'Admin')
        throw new ServiceError(t('Chỉ quản trị hệ thống được xem báo cáo doanh thu.'), 403);
      checkFilters(filters);
      const query = new URLSearchParams({ groupBy: filters.groupBy, topOrganizations: '10' });
      if (filters.dateFrom) query.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) query.set('dateTo', filters.dateTo);
      const parsed = reportSchema.safeParse(
        await get('/api/payments/revenue-report?' + query, signal),
      );
      if (!parsed.success)
        throw new ServiceError(t('Dữ liệu báo cáo doanh thu từ máy chủ không hợp lệ.'), 502);
      return parsed.data;
    },
  };
}
export const revenueApi = createRevenueApi();

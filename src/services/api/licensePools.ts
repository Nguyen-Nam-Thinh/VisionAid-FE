import { t, msg, labelMap } from '../../i18n';
import { z } from 'zod';
import { apiGet } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

// FE-35: GET /api/licenses/pools (BE 4a3266e), Admin only. Summary ignores the list filters.
const date = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();
const percent = z.number().finite();
const poolStatus = z.enum(['Active', 'Expired', 'Suspended']);
const overviewSchema = z.object({
  summary: z.object({
    totalPools: count,
    activePools: count,
    suspendedPools: count,
    expiredPools: count,
    expiringSoonPools: count,
    totalSeats: count,
    usedSeats: count,
    seatUtilizationPercent: percent,
    organizationsWithoutPool: count,
  }),
  pools: z.object({
    items: z.array(
      z.object({
        poolId: z.string().uuid(),
        organizationId: z.string().uuid(),
        organizationName: z.string(),
        organizationIsActive: z.boolean(),
        package: z.object({
          id: z.string().uuid(),
          name: z.string(),
          code: z.string(),
          packageType: z.string(),
        }),
        totalLicenses: count,
        usedLicenses: count,
        availableLicenses: count,
        utilizationPercent: percent,
        status: poolStatus,
        purchasedAt: date,
        expiresAt: date.nullable(),
        daysUntilExpiry: z.number().int().nullable(),
        isExpiringSoon: z.boolean(),
        autoRenew: z.boolean(),
        suspendedReason: z.string().nullable(),
        suspendedAt: date.nullable(),
      }),
    ),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: count,
    totalPages: count,
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});
export type LicensePoolOverview = z.infer<typeof overviewSchema>;
export type LicensePoolFilters = { status: string; search: string; expiringWithinDays: string };
export const poolStatusLabels: Record<z.infer<typeof poolStatus>, string> = labelMap({
  Active: msg('Đang hoạt động'),
  Expired: msg('Đã hết hạn'),
  Suspended: msg('Tạm ngưng'),
});

export function createLicensePoolsApi(get = apiGet) {
  return {
    async list(
      actor: Pick<Person, 'role'>,
      page: number,
      filters: LicensePoolFilters,
      signal?: AbortSignal,
    ) {
      if (actor.role !== 'Admin')
        throw new ServiceError(t('Chỉ quản trị hệ thống được xem kho license các trung tâm.'), 403);
      if (!Number.isInteger(page) || page < 1)
        throw new ServiceError(t('Trang không hợp lệ.'), 400);
      const query = new URLSearchParams({ page: String(page), pageSize: '10' });
      if (filters.status) {
        if (!poolStatus.safeParse(filters.status).success)
          throw new ServiceError(t('Trạng thái không hợp lệ.'), 400);
        query.set('status', filters.status);
      }
      const search = filters.search.trim();
      if (search.length > 200) throw new ServiceError(t('Từ khóa tìm kiếm tối đa 200 ký tự.'), 400);
      if (search) query.set('search', search);
      if (filters.expiringWithinDays) {
        const days = Number(filters.expiringWithinDays);
        // Mirrors GetAllLicensePoolsValidator: 0..365.
        if (!Number.isInteger(days) || days < 0 || days > 365)
          throw new ServiceError(t('Số ngày sắp hết hạn phải từ 0 đến 365.'), 400);
        query.set('expiringWithinDays', String(days));
      }
      const parsed = overviewSchema.safeParse(await get('/api/licenses/pools?' + query, signal));
      if (!parsed.success)
        throw new ServiceError(t('Dữ liệu kho license từ máy chủ không hợp lệ.'), 502);
      return parsed.data;
    },
  };
}
export const licensePoolsApi = createLicensePoolsApi();

import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { createAccountsApi } from './accounts';
import { getOrganizationPool, isOrganizationBuyer } from './licenses';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const assignment = z.object({
  id: z.string().uuid(),
  viuUser: z.object({ id: z.string().uuid(), fullName: z.string(), email: z.string() }),
  assignedAt: z.iso.datetime({ offset: true }),
  assignedBy: z.string().uuid().nullable(),
  revokedAt: z.iso.datetime({ offset: true }).nullable(),
  isActive: z.boolean(),
});
const pageSchema = z.object({
  items: z.array(assignment),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});
export type LicenseAssignment = z.infer<typeof assignment>;

export function createLicenseAssignmentsApi(get = apiGet, write = apiWrite) {
  const authorize = (actor: Person) => {
    if (!isOrganizationBuyer(actor))
      throw new ServiceError('Chỉ quản trị trung tâm có tổ chức được quản lý license.', 403);
  };
  const target = async (actor: Person, id: string) => {
    authorize(actor);
    const user = await createAccountsApi(get, write).detail(actor, id);
    if (user.role !== 'VisuallyImpaired')
      throw new ServiceError('Chỉ cấp hoặc thu hồi license của người được chăm sóc.', 403);
    return user;
  };
  return {
    async list(actor: Person, page: number, active: string, signal?: AbortSignal) {
      authorize(actor);
      if (!Number.isInteger(page) || page < 1 || !['', 'true', 'false'].includes(active))
        throw new ServiceError('Bộ lọc license không hợp lệ.', 400);
      const query = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (active) query.set('isActive', active);
      const result = pageSchema.safeParse(await get(`/api/licenses/assignments?${query}`, signal));
      if (
        !result.success ||
        result.data.page !== page ||
        result.data.items.some(
          (item) =>
            item.isActive !== (item.revokedAt === null) ||
            (active !== '' && item.isActive !== (active === 'true')),
        )
      )
        throw new ServiceError('Dữ liệu cấp license không hợp lệ. Hãy tải lại.', 502);
      return result.data;
    },
    async assign(actor: Person, viuId: string) {
      const user = await target(actor, viuId);
      if (!user.isActive || user.deletedAt)
        throw new ServiceError('Không thể cấp license cho tài khoản đã khóa hoặc xóa.', 422);
      const pool = await getOrganizationPool(actor, undefined, get);
      if (pool.status !== 'Active' || (pool.expiresAt && Date.parse(pool.expiresAt) <= Date.now()))
        throw new ServiceError('Kho license không còn hiệu lực. Hãy kiểm tra gói Business.', 422);
      if (pool.availableLicenses < 1)
        throw new ServiceError('Kho đã hết license. Hãy mua thêm gói Business rồi thử lại.', 422);
      const result = await write(`/api/licenses/assignments/${viuId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId: pool.id }),
      });
      if (!z.string().uuid().safeParse(result).success)
        throw new ServiceError(
          'Chưa xác nhận được kết quả cấp license. Tải lại danh sách trước khi thử lại.',
          502,
        );
    },
    async revoke(actor: Person, viuId: string) {
      await target(actor, viuId);
      await write(`/api/licenses/assignments/${viuId}/revoke`, { method: 'POST' });
    },
  };
}
export const licenseAssignmentsApi = createLicenseAssignmentsApi();

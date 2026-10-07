import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { getOrganizationPool, isPersonalCaregiver, subscription } from './licenses';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const distributed = z.object({
  subscriptionId: z.string().uuid(),
  licenseKey: z.string().regex(/^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
});
export type DistributedKey = z.infer<typeof distributed>;
// Unknown write outcomes must not be retried automatically: distribution consumes a seat.
export function keyOutcomeUnknown(error: unknown) {
  return !(error instanceof ServiceError) || error.status === 0 || error.status >= 500;
}
export function createLicenseKeysApi(get = apiGet, write = apiWrite) {
  const post = async (path: string, body: object) => {
    try {
      return await write(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const status = error instanceof ServiceError ? error.status : 0;
      // Do not render raw BE errors: validation/logging middleware may echo the submitted key.
      throw new ServiceError(
        status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : status === 403
            ? 'Bạn không có quyền thực hiện thao tác này.'
            : status === 429
              ? 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.'
              : status === 402
                ? 'License hiện tại không cho phép thao tác. Vui lòng kiểm tra với quản trị viên.'
                : status >= 400 && status < 500
                  ? 'Không thể thực hiện. Kiểm tra key chưa dùng, thời hạn và số suất còn lại trong kho.'
                  : 'Chưa xác nhận được kết quả. Kiểm tra trạng thái với quản trị viên trước khi thử lại.',
        status,
      );
    }
  };
  return {
    async distribute(actor: Person, note: string) {
      if (note.trim().length > 500) throw new ServiceError('Ghi chú tối đa 500 ký tự.', 400);
      const pool = await getOrganizationPool(actor, undefined, get);
      if (
        pool.status !== 'Active' ||
        (pool.expiresAt && Date.parse(pool.expiresAt) <= Date.now()) ||
        pool.availableLicenses < 1
      )
        throw new ServiceError(
          'Kho đã hết suất hoặc không còn hiệu lực. Kiểm tra gói Business trước khi tạo key.',
          422,
        );
      const result = distributed.safeParse(
        await post('/api/licenses/distribute', { poolId: pool.id, note: note.trim() || null }),
      );
      if (!result.success)
        throw new ServiceError(
          'Chưa đọc được key đã tạo. Không tạo lại; liên hệ quản trị viên để kiểm tra kết quả.',
          502,
        );
      return result.data;
    },
    async activate(actor: Person, key: string) {
      if (!isPersonalCaregiver(actor))
        throw new ServiceError('Chỉ người chăm sóc gia đình được kích hoạt key tại đây.', 403);
      const licenseKey = key.trim().toUpperCase();
      if (!licenseKey || licenseKey.length > 100)
        throw new ServiceError('Nhập key hợp lệ, tối đa 100 ký tự.', 400);
      const result = subscription.safeParse(
        await post('/api/licenses/activate-key', { licenseKey }),
      );
      if (!result.success || result.data.status !== 'Active')
        throw new ServiceError(
          'Chưa xác nhận được license đã kích hoạt. Tải lại thông tin trước khi thử lại.',
          502,
        );
      return result.data;
    },
  };
}
export const licenseKeysApi = createLicenseKeysApi();

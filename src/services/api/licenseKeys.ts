import { t, msg, labelMap } from '../../i18n';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import {
  getOrganizationPool,
  isOrganizationBuyer,
  isPersonalCaregiver,
  subscription,
} from './licenses';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const distributed = z.object({
  subscriptionId: z.string().uuid(),
  licenseKey: z.string().regex(/^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
});
export type DistributedKey = z.infer<typeof distributed>;
const date = z.iso.datetime({ offset: true });
export const keyStates = ['Unused', 'Activated', 'Expired', 'Revoked'] as const;
export type KeyState = (typeof keyStates)[number];
export const keyStateLabels = labelMap({
  Unused: msg('Chưa dùng'),
  Activated: msg('Đã kích hoạt'),
  Expired: msg('Đã hết hạn'),
  Revoked: msg('Đã thu hồi'),
});
const issuedKey = z.object({
  id: z.string().uuid(),
  poolId: z.string().uuid(),
  licenseKey: z.string().min(1),
  state: z.enum(keyStates),
  note: z.string().nullable(),
  createdAt: date,
  keyExpiresAt: date.nullable(),
  activatedAt: date.nullable(),
  activatedBy: z
    .object({ id: z.string().uuid(), fullName: z.string(), email: z.string() })
    .nullable(),
  periodEnd: date.nullable(),
  revokedAt: date.nullable(),
});
export type IssuedKey = z.infer<typeof issuedKey>;
const issuedPage = z.object({
  items: z.array(issuedKey),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type IssuedKeyPage = z.infer<typeof issuedPage>;
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
          ? t('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          : status === 403
            ? t('Bạn không có quyền thực hiện thao tác này.')
            : status === 429
              ? t('Có quá nhiều yêu cầu. Vui lòng thử lại sau.')
              : status === 402
                ? t(
                    'License hiện tại không cho phép thao tác. Vui lòng kiểm tra với quản trị viên.',
                  )
                : status >= 400 && status < 500
                  ? t(
                      'Không thể thực hiện. Kiểm tra key chưa dùng, thời hạn và số suất còn lại trong kho.',
                    )
                  : t(
                      'Chưa xác nhận được kết quả. Kiểm tra trạng thái với quản trị viên trước khi thử lại.',
                    ),
        status,
      );
    }
  };
  return {
    /** Keys distributed from the organization's pool (CenterAdmin), newest first, server-paged. */
    async list(
      actor: Person,
      filter: { state?: KeyState | ''; search?: string; page?: number; pageSize?: number },
      signal?: AbortSignal,
    ) {
      if (!isOrganizationBuyer(actor))
        throw new ServiceError(t('Chỉ quản trị viên trung tâm được xem key đã phát.'), 403);
      const query = new URLSearchParams({
        page: String(filter.page ?? 1),
        pageSize: String(filter.pageSize ?? 10),
      });
      if (filter.state) query.set('state', filter.state);
      const search = filter.search?.trim();
      if (search) query.set('search', search.slice(0, 100));
      const result = issuedPage.safeParse(await get('/api/licenses/keys?' + query, signal));
      if (!result.success)
        throw new ServiceError(t('Dữ liệu key đã phát không hợp lệ. Hãy tải lại.'), 502);
      return result.data;
    },
    /** Takes back an unused key; its seat returns to the pool. Activated or expired keys → 422. */
    async revoke(actor: Person, key: IssuedKey) {
      if (!isOrganizationBuyer(actor))
        throw new ServiceError(t('Chỉ quản trị viên trung tâm được thu hồi key.'), 403);
      if (key.state !== 'Unused')
        throw new ServiceError(t('Chỉ thu hồi được key chưa dùng và còn hạn.'), 422);
      if (!z.string().uuid().safeParse(key.id).success)
        throw new ServiceError(t('Key không hợp lệ. Hãy tải lại.'), 400);
      const raw = await write('/api/licenses/keys/' + key.id + '/revoke', { method: 'POST' });
      const result = issuedKey.safeParse(raw);
      return result.success ? result.data : undefined;
    },
    async distribute(actor: Person, note: string) {
      if (note.trim().length > 500) throw new ServiceError(t('Ghi chú tối đa 500 ký tự.'), 400);
      const pool = await getOrganizationPool(actor, undefined, get);
      if (
        pool.status !== 'Active' ||
        (pool.expiresAt && Date.parse(pool.expiresAt) <= Date.now()) ||
        pool.availableLicenses < 1
      )
        throw new ServiceError(
          t('Kho đã hết suất hoặc không còn hiệu lực. Kiểm tra gói Business trước khi tạo key.'),
          422,
        );
      const result = distributed.safeParse(
        await post('/api/licenses/distribute', { poolId: pool.id, note: note.trim() || null }),
      );
      if (!result.success)
        throw new ServiceError(
          t('Chưa đọc được key đã tạo. Không tạo lại; liên hệ quản trị viên để kiểm tra kết quả.'),
          502,
        );
      return result.data;
    },
    async activate(actor: Person, key: string) {
      if (!isPersonalCaregiver(actor))
        throw new ServiceError(t('Chỉ người chăm sóc gia đình được kích hoạt key tại đây.'), 403);
      const licenseKey = key.trim().toUpperCase();
      if (!licenseKey || licenseKey.length > 100)
        throw new ServiceError(t('Nhập key hợp lệ, tối đa 100 ký tự.'), 400);
      const result = subscription.safeParse(
        await post('/api/licenses/activate-key', { licenseKey }),
      );
      if (!result.success || result.data.status !== 'Active')
        throw new ServiceError(
          t('Chưa xác nhận được license đã kích hoạt. Tải lại thông tin trước khi thử lại.'),
          502,
        );
      return result.data;
    },
  };
}
export const licenseKeysApi = createLicenseKeysApi();

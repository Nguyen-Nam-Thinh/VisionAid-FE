import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { createPackagesApi, type LicensePackage } from './packages';
import { isPersonalCaregiver, isOrganizationBuyer, getOrganizationPool } from './licenses';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

export const paymentLabels = {
  Pending: 'Đang chờ thanh toán',
  Success: 'Thanh toán thành công',
  Failed: 'Thanh toán thất bại',
  Refunded: 'Đã hoàn tiền',
  Cancelled: 'Đã hủy',
};
const date = z.iso.datetime({ offset: true });
const transaction = z.object({
  id: z.string().uuid(),
  payosOrderId: z.string().regex(/^\d+$/),
  transactionType: z.enum([
    'SubscriptionNew',
    'SubscriptionRenew',
    'LicensePurchase',
    'LicenseTopup',
    'Refund',
  ]),
  status: z.enum(['Pending', 'Success', 'Failed', 'Refunded', 'Cancelled']),
  amount: z.number().finite().nonnegative(),
  currency: z.string(),
  payosCheckoutUrl: z.string().nullable(),
  failureReason: z.string().nullable(),
  paidAt: date.nullable(),
  createdAt: date,
});
const history = z.object({
  items: z.array(transaction),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
const paymentLink = z.object({
  transactionId: z.string().uuid(),
  checkoutUrl: z.string(),
  paymentLinkId: z.string().min(1),
  orderCode: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  amount: z.number().int().positive().max(2147483647),
  currency: z.literal('VND'),
});
export type Payment = z.infer<typeof transaction>;
export type PaymentLink = z.infer<typeof paymentLink>;
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ServiceError(
      'Dữ liệu thanh toán không hợp lệ. Kiểm tra lịch sử trước khi tạo giao dịch khác.',
      502,
    );
  return result.data;
}
export const canPay = (actor: Person) => isPersonalCaregiver(actor) || isOrganizationBuyer(actor);
export const paymentHistoryPath = (actor: Person) =>
  isOrganizationBuyer(actor) ? '/center-admin/payments' : '/caregiver/payments';
function check(actor: Person) {
  if (!canPay(actor))
    throw new ServiceError('Tài khoản không có quyền thanh toán gói dịch vụ.', 403);
}
export function safeCheckoutUrl(value: string | null): string | null {
  try {
    const url = new URL(value ?? '');
    // PayOS official checkout hosts; never accept an arbitrary redirect supplied in query strings.
    return url.protocol === 'https:' &&
      ['pay.payos.vn', 'next.pay.payos.vn'].includes(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function orderCode(value: string | null): string | null {
  return value && /^[1-9]\d{0,15}$/.test(value) && Number.isSafeInteger(Number(value))
    ? value
    : null;
}
export function paymentResumeTarget(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const [path, search = ''] = value.split('?');
  if (
    ![
      '/payments/return',
      '/payments/cancel',
      '/caregiver/payments',
      '/center-admin/payments',
    ].includes(path)
  )
    return null;
  const code = orderCode(new URLSearchParams(search).get('orderCode'));
  return path + (code ? '?orderCode=' + code : '');
}
export function canCheckout(item: LicensePackage, actor?: Person) {
  return (
    item.isActive &&
    (!actor || canPay(actor)) &&
    item.packageType === (actor && isOrganizationBuyer(actor) ? 'Business' : 'Personal') &&
    item.currency === 'VND' &&
    Number.isInteger(item.priceMonthly) &&
    item.priceMonthly > 0 &&
    item.priceMonthly <= 2147483647
  );
}
export function createPaymentsApi(get = apiGet, write = apiWrite) {
  const packages = createPackagesApi(get, write);
  async function list(actor: Person, page: number, signal?: AbortSignal, pageSize = 10) {
    check(actor);
    return parse(
      history,
      await get(`/api/payments/history?page=${page}&pageSize=${pageSize}`, signal),
    );
  }
  async function find(actor: Person, code: string, signal?: AbortSignal) {
    check(actor);
    if (!orderCode(code)) throw new ServiceError('Mã đơn thanh toán không hợp lệ.', 400);
    // Bounded fallback until BE exposes a transaction detail/status endpoint.
    for (let page = 1; page <= 10; page++) {
      const data = await list(actor, page, signal, 100);
      const found = data.items.find((item) => item.payosOrderId === code);
      if (found) return found;
      if (!data.hasNextPage) return null;
    }
    throw new ServiceError(
      'Chưa tìm thấy giao dịch trong 1.000 bản ghi gần nhất. Kiểm tra lịch sử hoặc liên hệ hỗ trợ.',
      422,
    );
  }
  return {
    list,
    find,
    async create(actor: Person, selected: LicensePackage, origin: string) {
      check(actor);
      if (!canCheckout(selected, actor))
        throw new ServiceError(
          'Gói không phù hợp với tài khoản hoặc chưa hỗ trợ thanh toán bằng VND nguyên dương.',
          422,
        );
      const base = new URL(origin);
      if (
        base.origin !== origin ||
        (base.protocol !== 'https:' &&
          !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))
      )
        throw new ServiceError('Địa chỉ Web thanh toán không hợp lệ.', 400);
      let current: LicensePackage | undefined;
      for (let page = 1; page <= 20; page++) {
        const data = await packages.list(actor, page, '');
        current = data.items.find((item) => item.id === selected.id);
        if (current || !data.hasNextPage) break;
      }
      if (
        !current ||
        !canCheckout(current, actor) ||
        current.updatedAt !== selected.updatedAt ||
        current.priceMonthly !== selected.priceMonthly ||
        current.currency !== selected.currency
      )
        throw new ServiceError(
          'Gói đã thay đổi hoặc ngừng mở. Đóng hộp thoại và tải lại danh mục để kiểm tra.',
          409,
        );
      if (isOrganizationBuyer(actor)) {
        try {
          const pool = await getOrganizationPool(actor, undefined, get);
          if (pool.status !== 'Suspended' && pool.package.id !== current.id)
            throw new ServiceError(
              'Kho hiện tại dùng gói khác. Chưa hỗ trợ đổi gói Business qua thanh toán; chọn đúng gói của kho hoặc liên hệ hỗ trợ.',
              409,
            );
        } catch (error) {
          if (!(error instanceof ServiceError && error.status === 404)) throw error;
        }
      }
      const result = parse(
        paymentLink,
        await write('/api/payments/create-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: current.id,
            returnUrl: origin + '/payments/return',
            cancelUrl: origin + '/payments/cancel',
          }),
        }),
      );
      if (!safeCheckoutUrl(result.checkoutUrl))
        throw new ServiceError(
          'Liên kết thanh toán không thuộc PayOS được hỗ trợ. Kiểm tra lịch sử; không tạo lại giao dịch ngay.',
          502,
        );
      return result;
    },
    async cancel(actor: Person, payment: Payment) {
      check(actor);
      const current = await find(actor, payment.payosOrderId);
      if (!current || current.id !== payment.id)
        throw new ServiceError('Không tìm thấy giao dịch của tài khoản này.', 404);
      if (current.status !== 'Pending')
        throw new ServiceError('Trạng thái giao dịch đã thay đổi. Hãy tải lại.', 409);
      await write('/api/payments/' + current.id + '/cancel', { method: 'DELETE' });
    },
  };
}
export const paymentsApi = createPaymentsApi();

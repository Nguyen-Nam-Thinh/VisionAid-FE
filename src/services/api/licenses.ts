import { z } from 'zod';
import { apiGet } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const date = z.iso.datetime({ offset: true });
const subscription = z.object({
  id: z.string().uuid(),
  status: z.enum(['Trial', 'Active', 'Expired', 'Cancelled', 'Suspended']),
  package: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    packageType: z.enum(['Personal', 'Business']),
  }),
  startedAt: date,
  trialEndsAt: date.nullable(),
  currentPeriodStart: date.nullable(),
  currentPeriodEnd: date.nullable(),
  autoRenew: z.boolean(),
  daysRemaining: z.number().int().nonnegative().nullable(),
});
export const subscriptionLabels = {
  Trial: 'Dùng thử',
  Active: 'Đang hoạt động',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
  Suspended: 'Tạm ngưng',
};
export const isPersonalCaregiver = (user: Person) => user.role === 'Caregiver' && !user.orgId;

export async function getMySubscription(user: Person, signal?: AbortSignal, get = apiGet) {
  if (!isPersonalCaregiver(user))
    throw new ServiceError('Tài khoản không dùng subscription cá nhân.', 403);
  const parsed = subscription.safeParse(await get('/api/licenses/subscription', signal));
  if (!parsed.success)
    throw new ServiceError('Dữ liệu subscription không hợp lệ. Hãy tải lại.', 502);
  return parsed.data;
}

// Display only: the backend controls access, including grace and safety exceptions.
export function licenseSummary(user: Person, now = Date.now()) {
  if (!isPersonalCaregiver(user))
    return user.role === 'Caregiver'
      ? 'Nhân viên thuộc tổ chức — không yêu cầu license cá nhân. Quyền dữ liệu vẫn theo phân công.'
      : 'Tài khoản quản trị — không yêu cầu license cá nhân.';
  const expiry = user.licenseExpiresAt ? Date.parse(user.licenseExpiresAt) : NaN;
  const days = Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : null;
  switch (user.licenseStatus) {
    case 'Trial':
      return `Đang dùng thử${days === null ? '' : ` · Còn ${days} ngày theo thời hạn hồ sơ`}.`;
    case 'Active':
      return 'License đang hoạt động theo trạng thái máy chủ.';
    case 'Expired':
      return Number.isFinite(expiry) && now >= expiry && now - expiry <= 3 * 86400000
        ? 'License đã hết hạn, đang trong khoảng gia hạn 3 ngày theo thời hạn hồ sơ. Quyền sử dụng do máy chủ xác nhận.'
        : 'License đã hết hạn. Một số chức năng có thể bị giới hạn; kiểm tra thông tin gia hạn.';
    case 'None':
      return 'Chưa có license cá nhân. Kiểm tra subscription hoặc thông tin kích hoạt.';
    default:
      return 'Chưa xác định được trạng thái license từ máy chủ. Hãy tải lại thông tin.';
  }
}

import { t, msg, labelMap } from '../../i18n';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const date = z.iso.datetime({ offset: true });
export const subscription = z.object({
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
  // UC-80: not returned by BE yet (cancel keeps Active/Trial); read it once BE adds it.
  cancelledAt: date.nullable().optional(),
});
export const subscriptionLabels = labelMap({
  Trial: msg('Dùng thử'),
  Active: msg('Đang hoạt động'),
  Expired: msg('Đã hết hạn'),
  Cancelled: msg('Đã hủy'),
  Suspended: msg('Tạm ngưng'),
});
export function viuLicenseLabel(status?: string | null) {
  return status === 'None'
    ? t('Chưa có license')
    : subscriptionLabels[status as keyof typeof subscriptionLabels] ||
        t('Chưa có thông tin license từ máy chủ');
}
export const isPersonalCaregiver = (user: Person) => user.role === 'Caregiver' && !user.orgId;
export const isOrganizationBuyer = (user: Person) => user.role === 'CenterAdmin' && !!user.orgId;
const pool = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  package: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    packageType: z.literal('Business'),
  }),
  totalLicenses: z.number().int().nonnegative(),
  usedLicenses: z.number().int().nonnegative(),
  availableLicenses: z.number().int().nonnegative(),
  status: z.enum(['Active', 'Expired', 'Suspended']),
  purchasedAt: date,
  expiresAt: date.nullable(),
  // Added with UC-130 suspension; optional so older deploys still parse.
  suspendedReason: z.string().nullable().optional(),
  suspendedAt: date.nullable().optional(),
});
export type OrganizationPool = z.infer<typeof pool>;
export async function getOrganizationPool(user: Person, signal?: AbortSignal, get = apiGet) {
  if (!isOrganizationBuyer(user))
    throw new ServiceError(t('Chỉ quản trị trung tâm có tổ chức được xem kho license.'), 403);
  const parsed = pool.safeParse(await get('/api/licenses/pool', signal));
  if (!parsed.success)
    throw new ServiceError(t('Dữ liệu kho license không hợp lệ. Hãy tải lại.'), 502);
  if (parsed.data.organizationId !== user.orgId)
    throw new ServiceError(t('Máy chủ trả về kho license không thuộc tổ chức của bạn.'), 403);
  return parsed.data;
}

/**
 * UC-130: Admin suspends or reactivates an organization's license pool. BE replies without data,
 * so callers reload the pool; reactivation may land on Expired when the pool is past its end date.
 */
export async function setPoolSuspended(
  user: Person,
  poolId: string,
  suspended: boolean,
  reason = '',
  write = apiWrite,
) {
  if (user.role !== 'Admin')
    throw new ServiceError(
      t('Chỉ quản trị hệ thống được tạm ngưng hoặc kích hoạt lại kho license.'),
      403,
    );
  if (!z.string().uuid().safeParse(poolId).success)
    throw new ServiceError(t('Kho license không hợp lệ. Hãy tải lại.'), 400);
  const note = reason.trim();
  if (note.length > 500) throw new ServiceError(t('Lý do tối đa 500 ký tự.'), 400);
  const query = suspended && note ? '?' + new URLSearchParams({ reason: note }) : '';
  await write(`/api/licenses/pool/${poolId}/${suspended ? 'suspend' : 'reactivate'}${query}`, {
    method: 'POST',
  });
}

/** UC-130: Admin reads one organization's current pool (Active/Suspended first, else the latest). */
export async function getAdminOrganizationPool(
  user: Person,
  organizationId: string,
  signal?: AbortSignal,
  get = apiGet,
) {
  if (user.role !== 'Admin')
    throw new ServiceError(t('Chỉ quản trị hệ thống được xem kho license của tổ chức khác.'), 403);
  if (!z.string().uuid().safeParse(organizationId).success)
    throw new ServiceError(t('Tổ chức không hợp lệ.'), 400);
  const query = new URLSearchParams({ organizationId });
  const parsed = pool.safeParse(await get('/api/licenses/pool?' + query, signal));
  if (!parsed.success)
    throw new ServiceError(t('Dữ liệu kho license không hợp lệ. Hãy tải lại.'), 502);
  if (parsed.data.organizationId !== organizationId)
    throw new ServiceError(t('Kho license trả về không thuộc tổ chức đã chọn.'), 502);
  return parsed.data;
}

/**
 * UC-80: a personal caregiver cancels their own plan. BE keeps access until the current period
 * ends and rejects key-activated (organization) plans with CANNOT_CANCEL_ORG_SUBSCRIPTION.
 */
export async function cancelMySubscription(user: Person, write = apiWrite) {
  if (!isPersonalCaregiver(user))
    throw new ServiceError(t('Chỉ người chăm sóc cá nhân được hủy gói của mình.'), 403);
  await write('/api/licenses/subscription', { method: 'DELETE' });
}

export async function getMySubscription(user: Person, signal?: AbortSignal, get = apiGet) {
  if (!isPersonalCaregiver(user))
    throw new ServiceError(t('Tài khoản không dùng subscription cá nhân.'), 403);
  const parsed = subscription.safeParse(await get('/api/licenses/subscription', signal));
  if (!parsed.success)
    throw new ServiceError(t('Dữ liệu subscription không hợp lệ. Hãy tải lại.'), 502);
  return parsed.data;
}

// Caregiver screens whose APIs the BE LicenseValidationMiddleware blocks (402) without a personal
// license. Alerts and calls stay open (SOS/WebRTC are exempt); license, packages and payments too.
export const licensedCaregiverPaths = [
  'users',
  'map',
  'registry',
  'locations',
  'contacts',
  'caregivers',
  'activity',
  'tts',
  'notifications',
] as const;
export const GRACE_DAYS = 3;
/**
 * Mirrors the BE rule for a personal Caregiver: None/unknown, or Expired past the 3-day grace,
 * blocks licensed screens. UI hint only — the BE still answers 402 if this view is stale.
 */
export function personalLicenseBlock(user: Person, now = Date.now()): 'none' | 'expired' | null {
  if (!isPersonalCaregiver(user)) return null;
  // Field absent (older BE / profile not loaded): do not guess; null or 'None' means no license.
  if (user.licenseStatus === undefined) return null;
  if (user.licenseStatus === 'Active' || user.licenseStatus === 'Trial') return null;
  if (user.licenseStatus === 'Expired') {
    const expiry = user.licenseExpiresAt ? Date.parse(user.licenseExpiresAt) : NaN;
    return Number.isFinite(expiry) && now - expiry <= GRACE_DAYS * 86400000 ? null : 'expired';
  }
  return 'none';
}
// Display only: the backend controls access, including grace and safety exceptions.
export function licenseSummary(user: Person, now = Date.now()) {
  if (!isPersonalCaregiver(user))
    return user.role === 'Caregiver'
      ? t(
          'Nhân viên thuộc tổ chức — không yêu cầu license cá nhân. Quyền dữ liệu vẫn theo phân công.',
        )
      : t('Tài khoản quản trị — không yêu cầu license cá nhân.');
  const expiry = user.licenseExpiresAt ? Date.parse(user.licenseExpiresAt) : NaN;
  const days = Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : null;
  switch (user.licenseStatus) {
    case 'Trial':
      return t('Đang dùng thử{p0}.', {
        p0: days === null ? '' : t(' · Còn {days} ngày theo thời hạn hồ sơ', { days }),
      });
    case 'Active':
      return t('License đang hoạt động theo trạng thái máy chủ.');
    case 'Expired':
      return Number.isFinite(expiry) && now >= expiry && now - expiry <= 3 * 86400000
        ? t(
            'License đã hết hạn, đang trong khoảng gia hạn 3 ngày theo thời hạn hồ sơ. Quyền sử dụng do máy chủ xác nhận.',
          )
        : t('License đã hết hạn. Một số chức năng có thể bị giới hạn; kiểm tra thông tin gia hạn.');
    case 'None':
      return t('Chưa có license cá nhân. Kiểm tra subscription hoặc thông tin kích hoạt.');
    default:
      return t('Chưa xác định được trạng thái license từ máy chủ. Hãy tải lại thông tin.');
  }
}

import { msg, labelMap, intlLocale } from '../i18n';
import type { AlertStatus, Role } from '../models/domain';
export const roles: Record<Role, string> = labelMap({
  Caregiver: msg('Người chăm sóc'),
  CenterAdmin: msg('Quản trị trung tâm'),
  Admin: msg('Quản trị hệ thống'),
  VisuallyImpaired: msg('Người khiếm thị'),
});
export const statuses: Record<AlertStatus, string> = labelMap({
  DETECTED: msg('Đã phát hiện'),
  DISMISSED: msg('Đã hủy'),
  SENT: msg('Chờ hỗ trợ'),
  ACKNOWLEDGED: msg('Đang hỗ trợ'),
  ESCALATED: msg('Đã chuyển cấp'),
  RESOLVED: msg('Đã giải quyết'),
  CALLED: msg('Đã gọi hỗ trợ'),
});
export const activityLabels = labelMap({
  MOVEMENT: msg('Di chuyển'),
  OCR: msg('Đọc văn bản'),
  QR: msg('Quét QR'),
  FACE: msg('Nhận diện'),
  VOICE: msg('Lệnh giọng nói'),
});
export function normalizeRole(raw: string): Role | null {
  return (
    (
      {
        CAREGIVER: 'Caregiver',
        Caregiver: 'Caregiver',
        CENTER_ADMIN: 'CenterAdmin',
        CenterAdmin: 'CenterAdmin',
        ADMIN: 'Admin',
        Admin: 'Admin',
        VISUALLY_IMPAIRED: 'VisuallyImpaired',
        VisuallyImpaired: 'VisuallyImpaired',
      } as Record<string, Role>
    )[raw] ?? null
  );
}
export const formatTime = (at: string) =>
  new Intl.DateTimeFormat(intlLocale(), {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(at));

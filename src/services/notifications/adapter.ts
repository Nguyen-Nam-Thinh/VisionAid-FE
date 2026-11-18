import { t } from '../../i18n';
export async function requestBrowserPermission(): Promise<string> {
  if (typeof Notification === 'undefined') return t('Trình duyệt không hỗ trợ thông báo.');
  const permission = await Notification.requestPermission();
  return permission === 'granted'
    ? t(
        'Đã cấp quyền trình duyệt. Dịch vụ thông báo chưa được cấu hình nên chưa nhận được thông báo thật.',
      )
    : permission === 'denied'
      ? t(
          'Bạn đã từ chối thông báo. Trang quản lý vẫn hoạt động; có thể đổi trong cài đặt trình duyệt.',
        )
      : t('Chưa cấp quyền thông báo.');
}

import { apiWrite, apiDeviceId } from './adapter';
import { ServiceError } from '../contracts';
export async function registerPushToken(token: string) {
  if (!token || token.length > 500) throw new ServiceError('Token thông báo không hợp lệ.', 400);
  await apiWrite('/api/auth/fcm-token', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fcmToken: token,
      clientDeviceId: apiDeviceId(),
      deviceType: 'Web',
      deviceModel: 'VisionAid Web',
      appVersion: '0.1.0',
    }),
  });
}

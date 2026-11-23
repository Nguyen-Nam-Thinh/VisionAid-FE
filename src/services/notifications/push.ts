import { t } from '../../i18n';
import { firebaseConfig, vapidKey } from '../../configs/firebase';

export const pushOwnerKey = 'visionaid.push.owner.v1';
const cacheName = 'visionaid-push-v1';
const scope = '/firebase-cloud-messaging-push-scope';
let generation = 0;
const lock = <T>(work: () => Promise<T>) => navigator.locks.request('visionaid-push', work);
export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!navigator.locks &&
    'caches' in window
  );
}
// Accounts that switched push off on this browser; auto re-registration skips them.
const optOutKey = 'visionaid.push.optout.v1';
function optOuts(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(optOutKey) || '[]');
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
export const pushOptedOut = (userId: string) => optOuts().includes(userId);
export function setPushOptOut(userId: string, out: boolean) {
  try {
    const rest = optOuts().filter((id) => id !== userId);
    localStorage.setItem(optOutKey, JSON.stringify(out ? [...rest, userId] : rest));
  } catch {
    // Storage unavailable: the choice applies to this page view only.
  }
}
export function pushOwner() {
  try {
    return localStorage.getItem(pushOwnerKey);
  } catch {
    return null;
  }
}
async function sdk() {
  const [{ initializeApp, getApps }, messaging] = await Promise.all([
    import('@firebase/app'),
    import('@firebase/messaging'),
  ]);
  if (!(await messaging.isSupported()))
    throw new Error(t('Trình duyệt này chưa hỗ trợ thông báo.'));
  return {
    ...messaging,
    instance: messaging.getMessaging(getApps()[0] || initializeApp(firebaseConfig)),
  };
}
function notify() {
  window.dispatchEvent(new Event('visionaid-push-state'));
}
async function revoke() {
  localStorage.removeItem(pushOwnerKey);
  await caches.delete(cacheName);
  notify();
  const registration = await navigator.serviceWorker.getRegistration(scope);
  if (!registration) return;
  (await registration.getNotifications()).forEach((notification) => notification.close());
  const subscription = await registration.pushManager.getSubscription();
  if (subscription && !(await subscription.unsubscribe()))
    throw new Error(
      t('Chưa tắt được thông báo đẩy. Hãy chặn thông báo trong cài đặt trình duyệt.'),
    );
  // Local unsubscribe works offline; remote Firebase cleanup is best effort.
  try {
    const fcm = await sdk();
    await fcm.deleteToken(fcm.instance);
  } catch {
    /* Subscription already removed. */
  }
}
export function disablePush() {
  generation++;
  if (!pushSupported()) return Promise.resolve();
  return lock(revoke);
}
export async function enablePush(
  owner: string,
  register: (token: string) => Promise<unknown>,
  ask = true,
) {
  if (!pushSupported())
    throw new Error(
      t('Thông báo trên trình duyệt cần trang web bảo mật (https) và trình duyệt có hỗ trợ.'),
    );
  const epoch = generation;
  // Permission prompt runs directly after the user's click, before loading Firebase.
  const permission = ask ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted')
    throw new Error(t('Chưa được cấp quyền thông báo. Bạn vẫn có thể dùng trang quản lý.'));
  return lock(async () => {
    if (epoch !== generation) throw new Error(t('Phiên đã thay đổi. Vui lòng thử lại.'));
    if (!ask && pushOwner() !== owner) return;
    try {
      if (pushOwner() !== owner) await revoke();
      const fcm = await sdk();
      const token = await fcm.getToken(fcm.instance, { vapidKey });
      if (epoch !== generation) throw new Error(t('Phiên đã thay đổi.'));
      await register(token);
      if (epoch !== generation) throw new Error(t('Phiên đã thay đổi.'));
      localStorage.setItem(pushOwnerKey, owner);
      const state = await caches.open(cacheName);
      await state.put('/push-enabled', new Response('1'));
      notify();
    } catch (error) {
      await revoke();
      throw error;
    }
  });
}

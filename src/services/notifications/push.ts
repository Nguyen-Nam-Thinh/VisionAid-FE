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
  if (!(await messaging.isSupported())) throw new Error('Trình duyệt chưa hỗ trợ Web Push.');
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
    throw new Error('Chưa tắt được push. Hãy chặn thông báo trong cài đặt trình duyệt.');
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
  if (!pushSupported()) throw new Error('Web Push cần HTTPS và trình duyệt hỗ trợ thông báo.');
  const epoch = generation;
  // Permission prompt runs directly after the user's click, before loading Firebase.
  const permission = ask ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted')
    throw new Error('Chưa được cấp quyền thông báo. Bạn vẫn có thể dùng Dashboard.');
  return lock(async () => {
    if (epoch !== generation) throw new Error('Phiên đã thay đổi. Vui lòng thử lại.');
    if (!ask && pushOwner() !== owner) return;
    try {
      if (pushOwner() !== owner) await revoke();
      const fcm = await sdk();
      const token = await fcm.getToken(fcm.instance, { vapidKey });
      if (epoch !== generation) throw new Error('Phiên đã thay đổi.');
      await register(token);
      if (epoch !== generation) throw new Error('Phiên đã thay đổi.');
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

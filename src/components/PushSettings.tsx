import { t } from '../i18n';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  enablePush,
  disablePush,
  pushOwner,
  pushOwnerKey,
  pushSupported,
  pushOptedOut,
  setPushOptOut,
} from '../services/notifications/push';
import { apiDeviceId } from '../services/api/adapter';
import { registerPushToken } from '../services/api/push';

export function PushSettings({ userId }: { userId: string }) {
  const owner = userId + ':' + apiDeviceId();
  const [enabled, setEnabled] = useState(() => pushOwner() === owner);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const update = () => setEnabled(pushOwner() === owner && Notification.permission === 'granted');
    window.addEventListener('visionaid-push-state', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('visionaid-push-state', update);
      window.removeEventListener('storage', update);
    };
  }, [owner]);
  return (
    <section className="glass card stack">
      <h2>{t('Thông báo trên trình duyệt')}</h2>
      <p>
        {enabled
          ? t('Đã đăng ký nhận thông báo đẩy cho phiên này.')
          : t('Chưa đăng ký thông báo đẩy cho phiên này.')}
      </p>
      <p>
        {t(
          'Thông báo chỉ hiển thị lời nhắc chung. Mở trang quản lý để xem dữ liệu theo quyền của bạn. Mỗi trình duyệt nhận thông báo đẩy cho một phiên; bật ở tab khác sẽ thay phiên nhận. Đăng xuất hoặc tắt ở một tab sẽ tắt thông báo đẩy trên trình duyệt này.',
        )}
      </p>
      {!pushSupported() && <p>{t('Trình duyệt chưa hỗ trợ hoặc trang chưa dùng HTTPS.')}</p>}
      <div className="row">
        <button
          className="btn primary"
          disabled={pending || !pushSupported()}
          onClick={async () => {
            setPending(true);
            setMessage('');
            try {
              await enablePush(owner, registerPushToken);
              setPushOptOut(userId, false);
              setMessage(t('Đã bật thông báo trên trình duyệt này.'));
            } catch {
              setMessage(
                t(
                  'Không đăng ký được thông báo đẩy. Kiểm tra quyền thông báo, kết nối rồi thử lại.',
                ),
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {pending
            ? t('Đang xử lý…')
            : enabled
              ? t('Đồng bộ đăng ký thông báo đẩy')
              : t('Bật thông báo trình duyệt')}
        </button>
        <button
          className="btn"
          disabled={pending || !pushSupported()}
          onClick={async () => {
            setPending(true);
            setMessage('');
            try {
              await disablePush();
              setPushOptOut(userId, true);
              setMessage(
                t(
                  'Đã tắt thông báo trên trình duyệt này. Các tùy chọn thông báo khác vẫn giữ nguyên.',
                ),
              );
            } catch {
              setMessage(
                t('Chưa xác nhận tắt thông báo đẩy. Hãy chặn thông báo trong cài đặt trình duyệt.'),
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {t('Tắt thông báo đẩy trên trình duyệt')}
        </button>
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </section>
  );
}

export function PushSync({ userId }: { userId: string }) {
  const cache = useQueryClient();
  useEffect(() => {
    if (!pushSupported()) return;
    const owner = userId + ':' + apiDeviceId();
    const sync = () => {
      // Logging out clears the push slot; on the next login a browser that already allowed
      // notifications registers again by itself, unless this account switched push off.
      if (pushOwner() === null && Notification.permission === 'granted' && !pushOptedOut(userId)) {
        void enablePush(owner, registerPushToken).catch(() => {});
        return;
      }
      if (pushOwner() !== owner) return;
      if (Notification.permission !== 'granted') void disablePush().catch(() => {});
      else void enablePush(owner, registerPushToken, false).catch(() => {});
    };
    const receive = (event: MessageEvent) => {
      if (event.data?.type !== 'visionaid-push' || pushOwner()?.split(':')[0] !== userId) return;
      // REST remains authoritative. No second toast alongside SignalR.
      void cache.invalidateQueries({ predicate: (query) => query.queryKey.includes(userId) });
    };
    const storage = (event: StorageEvent) => {
      if (event.key === pushOwnerKey) void cache.invalidateQueries({ queryKey: ['session'] });
    };
    sync();
    window.addEventListener('focus', sync);
    window.addEventListener('online', sync);
    window.addEventListener('storage', storage);
    navigator.serviceWorker.addEventListener('message', receive);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('online', sync);
      window.removeEventListener('storage', storage);
      navigator.serviceWorker.removeEventListener('message', receive);
    };
  }, [userId, cache]);
  return null;
}

const promptKey = 'visionaid.push.prompt.later.v1';
const LATER_MS = 3 * 86400000;
function askedLater(userId: string) {
  try {
    const at = Number(JSON.parse(localStorage.getItem(promptKey) || '{}')[userId]);
    return Number.isFinite(at) && Date.now() - at < LATER_MS;
  } catch {
    return false;
  }
}
function rememberLater(userId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(promptKey) || '{}') as Record<string, number>;
    localStorage.setItem(promptKey, JSON.stringify({ ...all, [userId]: Date.now() }));
  } catch {
    // Storage unavailable: the banner comes back on the next page load.
  }
}
/** One-click invitation under the topbar, so alerts reach the browser without visiting Profile. */
export function PushPrompt({ userId }: { userId: string }) {
  const owner = userId + ':' + apiDeviceId();
  const shouldShow = () =>
    pushSupported() &&
    Notification.permission !== 'denied' &&
    pushOwner() !== owner &&
    !pushOptedOut(userId) &&
    !askedLater(userId);
  const [show, setShow] = useState(shouldShow);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const update = () => setShow(shouldShow());
    window.addEventListener('visionaid-push-state', update);
    return () => window.removeEventListener('visionaid-push-state', update);
    // shouldShow only reads storage and browser state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);
  if (!show && !message) return null;
  return (
    <div className="push-prompt" role="region" aria-label={t('Thông báo trên trình duyệt')}>
      <p>
        {message ||
          t('Bật thông báo để nhận cảnh báo té ngã ngay cả khi không mở trang VisionAid.')}
      </p>
      <div className="row">
        {show && (
          <button
            className="btn small primary"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await enablePush(owner, registerPushToken);
                setPushOptOut(userId, false);
                setShow(false);
              } catch {
                setShow(false);
                setMessage(
                  Notification.permission === 'denied'
                    ? t(
                        'Trình duyệt đang chặn thông báo. Bấm biểu tượng bên trái thanh địa chỉ, chọn Cho phép thông báo rồi tải lại trang.',
                      )
                    : t('Chưa bật được thông báo. Thử lại ở trang Hồ sơ.'),
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? t('Đang xử lý…') : t('Bật thông báo')}
          </button>
        )}
        <button
          className="btn small"
          onClick={() => {
            if (show) rememberLater(userId);
            setShow(false);
            setMessage('');
          }}
        >
          {show ? t('Để sau') : t('Đóng')}
        </button>
      </div>
    </div>
  );
}

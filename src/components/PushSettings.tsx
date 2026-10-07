import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  enablePush,
  disablePush,
  pushOwner,
  pushOwnerKey,
  pushSupported,
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
      <h2>Thông báo trên trình duyệt</h2>
      <p>{enabled ? 'Đã đăng ký nhận push cho phiên này.' : 'Chưa đăng ký push cho phiên này.'}</p>
      <p>
        Thông báo chỉ hiển thị lời nhắc chung. Mở Dashboard để xem dữ liệu theo quyền của bạn. Mỗi
        trình duyệt nhận push cho một phiên; bật ở tab khác sẽ thay phiên nhận. Đăng xuất hoặc tắt ở
        một tab sẽ tắt push trên trình duyệt này.
      </p>
      {!pushSupported() && <p>Trình duyệt chưa hỗ trợ hoặc trang chưa dùng HTTPS.</p>}
      <div className="row">
        <button
          className="btn primary"
          disabled={pending || !pushSupported()}
          onClick={async () => {
            setPending(true);
            setMessage('');
            try {
              await enablePush(owner, registerPushToken);
              setMessage(
                'Đã đăng ký trên máy chủ. Việc nhận push còn phụ thuộc dịch vụ gửi thông báo.',
              );
            } catch {
              setMessage('Không đăng ký được push. Kiểm tra quyền thông báo, kết nối rồi thử lại.');
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? 'Đang xử lý…' : enabled ? 'Đồng bộ đăng ký push' : 'Bật thông báo trình duyệt'}
        </button>
        <button
          className="btn"
          disabled={pending || !pushSupported()}
          onClick={async () => {
            setPending(true);
            setMessage('');
            try {
              await disablePush();
              setMessage(
                'Đã tắt push trên trình duyệt này. Tùy chọn kênh trên máy chủ không thay đổi.',
              );
            } catch {
              setMessage('Chưa xác nhận tắt push. Hãy chặn thông báo trong cài đặt trình duyệt.');
            } finally {
              setPending(false);
            }
          }}
        >
          Tắt push trên trình duyệt
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

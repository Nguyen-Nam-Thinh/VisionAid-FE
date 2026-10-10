import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { CallClient } from '../services/realtime/calls';
import { Dialog } from './UI';

export const CallContext = createContext<CallClient | null>(null);
export function CallAvailability() {
  const client = useContext(CallContext);
  return client ? <ConnectionNotice client={client} /> : null;
}
function ConnectionNotice({ client }: { client: CallClient }) {
  const call = useSyncExternalStore(client.subscribe, client.snapshot);
  return (
    <p className="notice" role="status">
      {call.network === 'connected'
        ? 'Sẵn sàng gọi hỗ trợ. Micro chỉ bật khi bạn bắt đầu hoặc nhận cuộc gọi.'
        : 'Chưa kết nối dịch vụ cuộc gọi. Nếu chờ lâu, kiểm tra mạng rồi tải lại trang.'}
    </p>
  );
}
export function CallButton({
  viuId,
  name,
  disabled = false,
}: {
  viuId: string;
  name: string;
  disabled?: boolean;
}) {
  const client = useContext(CallContext);
  return client ? (
    <ConnectedButton client={client} viuId={viuId} name={name} disabled={disabled} />
  ) : null;
}
function ConnectedButton({
  client,
  viuId,
  name,
  disabled,
}: {
  client: CallClient;
  viuId: string;
  name: string;
  disabled: boolean;
}) {
  const call = useSyncExternalStore(client.subscribe, client.snapshot);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button
        className="btn"
        disabled={
          disabled || call.network !== 'connected' || !['idle', 'ended'].includes(call.phase)
        }
        aria-label={'Gọi ' + name}
        onClick={() => setConfirm(true)}
      >
        Gọi hỗ trợ
      </button>
      {confirm && (
        <Dialog title={'Gọi ' + name} onClose={() => setConfirm(false)}>
          <div className="stack">
            <p>
              Web sẽ bật micro để bạn trò chuyện và nhận hình ảnh từ người được chăm sóc. Camera của
              bạn không được bật.
            </p>
            <button
              className="btn primary"
              onClick={() => {
                setConfirm(false);
                void client.start(viuId, name);
              }}
            >
              Bắt đầu gọi
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
export function CallPanel({ client }: { client: CallClient }) {
  const call = useSyncExternalStore(client.subscribe, client.snapshot);
  const video = useRef<HTMLVideoElement>(null);
  const [playError, setPlayError] = useState('');
  useEffect(() => {
    const element = video.current;
    if (!element || !call.remote) return;
    element.srcObject = call.remote;
    let active = true;
    void element
      .play()
      .then(() => {
        if (active) setPlayError('');
      })
      .catch(() => {
        if (active) setPlayError('Trình duyệt chặn tự phát. Nhấn Phát âm thanh và hình ảnh.');
      });
    return () => {
      active = false;
      element.srcObject = null;
    };
  }, [call.remote]);
  if (call.phase === 'idle') return null;
  const close = () => {
    if (call.phase === 'ended') client.dismiss();
    else if (call.phase === 'incoming') void client.reject();
    else void client.end();
  };
  return (
    <Dialog title={'Cuộc gọi · ' + call.name} onClose={close}>
      <div className="stack">
        <p role="status">{call.message}</p>
        {call.pending && (
          <p role="status">
            Có cuộc gọi khác cần kiểm tra. Đóng cuộc gọi hiện tại để kiểm tra lại trên máy chủ.
          </p>
        )}
        {call.phase !== 'ended' && (
          <>
            <video
              ref={video}
              playsInline
              autoPlay
              aria-label="Hình ảnh và âm thanh từ người được chăm sóc"
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                objectFit: 'contain',
                background: 'var(--stone)',
                borderRadius: 16,
              }}
            />
            {!call.remote && <p className="muted">Chưa nhận được hình ảnh hoặc âm thanh.</p>}
            {playError && <p role="alert">{playError}</p>}
            {call.remote && (
              <button
                className="btn"
                onClick={() => {
                  void video.current
                    ?.play()
                    .then(() => setPlayError(''))
                    .catch(() =>
                      setPlayError('Không thể phát. Kiểm tra thiết bị âm thanh của bạn.'),
                    );
                }}
              >
                Phát âm thanh và hình ảnh
              </button>
            )}
          </>
        )}
        <div className="row">
          {call.phase === 'incoming' ? (
            <>
              <button
                className="btn primary"
                onClick={() => {
                  void client.accept();
                }}
              >
                Nhận cuộc gọi
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  void client.reject();
                }}
              >
                Từ chối
              </button>
            </>
          ) : call.phase === 'ended' ? (
            <button className="btn" onClick={client.dismiss}>
              Đóng
            </button>
          ) : (
            <>
              <button
                className="btn"
                disabled={call.phase === 'preparing'}
                aria-pressed={call.muted}
                onClick={client.mute}
              >
                {call.muted ? 'Bật micro' : 'Tắt micro'}
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  void client.end();
                }}
              >
                Kết thúc cuộc gọi
              </button>
            </>
          )}
        </div>
        {call.phase !== 'ended' && (
          <p className="muted">
            Đóng hộp thoại sẽ {call.phase === 'incoming' ? 'từ chối' : 'kết thúc'} cuộc gọi. Không
            ghi âm hoặc lưu video trên Web.
          </p>
        )}
      </div>
    </Dialog>
  );
}

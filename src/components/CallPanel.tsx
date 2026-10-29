import { t } from '../i18n';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Maximize2, Mic, MicOff, Minus, Phone, PhoneIncoming, PhoneOff, Video } from 'lucide-react';
import type { CallClient, CallView } from '../services/realtime/calls';
import { Dialog } from './UI';

export const CallContext = createContext<CallClient | null>(null);
export function CallAvailability() {
  const client = useContext(CallContext);
  return client ? <ConnectionNotice client={client} /> : null;
}
function ConnectionNotice({ client }: { client: CallClient }) {
  const call = useSyncExternalStore(client.subscribe, client.snapshot);
  if (call.network === 'connected') return null;
  return (
    <p className="notice" role="status">
      {t('Chưa kết nối dịch vụ cuộc gọi. Nếu chờ lâu, kiểm tra mạng rồi tải lại trang.')}
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
        aria-label={t('Gọi ') + name}
        onClick={() => setConfirm(true)}
      >
        {t('Gọi hỗ trợ')}
      </button>
      {confirm && (
        <Dialog title={t('Gọi ') + name} onClose={() => setConfirm(false)}>
          <div className="stack">
            <p>
              {t(
                'Web sẽ bật micro để bạn trò chuyện và nhận hình ảnh từ người được chăm sóc. Camera của bạn không được bật.',
              )}
            </p>
            <button
              className="btn primary"
              onClick={() => {
                setConfirm(false);
                void client.start(viuId, name);
              }}
            >
              {t('Bắt đầu gọi')}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
export function CallPanel({ client }: { client: CallClient }) {
  const call = useSyncExternalStore(client.subscribe, client.snapshot);
  return call.phase === 'idle' ? null : (
    <CallWorkspace key={call.sessionId || call.viuId} client={client} call={call} />
  );
}
function IncomingCall({ client, call }: { client: CallClient; call: CallView }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="dialog incoming-call"
      aria-label={t('Cuộc gọi đến từ ') + call.name}
      onCancel={(event) => event.preventDefault()}
    >
      <div className="incoming-call-avatar">
        <PhoneIncoming size={32} aria-hidden="true" />
      </div>
      <p className="muted">{t('Cuộc gọi hỗ trợ đến')}</p>
      <h2>{call.name}</h2>
      <p role="status">{call.message}</p>
      <p className="muted">{t('Micro chỉ bật khi bạn nhận cuộc gọi. Camera của bạn không bật.')}</p>
      <div className="row">
        <button className="btn" onClick={() => void client.reject()}>
          {t('Từ chối')}
        </button>
        <button className="btn primary" onClick={() => void client.accept()}>
          <Phone size={18} aria-hidden="true" />
          {t('Nhận cuộc gọi')}
        </button>
      </div>
    </dialog>
  );
}
function CallWorkspace({ client, call }: { client: CallClient; call: CallView }) {
  const location = useLocation();
  const [view, setView] = useState({ path: location.key, minimized: false });
  if (view.path !== location.key) {
    setView({ path: location.key, minimized: true });
  }
  const minimized = view.minimized || view.path !== location.key;
  const panel = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playError, setPlayError] = useState('');
  const incoming = call.phase === 'incoming';
  const ended = call.phase === 'ended';
  useEffect(() => {
    const main = document.getElementById('main');
    if (!main || minimized || incoming) return;
    // Keep keyboard focus out of page controls obscured by the expanded call.
    const previous = main.inert;
    main.inert = true;
    return () => {
      main.inert = previous;
    };
  }, [minimized, incoming]);
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
        if (active) setPlayError(t('Trình duyệt chặn tự phát. Nhấn Phát âm thanh và hình ảnh.'));
      });
    return () => {
      active = false;
      element.srcObject = null;
    };
  }, [call.remote]);
  useEffect(() => {
    if (!incoming) panel.current?.focus({ preventScroll: true });
  }, [incoming]);
  useEffect(() => {
    if (minimized || incoming || ended) return;
    const escape = (event: KeyboardEvent) => {
      // Leave Escape to any form dialog opened above the call workspace.
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        document.querySelector('dialog[open]')
      )
        return;
      event.preventDefault();
      setView({ path: location.key, minimized: true });
      toggle.current?.focus();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [minimized, incoming, ended, location.key]);
  if (incoming) return <IncomingCall client={client} call={call} />;
  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-label={t('Cuộc gọi với ') + call.name}
      className={'call-workspace' + (minimized ? ' is-minimized' : '') + (ended ? ' is-ended' : '')}
    >
      <div className="call-workspace-header">
        <div className="call-identity">
          <span className="call-avatar">
            <Phone size={22} aria-hidden="true" />
          </span>
          <div>
            <h2>{call.name}</h2>
            <p className="call-status" role="status">
              {call.message}
            </p>
            {ended && call.license && <Link to="/license">{t('Xem trạng thái license')}</Link>}
          </div>
        </div>
        {!ended && (
          <button
            ref={toggle}
            className="btn"
            aria-label={minimized ? t('Mở rộng cuộc gọi') : t('Thu nhỏ cuộc gọi')}
            onClick={() => setView({ path: location.key, minimized: !minimized })}
          >
            {minimized ? (
              <Maximize2 size={18} aria-hidden="true" />
            ) : (
              <Minus size={18} aria-hidden="true" />
            )}
            <span>{minimized ? t('Mở rộng') : t('Thu nhỏ')}</span>
          </button>
        )}
      </div>
      {call.pending && (
        <p className="notice call-pending" role="status">
          {t(
            'Có cuộc gọi khác cần kiểm tra. Kết thúc cuộc gọi hiện tại rồi đóng bảng để kiểm tra lại trên máy chủ.',
          )}
        </p>
      )}
      {!ended && (
        <div className="call-workspace-content">
          <div className="call-video-stage">
            <video
              ref={video}
              playsInline
              autoPlay
              aria-label={t('Hình ảnh và âm thanh từ người được chăm sóc')}
            />
            {!call.remote && (
              <div className="call-video-empty">
                <Video size={40} aria-hidden="true" />
                <p>{t('Đang chờ âm thanh và hình ảnh')}</p>
                <small>{t('Hình ảnh sẽ xuất hiện khi thiết bị kết nối.')}</small>
              </div>
            )}
            <span className="call-video-caption">{t('Hình ảnh từ người được chăm sóc')}</span>
          </div>
          <div className="call-information">
            <h3>{t('Trong cuộc gọi')}</h3>
            <dl>
              <dt>{t('Người được chăm sóc')}</dt>
              <dd>{call.name}</dd>
              <dt>{t('Micro của bạn')}</dt>
              <dd>
                {call.phase === 'preparing'
                  ? t('Đang chuẩn bị')
                  : call.muted
                    ? t('Đã tắt')
                    : t('Đang bật')}
              </dd>
              <dt>{t('Camera của bạn')}</dt>
              <dd>{t('Không bật')}</dd>
            </dl>
            <p>{t('Thu nhỏ để xem bản đồ hoặc thông tin người thân trong khi trò chuyện.')}</p>
            <p>{t('Web không ghi âm hoặc lưu video.')}</p>
          </div>
        </div>
      )}
      {!ended && playError && (
        <div className="call-playback">
          <p role="alert">{playError}</p>
          <button
            className="btn"
            onClick={() => {
              void video.current
                ?.play()
                .then(() => setPlayError(''))
                .catch(() =>
                  setPlayError(t('Không thể phát. Kiểm tra thiết bị âm thanh của bạn.')),
                );
            }}
          >
            {t('Phát âm thanh và hình ảnh')}
          </button>
        </div>
      )}
      <div className="call-controls">
        <p className="muted">
          {ended
            ? t('Bạn có thể đóng bảng và xem lại lịch sử cuộc gọi.')
            : t('Thu nhỏ không kết thúc cuộc gọi.')}
        </p>
        <div className="row">
          {ended ? (
            <button className="btn" onClick={client.dismiss}>
              {t('Đóng')}
            </button>
          ) : (
            <>
              <button
                className="btn"
                disabled={call.phase === 'preparing'}
                aria-pressed={call.muted}
                onClick={client.mute}
              >
                {call.muted ? (
                  <MicOff size={18} aria-hidden="true" />
                ) : (
                  <Mic size={18} aria-hidden="true" />
                )}
                {call.muted ? t('Bật micro') : t('Tắt micro')}
              </button>
              <button className="btn call-end" onClick={() => void client.end()}>
                <PhoneOff size={18} aria-hidden="true" />
                {t('Kết thúc cuộc gọi')}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

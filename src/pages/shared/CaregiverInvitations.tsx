import { t, msg, formatLocaleDateTime, type MessageId } from '../../i18n';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QrCode, ScanLine } from 'lucide-react';
import { Badge, Dialog, State, Toggle } from '../../components/UI';
import { SearchPicker } from '../../components/SearchPicker';
import { searchPrimaryCareRecipients } from '../../services/api/pickers';
import { decodeQrImage } from '../../services/qr';
import {
  invitationsApi,
  invitationStateLabels,
  type Invitation,
  type InvitationPermissions,
  type InvitationPreview,
} from '../../services/api/invitations';
import type { Person } from '../../models/domain';

const permissionLabels: [keyof InvitationPermissions, string, MessageId][] = [
  ['canReceiveAlerts', 'invite-alerts', msg('Nhận cảnh báo')],
  ['canManageRegistry', 'invite-registry', msg('Quản lý gương mặt thân quen')],
  ['canManageLocations', 'invite-locations', msg('Quản lý địa điểm và vùng an toàn')],
];
const granted = (p: InvitationPermissions) =>
  permissionLabels
    .filter(([key]) => p[key])
    .map(([, , label]) => t(label))
    .join(', ') || t('Chỉ xem');

/**
 * Caregiver: invite a secondary caregiver with a single-use QR, or accept an invitation someone
 * showed you. Only the primary caregiver of a care recipient can create one (BE enforces it).
 */
export function CaregiverInvitations({
  actor,
  onAccepted,
}: {
  actor: Person;
  onAccepted: () => Promise<unknown>;
}) {
  const [inviting, setInviting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [notice, setNotice] = useState('');
  if (actor.role !== 'Caregiver') return null;
  return (
    <section className="glass card stack" aria-labelledby="invite-title">
      <h2 id="invite-title">{t('Mời bằng mã QR')}</h2>
      <p>
        {t(
          'Người chăm sóc chính tạo mã QR dùng một lần cho người chăm sóc phụ. Người được mời quét hoặc nhập mã, xem trước rồi chấp nhận để được liên kết với các quyền đã chọn.',
        )}
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className="row">
        <button className="btn primary" onClick={() => setInviting(true)}>
          <QrCode size={16} aria-hidden="true" />
          {t('Tạo lời mời')}
        </button>
        <button className="btn" onClick={() => setAccepting(true)}>
          <ScanLine size={16} aria-hidden="true" />
          {t('Nhận lời mời')}
        </button>
      </div>
      {inviting && <CreateInvitation actor={actor} onClose={() => setInviting(false)} />}
      {accepting && (
        <AcceptInvitation
          actor={actor}
          onClose={() => setAccepting(false)}
          onAccepted={async (name) => {
            setAccepting(false);
            setNotice(t('Đã chấp nhận lời mời. Bạn là người chăm sóc phụ của {name}.', { name }));
            await onAccepted();
          }}
        />
      )}
    </section>
  );
}

function CreateInvitation({ actor, onClose }: { actor: Person; onClose: () => void }) {
  const cache = useQueryClient();
  const [viu, setViu] = useState('');
  const [permissions, setPermissions] = useState<InvitationPermissions>({
    canReceiveAlerts: true,
    canManageRegistry: false,
    canManageLocations: false,
  });
  const [result, setResult] = useState<Invitation | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState('');
  const history = useQuery({
    queryKey: ['api-invitations', actor.id, actor.orgId, viu],
    queryFn: ({ signal }) => invitationsApi.history(actor, viu, signal),
    enabled: !!viu,
    retry: false,
  });
  return (
    <Dialog title={t('Tạo lời mời người chăm sóc phụ')} onClose={onClose}>
      <div className="stack">
        {!result ? (
          <>
            <SearchPicker
              label={t('Người được chăm sóc')}
              value={viu}
              onChange={setViu}
              search={searchPrimaryCareRecipients(actor)}
              queryKey={['invite-viu', actor.id, actor.orgId]}
            />
            <p className="muted">{t('Chỉ hiện những người mà bạn là người chăm sóc chính.')}</p>
            {permissionLabels.map(([key, id, label]) => (
              <div key={key} className="row between">
                <span id={id}>{t(label)}</span>
                <Toggle
                  labelledBy={id}
                  checked={permissions[key]}
                  onChange={(next) => setPermissions({ ...permissions, [key]: next })}
                />
              </div>
            ))}
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button
              className="btn primary"
              disabled={!viu || pending}
              onClick={async () => {
                setPending(true);
                setError('');
                try {
                  setResult(await invitationsApi.create(actor, viu, permissions));
                  await cache.invalidateQueries({ queryKey: ['api-invitations', actor.id] });
                } catch (err) {
                  setError(err instanceof Error ? err.message : t('Không thể thực hiện.'));
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? t('Đang tạo…') : t('Tạo mã QR')}
            </button>
          </>
        ) : (
          <div className="stack invite-result">
            <p role="status">
              {t('Lời mời làm người chăm sóc phụ cho {name}. Quyền: {permissions}.', {
                name: result.viuFullName,
                permissions: granted(result),
              })}
            </p>
            <div className="invite-qr">
              <QRCodeSVG value={result.token} size={200} title={t('Mã QR lời mời')} />
            </div>
            <p>
              {t('Hết hạn lúc {time}. Mã chỉ dùng được một lần.', {
                time: formatLocaleDateTime(result.expiresAt),
              })}
            </p>
            <label className="field">
              {t('Mã lời mời (nếu không quét được QR)')}
              <input readOnly value={result.token} onFocus={(e) => e.currentTarget.select()} />
            </label>
            <button
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.token);
                  setCopied(t('Đã sao chép mã lời mời.'));
                } catch {
                  setCopied(t('Không sao chép được. Hãy chọn mã và sao chép thủ công.'));
                }
              }}
            >
              {t('Sao chép mã')}
            </button>
            {copied && <p role="status">{copied}</p>}
          </div>
        )}
        {viu && (
          <section className="stack" aria-labelledby="invite-history-title">
            <h3 id="invite-history-title">{t('Lời mời đã tạo')}</h3>
            <State
              loading={history.isPending}
              error={history.error}
              retry={() => history.refetch()}
            >
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{t('Ngày tạo')}</th>
                      <th scope="col">{t('Trạng thái')}</th>
                      <th scope="col">{t('Quyền')}</th>
                      <th scope="col">{t('Người chấp nhận')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data?.map((item) => (
                      <tr key={item.id}>
                        <td>{formatLocaleDateTime(item.createdAt)}</td>
                        <td>
                          <Badge
                            tone={
                              item.state === 'Accepted'
                                ? 'green'
                                : item.state === 'Pending'
                                  ? 'amber'
                                  : 'gray'
                            }
                          >
                            {invitationStateLabels[item.state] ?? item.state}
                          </Badge>
                        </td>
                        <td>{granted(item)}</td>
                        <td>
                          {item.acceptedByName
                            ? item.acceptedByName +
                              (item.acceptedAt ? ' · ' + formatLocaleDateTime(item.acceptedAt) : '')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!history.data?.length && (
                  <p className="empty">{t('Chưa có lời mời nào cho người này.')}</p>
                )}
              </div>
            </State>
          </section>
        )}
      </div>
    </Dialog>
  );
}

function AcceptInvitation({
  actor,
  onClose,
  onAccepted,
}: {
  actor: Person;
  onClose: () => void;
  onAccepted: (name: string) => Promise<void>;
}) {
  const [token, setToken] = useState('');
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const check = async (value: string) => {
    setPending(true);
    setError('');
    setPreview(null);
    try {
      setPreview(await invitationsApi.preview(actor, value));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Không thể thực hiện.'));
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog
      title={t('Nhận lời mời người chăm sóc phụ')}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <div className="stack">
        <label className="field">
          {t('Mã lời mời')}
          <input
            value={token}
            autoComplete="off"
            onChange={(e) => {
              setToken(e.target.value);
              setPreview(null);
            }}
          />
        </label>
        <label className="field">
          {t('Hoặc chọn ảnh chụp mã QR')}
          <input
            type="file"
            accept="image/png,image/jpeg"
            disabled={pending}
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              input.value = '';
              if (!file) return;
              setError('');
              try {
                const code = await decodeQrImage(file);
                setToken(code);
                await check(code);
              } catch (err) {
                setError(err instanceof Error ? err.message : t('Không đọc được ảnh QR.'));
              }
            }}
          />
        </label>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {!preview && (
          <button
            className="btn primary"
            disabled={!token.trim() || pending}
            onClick={() => void check(token)}
          >
            {pending ? t('Đang kiểm tra…') : t('Xem lời mời')}
          </button>
        )}
        {preview && (
          <div className="stack">
            <dl className="record-details">
              <div>
                <dt>{t('Người mời')}</dt>
                <dd>{preview.inviterFullName}</dd>
              </div>
              <div>
                <dt>{t('Người được chăm sóc')}</dt>
                <dd>{preview.viuFullName}</dd>
              </div>
              <div>
                <dt>{t('Quyền')}</dt>
                <dd>{granted(preview)}</dd>
              </div>
              <div>
                <dt>{t('Hết hạn')}</dt>
                <dd>{formatLocaleDateTime(preview.expiresAt)}</dd>
              </div>
            </dl>
            <button
              className="btn primary"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError('');
                try {
                  await invitationsApi.accept(actor, token);
                  await onAccepted(preview.viuFullName);
                } catch (err) {
                  setError(err instanceof Error ? err.message : t('Không thể thực hiện.'));
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? t('Đang xử lý…') : t('Chấp nhận lời mời')}
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

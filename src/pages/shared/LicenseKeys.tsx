import { t, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Confirm, Dialog } from '../../components/UI';
import { Form } from '../../components/Form';
import {
  licenseKeysApi,
  keyOutcomeUnknown,
  type DistributedKey,
} from '../../services/api/licenseKeys';
import { isOrganizationBuyer, isPersonalCaregiver } from '../../services/api/licenses';
import { IssuedKeys } from './IssuedKeys';
import type { Person } from '../../models/domain';

export function LicenseKeys({ actor, mode }: { actor: Person; mode: 'distribute' | 'activate' }) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<DistributedKey | null>(null);
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [copied, setCopied] = useState('');
  const [another, setAnother] = useState(false);
  const distributing = mode === 'distribute';
  if (distributing ? !isOrganizationBuyer(actor) : !isPersonalCaregiver(actor)) return null;
  const refresh = () =>
    cache.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'session' ||
        ([
          'license-pool',
          'license-keys',
          'license-subscription',
          'api-users',
          'api-accounts',
          'api-account',
        ].includes(String(q.queryKey[0])) &&
          q.queryKey[1] === actor.id),
    });
  return (
    <section
      className="glass card stack license-card"
      aria-label={distributing ? t('Phát mã kích hoạt') : t('Kích hoạt mã')}
    >
      <h2>{distributing ? t('Mã kích hoạt cho gia đình') : t('Kích hoạt bằng mã')}</h2>
      <p>
        {distributing
          ? t(
              'Mỗi mã kích hoạt sử dụng một suất ngay khi tạo, hết hạn theo kho của trung tâm. Bạn tự chuyển mã kích hoạt cho gia đình.',
            )
          : t(
              'Nhập mã kích hoạt do trung tâm cấp. Thời hạn theo mã kích hoạt, không tự cộng thêm thời gian dùng thử hoặc gói đang có. Kích hoạt không thay đổi tổ chức hay liên kết chăm sóc.',
            )}
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {uncertain && (
        <p className="notice error" role="alert">
          {t(
            'Kết quả chưa rõ. Không gửi lại thao tác; hãy tải lại thông tin gói dịch vụ và nhờ quản trị viên kiểm tra.',
          )}
        </p>
      )}
      <button
        className="btn primary license-key-action"
        disabled={uncertain}
        onClick={() => setOpen(true)}
      >
        {result
          ? t('Xem mã kích hoạt vừa tạo')
          : distributing
            ? t('Tạo mã kích hoạt cho gia đình')
            : t('Nhập mã kích hoạt')}
      </button>
      {result && (
        <button className="btn" onClick={() => setAnother(true)}>
          {t('Tạo mã kích hoạt khác')}
        </button>
      )}
      {another && (
        <Confirm
          title={t('Bắt đầu mã kích hoạt mới')}
          description={t(
            'Mã kích hoạt vừa tạo vẫn còn trong danh sách Mã kích hoạt đã phát. Tạo mã kích hoạt mới không thu hồi mã kích hoạt cũ và không hoàn lại suất đã dùng.',
          )}
          onClose={() => setAnother(false)}
          onConfirm={async () => {
            setResult(null);
            setVisible(false);
            setCopied('');
            setOpen(true);
          }}
        />
      )}
      {distributing && <IssuedKeys actor={actor} />}
      {open && (
        <Dialog
          title={distributing ? t('Tạo mã kích hoạt cho gia đình') : t('Kích hoạt gói dịch vụ')}
          onClose={() => {
            setOpen(false);
            setVisible(false);
            setCopied('');
          }}
        >
          {result ? (
            <div className="stack">
              <p role="status">{t('Đã tạo mã kích hoạt và dùng một suất trong kho.')}</p>
              <label className="field">
                {t('Mã kích hoạt vừa tạo')}
                <input
                  readOnly
                  value={visible ? result.licenseKey : '••••-••••-••••-••••'}
                  autoComplete="off"
                />
              </label>
              <p>
                {t('Hạn dùng:')}{' '}
                {result.expiresAt
                  ? formatLocaleDateTime(result.expiresAt)
                  : t('Máy chủ không cung cấp thời hạn')}
              </p>
              <div className="row">
                <button className="btn" onClick={() => setVisible(!visible)}>
                  {visible ? t('Ẩn mã kích hoạt') : t('Hiện mã kích hoạt')}
                </button>
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result.licenseKey);
                      setCopied(t('Đã sao chép mã kích hoạt.'));
                    } catch {
                      setCopied(
                        t('Không sao chép được. Nhấn Hiện mã kích hoạt để sao chép thủ công.'),
                      );
                    }
                  }}
                >
                  {t('Sao chép mã kích hoạt')}
                </button>
              </div>
              {copied && <p role="status">{copied}</p>}
              <p>
                {t(
                  'Có thể xem lại mã kích hoạt này bất cứ lúc nào trong danh sách Mã kích hoạt đã phát.',
                )}
              </p>
            </div>
          ) : (
            <>
              <p>
                {distributing
                  ? t(
                      'Xác nhận tạo một mã kích hoạt và sử dụng một suất trong kho. Ghi chú không phải địa chỉ gửi thư.',
                    )
                  : t(
                      'Xác nhận sử dụng mã kích hoạt một lần cho tài khoản của bạn. Hãy kiểm tra thời hạn với trung tâm trước khi kích hoạt.',
                    )}
              </p>
              <Form
                fields={
                  distributing
                    ? [{ key: 'note', label: t('Ghi chú'), type: 'textarea', max: 500 }]
                    : [{ key: 'licenseKey', label: t('Mã kích hoạt'), required: true, max: 100 }]
                }
                submit={distributing ? t('Xác nhận tạo mã kích hoạt') : t('Xác nhận kích hoạt')}
                onSubmit={async (values) => {
                  try {
                    if (distributing)
                      setResult(await licenseKeysApi.distribute(actor, String(values.note || '')));
                    else {
                      await licenseKeysApi.activate(actor, String(values.licenseKey));
                      setNotice(
                        t(
                          'Máy chủ đã xác nhận kích hoạt. Kiểm tra trạng thái và thời hạn vừa tải lại ở trên.',
                        ),
                      );
                      setOpen(false);
                    }
                  } catch (error) {
                    if (keyOutcomeUnknown(error)) {
                      setUncertain(true);
                      setOpen(false);
                    } else throw error;
                  } finally {
                    await refresh();
                  }
                }}
              />
            </>
          )}
        </Dialog>
      )}
    </section>
  );
}

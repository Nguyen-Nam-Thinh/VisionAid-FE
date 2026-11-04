import { t } from '../../i18n';
import { useId, useState } from 'react';
import { setPoolAutoRenew, type OrganizationPool } from '../../services/api/licenses';
import type { Person } from '../../models/domain';
import { Toggle } from '../../components/UI';

/** BR-57: pool auto-renew switch shared by the CenterAdmin pool page and the Admin organization view. */
export function PoolAutoRenew({
  actor,
  pool,
  reload,
}: {
  actor: Person;
  pool: OrganizationPool;
  reload: () => Promise<unknown>;
}) {
  const id = useId();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const known = pool.autoRenew !== undefined;
  const on = !!pool.autoRenew;
  return (
    <div className="stack">
      <div className="row">
        <Toggle
          labelledBy={id + '-label'}
          describedBy={id + '-hint'}
          checked={on}
          disabled={pending || !known}
          onChange={async (next) => {
            setPending(true);
            setMessage('');
            setError('');
            try {
              await setPoolAutoRenew(actor, pool, next);
              setMessage(next ? t('Đã bật tự gia hạn kho.') : t('Đã tắt tự gia hạn kho.'));
            } catch (err) {
              setError(err instanceof Error ? err.message : t('Không thể thực hiện.'));
            } finally {
              // The server value is authoritative, including after a failure.
              await reload();
              setPending(false);
            }
          }}
        />
        <span id={id + '-label'}>{t('Tự gia hạn kho')}</span>
        <strong>{known ? (on ? t('Bật') : t('Tắt')) : t('Chưa có từ máy chủ')}</strong>
      </div>
      <small id={id + '-hint'}>
        {!known
          ? t('Máy chủ chưa trả trạng thái tự gia hạn. Hãy tải lại kho license.')
          : t(
              'Khi bật, trước ngày hết hạn máy chủ gửi link thanh toán PayOS cho quản trị trung tâm qua email và thông báo. Chỉ áp dụng khi kho đang hoạt động; không tự trừ tiền.',
            )}
      </small>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </div>
  );
}

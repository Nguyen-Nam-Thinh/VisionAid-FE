import { t, formatLocaleDateTime } from '../../i18n';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useService';
import { useLimit } from '../../hooks/useLimit';
import { Confirm, PageHead, State, Toast } from '../../components/UI';
import {
  autoRenewBlock,
  cancelMySubscription,
  canCancelRenewal,
  getMySubscription,
  setMyAutoRenew,
  isPersonalCaregiver,
  licenseSummary,
  subscriptionLabels,
} from '../../services/api/licenses';
import { ServiceError } from '../../services/contracts';
import { canBrowsePackages } from '../../services/api/packages';
import { LicenseKeys } from './LicenseKeys';

const dateLabel = (date?: string | null) =>
  date ? formatLocaleDateTime(date, { timeZoneName: 'short' }) : t('Chưa có thời hạn từ máy chủ');

export function ApiLicense() {
  const maxVius = useLimit('caregiving.max_vius_per_caregiver');
  const session = useSession();
  const cache = useQueryClient();
  const user = session.data;
  const personal = !!user && isPersonalCaregiver(user);
  const detail = useQuery({
    queryKey: ['license-subscription', user?.id, user?.orgId],
    queryFn: ({ signal }) => getMySubscription(user!, signal),
    enabled: personal,
    retry: false,
    refetchInterval: 60000,
  });
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // BE confirmed the cancel; keep it for this page view in case an older GET lacks cancelledAt.
  const [cancelledNow, setCancelledNow] = useState(false);
  const [notice, setNotice] = useState('');
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState('');
  const periodEnd = detail.data
    ? detail.data.status === 'Trial'
      ? detail.data.trialEndsAt
      : detail.data.currentPeriodEnd
    : null;
  const cancelled = cancelledNow || !!detail.data?.cancelledAt;
  if (!user) return null;
  return (
    <>
      <PageHead title="License" description={t('Trạng thái và thời hạn sử dụng của tài khoản.')} />
      <section className="glass card stack license-card" aria-label={t('Thông tin license')}>
        <div className="card-head">
          <h2>{t('Trạng thái tài khoản')}</h2>
          <button
            className="btn small"
            aria-label={t('Tải lại thông tin license')}
            disabled={checking || session.isFetching || detail.isFetching}
            onClick={async () => {
              setChecking(true);
              try {
                // Refetch reads only. Never replay a mutation that returned 402.
                await cache.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
                await session.refetch();
              } finally {
                setChecking(false);
              }
            }}
          >
            <RefreshCw size={16} aria-hidden="true" /> {t('Tải lại')}
          </button>
        </div>
        <p>{licenseSummary(user)}</p>
        {personal && <p>{t('Thời hạn hồ sơ: {p1}', { p1: dateLabel(user.licenseExpiresAt) })}</p>}
        {(canBrowsePackages(user) || (user.role === 'CenterAdmin' && user.orgId)) && (
          <div className="row">
            {canBrowsePackages(user) && (
              <Link
                className="btn small license-catalog"
                to={user.role === 'Admin' ? '/admin/packages' : '/packages'}
              >
                {t('Xem danh mục gói')}
              </Link>
            )}
            {user.role === 'CenterAdmin' && user.orgId && (
              <Link className="btn small" to="/center-admin/licenses">
                {t('Xem kho license tổ chức')}
              </Link>
            )}
          </div>
        )}
      </section>
      {personal && (
        <section className="glass card stack license-card">
          <h2>{t('Gói sử dụng cá nhân')}</h2>
          {detail.error instanceof ServiceError && detail.error.status === 404 ? (
            <p className="notice">
              {t('Máy chủ chưa tìm thấy thông tin gói sử dụng cho tài khoản này.')}
            </p>
          ) : (
            <State loading={detail.isPending} error={detail.error}>
              {detail.data && (
                <dl className="license-details">
                  <div>
                    <dt>{t('Gói')}</dt>
                    <dd>{detail.data.package.name}</dd>
                  </div>
                  <div>
                    <dt>{t('Trạng thái gói')}</dt>
                    <dd>{subscriptionLabels[detail.data.status]}</dd>
                  </div>
                  <div>
                    <dt>{t('Hết hạn kỳ sử dụng')}</dt>
                    <dd>{dateLabel(periodEnd)}</dd>
                  </div>
                  <div>
                    <dt id="auto-renew-label">{t('Tự gia hạn')}</dt>
                    <dd className="stack">
                      <label className="row">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-labelledby="auto-renew-label"
                          aria-describedby="auto-renew-hint"
                          checked={detail.data.autoRenew && !cancelled}
                          disabled={renewing || detail.isFetching || !!autoRenewBlock(detail.data)}
                          onChange={async (e) => {
                            const next = e.currentTarget.checked;
                            const key = ['license-subscription', user.id, user.orgId];
                            setRenewing(true);
                            setRenewError('');
                            setNotice('');
                            try {
                              const updated = await setMyAutoRenew(user, detail.data!, next);
                              if (updated) cache.setQueryData(key, updated);
                              // Turning it on resumes a cancelled plan (BE clears cancelledAt).
                              if (next) setCancelledNow(false);
                              setNotice(next ? t('Đã bật tự gia hạn.') : t('Đã tắt tự gia hạn.'));
                            } catch (err) {
                              setRenewError(
                                err instanceof Error ? err.message : t('Không thể thực hiện.'),
                              );
                            } finally {
                              await cache.invalidateQueries({ queryKey: key });
                              setRenewing(false);
                            }
                          }}
                        />
                        {detail.data.autoRenew && !cancelled ? t('Bật') : t('Tắt')}
                      </label>
                      <small id="auto-renew-hint">
                        {autoRenewBlock(detail.data) ??
                          (cancelled
                            ? t('Bật lại để tiếp tục gia hạn gói đã hủy.')
                            : t(
                                'Khi bật, trước ngày hết hạn máy chủ gửi link thanh toán PayOS qua email và thông báo. Không tự trừ tiền.',
                              ))}
                      </small>
                      {renewError && (
                        <p role="alert" className="notice error">
                          {renewError}
                        </p>
                      )}
                    </dd>
                  </div>
                </dl>
              )}
              {detail.data && ['Active', 'Trial'].includes(detail.data.status) && (
                <div className="row">
                  {cancelled ? (
                    <p className="notice" role="status">
                      {t(
                        'Đã hủy gia hạn, còn dùng đến {date}. Sau đó gói không tự gia hạn; bạn có thể mua lại từ danh mục gói.',
                        { date: dateLabel(periodEnd) },
                      )}
                    </p>
                  ) : detail.data.isOrgIssued ? (
                    <p className="notice">
                      {t(
                        'Gói này được kích hoạt bằng key của trung tâm. Liên hệ quản trị trung tâm để thay đổi.',
                      )}
                    </p>
                  ) : (
                    canCancelRenewal(detail.data) && (
                      <button className="btn danger small" onClick={() => setCancelling(true)}>
                        {t('Hủy gia hạn')}
                      </button>
                    )
                  )}
                </div>
              )}
            </State>
          )}
          <p>
            {t(
              'Trial và Personal hỗ trợ tối đa {max} người được chăm sóc. Quyền truy cập từng người vẫn theo liên kết.',
              { max: maxVius },
            )}
          </p>
        </section>
      )}
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {cancelling && detail.data && (
        <Confirm
          title={t('Hủy gia hạn gói')}
          description={t(
            'Hủy gia hạn gói {name}? Bạn vẫn dùng được tới hết kỳ hiện tại ({date}); sau đó gói không tự gia hạn.',
            { name: detail.data.package.name, date: dateLabel(periodEnd) },
          )}
          onClose={() => setCancelling(false)}
          onConfirm={async () => {
            await cancelMySubscription(user);
            setCancelledNow(true);
            setNotice(t('Đã hủy gia hạn, còn dùng đến {date}.', { date: dateLabel(periodEnd) }));
            await cache.invalidateQueries({ queryKey: ['license-subscription'] });
          }}
        />
      )}
      <LicenseKeys key={user.id + user.orgId} actor={user} mode="activate" />
    </>
  );
}

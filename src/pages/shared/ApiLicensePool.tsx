import { RefreshCw } from 'lucide-react';
import { t, formatLocaleDateTime } from '../../i18n';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useService';
import { PageHead, State } from '../../components/UI';
import {
  getOrganizationPool,
  isOrganizationBuyer,
  subscriptionLabels,
} from '../../services/api/licenses';
import { ServiceError } from '../../services/contracts';
import type { Person } from '../../models/domain';
import { LicenseAssignments } from './LicenseAssignments';
import { LicenseKeys } from './LicenseKeys';
import { PoolAutoRenew } from './PoolAutoRenew';

export function OrganizationPool({
  actor,
  embedded = false,
}: {
  actor: Person;
  /** Shown inside the payment result page, which already links to the payment history. */
  embedded?: boolean;
}) {
  const query = useQuery({
    queryKey: ['license-pool', actor.id, actor.orgId],
    queryFn: ({ signal }) => getOrganizationPool(actor, signal),
    enabled: isOrganizationBuyer(actor),
    retry: false,
  });
  if (!isOrganizationBuyer(actor))
    return <p className="notice">{t('Chỉ quản trị trung tâm có tổ chức được xem kho license.')}</p>;
  const item = query.data;
  return (
    <section className="glass card stack license-card" aria-label={t('Kho license tổ chức')}>
      <div className="row page-head-actions">
        <button
          className="btn small"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {t('Tải lại kho license')}
        </button>
        <Link className="btn small" to="/packages">
          {t('Chọn gói Business')}
        </Link>
        {!embedded && (
          <Link className="btn small" to="/center-admin/payments">
            {t('Lịch sử thanh toán')}
          </Link>
        )}
      </div>
      {query.error instanceof ServiceError && query.error.status === 404 ? (
        <p className="notice">{t('Tổ chức chưa có kho license. Chọn gói Business để bắt đầu.')}</p>
      ) : (
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {item && (
            <>
              <h2>{item.package.name}</h2>
              <dl className="license-details">
                <div>
                  <dt>{t('Trạng thái')}</dt>
                  <dd>{subscriptionLabels[item.status]}</dd>
                </div>
                <div>
                  <dt>{t('Tổng license')}</dt>
                  <dd>{item.totalLicenses}</dd>
                </div>
                <div>
                  <dt>{t('Đã sử dụng')}</dt>
                  <dd>{item.usedLicenses}</dd>
                </div>
                <div>
                  <dt>{t('Còn lại')}</dt>
                  <dd>{item.availableLicenses}</dd>
                </div>
                <div>
                  <dt>{t('Ngày mua')}</dt>
                  <dd>{formatLocaleDateTime(item.purchasedAt, { timeZoneName: 'short' })}</dd>
                </div>
                <div>
                  <dt>{t('Hết hạn')}</dt>
                  <dd>
                    {item.expiresAt
                      ? formatLocaleDateTime(item.expiresAt, { timeZoneName: 'short' })
                      : t('Không có thời hạn từ máy chủ')}
                  </dd>
                </div>
              </dl>
              <PoolAutoRenew actor={actor} pool={item} reload={() => query.refetch()} />
              <p>
                {t(
                  'Nhân viên chăm sóc không sử dụng license trong kho. Việc cấp license cho người được chăm sóc do máy chủ kiểm tra.',
                )}
              </p>
            </>
          )}
        </State>
      )}
    </section>
  );
}
export function ApiLicensePool() {
  const { data: actor } = useSession();
  if (!actor) return null;
  return (
    <>
      <PageHead
        title={t('Kho license tổ chức')}
        description={t('Số license đã mua, đã cấp và thời hạn sử dụng của trung tâm.')}
      />
      <OrganizationPool key={'pool-' + actor.id + actor.orgId} actor={actor} />
      {isOrganizationBuyer(actor) && (
        <LicenseAssignments key={'assignments-' + actor.id + actor.orgId} actor={actor} />
      )}
      <LicenseKeys key={'keys-' + actor.id + actor.orgId} actor={actor} mode="distribute" />
    </>
  );
}

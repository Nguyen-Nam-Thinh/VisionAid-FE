import { t, formatNumber } from '../../i18n';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { State } from '../../components/UI';
import { formatTime } from '../../constants/labels';
import {
  getMySubscription,
  getOrganizationPool,
  isPersonalCaregiver,
  isOrganizationBuyer,
  licenseSummary,
  subscriptionLabels,
} from '../../services/api/licenses';
import { emergenciesApi, alertLabels } from '../../services/api/emergencies';
import { paymentsApi, canPay, paymentHistoryPath } from '../../services/api/payments';
import { monitoringApi } from '../../services/api/monitoring';
import { ServiceError } from '../../services/contracts';
import type { Person } from '../../models/domain';

const refresh = { retry: false, gcTime: 0, refetchInterval: 60000 } as const;
const time = (value: string | null) =>
  value ? formatTime(value) + ' · UTC+7' : t('Chưa có dữ liệu thời hạn');

export function DashboardOverview({ actor }: { actor: Person }) {
  return (
    <div className="overview-grid">
      {(actor.role === 'Caregiver' || isOrganizationBuyer(actor)) && (
        <section className="glass card stack overview-alerts" aria-label={t('Cảnh báo đang mở')}>
          <h2>{t('Cảnh báo đang mở')}</h2>
          <p>
            {t(
              'Theo dõi cảnh báo trong phạm vi chăm sóc của bạn. Mỗi nhóm cập nhật riêng, tự tải lại sau 30 giây.',
            )}
          </p>
          <div className="overview-alert-counts">
            {(['Sent', 'Acknowledged', 'Escalated'] as const).map((status) => (
              <AlertCount key={status} actor={actor} status={status} />
            ))}
          </div>
          <Link
            className="btn primary"
            to={actor.role === 'Caregiver' ? '/caregiver/alerts' : '/center-admin/reports'}
          >
            {actor.role === 'Caregiver' ? t('Mở trung tâm cảnh báo') : t('Xem báo cáo trung tâm')}
          </Link>
        </section>
      )}
      {isPersonalCaregiver(actor) && <Personal actor={actor} />}
      {isOrganizationBuyer(actor) && <Pool actor={actor} />}
      {actor.role === 'Caregiver' && actor.orgId && (
        <section className="glass card stack">
          <h2>{t('Phạm vi chăm sóc')}</h2>
          <p>{licenseSummary(actor)}</p>
          <Link className="btn" to="/caregiver/users">
            {t('Người được phân công')}
          </Link>
        </section>
      )}
      {canPay(actor) && <PendingPayments actor={actor} />}
      {actor.role === 'Admin' && <Delivery actor={actor} />}
      {actor.role === 'CenterAdmin' && !actor.orgId && (
        <p className="notice error" role="alert">
          {t('Tài khoản chưa có tổ chức. Liên hệ quản trị viên để kiểm tra phân công.')}
        </p>
      )}
    </div>
  );
}

function Personal({ actor }: { actor: Person }) {
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-subscription', actor.id, actor.orgId],
    queryFn: ({ signal }) => getMySubscription(actor, signal),
  });
  return (
    <section className="glass card stack" aria-label={t('License cá nhân')}>
      <h2>{t('License cá nhân')}</h2>
      <p>{licenseSummary(actor)}</p>
      {query.error instanceof ServiceError && query.error.status === 404 ? (
        <p>{t('Máy chủ chưa tìm thấy subscription cá nhân.')}</p>
      ) : (
        <State loading={query.isPending} error={query.error}>
          {query.data && (
            <dl className="account-details">
              <div>
                <dt>{t('Gói')}</dt>
                <dd>{query.data.package.name}</dd>
              </div>
              <div>
                <dt>{t('Trạng thái gói')}</dt>
                <dd>{subscriptionLabels[query.data.status]}</dd>
              </div>
              <div>
                <dt>{t('Hết hạn kỳ sử dụng')}</dt>
                <dd>
                  {time(
                    query.data.status === 'Trial'
                      ? query.data.trialEndsAt
                      : query.data.currentPeriodEnd,
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('Ngày còn lại theo máy chủ')}</dt>
                <dd>{query.data.daysRemaining ?? t('Chưa có dữ liệu')}</dd>
              </div>
            </dl>
          )}
        </State>
      )}
      <p>
        {t(
          'Trạng thái hồ sơ và subscription có thể khác nhau. Quyền truy cập do máy chủ quyết định; xem trang License để kiểm tra hoặc gia hạn.',
        )}
      </p>
      <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
        {t('Tải lại license')}
      </button>
      <Link to="/license">{t('Xem quyền sử dụng')}</Link>
    </section>
  );
}

function Pool({ actor }: { actor: Person }) {
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-pool', actor.id, actor.orgId],
    queryFn: ({ signal }) => getOrganizationPool(actor, signal),
  });
  return (
    <section className="glass card stack" aria-label={t('Kho license tổ chức')}>
      <h2>{t('Kho license tổ chức')}</h2>
      {query.error instanceof ServiceError && query.error.status === 404 ? (
        <p>{t('Máy chủ chưa tìm thấy kho license của trung tâm.')}</p>
      ) : (
        <State loading={query.isPending} error={query.error}>
          {query.data && (
            <dl className="account-details">
              <div>
                <dt>{t('Gói')}</dt>
                <dd>{query.data.package.name}</dd>
              </div>
              <div>
                <dt>{t('Trạng thái')}</dt>
                <dd>{subscriptionLabels[query.data.status]}</dd>
              </div>
              <div>
                <dt>{t('Tổng license')}</dt>
                <dd>{query.data.totalLicenses}</dd>
              </div>
              <div>
                <dt>{t('Đã cấp')}</dt>
                <dd>{query.data.usedLicenses}</dd>
              </div>
              <div>
                <dt>{t('Còn lại theo máy chủ')}</dt>
                <dd>{query.data.availableLicenses}</dd>
              </div>
              <div>
                <dt>{t('Hết hạn')}</dt>
                <dd>{time(query.data.expiresAt)}</dd>
              </div>
            </dl>
          )}
        </State>
      )}
      <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
        {t('Tải lại kho license')}
      </button>
      <Link to="/center-admin/licenses">{t('Quản lý kho license')}</Link>
    </section>
  );
}

function AlertCount({
  actor,
  status,
}: {
  actor: Person;
  status: 'Sent' | 'Acknowledged' | 'Escalated';
}) {
  const query = useQuery({
    ...refresh,
    refetchInterval: 30000,
    queryKey: ['api-alerts', actor.id, actor.orgId, 'dashboard-count', status],
    queryFn: async ({ signal }) =>
      (
        await emergenciesApi.list(
          actor,
          { viuId: '', status, dateFrom: '', dateTo: '', page: 1 },
          signal,
        )
      ).totalCount,
  });
  return (
    <div className="stack" role="group" aria-label={alertLabels[status]}>
      <div className="row between">
        <h3>{alertLabels[status]}</h3>
        <button
          className="btn small"
          aria-label={t('Tải lại ') + alertLabels[status].toLowerCase()}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t('Tải lại')}
        </button>
      </div>
      <State loading={query.isPending} error={query.error}>
        {query.data !== undefined && (
          <p>
            <strong>{query.data}</strong>{' '}
            {t('cảnh báo · cập nhật {p3}', {
              p3: time(new Date(query.dataUpdatedAt).toISOString()),
            })}
          </p>
        )}
      </State>
    </div>
  );
}

function PendingPayments({ actor }: { actor: Person }) {
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-payments', actor.id, actor.orgId],
    queryFn: async ({ signal }) => {
      // shortcut: API chưa lọc trạng thái; chỉ xét 10 giao dịch mới nhất đến khi BE có bộ lọc.
      const data = await paymentsApi.list(actor, 1, signal);
      return {
        more: data.hasNextPage,
        items: data.items
          .filter((item) => item.status === 'Pending')
          .map(({ id, createdAt, amount, currency }) => ({ id, createdAt, amount, currency })),
      };
    },
  });
  return (
    <section className="glass card stack" aria-label={t('Thanh toán gần đây')}>
      <h2>{t('Thanh toán gần đây')}</h2>
      <p>
        {t(
          'Giao dịch đang chờ trong 10 giao dịch gần nhất. Đây không phải tổng số giao dịch đang chờ của toàn bộ lịch sử.',
        )}
      </p>
      <State loading={query.isPending} error={query.error}>
        {query.data && (
          <>
            {query.data.items.length ? (
              <ul className="stack">
                {query.data.items.map((item) => (
                  <li key={item.id}>
                    {t('{p0} · {p2} {currency} · Đang chờ thanh toán', {
                      p0: time(item.createdAt),
                      p2: formatNumber(item.amount),
                      currency: item.currency,
                    })}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('Không có giao dịch đang chờ trong nhóm vừa tải.')}</p>
            )}
            {query.data.more && (
              <p>
                {t(
                  'Còn giao dịch cũ hơn trong lịch sử; chưa kiểm tra trạng thái của các giao dịch đó.',
                )}
              </p>
            )}
          </>
        )}
      </State>
      <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
        {t('Tải lại thanh toán')}
      </button>
      <Link to={paymentHistoryPath(actor)}>{t('Mở lịch sử thanh toán')}</Link>
    </section>
  );
}

function Delivery({ actor }: { actor: Person }) {
  const query = useQuery({
    ...refresh,
    queryKey: ['api-delivery-status', actor.id],
    queryFn: ({ signal }) => monitoringApi.status(actor, signal),
  });
  return (
    <section className="glass card stack">
      <h2>{t('Gửi cảnh báo trong 24 giờ')}</h2>
      <State loading={query.isPending} error={query.error}>
        {query.data && (
          <dl className="account-details">
            <div>
              <dt>{t('Đã gửi')}</dt>
              <dd>{query.data.last24Hours.totalSent}</dd>
            </div>
            <div>
              <dt>{t('Thất bại')}</dt>
              <dd>{query.data.last24Hours.totalFailed}</dd>
            </div>
            <div>
              <dt>{t('Đang chờ gửi')}</dt>
              <dd>{query.data.last24Hours.totalPending}</dd>
            </div>
          </dl>
        )}
      </State>
      <p>
        {t('Thống kê cảnh báo được máy chủ theo dõi. Đã gửi không xác nhận người nhận đã đọc.')}
      </p>
      <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
        {t('Tải lại thống kê')}
      </button>
      <Link to="/admin/delivery">{t('Theo dõi thông báo')}</Link>
      <Link to="/admin/metrics">{t('Hiệu năng AI')}</Link>
    </section>
  );
}

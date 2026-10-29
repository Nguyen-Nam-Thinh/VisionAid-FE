import { t, formatNumber } from '../../i18n';
import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  MapPin,
  Package,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
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
          <div className="row between">
            <h2>{t('Cảnh báo đang mở')}</h2>
            <ReloadAlertCounts actor={actor} />
          </div>
          <p>{t('Theo dõi cảnh báo trong phạm vi chăm sóc của bạn.')}</p>
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
        <section className="glass card stack overview-wide">
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
      <Shortcuts actor={actor} />
    </div>
  );
}

type Shortcut = { to: string; icon: LucideIcon; title: string; detail: string };
// Role-specific entry points; the sidebar still lists every screen.
function shortcuts(actor: Person): Shortcut[] {
  const profile: Shortcut = {
    to: '/profile',
    icon: UserRound,
    title: t('Hồ sơ của tôi'),
    detail: t('Cập nhật thông tin liên hệ và mật khẩu.'),
  };
  const license: Shortcut = {
    to: '/license',
    icon: ShieldCheck,
    title: t('Quyền sử dụng'),
    detail: t('Xem trạng thái license của tài khoản.'),
  };
  if (actor.role === 'Admin')
    return [
      {
        to: '/admin/revenue',
        icon: BarChart3,
        title: t('Báo cáo doanh thu'),
        detail: t('Doanh thu PayOS theo kênh, gói và trung tâm.'),
      },
      {
        to: '/admin/delivery',
        icon: Send,
        title: t('Theo dõi thông báo'),
        detail: t('Trạng thái gửi và thông báo lỗi.'),
      },
      {
        to: '/admin/metrics',
        icon: Activity,
        title: t('Hiệu năng AI'),
        detail: t('Số liệu nhận diện và đọc chữ theo mô hình.'),
      },
      profile,
    ];
  if (actor.role === 'CenterAdmin')
    return [
      {
        to: '/center-admin/users',
        icon: Users,
        title: t('Người dùng VIU'),
        detail: t('Tài khoản người khiếm thị của trung tâm.'),
      },
      {
        to: '/center-admin/licenses',
        icon: Package,
        title: t('Kho license'),
        detail: t('Cấp, thu hồi và gia hạn license.'),
      },
      {
        to: '/center-admin/map',
        icon: MapPin,
        title: t('Bản đồ toàn trung tâm'),
        detail: t('Vị trí người khiếm thị được phép theo dõi.'),
      },
      profile,
    ];
  return [
    {
      to: '/caregiver/users',
      icon: Users,
      title: t('Người được chăm sóc'),
      detail: t('Hồ sơ và liên kết chăm sóc.'),
    },
    {
      to: '/caregiver/map',
      icon: MapPin,
      title: t('Bản đồ theo dõi'),
      detail: t('Vị trí ghi nhận gần nhất.'),
    },
    actor.orgId
      ? {
          to: '/caregiver/alerts',
          icon: Bell,
          title: t('Cảnh báo khẩn cấp'),
          detail: t('Tiếp nhận và xử lý cảnh báo.'),
        }
      : license,
    profile,
  ];
}

function Shortcuts({ actor }: { actor: Person }) {
  return (
    <section className="glass card stack overview-wide" aria-labelledby="overview-shortcuts">
      <h2 id="overview-shortcuts">{t('Lối tắt')}</h2>
      <div className="shortcut-grid">
        {shortcuts(actor).map(({ to, icon: Icon, title, detail }) => (
          <Link key={to} className="quick-link" to={to}>
            <span className="row between">
              <Icon size={20} aria-hidden="true" />
              <ArrowRight size={16} aria-hidden="true" />
            </span>
            <strong>{title}</strong>
            <span className="muted">{detail}</span>
          </Link>
        ))}
      </div>
    </section>
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
        <RefreshCw size={16} aria-hidden="true" />
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
        <RefreshCw size={16} aria-hidden="true" />
        {t('Tải lại kho license')}
      </button>
      <Link to="/center-admin/licenses">{t('Quản lý kho license')}</Link>
    </section>
  );
}

// One reload for the three counts (Sent, Acknowledged, Escalated); each count still has its own query.
function ReloadAlertCounts({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const queryKey = ['api-alerts', actor.id, actor.orgId, 'dashboard-count'];
  const fetching = useIsFetching({ queryKey }) > 0;
  return (
    <button
      className="btn small"
      disabled={fetching}
      onClick={() => void cache.refetchQueries({ queryKey })}
    >
      <RefreshCw size={16} aria-hidden="true" />
      {t('Tải lại cảnh báo')}
    </button>
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
      <h3>{alertLabels[status]}</h3>
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
        <RefreshCw size={16} aria-hidden="true" />
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
    <section className="glass card stack overview-wide" aria-label={t('Gửi cảnh báo trong 24 giờ')}>
      <h2>{t('Gửi cảnh báo trong 24 giờ')}</h2>
      <State loading={query.isPending} error={query.error}>
        {query.data && (
          <dl className="overview-stats">
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
      <div className="row">
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw size={16} aria-hidden="true" />
          {t('Tải lại thống kê')}
        </button>
        <Link className="btn" to="/admin/delivery">
          {t('Xem chi tiết')}
        </Link>
      </div>
    </section>
  );
}

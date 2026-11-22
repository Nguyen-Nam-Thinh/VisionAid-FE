import { t, formatNumber, formatMoney, formatLocaleDateTime } from '../../i18n';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Inbox,
  MapPin,
  Package,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, State } from '../../components/UI';
import { useNow } from '../../hooks/useNow';
import { useLicenseWarning } from '../../hooks/useLicenseWarning';
import {
  getMySubscription,
  getOrganizationPool,
  isPersonalCaregiver,
  isOrganizationBuyer,
  licenseSummary,
  subscriptionLabels,
} from '../../services/api/licenses';
import { emergenciesApi } from '../../services/api/emergencies';
import { caregivingApi } from '../../services/api/caregiving';
import { locationsApi } from '../../services/api/locations';
import { inboxApi, inboxTypeLabels, notificationCopy } from '../../services/api/inbox';
import { monitoringApi, auditActionLabels, type AuditAction } from '../../services/api/monitoring';
import { revenueApi } from '../../services/api/revenue';
import { paymentsApi, canPay, paymentHistoryPath } from '../../services/api/payments';
import { organizationsApi } from '../../services/api/organizations';
import { ServiceError } from '../../services/contracts';
import type { Person } from '../../models/domain';

const refresh = { retry: false, refetchInterval: 60000 } as const;
const FRESH_MS = 2 * 60000;
const ROSTER_SIZE = 6;
// Recent notices and audit entries: the latest three keep the panel level with its neighbour.
const RECENT_SIZE = 3;
const dateOnly: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
};
// Vietnam calendar day as yyyy-MM-dd, `offset` days from today.
const vnDay = (offset = 0) =>
  new Date(Date.now() + 7 * 3600000 + offset * 86400000).toISOString().slice(0, 10);

export function DashboardOverview({ actor }: { actor: Person }) {
  if (actor.role === 'Admin') return <AdminOverview actor={actor} />;
  if (actor.role === 'CenterAdmin')
    return actor.orgId ? (
      <CenterOverview actor={actor} />
    ) : (
      <p className="notice error" role="alert">
        {t('Tài khoản chưa có tổ chức. Liên hệ quản trị viên để kiểm tra phân công.')}
      </p>
    );
  return <CaregiverOverview actor={actor} />;
}

/* ── Shared pieces ─────────────────────────────────────────────────────────────────────── */

type Tone = 'calm' | 'busy' | 'urgent';
/** The page opener: one plain sentence that answers "is everyone all right?" for this role. */
function StatusBoard({
  tone,
  title,
  detail,
  action,
  loading,
}: {
  tone: Tone;
  title: string;
  detail: string;
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <section className={'status-board ' + tone} aria-live="polite" aria-busy={loading || undefined}>
      <div className="status-board-text">
        <span className="status-board-signal" aria-hidden="true" />
        <h2 className="status-board-title">{title}</h2>
        <p>{detail}</p>
      </div>
      {action && <div className="status-board-action">{action}</div>}
    </section>
  );
}

function Figures({ items }: { items: { label: string; value: ReactNode; note?: string }[] }) {
  return (
    <dl className="figure-row">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.note && <small>{item.note}</small>}
        </div>
      ))}
    </dl>
  );
}

function Meter({ value, total, label }: { value: number; total: number; label: string }) {
  const share = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div
      className="meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <span style={{ width: share + '%' }} />
    </div>
  );
}

function RecentNotices({ actor }: { actor: Person }) {
  const query = useQuery({
    ...refresh,
    queryKey: ['api-inbox-latest', actor.id, actor.orgId, 'dashboard'],
    queryFn: ({ signal }) => inboxApi.list({ page: 1 }, signal),
  });
  const items = query.data?.items.slice(0, RECENT_SIZE) ?? [];
  return (
    <section className="glass card stack overview-panel" aria-labelledby="overview-recent">
      <div className="row between">
        <h2 id="overview-recent">{t('Gần đây')}</h2>
        <Link to="/inbox">{t('Mở hộp thư')}</Link>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {items.length ? (
          <ul className="feed">
            {items.map((item) => {
              const copy = notificationCopy(item);
              return (
                <li key={item.id} className={item.readAt ? '' : 'unread'}>
                  <strong>
                    {inboxTypeLabels[item.notificationType] ?? copy.title ?? item.notificationType}
                  </strong>
                  {copy.body && <p>{copy.body}</p>}
                  <time dateTime={item.createdAt}>{formatLocaleDateTime(item.createdAt)}</time>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">
            <Inbox size={28} aria-hidden="true" />
            {t('Chưa có thông báo nào. Cảnh báo và tin nhắn hệ thống sẽ hiện ở đây.')}
          </p>
        )}
      </State>
    </section>
  );
}

type Shortcut = { to: string; icon: LucideIcon; title: string; detail: string };
function Shortcuts({ items }: { items: Shortcut[] }) {
  return (
    <nav className="glass card stack overview-panel" aria-labelledby="overview-shortcuts">
      <h2 id="overview-shortcuts">{t('Đi nhanh tới')}</h2>
      <ul className="shortcut-list">
        {items.map(({ to, icon: Icon, title, detail }) => (
          <li key={to}>
            <Link to={to}>
              <Icon size={20} aria-hidden="true" />
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
const profileShortcut = (): Shortcut => ({
  to: '/profile',
  icon: UserRound,
  title: t('Hồ sơ của tôi'),
  detail: t('Thông tin liên hệ, mật khẩu và thông báo trình duyệt.'),
});

/* ── Caregiver ─────────────────────────────────────────────────────────────────────────── */

function useAlertTotal(actor: Person, status: 'Sent' | 'Acknowledged' | 'Escalated') {
  return useQuery({
    ...refresh,
    refetchInterval: 30000,
    // 'api-alerts' + actor scope: SignalR alert events refresh these counts.
    queryKey: ['api-alerts', actor.id, actor.orgId, 'dashboard-count', status],
    queryFn: ({ signal }) =>
      emergenciesApi.list(actor, { viuId: '', status, dateFrom: '', dateTo: '', page: 1 }, signal),
  });
}

function CaregiverOverview({ actor }: { actor: Person }) {
  const sent = useAlertTotal(actor, 'Sent');
  const acknowledged = useAlertTotal(actor, 'Acknowledged');
  const escalated = useAlertTotal(actor, 'Escalated');
  const waiting = sent.data?.totalCount ?? 0;
  const handling = (acknowledged.data?.totalCount ?? 0) + (escalated.data?.totalCount ?? 0);
  const loading = sent.isPending || acknowledged.isPending || escalated.isPending;
  const failed = sent.error || acknowledged.error || escalated.error;
  const alertViuIds = new Set(
    [sent, acknowledged, escalated].flatMap(
      (q) => q.data?.items.map((item) => item.visuallyImpairedUserId) ?? [],
    ),
  );
  return (
    <div className="overview">
      <StatusBoard
        loading={loading}
        tone={waiting ? 'urgent' : handling ? 'busy' : 'calm'}
        title={
          loading
            ? t('Đang kiểm tra cảnh báo…')
            : failed
              ? t('Chưa đọc được cảnh báo')
              : waiting
                ? t('{count} cảnh báo đang chờ bạn tiếp nhận', { count: waiting })
                : handling
                  ? t('{count} cảnh báo đang được xử lý', { count: handling })
                  : t('Mọi người đều ổn')
        }
        detail={
          failed
            ? t('Hãy mở trung tâm cảnh báo để kiểm tra trực tiếp.')
            : waiting
              ? t(
                  'Mở cảnh báo để xem vị trí và tiếp nhận. Sau 5 phút chưa ai tiếp nhận, hãy cân nhắc gọi 115.',
                )
              : handling
                ? t('Đã có người tiếp nhận. Theo dõi đến khi cảnh báo được xử lý xong.')
                : t('Không có cảnh báo nào đang mở trong phạm vi bạn chăm sóc.')
        }
        action={
          <Link className={waiting ? 'btn primary' : 'btn'} to="/caregiver/alerts">
            <Bell size={18} aria-hidden="true" />
            {waiting ? t('Tiếp nhận cảnh báo') : t('Mở trung tâm cảnh báo')}
          </Link>
        }
      />
      <div className="overview-columns">
        <CareRoster actor={actor} alertViuIds={alertViuIds} />
        <RecentNotices actor={actor} />
      </div>
      <div className="overview-columns">
        {isPersonalCaregiver(actor) ? (
          <PlanPanel actor={actor} />
        ) : (
          <section className="glass card stack overview-panel">
            <h2>{t('Phạm vi chăm sóc')}</h2>
            <p>{licenseSummary(actor)}</p>
            <Link className="btn" to="/caregiver/users">
              {t('Người được phân công')}
            </Link>
          </section>
        )}
        {canPay(actor) && <PendingPayments actor={actor} />}
      </div>
      <div className="overview-columns">
        <Shortcuts
          items={[
            {
              to: '/caregiver/map',
              icon: MapPin,
              title: t('Bản đồ theo dõi'),
              detail: t('Vị trí ghi nhận gần nhất của từng người.'),
            },
            {
              to: '/caregiver/activity',
              icon: Activity,
              title: t('Nhật ký hoạt động'),
              detail: t('Vật cản, dẫn đường, đọc chữ và nhận diện.'),
            },
            {
              to: '/caregiver/contacts',
              icon: Users,
              title: t('Liên hệ khẩn cấp'),
              detail: t('Người được gọi khi cần giúp đỡ.'),
            },
            profileShortcut(),
          ]}
        />
      </div>
    </div>
  );
}

/** Each care recipient with where and when the phone last reported. */
function CareRoster({ actor, alertViuIds }: { actor: Person; alertViuIds: Set<string> }) {
  const now = useNow();
  const users = useQuery({
    ...refresh,
    queryKey: ['api-tracking-users', actor.id, actor.orgId, 'dashboard'],
    queryFn: ({ signal }) => caregivingApi.users(1, '', signal),
  });
  const people = (users.data?.items ?? []).filter((p) => p.isActive).slice(0, ROSTER_SIZE);
  const places = useQueries({
    queries: people.map((person) => ({
      ...refresh,
      queryKey: ['api-location-live', actor.id, actor.orgId, person.id, 'dashboard'],
      queryFn: ({ signal }: { signal: AbortSignal }) => locationsApi.live(actor, person.id, signal),
    })),
  });
  return (
    <section className="glass card stack overview-panel" aria-labelledby="overview-roster">
      <div className="row between">
        <h2 id="overview-roster">{t('Người thân của bạn')}</h2>
        <Link to="/caregiver/users">{t('Xem tất cả')}</Link>
      </div>
      <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
        {people.length ? (
          <ul className="roster">
            {people.map((person, index) => {
              const place = places[index];
              const at = place?.data?.cachedAt;
              const fresh = at ? now - Date.parse(at) < FRESH_MS : false;
              const alert = alertViuIds.has(person.id);
              return (
                <li key={person.id} className={alert ? 'roster-row alert' : 'roster-row'}>
                  <span className="roster-initial" aria-hidden="true">
                    {person.fullName.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase()}
                  </span>
                  <span className="roster-main">
                    <strong>{person.fullName}</strong>
                    <small>
                      {place?.isPending
                        ? t('Đang tìm vị trí…')
                        : place?.data
                          ? place.data.formattedAddress || t('Chưa có địa chỉ')
                          : t('Chưa có vị trí từ điện thoại')}
                    </small>
                  </span>
                  <span className="roster-state">
                    {alert ? (
                      <Badge tone="red">{t('Có cảnh báo')}</Badge>
                    ) : at ? (
                      <Badge tone={fresh ? 'green' : 'amber'}>
                        {fresh ? t('Vừa cập nhật') : formatLocaleDateTime(at)}
                      </Badge>
                    ) : null}
                  </span>
                  <Link
                    className="btn small"
                    to={alert ? '/caregiver/alerts' : '/caregiver/map'}
                    aria-label={t('Xem {name}', { name: person.fullName })}
                  >
                    {alert ? t('Xem cảnh báo') : t('Bản đồ')}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">
            <Users size={28} aria-hidden="true" />
            {t('Chưa có người được chăm sóc. Thêm tài khoản hoặc nhận lời mời ở trang người dùng.')}
          </p>
        )}
        {(users.data?.totalCount ?? 0) > people.length && (
          <small className="muted">
            {t('Đang hiện {shown} trên {total} người.', {
              shown: people.length,
              total: users.data?.totalCount ?? 0,
            })}
          </small>
        )}
      </State>
    </section>
  );
}

function PlanPanel({ actor }: { actor: Person }) {
  const warning = useLicenseWarning();
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-subscription', actor.id, actor.orgId],
    queryFn: ({ signal }) => getMySubscription(actor, signal),
  });
  const plan = query.data;
  const end = plan ? (plan.status === 'Trial' ? plan.trialEndsAt : plan.currentPeriodEnd) : null;
  const total = plan?.status === 'Trial' ? 7 : 30;
  return (
    <section className="glass card stack overview-panel" aria-labelledby="overview-plan">
      <div className="row between">
        <h2 id="overview-plan">{t('Gói của bạn')}</h2>
        <Link to="/license">{t('Gia hạn hoặc đổi gói')}</Link>
      </div>
      {query.error instanceof ServiceError && query.error.status === 404 ? (
        <p>{t('Bạn chưa có gói dịch vụ. Chọn gói để dùng đầy đủ chức năng.')}</p>
      ) : (
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {plan && (
            <div className="plan-summary">
              <p className="plan-name">
                <strong>{plan.package.name}</strong>
                <Badge tone={['Active', 'Trial'].includes(plan.status) ? 'green' : 'amber'}>
                  {subscriptionLabels[plan.status]}
                </Badge>
              </p>
              {plan.daysRemaining !== null && (
                <>
                  <p className="plan-days">
                    {t('Còn {days} ngày', { days: formatNumber(plan.daysRemaining) })}
                  </p>
                  <Meter
                    value={Math.max(0, plan.daysRemaining)}
                    total={Math.max(total, plan.daysRemaining)}
                    label={t('Số ngày còn lại')}
                  />
                </>
              )}
              <small className="muted">
                {end
                  ? t('Hết hạn lúc {time}.', { time: formatLocaleDateTime(end) })
                  : licenseSummary(actor, undefined, warning)}
              </small>
            </div>
          )}
        </State>
      )}
    </section>
  );
}

function PendingPayments({ actor }: { actor: Person }) {
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-payments', actor.id, actor.orgId],
    // The API has no status filter yet: only the ten latest payments are checked.
    queryFn: ({ signal }) => paymentsApi.list(actor, 1, signal),
  });
  const pending = query.data?.items.filter((item) => item.status === 'Pending') ?? [];
  return (
    <section className="glass card stack overview-panel" aria-label={t('Thanh toán gần đây')}>
      <div className="row between">
        <h2>{t('Thanh toán gần đây')}</h2>
        <Link to={paymentHistoryPath(actor)}>{t('Mở lịch sử thanh toán')}</Link>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {pending.length ? (
          <ul className="feed">
            {pending.map((item) => (
              <li key={item.id} className="unread">
                <strong>{formatMoney(item.amount, item.currency, 0)}</strong>
                <p>{t('Đang chờ thanh toán')}</p>
                <time dateTime={item.createdAt}>{formatLocaleDateTime(item.createdAt)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t('Không có giao dịch đang chờ trong 10 giao dịch gần nhất.')}</p>
        )}
      </State>
    </section>
  );
}

/* ── Center Admin ──────────────────────────────────────────────────────────────────────── */

function CenterOverview({ actor }: { actor: Person }) {
  const now = useNow();
  const fleet = useQuery({
    ...refresh,
    refetchInterval: 30000,
    queryKey: ['api-location-fleet', actor.id, actor.orgId, 'dashboard'],
    queryFn: ({ signal }) => locationsApi.fleet(actor, signal),
  });
  const members = fleet.data ?? [];
  const withAlert = members.filter((m) => m.hasOpenAlert);
  const fresh = members.filter((m) => m.cachedAt && now - Date.parse(m.cachedAt) < FRESH_MS);
  return (
    <div className="overview">
      <StatusBoard
        loading={fleet.isPending}
        tone={withAlert.length ? 'urgent' : 'calm'}
        title={
          fleet.isPending
            ? t('Đang kiểm tra trung tâm…')
            : fleet.error
              ? t('Chưa đọc được tình hình trung tâm')
              : withAlert.length
                ? t('{count} người đang có cảnh báo', { count: withAlert.length })
                : t('Trung tâm đang yên ổn')
        }
        detail={
          fleet.error
            ? t('Mở bản đồ toàn trung tâm để kiểm tra trực tiếp.')
            : withAlert.length
              ? withAlert
                  .slice(0, 3)
                  .map((m) => m.fullName)
                  .join(', ') + (withAlert.length > 3 ? '…' : '')
              : t('Không ai trong trung tâm đang có cảnh báo mở.')
        }
        action={
          withAlert.length ? (
            <Link className="btn primary" to="/center-admin/alerts">
              <Bell size={18} aria-hidden="true" />
              {t('Xử lý cảnh báo')}
            </Link>
          ) : (
            <Link className="btn" to="/center-admin/map">
              <MapPin size={18} aria-hidden="true" />
              {t('Mở bản đồ toàn trung tâm')}
            </Link>
          )
        }
      />
      <PoolFigures actor={actor} members={members.length} fresh={fresh.length} />
      <div className="overview-columns">
        <FleetList members={members} now={now} loading={fleet.isPending} error={fleet.error} />
        <MonthSummary actor={actor} />
      </div>
      <div className="overview-columns">
        <RecentNotices actor={actor} />
        {canPay(actor) && <PendingPayments actor={actor} />}
      </div>
      <div className="overview-columns">
        <Shortcuts
          items={[
            {
              to: '/center-admin/users',
              icon: Users,
              title: t('Người khiếm thị'),
              detail: t('Tài khoản và phân công chăm sóc.'),
            },
            {
              to: '/center-admin/licenses',
              icon: Package,
              title: t('Kho suất sử dụng'),
              detail: t('Cấp, thu hồi và mua thêm suất.'),
            },
            {
              to: '/center-admin/reports',
              icon: BarChart3,
              title: t('Báo cáo trung tâm'),
              detail: t('Cảnh báo và hoạt động theo khoảng ngày.'),
            },
            profileShortcut(),
          ]}
        />
      </div>
    </div>
  );
}

function PoolFigures({ actor, members, fresh }: { actor: Person; members: number; fresh: number }) {
  const pool = useQuery({
    ...refresh,
    queryKey: ['dashboard-pool', actor.id, actor.orgId],
    queryFn: ({ signal }) => getOrganizationPool(actor, signal),
    enabled: isOrganizationBuyer(actor),
  });
  const data = pool.data;
  return (
    <section className="glass card overview-figures" aria-label={t('Kho suất sử dụng của tổ chức')}>
      <Figures
        items={[
          { label: t('Người khiếm thị'), value: formatNumber(members) },
          {
            label: t('Vị trí trong 2 phút qua'),
            value: formatNumber(fresh),
            note: members ? t('trên {total} người', { total: members }) : undefined,
          },
          {
            label: t('Suất còn trống'),
            value: data ? formatNumber(data.availableLicenses) : '—',
            note: data ? t('trên {total} suất', { total: data.totalLicenses }) : undefined,
          },
          {
            label: t('Kho hết hạn'),
            value: data?.expiresAt ? formatLocaleDateTime(data.expiresAt, dateOnly) : '—',
            note: data ? subscriptionLabels[data.status] : undefined,
          },
        ]}
      />
      {data && (
        <p className="meter-caption">
          {t('Đã cấp {used} trên {total} suất', {
            used: data.usedLicenses,
            total: data.totalLicenses,
          })}
        </p>
      )}
      {data && (
        <Meter
          value={data.usedLicenses}
          total={data.totalLicenses}
          label={t('Suất đã cấp {used} trên {total}', {
            used: data.usedLicenses,
            total: data.totalLicenses,
          })}
        />
      )}
    </section>
  );
}

function FleetList({
  members,
  now,
  loading,
  error,
}: {
  members: {
    viuId: string;
    fullName: string;
    cachedAt: string | null;
    formattedAddress: string | null;
    hasOpenAlert: boolean;
  }[];
  now: number;
  loading: boolean;
  error: Error | null;
}) {
  // People with an open alert first, then the oldest positions: what needs a look comes first.
  const sorted = [...members].sort(
    (a, b) =>
      Number(b.hasOpenAlert) - Number(a.hasOpenAlert) ||
      (a.cachedAt ? Date.parse(a.cachedAt) : 0) - (b.cachedAt ? Date.parse(b.cachedAt) : 0),
  );
  return (
    <section className="glass card stack overview-panel" aria-labelledby="overview-fleet">
      <div className="row between">
        <h2 id="overview-fleet">{t('Cần để mắt tới')}</h2>
        <Link to="/center-admin/map">{t('Xem trên bản đồ')}</Link>
      </div>
      <State loading={loading} error={error}>
        {sorted.length ? (
          <ul className="roster">
            {sorted.slice(0, ROSTER_SIZE).map((m) => {
              const fresh = m.cachedAt ? now - Date.parse(m.cachedAt) < FRESH_MS : false;
              return (
                <li key={m.viuId} className={m.hasOpenAlert ? 'roster-row alert' : 'roster-row'}>
                  <span className="roster-initial" aria-hidden="true">
                    {m.fullName.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase()}
                  </span>
                  <span className="roster-main">
                    <strong>{m.fullName}</strong>
                    <small>{m.formattedAddress || t('Chưa có vị trí từ điện thoại')}</small>
                  </span>
                  <span className="roster-state">
                    {m.hasOpenAlert ? (
                      <Badge tone="red">{t('Có cảnh báo')}</Badge>
                    ) : m.cachedAt ? (
                      <Badge tone={fresh ? 'green' : 'amber'}>
                        {fresh ? t('Vừa cập nhật') : formatLocaleDateTime(m.cachedAt)}
                      </Badge>
                    ) : (
                      <Badge tone="amber">{t('Chưa có vị trí')}</Badge>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">
            <Users size={28} aria-hidden="true" />
            {t('Trung tâm chưa có người khiếm thị đang hoạt động.')}
          </p>
        )}
      </State>
    </section>
  );
}

function MonthSummary({ actor }: { actor: Person }) {
  const from = vnDay(-29);
  const to = vnDay();
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-org-summary', actor.id, actor.orgId, from, to],
    queryFn: ({ signal }) => organizationsApi.summary(actor, actor.orgId!, from, to, signal),
  });
  const data = query.data;
  const rows = data
    ? [
        { label: t('Cảnh báo khẩn cấp'), value: data.emergencyEventCount },
        { label: t('Ra khỏi vùng an toàn'), value: data.geofenceBreachCount },
        { label: t('Lần đọc chữ'), value: data.ocrRequestCount },
        { label: t('Lần nhận diện gương mặt'), value: data.faceRecognitionCount },
      ]
    : [];
  const top = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="glass card stack overview-panel" aria-labelledby="overview-month">
      <div className="row between">
        <h2 id="overview-month">{t('30 ngày qua')}</h2>
        <Link to="/center-admin/reports">{t('Xem báo cáo')}</Link>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <ul className="bar-list">
          {rows.map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <span className="bar-track" aria-hidden="true">
                <span style={{ width: Math.round((row.value / top) * 100) + '%' }} />
              </span>
              <strong>{formatNumber(row.value)}</strong>
            </li>
          ))}
        </ul>
      </State>
    </section>
  );
}

/* ── Admin ─────────────────────────────────────────────────────────────────────────────── */

function AdminOverview({ actor }: { actor: Person }) {
  const delivery = useQuery({
    ...refresh,
    queryKey: ['api-delivery-status', actor.id],
    queryFn: ({ signal }) => monitoringApi.status(actor, signal),
  });
  const day = delivery.data?.last24Hours;
  return (
    <div className="overview">
      <StatusBoard
        loading={delivery.isPending}
        tone={day?.totalFailed ? 'urgent' : day?.totalPending ? 'busy' : 'calm'}
        title={
          delivery.isPending
            ? t('Đang kiểm tra hệ thống…')
            : delivery.error
              ? t('Chưa đọc được tình trạng gửi thông báo')
              : day?.totalFailed
                ? t('{count} thông báo gửi lỗi trong 24 giờ qua', { count: day.totalFailed })
                : day?.totalPending
                  ? t('{count} thông báo đang chờ gửi', { count: day.totalPending })
                  : t('Thông báo đang được gửi bình thường')
        }
        detail={
          day
            ? t('Đã gửi {sent} thông báo trong 24 giờ qua.', { sent: formatNumber(day.totalSent) })
            : t('Mở trang theo dõi thông báo để kiểm tra trực tiếp.')
        }
        action={
          <Link className={day?.totalFailed ? 'btn primary' : 'btn'} to="/admin/delivery">
            <Send size={18} aria-hidden="true" />
            {day?.totalFailed ? t('Xem thông báo lỗi') : t('Theo dõi thông báo')}
          </Link>
        }
      />
      <RevenueMonth actor={actor} />
      <div className="overview-columns">
        <DeliveryWeek
          sent={delivery.data?.last7Days.totalSent}
          failed={delivery.data?.last7Days.totalFailed}
          pending={delivery.data?.last7Days.totalPending}
        />
        <RecentAudit actor={actor} />
      </div>
      <Shortcuts
        items={[
          {
            to: '/admin/organizations',
            icon: Building2,
            title: t('Tổ chức và trung tâm'),
            detail: t('Thêm trung tâm, kho suất và quản trị viên.'),
          },
          {
            to: '/admin/accounts',
            icon: Users,
            title: t('Quản lý tài khoản'),
            detail: t('Khóa, mở khóa và đặt lại mật khẩu.'),
          },
          {
            to: '/admin/packages',
            icon: Package,
            title: t('Gói dịch vụ'),
            detail: t('Giá, thời hạn và tính năng của từng gói.'),
          },
          {
            to: '/admin/metrics',
            icon: ShieldCheck,
            title: t('Hiệu năng AI'),
            detail: t('Kết quả nhận diện và đọc chữ theo ngày.'),
          },
        ]}
      />
    </div>
  );
}

function RevenueMonth({ actor }: { actor: Person }) {
  const from = vnDay().slice(0, 8) + '01';
  const to = vnDay();
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-revenue', actor.id, from, to],
    queryFn: ({ signal }) =>
      revenueApi.report(actor, { dateFrom: from, dateTo: to, groupBy: 'Day' }, signal),
  });
  const data = query.data;
  const top = Math.max(1, ...(data?.timeline.map((d) => d.revenue) ?? [0]));
  return (
    <section className="glass card stack overview-revenue" aria-labelledby="overview-revenue">
      <div className="row between">
        <h2 id="overview-revenue">{t('Doanh thu tháng này')}</h2>
        <Link to="/admin/revenue">{t('Xem báo cáo doanh thu')}</Link>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {data && (
          <>
            <Figures
              items={[
                {
                  label: t('Doanh thu thực nhận'),
                  value: (
                    <>
                      {formatNumber(data.summary.netRevenue)}
                      <small className="figure-unit"> {data.currency}</small>
                    </>
                  ),
                },
                {
                  label: t('Giao dịch thành công'),
                  value: formatNumber(data.summary.paidTransactions),
                  note: data.summary.pendingTransactions
                    ? t('{count} đang chờ', { count: data.summary.pendingTransactions })
                    : undefined,
                },
                {
                  label: t('Gia đình trả phí'),
                  value: formatNumber(data.summary.payingCaregivers),
                },
                {
                  label: t('Trung tâm trả phí'),
                  value: formatNumber(data.summary.payingOrganizations),
                },
              ]}
            />
            {data.timeline.length > 1 && (
              <div
                className="day-bars"
                role="img"
                aria-label={t('Doanh thu theo ngày từ {from} đến {to}', { from, to })}
              >
                {data.timeline.map((d) => (
                  <span
                    key={d.periodStart}
                    title={d.periodStart + ' · ' + formatMoney(d.revenue, data.currency, 0)}
                    style={{ height: Math.max(4, Math.round((d.revenue / top) * 100)) + '%' }}
                    className={d.revenue ? '' : 'zero'}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </State>
    </section>
  );
}

function DeliveryWeek({
  sent = 0,
  failed = 0,
  pending = 0,
}: {
  sent?: number;
  failed?: number;
  pending?: number;
}) {
  const total = sent + failed + pending;
  const part = (n: number) => (total ? (n / total) * 100 : 0) + '%';
  return (
    <section className="glass card stack overview-panel" aria-labelledby="overview-week">
      <h2 id="overview-week">{t('Gửi thông báo trong 7 ngày')}</h2>
      <div className="stacked-bar" aria-hidden="true">
        <span className="ok" style={{ width: part(sent) }} />
        <span className="wait" style={{ width: part(pending) }} />
        <span className="bad" style={{ width: part(failed) }} />
      </div>
      <ul className="legend">
        <li>
          <span className="ok" aria-hidden="true" />
          {t('Đã gửi')} <strong>{formatNumber(sent)}</strong>
        </li>
        <li>
          <span className="wait" aria-hidden="true" />
          {t('Đang chờ gửi')} <strong>{formatNumber(pending)}</strong>
        </li>
        <li>
          <span className="bad" aria-hidden="true" />
          {t('Gửi lỗi')} <strong>{formatNumber(failed)}</strong>
        </li>
      </ul>
    </section>
  );
}

function RecentAudit({ actor }: { actor: Person }) {
  const query = useQuery({
    ...refresh,
    queryKey: ['dashboard-audit', actor.id],
    queryFn: ({ signal }) => monitoringApi.list(actor, 'audit', 1, {}, signal),
  });
  const items = query.data?.items.slice(0, RECENT_SIZE) ?? [];
  return (
    <section className="glass card stack overview-panel" aria-labelledby="overview-audit">
      <div className="row between">
        <h2 id="overview-audit">{t('Thao tác gần đây')}</h2>
        <Link to="/admin/audit">{t('Mở nhật ký thao tác')}</Link>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {items.length ? (
          <ul className="feed">
            {items.map((item) => (
              <li key={item.id}>
                <strong>
                  {auditActionLabels[item.actionType as AuditAction] ?? String(item.actionType)}
                </strong>
                <p>{item.actorName ? String(item.actorName) : t('Hệ thống')}</p>
                <time dateTime={String(item.performedAt)}>
                  {formatLocaleDateTime(String(item.performedAt))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">{t('Chưa có thao tác nào được ghi lại.')}</p>
        )}
      </State>
    </section>
  );
}

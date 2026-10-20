import { t, intlLocale } from '../../i18n';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Users,
  BellRing,
  HeartHandshake,
  ShieldCheck,
  Activity,
  Building2,
  Cpu,
  Send,
  MapPin,
} from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useNow } from '../../hooks/useNow';
import { PageHead, State, Badge } from '../../components/UI';
import { MapPanel } from '../../components/MapPanel';
import { formatTime, statuses } from '../../constants/labels';
export function Dashboard() {
  const { query, db, user, setSelected } = useWorkspace();
  const now = useNow();
  const admin = user.role === 'Admin';
  const center = user.role === 'CenterAdmin';
  const base = admin ? '/admin' : center ? '/center-admin' : '/caregiver';
  const vius = db?.people.filter((p) => p.role === 'VisuallyImpaired' && p.active) ?? [];
  const activeAlerts =
    db?.alerts.filter((a) => ['SENT', 'ACKNOWLEDGED', 'ESCALATED'].includes(a.status)) ?? [];
  const cards = admin
    ? [
        {
          label: t('Tổ chức đang hoạt động'),
          value: db?.entities.organizations.filter((o) => o.active).length ?? 0,
          icon: Building2,
          path: 'organizations',
          foot: t('Mạng lưới hỗ trợ'),
        },
        {
          label: t('Tài khoản hoạt động'),
          value: db?.people.filter((p) => p.active).length ?? 0,
          icon: Users,
          path: 'accounts',
          foot: t('Trên toàn nền tảng'),
        },
        {
          label: t('Mô hình AI'),
          value: new Set(db?.metrics.map((m) => m.model)).size,
          icon: Cpu,
          path: 'metrics',
          foot: t('Chỉ số tổng hợp'),
        },
        {
          label: t('Delivery thất bại'),
          value: db?.deliveries.filter((d) => d.status === 'FAILED').length ?? 0,
          icon: Send,
          path: 'delivery',
          foot: t('Cần kiểm tra · mô phỏng'),
        },
      ]
    : [
        {
          label: t('Người được chăm sóc'),
          value: vius.length,
          icon: Users,
          path: 'users',
          foot: center ? t('Trong tổ chức của bạn') : t('Đang được liên kết'),
        },
        {
          label: t('Cảnh báo đang mở'),
          value: activeAlerts.length,
          icon: BellRing,
          path: center ? 'reports' : 'alerts',
          foot: t('Ưu tiên phản hồi kịp thời'),
        },
        {
          label: center ? t('Nhân viên chăm sóc') : t('Người cùng đồng hành'),
          value: center
            ? (db?.people.filter((p) => p.role === 'Caregiver' && p.active).length ?? 0)
            : new Set(db?.links.map((l) => l.caregiverId)).size,
          icon: HeartHandshake,
          path: center ? 'staff' : 'caregivers',
          foot: center ? t('Trong trung tâm') : t('Chia sẻ trách nhiệm chăm sóc'),
        },
        {
          label: t('Vị trí cập nhật gần đây'),
          value: db?.locations.filter((l) => now - new Date(l.at).getTime() < 120000).length ?? 0,
          icon: MapPin,
          path: 'map',
          foot: t('Dữ liệu trong 2 phút gần nhất'),
        },
      ];
  return (
    <>
      <PageHead
        title={t('Xin chào, {p0}.', { p0: user.name.split(' ').at(-1) })}
        description={
          admin
            ? t('Một góc nhìn rõ ràng về toàn bộ nền tảng.')
            : center
              ? t('Cùng đội ngũ tạo nên một ngày an toàn hơn.')
              : t('Mọi kết nối đều bắt đầu từ sự quan tâm.')
        }
        actions={
          <span className="badge">
            {new Intl.DateTimeFormat(intlLocale(), {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              timeZone: 'Asia/Ho_Chi_Minh',
            }).format(now)}
          </span>
        }
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="stack">
          <div className="grid dashboard-stats">
            {cards.map((c) => (
              <Link to={base + '/' + c.path} className="glass card stat-card" key={c.label}>
                <div className="row between">
                  <span className="muted">{c.label}</span>
                  <span className="icon-tile">
                    <c.icon size={19} />
                  </span>
                </div>
                <strong className="stat">{c.value}</strong>
                <span className="muted">
                  {c.foot} <ArrowUpRight size={13} />
                </span>
              </Link>
            ))}
          </div>
          <div className="dashboard-columns">
            <section className="glass card stack">
              <div className="row between">
                <h2>{admin ? t('Tổ chức đồng hành') : t('Vị trí người thân')}</h2>
                <Link to={base + (admin ? '/organizations' : '/map')} className="row">
                  {t('Xem tất cả')} <ArrowUpRight size={16} />
                </Link>
              </div>
              {admin ? (
                <div className="stack">
                  {db?.entities.organizations.map((o) => (
                    <div className="row between dashboard-person" key={o.id}>
                      <div className="row">
                        <span className="avatar">
                          <Building2 size={20} />
                        </span>
                        <div>
                          <strong>{o.name}</strong>
                          <p className="muted">{String(o.fields.address)}</p>
                        </div>
                      </div>
                      <Badge tone={o.active ? 'green' : 'amber'}>
                        {o.active ? t('Hoạt động') : t('Ngừng hoạt động')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <MapPanel
                    locations={db?.locations ?? []}
                    people={db?.people ?? []}
                    onSelect={setSelected}
                  />
                  <div className="row">
                    <Badge tone="green">
                      <ShieldCheck size={13} />
                      {t('Phạm vi được cấp quyền')}
                    </Badge>
                    <small>{t('Sơ đồ mô phỏng · Không dùng để chỉ đường')}</small>
                  </div>
                </>
              )}
              {!admin && (
                <section className="stack dashboard-people">
                  <div className="row between">
                    <h2>{t('Những người đang đồng hành')}</h2>
                    <Link to={base + '/users'}>{t('Quản lý danh sách →')}</Link>
                  </div>
                  <div className="grid">
                    {vius.map((p) => (
                      <Link
                        key={p.id}
                        className="dashboard-person row"
                        to={base + '/map'}
                        onClick={() => setSelected(p.id)}
                      >
                        <span className="avatar">{p.name.split(' ').at(-1)?.slice(0, 1)}</span>
                        <div>
                          <strong>{p.name}</strong>
                          <p className="muted">{p.phone || t('Chưa có số điện thoại')}</p>
                        </div>
                        <ArrowUpRight size={16} />
                      </Link>
                    ))}
                  </div>
                  {!vius.length && (
                    <p className="empty">
                      {t('Chưa có người được chăm sóc. Thêm hoặc phân công ở trang người dùng.')}
                    </p>
                  )}
                </section>
              )}
            </section>
            <section className="glass card stack">
              <div className="row between">
                <h2>{admin ? t('Nhật ký gần đây') : t('Cần bạn quan tâm')}</h2>
                <Activity size={20} color="var(--primary)" />
              </div>
              {admin ? (
                <div className="timeline">
                  {db?.audit.slice(0, 4).map((a) => (
                    <div key={a.id}>
                      <strong>{a.action}</strong>
                      <p className="muted">{a.target}</p>
                      <small>{formatTime(a.at)}</small>
                    </div>
                  ))}
                </div>
              ) : activeAlerts.length ? (
                <div className="stack">
                  {activeAlerts.slice(0, 3).map((a) => (
                    <Link
                      className="alert-preview"
                      to={base + (center ? '/reports' : '/alerts')}
                      key={a.id}
                    >
                      <div className="row between">
                        <Badge tone="red">{a.type === 'FALL' ? t('Té ngã') : 'SOS'}</Badge>
                        <ArrowUpRight size={16} />
                      </div>
                      <h3>{db?.people.find((p) => p.id === a.viuId)?.name}</h3>
                      <p>{statuses[a.status]}</p>
                      <small>{formatTime(a.at)}</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <ShieldCheck size={36} />
                  <p>{t('Chưa có cảnh báo đang mở.')}</p>
                </div>
              )}
              <Link
                className="btn"
                to={base + (admin ? '/audit' : center ? '/reports' : '/alerts')}
              >
                {admin ? t('Mở nhật ký kiểm toán') : t('Xem tất cả cảnh báo')}
                <ArrowUpRight size={16} />
              </Link>
              <div className="notice">
                {admin
                  ? t('Số liệu demo chưa phản ánh sức khỏe máy chủ thật.')
                  : t(
                      'Luôn kiểm tra thời gian ghi nhận. Vị trí cũ không phản ánh vị trí trực tiếp.',
                    )}
              </div>
            </section>
          </div>
        </div>
      </State>
    </>
  );
}

import { t, useI18n } from '../i18n';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { ApiNotifications } from '../pages/shared/ApiNotifications';
import { ApiPackages } from '../pages/shared/ApiPackages';
import { ApiPayments } from '../pages/shared/ApiPayments';
import { ApiLicensePool } from '../pages/shared/ApiLicensePool';
import { paymentResumeTarget } from '../services/api/payments';
import { ApiLicense } from '../pages/shared/ApiLicense';
import { ApiRealtime } from '../components/ApiRealtime';
import { PushSync } from '../components/PushSettings';
import { ApiAlerts } from '../pages/shared/ApiAlerts';
import { ApiTracking } from '../pages/shared/ApiTracking';
import { ApiLinks } from '../pages/shared/ApiLinks';
import { ApiAccounts } from '../pages/shared/ApiAccounts';
import { ApiOrganizations } from '../pages/shared/ApiOrganizations';
import { Landing } from '../pages/public/Landing';
import { ApiSession, ApiPending } from '../pages/shared/ApiSession';
import { ApiLinkedUsers } from '../pages/caregiver/ApiLinkedUsers';
import { ApiPlaces } from '../pages/caregiver/ApiPlaces';
import { ApiRegistry } from '../pages/caregiver/ApiRegistry';
import { ApiTts } from '../pages/caregiver/ApiTts';
import { ApiActivity } from '../pages/caregiver/ApiActivity';
import { ApiReports } from '../pages/center-admin/ApiReports';
import { ApiIceServers } from '../pages/super-admin/ApiIceServers';
import { ApiMonitoring } from '../pages/super-admin/ApiMonitoring';
import { ApiConfigurations } from '../pages/super-admin/ApiConfigurations';
import { ApiContacts } from '../pages/caregiver/ApiContacts';
import { ApiCalls } from '../pages/caregiver/ApiCalls';
import { runtime } from '../configs/runtime';
import { Dashboard } from '../pages/shared/Dashboard';
import { features } from './features';
import { useState, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  Link,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  LogOut,
  Lock,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Package,
  Phone,
  Menu,
  LayoutDashboard,
  UserRound,
  ShieldCheck,
  Users,
  MapPin,
  Bell,
  ScanFace,
  Contact,
  Link2,
  History,
  Volume2,
  Settings,
  Building2,
  Activity,
  Send,
  FileText,
} from 'lucide-react';
import { useAuth, useSession } from '../hooks/useService';
import { Brand, Confirm, State, Toast } from '../components/UI';
import { AuthPage } from '../pages/auth/AuthPage';
import { Profile } from '../pages/shared/Profile';
import { roles } from '../constants/labels';
import { uiStore, useUI } from '../stores/ui';
import { ErrorBoundary } from './ErrorBoundary';
import { StatusPage } from '../pages/shared/StatusPage';
import { LicenseGate } from '../pages/shared/LicenseGate';
import { licensedCaregiverPaths, personalLicenseBlock } from '../services/api/licenses';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
export function Guard({ role }: { role?: string }) {
  const location = useLocation();
  const q = useSession();
  const auth = useAuth();
  if (q.isPending)
    return (
      <div className="empty" role="status">
        {t('Đang kiểm tra phiên…')}
      </div>
    );
  if (q.isError)
    return (
      <div className="main">
        <State error={q.error} retry={() => q.refetch()}>
          <span />
        </State>
        <Link to="/auth/login">{t('Đăng nhập')}</Link>
      </div>
    );
  if (!q.data)
    return (
      <Navigate
        to="/auth/login"
        state={{ returnTo: paymentResumeTarget(location.pathname + location.search) }}
        replace
      />
    );
  if (!['Caregiver', 'CenterAdmin', 'Admin'].includes(q.data.role))
    return (
      <StatusPage
        kind="unsupported"
        standalone
        actions={
          <button className="btn primary" onClick={() => auth.logout()}>
            {t('Đăng xuất')}
          </button>
        }
      />
    );
  if (role && q.data.role !== role) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
export const roleBase = (role: string) =>
  role === 'Caregiver' ? '/caregiver' : role === 'CenterAdmin' ? '/center-admin' : '/admin';
export const menu = Object.fromEntries(
  ['Caregiver', 'CenterAdmin', 'Admin'].map((role) => [
    role,
    features
      .filter((f) => f.role === role)
      .sort(
        (a, b) =>
          [
            'users',
            'staff',
            'assignments',
            'map',
            'alerts',
            'registry',
            'locations',
            'contacts',
            'caregivers',
            'activity',
            'organization',
            'reports',
            'routing',
            'tts',
            'notifications',
            'organizations',
            'accounts',
            'links',
            'metrics',
            'configurations',
            'rules',
            'delivery',
            'audit',
          ].indexOf(a.path) -
          [
            'users',
            'staff',
            'assignments',
            'map',
            'alerts',
            'registry',
            'locations',
            'contacts',
            'caregivers',
            'activity',
            'organization',
            'reports',
            'routing',
            'tts',
            'notifications',
            'organizations',
            'accounts',
            'links',
            'metrics',
            'configurations',
            'rules',
            'delivery',
            'audit',
          ].indexOf(b.path),
      ),
  ]),
);
const navigationIcons = {
  users: Users,
  caregivers: Link2,
  map: MapPin,
  alerts: Bell,
  registry: ScanFace,
  locations: MapPin,
  contacts: Contact,
  activity: History,
  tts: Volume2,
  notifications: Bell,
  organizations: Building2,
  organization: Building2,
  accounts: Users,
  staff: Users,
  assignments: Link2,
  links: Link2,
  metrics: Activity,
  configurations: Settings,
  rules: Settings,
  routing: Settings,
  reports: FileText,
  delivery: Send,
  audit: History,
};
function Shell() {
  const location = useLocation();
  const { data: user } = useSession();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [reset, setReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { notice } = useUI();
  if (!user) return null;
  const block = runtime.mode === 'api' ? personalLicenseBlock(user) : null;
  const locked = (path: string) =>
    !!block && (licensedCaregiverPaths as readonly string[]).includes(path);
  const content = (
    <div className={'shell' + (collapsed ? ' sidebar-collapsed' : '')}>
      <a className="skip" href="#main">
        {t('Đến nội dung chính')}
      </a>
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="btn sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? t('Mở rộng sidebar') : t('Thu gọn sidebar')}
            title={collapsed ? t('Mở rộng sidebar') : t('Thu gọn sidebar')}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        <div>
          <nav className="nav" aria-label={t('Điều hướng chính')}>
            <NavLink to="/dashboard" title={t('Tổng quan')} end onClick={() => setOpen(false)}>
              <LayoutDashboard size={18} />
              <span>{t('Tổng quan')}</span>
            </NavLink>
            {menu[user.role]
              ?.filter(
                (item) =>
                  runtime.mode === 'mock' ||
                  (user.role === 'Caregiver' &&
                    [
                      'users',
                      'caregivers',
                      'map',
                      'alerts',
                      'notifications',
                      'contacts',
                      'activity',
                      'registry',
                      'locations',
                      'tts',
                    ].includes(item.path)) ||
                  (user.role === 'Admin' &&
                    [
                      'organizations',
                      'accounts',
                      'links',
                      'rules',
                      'configurations',
                      'metrics',
                      'audit',
                      'delivery',
                    ].includes(item.path)) ||
                  (user.role === 'CenterAdmin' &&
                    [
                      'organization',
                      'staff',
                      'users',
                      'assignments',
                      'map',
                      'routing',
                      'reports',
                    ].includes(item.path)),
              )
              .map((item) => (
                <NavLink
                  key={item.path}
                  title={
                    runtime.mode === 'api' &&
                    user.role === 'Caregiver' &&
                    item.path === 'caregivers'
                      ? t('Liên kết của tôi')
                      : t(item.label)
                  }
                  to={roleBase(user.role) + '/' + item.path}
                  onClick={() => setOpen(false)}
                >
                  {(() => {
                    const Icon =
                      navigationIcons[item.path as keyof typeof navigationIcons] || FileText;
                    return <Icon size={18} aria-hidden="true" />;
                  })()}
                  <span>
                    {runtime.mode === 'api' &&
                    user.role === 'Caregiver' &&
                    item.path === 'caregivers'
                      ? t('Liên kết của tôi')
                      : t(item.label)}
                  </span>
                  {locked(item.path) && (
                    <span className="nav-lock" title={t('Cần gói dịch vụ')}>
                      <Lock size={14} aria-hidden="true" />
                      <span className="sr-only">{t('(cần gói dịch vụ)')}</span>
                    </span>
                  )}
                </NavLink>
              ))}
          </nav>
        </div>
        <div className="sidebar-foot stack">
          <div className="notice">
            <ShieldCheck size={20} />
            <p>{t('Mỗi kết nối là một sự an tâm.')}</p>
          </div>
          <nav className="nav">
            {runtime.mode === 'api' && user.role === 'Caregiver' && (
              <NavLink
                title={t('Lịch sử cuộc gọi')}
                to="/caregiver/calls"
                onClick={() => setOpen(false)}
              >
                <Phone size={18} aria-hidden="true" />
                <span>{t('Lịch sử cuộc gọi')}</span>
              </NavLink>
            )}
            {runtime.mode === 'api' && user.role === 'CenterAdmin' && user.orgId && (
              <>
                <NavLink
                  title={t('Kho license')}
                  to="/center-admin/licenses"
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>{t('Kho license')}</span>
                </NavLink>
                <NavLink
                  title={t('Thanh toán')}
                  to="/center-admin/payments"
                  onClick={() => setOpen(false)}
                >
                  <CreditCard size={18} aria-hidden="true" />
                  <span>{t('Thanh toán')}</span>
                </NavLink>
              </>
            )}
            {runtime.mode === 'api' && user.role === 'Admin' && (
              <NavLink
                title={t('Nhật ký Hybrid')}
                to="/admin/hybrid"
                onClick={() => setOpen(false)}
              >
                <Activity size={18} aria-hidden="true" />
                <span>{t('Nhật ký Hybrid')}</span>
              </NavLink>
            )}
            {runtime.mode === 'api' && user.role === 'Admin' && (
              <NavLink
                title={t('Máy chủ cuộc gọi')}
                to="/admin/ice-servers"
                onClick={() => setOpen(false)}
              >
                <Settings size={18} aria-hidden="true" />
                <span>{t('Máy chủ cuộc gọi')}</span>
              </NavLink>
            )}
            {runtime.mode === 'api' && (
              <NavLink title="License" to="/license">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>License</span>
              </NavLink>
            )}
            {runtime.mode === 'api' && user.role === 'Caregiver' && !user.orgId && (
              <NavLink
                title={t('Thanh toán')}
                to="/caregiver/payments"
                onClick={() => setOpen(false)}
              >
                <CreditCard size={18} aria-hidden="true" />
                <span>{t('Thanh toán')}</span>
              </NavLink>
            )}
            {runtime.mode === 'api' &&
              (user.role === 'Admin' ||
                user.role === 'CenterAdmin' ||
                (user.role === 'Caregiver' && !user.orgId)) && (
                <NavLink
                  title={t('Gói dịch vụ')}
                  to={user.role === 'Admin' ? '/admin/packages' : '/packages'}
                  onClick={() => setOpen(false)}
                >
                  <Package size={18} aria-hidden="true" />
                  <span>{t('Gói dịch vụ')}</span>
                </NavLink>
              )}
          </nav>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <button
              className="btn mobile-menu"
              aria-label={t('Mở điều hướng')}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Menu size={18} />
            </button>
            <span className="muted" style={{ fontSize: 13 }}>
              VisionAid <span aria-hidden="true">/</span> {roles[user.role]}
            </span>
          </div>
          <div className="topbar-actions">
            <LanguageSwitch />
            <button
              className="row account-trigger"
              popoverTarget="account-menu"
              aria-label={t('Menu tài khoản')}
            >
              <span className="avatar">
                {user.name.split(' ').at(-1)?.slice(0, 2).toUpperCase()}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>
                <strong>{user.name}</strong>
                <br />
                <small>{roles[user.role]}</small>
              </span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
          <div id="account-menu" popover="auto" className="account-menu">
            <Link
              to="/profile"
              onClick={(event) => {
                event.currentTarget.parentElement?.hidePopover();
                setOpen(false);
              }}
            >
              <UserRound size={18} aria-hidden="true" /> {t('Hồ sơ của tôi')}
            </Link>{' '}
            <button
              className="btn"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                try {
                  await auth.logout();
                } finally {
                  setSigningOut(false);
                }
              }}
            >
              <LogOut size={16} />
              {signingOut ? t('Đang đăng xuất…') : t('Đăng xuất')}
            </button>
          </div>
        </header>
        {auth.mode === 'api' &&
          !signingOut &&
          (user.role === 'Caregiver' || (user.role === 'CenterAdmin' && user.orgId)) && (
            <>
              <PushSync key={user.id} userId={user.id} />
            </>
          )}
        {auth.mode === 'mock' && (
          <div className="demo-strip">
            <span>{t('● Chế độ demo · Dữ liệu mô phỏng, chưa kết nối backend')}</span>
            <button
              style={{
                border: 0,
                background: 'transparent',
                color: 'var(--primary)',
                textDecoration: 'underline',
              }}
              onClick={() => setReset(true)}
            >
              {t('Reset dữ liệu demo')}
            </button>
          </div>
        )}
        <main id="main" tabIndex={-1} className="main">
          <Suspense
            fallback={
              <div className="glass empty" role="status">
                {t('Đang tải màn hình…')}
              </div>
            }
          >
            <ErrorBoundary scope="route" resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
      {notice && <Toast message={notice} onDismiss={() => uiStore.set({ notice: '' })} />}
      {reset && (
        <Confirm
          title={t('Reset dữ liệu demo?')}
          description={t(
            'Xóa toàn bộ thay đổi, ảnh demo và phiên đăng nhập trên trình duyệt này để trở về dữ liệu mẫu.',
          )}
          onClose={() => setReset(false)}
          onConfirm={auth.resetDemo}
        />
      )}
    </div>
  );
  return auth.mode === 'api' ? (
    <ApiRealtime
      key={user.id + ':' + user.role + ':' + user.orgId}
      actor={user}
      enabled={!signingOut}
    >
      {content}
    </ApiRealtime>
  ) : (
    content
  );
}
function HomeActions() {
  return (
    <>
      <Link className="btn primary" to="/dashboard">
        {t('Về tổng quan')}
      </Link>
      <button className="btn" onClick={() => window.history.back()}>
        {t('Quay lại trang trước')}
      </button>
    </>
  );
}
// Unknown URL: inside the shell for a signed-in Web user, a standalone page otherwise
// (no login redirect for a mistyped address).
function UnknownRoute() {
  const q = useSession();
  if (q.isPending)
    return (
      <div className="empty" role="status">
        {t('Đang kiểm tra phiên…')}
      </div>
    );
  if (q.data && ['Caregiver', 'CenterAdmin', 'Admin'].includes(q.data.role))
    return (
      <Routes>
        <Route element={<Shell />}>
          <Route path="*" element={<StatusPage kind="not-found" actions={<HomeActions />} />} />
        </Route>
      </Routes>
    );
  return (
    <StatusPage
      kind="not-found"
      standalone
      actions={
        <>
          <Link className="btn primary" to="/">
            {t('Về trang chủ')}
          </Link>
          <Link className="btn" to="/auth/login">
            {t('Đăng nhập')}
          </Link>
        </>
      }
    />
  );
}
export function App() {
  // Subscribing at the root re-renders the whole tree (state kept) when the language changes.
  useI18n();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/:action" element={<AuthPage />} />
          <Route path="/reset-password" element={<AuthPage action="reset" />} />
          <Route element={<Guard />}>
            <Route element={<Shell />}>
              <Route
                path="dashboard"
                element={runtime.mode === 'api' ? <ApiSession /> : <Dashboard />}
              />
              <Route path="profile" element={<Profile />} />
              {runtime.mode === 'api' && (
                <>
                  <Route path="caregiver/payments" element={<ApiPayments />} />
                  <Route element={<Guard role="Caregiver" />}>
                    <Route path="caregiver/calls" element={<ApiCalls />} />
                  </Route>
                  <Route element={<Guard role="CenterAdmin" />}>
                    <Route path="center-admin/payments" element={<ApiPayments />} />
                    <Route path="center-admin/licenses" element={<ApiLicensePool />} />
                  </Route>
                  <Route path="payments/return" element={<ApiPayments result />} />
                  <Route path="payments/cancel" element={<ApiPayments result />} />
                </>
              )}
              {runtime.mode === 'api' && <Route path="packages" element={<ApiPackages />} />}
              {runtime.mode === 'api' && (
                <Route element={<Guard role="Admin" />}>
                  <Route path="admin/packages" element={<ApiPackages admin />} />
                  <Route path="admin/ice-servers" element={<ApiIceServers />} />
                  <Route path="admin/hybrid" element={<ApiMonitoring kind="guidance" />} />
                </Route>
              )}
              {runtime.mode === 'api' && <Route path="license" element={<ApiLicense />} />}
              {features.map((f) => (
                <Route key={f.role + f.path} element={<Guard role={f.role} />}>
                  <Route
                    path={roleBase(f.role) + '/' + f.path}
                    element={
                      runtime.mode === 'api' ? (
                        <LicenseGate
                          licensed={
                            f.role === 'Caregiver' &&
                            (licensedCaregiverPaths as readonly string[]).includes(f.path)
                          }
                        >
                          {f.role === 'Caregiver' && f.path === 'users' ? (
                            <ApiLinkedUsers />
                          ) : f.role === 'Caregiver' && f.path === 'contacts' ? (
                            <ApiContacts />
                          ) : f.role === 'Caregiver' && f.path === 'locations' ? (
                            <ApiPlaces />
                          ) : f.role === 'Caregiver' && f.path === 'registry' ? (
                            <ApiRegistry />
                          ) : f.role === 'Caregiver' && f.path === 'tts' ? (
                            <ApiTts />
                          ) : f.role === 'Caregiver' && f.path === 'activity' ? (
                            <ApiActivity />
                          ) : f.role === 'CenterAdmin' && f.path === 'reports' ? (
                            <ApiReports />
                          ) : f.role === 'Admin' &&
                            (f.path === 'metrics' ||
                              f.path === 'audit' ||
                              f.path === 'delivery') ? (
                            <ApiMonitoring kind={f.path} />
                          ) : f.role === 'Admin' && f.path === 'configurations' ? (
                            <ApiConfigurations />
                          ) : (f.role === 'Admin' && f.path === 'organizations') ||
                            (f.role === 'CenterAdmin' && f.path === 'organization') ? (
                            <ApiOrganizations />
                          ) : f.role === 'Admin' && f.path === 'accounts' ? (
                            <ApiAccounts />
                          ) : f.role === 'CenterAdmin' && ['staff', 'users'].includes(f.path) ? (
                            <ApiAccounts
                              fixedRole={f.path === 'staff' ? 'Caregiver' : 'VisuallyImpaired'}
                            />
                          ) : (f.role === 'Admin' && f.path === 'links') ||
                            (f.role === 'CenterAdmin' && f.path === 'assignments') ||
                            (f.role === 'Caregiver' && f.path === 'caregivers') ? (
                            <ApiLinks />
                          ) : ['Caregiver', 'CenterAdmin'].includes(f.role) && f.path === 'map' ? (
                            <ApiTracking />
                          ) : f.role === 'Caregiver' && f.path === 'alerts' ? (
                            <ApiAlerts />
                          ) : (f.role === 'Caregiver' && f.path === 'notifications') ||
                            (f.role === 'Admin' && f.path === 'rules') ||
                            (f.role === 'CenterAdmin' && f.path === 'routing') ? (
                            <ApiNotifications />
                          ) : (
                            <ApiPending />
                          )}
                        </LicenseGate>
                      ) : (
                        <f.component />
                      )
                    }
                  />
                </Route>
              ))}
              <Route
                path="forbidden"
                element={<StatusPage kind="forbidden" actions={<HomeActions />} />}
              />
            </Route>
          </Route>
          <Route path="*" element={<UnknownRoute />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

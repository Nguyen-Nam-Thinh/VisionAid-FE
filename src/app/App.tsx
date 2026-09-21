import { Landing } from '../pages/public/Landing';
import { Dashboard } from '../pages/shared/Dashboard';
import { features } from './features';
import { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogOut, Menu, LayoutDashboard, UserRound, ShieldCheck } from 'lucide-react';
import { useAuth, useSession } from '../hooks/useService';
import { Brand, Confirm, PageHead, State } from '../components/UI';
import { AuthPage } from '../pages/auth/AuthPage';
import { Profile } from '../pages/shared/Profile';
import { roles } from '../constants/labels';
import { uiStore, useUI } from '../stores/ui';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
export function Guard({ role }: { role?: string }) {
  const q = useSession();
  const auth = useAuth();
  if (q.isPending)
    return (
      <div className="empty" role="status">
        Đang kiểm tra phiên…
      </div>
    );
  if (q.isError)
    return (
      <div className="main">
        <State error={q.error} retry={() => q.refetch()}>
          <span />
        </State>
        <Link to="/auth/login">Đăng nhập</Link>
      </div>
    );
  if (!q.data) return <Navigate to="/auth/login" replace />;
  if (!['Caregiver', 'CenterAdmin', 'Admin'].includes(q.data.role))
    return (
      <main className="main">
        <section className="glass card stack">
          <h1>Không có quyền truy cập Web</h1>
          <p>Vai trò này không được hỗ trợ trên Web Dashboard.</p>
          <button className="btn" onClick={() => auth.logout()}>
            Đăng xuất
          </button>
        </section>
      </main>
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
function Shell() {
  const { data: user } = useSession();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [reset, setReset] = useState(false);
  const { notice } = useUI();
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => uiStore.set({ notice: '' }), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  if (!user) return null;
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Đến nội dung chính
      </a>
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <Brand />
        <div>
          <p className="eyebrow" style={{ padding: '0 12px 12px' }}>
            Không gian của bạn
          </p>
          <nav className="nav" aria-label="Điều hướng chính">
            <NavLink to="/dashboard" end onClick={() => setOpen(false)}>
              <LayoutDashboard size={18} />
              Tổng quan
            </NavLink>
            {menu[user.role]?.map((item) => (
              <NavLink
                key={item.path}
                to={roleBase(user.role) + '/' + item.path}
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">◦</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-foot stack">
          <div className="notice">
            <ShieldCheck size={20} />
            <p>Mỗi kết nối là một sự an tâm.</p>
          </div>
          <nav className="nav">
            <NavLink to="/profile">
              <UserRound size={18} />
              Hồ sơ của tôi
            </NavLink>
          </nav>
          <button className="btn" onClick={() => auth.logout()}>
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <button
              className="btn mobile-menu"
              aria-label="Mở điều hướng"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Menu size={18} />
            </button>
            <span className="muted" style={{ fontSize: 13 }}>
              VisionAid <span aria-hidden="true">/</span> {roles[user.role]}
            </span>
          </div>
          <Link className="row" to="/profile">
            <span className="avatar">{user.name.split(' ').at(-1)?.slice(0, 2).toUpperCase()}</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>
              <strong>{user.name}</strong>
              <br />
              <small>{roles[user.role]}</small>
            </span>
          </Link>
        </header>
        {auth.mode === 'mock' && (
          <div className="demo-strip">
            <span>● Chế độ demo · Dữ liệu mô phỏng, chưa kết nối backend</span>
            <button
              style={{
                border: 0,
                background: 'transparent',
                color: 'var(--primary)',
                textDecoration: 'underline',
              }}
              onClick={() => setReset(true)}
            >
              Reset dữ liệu demo
            </button>
          </div>
        )}
        <main id="main" tabIndex={-1} className="main">
          <Suspense
            fallback={
              <div className="glass empty" role="status">
                Đang tải màn hình…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      {notice && (
        <div role="status" className="toast">
          {notice}
        </div>
      )}
      {reset && (
        <Confirm
          title="Reset dữ liệu demo?"
          description="Xóa toàn bộ thay đổi, ảnh demo và phiên đăng nhập trên trình duyệt này để trở về dữ liệu mẫu."
          onClose={() => setReset(false)}
          onConfirm={auth.resetDemo}
        />
      )}
    </div>
  );
}
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/:action" element={<AuthPage />} />
          <Route element={<Guard />}>
            <Route element={<Shell />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              {features.map((f) => (
                <Route key={f.role + f.path} element={<Guard role={f.role} />}>
                  <Route path={roleBase(f.role) + '/' + f.path} element={<f.component />} />
                </Route>
              ))}
              <Route
                path="forbidden"
                element={
                  <>
                    <PageHead
                      title="Không có quyền truy cập"
                      description="Tài khoản của bạn không được cấp quyền cho màn hình này."
                    />
                    <Link className="btn" to="/dashboard">
                      Về tổng quan
                    </Link>
                  </>
                }
              />
              <Route
                path="*"
                element={
                  <>
                    <PageHead
                      title="Không tìm thấy trang"
                      description="Đường dẫn không tồn tại hoặc đã được thay đổi."
                    />
                    <Link className="btn" to="/dashboard">
                      Về tổng quan
                    </Link>
                  </>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

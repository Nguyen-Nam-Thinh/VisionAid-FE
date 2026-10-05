import { useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { paymentResumeTarget } from '../../services/api/payments';
import { Eye, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Form, type FieldSpec } from '../../components/Form';
import { useAuth, useDemoAccounts, useSession } from '../../hooks/useService';
import { roles } from '../../constants/labels';
import { useUI } from '../../stores/ui';
export function AuthPage({ action: fixedAction }: { action?: string } = {}) {
  const location = useLocation();
  const returnTo =
    paymentResumeTarget((location.state as { returnTo?: unknown } | null)?.returnTo) ??
    '/dashboard';
  const { action: routeAction = 'login' } = useParams();
  const action = fixedAction ?? routeAction;
  const [search] = useSearchParams();
  const resetEmail = action === 'reset' ? (search.get('email') ?? '') : '';
  const resetToken = action === 'reset' ? (search.get('token') ?? '') : '';
  const auth = useAuth();
  const session = useSession();
  const user = session.data;
  const { notice } = useUI();
  const { data: accounts = [] } = useDemoAccounts();
  const nav = useNavigate();
  const [email, setEmail] = useState(auth.mode === 'mock' ? 'caregiver@demo.vn' : '');
  const [message, setMessage] = useState('');
  const emailReset = auth.mode === 'api' && action === 'reset';
  const validResetLink = !!resetToken && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail);
  if (user && action !== 'reset') return <Navigate to={returnTo} replace />;
  const titles: Record<string, string> = {
    login: 'Chào mừng trở lại.',
    register: 'Bắt đầu đồng hành.',
    recover: 'Khôi phục mật khẩu',
    reset: 'Đặt mật khẩu mới',
  };
  if (!titles[action]) return <Navigate to="/not-found" replace />;
  const fields: FieldSpec[] =
    action === 'reset'
      ? [
          { key: 'email', label: 'Địa chỉ email', type: 'email', required: true },
          {
            key: 'code',
            label: auth.mode === 'api' ? 'Mã hoặc liên kết khôi phục' : 'Mã khôi phục demo',
            type: auth.mode === 'api' ? 'password' : 'text',
            required: true,
          },
          { key: 'password', label: 'Mật khẩu mới', type: 'password', required: true },
          ...(auth.mode === 'api'
            ? [
                {
                  key: 'confirm',
                  label: 'Nhập lại mật khẩu mới',
                  type: 'password' as const,
                  required: true,
                },
              ]
            : []),
        ]
      : [
          { key: 'email', label: 'Địa chỉ email', type: 'email', required: true },
          ...(action === 'register' ? [{ key: 'name', label: 'Họ và tên', required: true }] : []),
          ...(action !== 'recover'
            ? [{ key: 'password', label: 'Mật khẩu', type: 'password' as const, required: true }]
            : []),
          ...(action === 'register' && auth.mode === 'api'
            ? [
                {
                  key: 'confirm',
                  label: 'Nhập lại mật khẩu',
                  type: 'password' as const,
                  required: true,
                },
              ]
            : []),
        ];
  return (
    <div className="auth">
      <aside className="auth-story">
        <div className="row">
          <Eye size={36} />
          <strong style={{ fontSize: 24 }}>VisionAid.</strong>
        </div>
        <div className="stack">
          <span className="eyebrow" style={{ color: 'var(--on-primary)' }}>
            Một kết nối. Nhiều an tâm.
          </span>
          <h1>
            Luôn gần bên,
            <br />
            dù ở nơi đâu.
          </h1>
          <p>
            Kết nối người chăm sóc và người thân trong một không gian an toàn, rõ ràng và dễ sử
            dụng.
          </p>
          <div className="auth-mark">
            <Eye size={110} strokeWidth={1} />
          </div>
        </div>
        <div className="row">
          <ShieldCheck size={20} />
          <span>Đồng hành cùng sự tự lập mỗi ngày</span>
        </div>
      </aside>
      <main className="auth-form">
        <div className="stack">
          <Link to="/">← Về trang chủ</Link>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {auth.mode === 'api' && session.isPending && (
            <p role="status">Đang kiểm tra phiên đã lưu…</p>
          )}
          {auth.mode === 'api' && session.isError && (
            <p className="notice error" role="alert">
              Không khôi phục được phiên. Bạn có thể đăng nhập lại. {session.error.message}
            </p>
          )}
          <span className="badge blue">VISIONAID WEB DASHBOARD</span>
          <h1>{titles[action]}</h1>
          <p className="muted">
            {action === 'register'
              ? 'Tạo tài khoản người chăm sóc gia đình.'
              : 'Không gian chăm sóc dành cho bạn.'}
          </p>
          {auth.mode === 'mock' && (
            <div className="notice">
              Bản demo · Dữ liệu giả lưu trên trình duyệt. Mật khẩu mẫu: <strong>Demo@123</strong>.
              Không nhập dữ liệu hoặc mật khẩu thật.
            </div>
          )}
          {action === 'login' && auth.mode === 'mock' && (
            <label className="field">
              Chọn tài khoản demo
              <select value={email} onChange={(e) => setEmail(e.target.value)}>
                {accounts.map((p) => (
                  <option key={p.id} value={p.email}>
                    {p.name} · {roles[p.role]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {emailReset && !validResetLink && (
            <p className="notice error" role="alert">
              Liên kết khôi phục thiếu hoặc không hợp lệ. Hãy yêu cầu email mới qua Quên mật khẩu.
            </p>
          )}
          {!(auth.mode === 'api' && session.isPending) && (!emailReset || validResetLink) && (
            <Form
              key={action + email + resetEmail + resetToken}
              fields={
                emailReset ? fields.filter((f) => !['email', 'code'].includes(f.key)) : fields
              }
              initial={{
                email: resetEmail || email,
                code: resetToken,
                password: auth.mode === 'mock' ? 'Demo@123' : '',
              }}
              submit={
                action === 'login'
                  ? 'Đăng nhập'
                  : action === 'register'
                    ? 'Tạo tài khoản'
                    : action === 'recover'
                      ? 'Tạo yêu cầu khôi phục'
                      : 'Đặt mật khẩu'
              }
              onSubmit={async (v) => {
                setMessage('');
                if (action === 'login') {
                  await auth.login(String(v.email), String(v.password));
                  nav(returnTo, { replace: true });
                }
                if (action === 'register') {
                  if (auth.mode === 'api' && v.password !== v.confirm)
                    throw Error('Mật khẩu xác nhận không khớp.');
                  await auth.register(String(v.name), String(v.email), String(v.password));
                  nav(returnTo, { replace: true });
                }
                if (action === 'recover') {
                  const code = await auth.recover(String(v.email));
                  setMessage(
                    auth.mode === 'api'
                      ? code
                      : 'Mô phỏng yêu cầu khôi phục. Chưa gửi email thật. Mã demo (chỉ dùng với email tồn tại): ' +
                          code,
                  );
                }
                if (action === 'reset') {
                  if (auth.mode === 'api' && v.password !== v.confirm)
                    throw Error('Mật khẩu xác nhận không khớp.');
                  await auth.resetPassword(
                    emailReset ? resetEmail : String(v.email),
                    emailReset ? resetToken : String(v.code),
                    String(v.password),
                  );
                  if (auth.mode === 'api') nav('/auth/login', { replace: true });
                  else setMessage('Đã đổi mật khẩu demo. Bạn có thể đăng nhập lại.');
                }
              }}
            />
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          {auth.mode === 'api' && (
            <>
              {action !== 'recover' && <Link to="/auth/recover">Quên mật khẩu?</Link>}
              {['register', 'reset'].includes(action) && (
                <p className="muted">
                  Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>
              )}
              <div className="row between">
                <Link to="/auth/login">Đăng nhập</Link>
                <Link to="/auth/register">
                  Đăng ký <ArrowUpRight size={14} />
                </Link>
              </div>
            </>
          )}
          {auth.mode === 'mock' && (
            <>
              <div className="row between">
                <Link to="/auth/login">Đăng nhập</Link>
                <Link to="/auth/register">
                  Đăng ký <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="row between">
                <Link to="/auth/recover">Quên mật khẩu?</Link>
                <Link to="/auth/reset">Nhập mã khôi phục</Link>
              </div>
            </>
          )}
          <small>Hệ thống hỗ trợ người khiếm thị · FA26SE013</small>
        </div>
      </main>
    </div>
  );
}

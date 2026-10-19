import { Link } from 'react-router-dom';
import { PageHead } from '../../components/UI';
import { useSession } from '../../hooks/useService';
import { roles } from '../../constants/labels';
import { ArrowRight, UserRound, ShieldCheck } from 'lucide-react';
import { DashboardOverview } from './DashboardOverview';

export function ApiSession() {
  const session = useSession();
  const user = session.data;
  return (
    <>
      <PageHead
        title={`Xin chào${user ? ', ' + user.name.split(' ').at(-1) : ''}.`}
        description="Một nơi để kết nối, chăm sóc và cùng nhau an tâm hơn."
      />
      <div className="stack">
        {user && <DashboardOverview key={user.id + user.orgId + user.role} actor={user} />}
        <div className="overview-grid">
          <section className="glass card stack">
            <h2>Đã đăng nhập bằng tài khoản BE</h2>
            <dl className="account-details">
              <div>
                <dt>Họ và tên</dt>
                <dd>{user?.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>Vai trò</dt>
                <dd>{user && roles[user.role]}</dd>
              </div>
              <div>
                <dt>Tổ chức</dt>
                <dd>{user?.orgId || 'Tài khoản cá nhân'}</dd>
              </div>
            </dl>
            <button
              className="btn"
              disabled={session.isFetching}
              onClick={() => void session.refetch()}
            >
              {session.isFetching ? 'Đang kiểm tra phiên…' : 'Kiểm tra phiên'}
            </button>
            <p className="muted">
              Phiên được giữ trong tab hiện tại khi tải lại trang. Chưa hỗ trợ ghi nhớ đăng nhập dài
              hạn.
            </p>
          </section>
          <section className="glass card stack">
            <h2>Dành cho bạn</h2>
            <Link className="quick-link" to="/profile">
              <span className="row">
                <UserRound size={22} aria-hidden="true" />
                <ArrowRight size={18} aria-hidden="true" />
              </span>
              <strong>Hồ sơ của tôi</strong>
              <p>Cập nhật thông tin liên hệ và quản lý mật khẩu.</p>
            </Link>
            <Link className="quick-link" to="/license">
              <span className="row">
                <ShieldCheck size={22} aria-hidden="true" />
                <ArrowRight size={18} aria-hidden="true" />
              </span>
              <strong>Quyền sử dụng</strong>
              <p>Xem trạng thái license dành cho tài khoản của bạn.</p>
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
export function ApiPending() {
  return (
    <section className="glass card stack">
      <h1>Chức năng chưa sẵn sàng</h1>
      <p>Màn hình này chưa được kết nối với máy chủ.</p>
      <Link className="btn" to="/dashboard">
        Về thông tin phiên
      </Link>
    </section>
  );
}

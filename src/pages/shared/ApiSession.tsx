import { Link } from 'react-router-dom';
import { PageHead } from '../../components/UI';
import { useSession } from '../../hooks/useService';
import { roles } from '../../constants/labels';

export function ApiSession() {
  const session = useSession();
  const user = session.data;
  return (
    <>
      <PageHead
        title="Kết nối tài khoản"
        description="Đợt 3a · Tài khoản và phiên đăng nhập với backend VisionAid."
      />
      <section className="glass card stack">
        <h2>Đã đăng nhập bằng tài khoản BE</h2>
        <dl className="stack">
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
        <p className="notice">
          Các màn hình nghiệp vụ sẽ được mở sau từng đợt tích hợp. Trang này không sử dụng dữ liệu
          demo.
        </p>
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
    </>
  );
}
export function ApiPending() {
  return (
    <section className="glass card stack">
      <h1>Chưa tích hợp trong đợt này</h1>
      <p>Màn hình này sẽ được ghép API ở đợt tiếp theo.</p>
      <Link className="btn" to="/dashboard">
        Về thông tin phiên
      </Link>
    </section>
  );
}

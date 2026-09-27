import { useState } from 'react';
import { Form } from '../../components/Form';
import { Confirm, PageHead } from '../../components/UI';
import { useAuth, useSession } from '../../hooks/useService';
export function Profile() {
  const { data: user } = useSession();
  const auth = useAuth();
  const [message, setMessage] = useState('');
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  if (!user) return null;
  return (
    <>
      <PageHead title="Hồ sơ của bạn" description="Thông tin cá nhân và bảo vệ phiên đăng nhập." />
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="grid">
        <section className="glass card stack">
          <h2>Thông tin cá nhân</h2>
          <p>{user.email}</p>
          <Form
            fields={[
              { key: 'name', label: 'Họ và tên', required: true, max: 200 },
              { key: 'phone', label: 'Số điện thoại' },
            ]}
            initial={{ name: user.name, phone: user.phone }}
            onSubmit={async (v) => {
              setMessage('');
              await auth.profile({
                name: String(v.name),
                phone: String(v.phone),
                avatar: user.avatar,
              });
              setMessage('Đã cập nhật hồ sơ.');
            }}
          />
          {auth.mode === 'mock' && (
            <label className="field">
              Ảnh đại diện JPG/PNG (demo tối đa 2 MB)
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (
                      !['image/png', 'image/jpeg'].includes(file.type) ||
                      file.size > 2 * 1024 * 1024
                    )
                      throw Error('Chọn ảnh JPG/PNG dưới 2 MB.');
                    const avatar = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(String(reader.result));
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                    await auth.profile({ name: user.name, phone: user.phone, avatar });
                    setMessage('Đã cập nhật avatar demo.');
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : 'Không thể đọc ảnh.');
                  }
                }}
              />
            </label>
          )}
          {auth.mode === 'api' && (
            <p className="muted">
              Ảnh đại diện hiện tại được giữ nguyên. Chưa tích hợp tải ảnh lên.
            </p>
          )}
          {user.avatar && (
            <img src={user.avatar} alt="Ảnh đại diện của bạn" width={80} height={80} />
          )}
        </section>
        <section className="glass card stack">
          <h2>Đổi mật khẩu</h2>
          <Form
            fields={[
              { key: 'current', label: 'Mật khẩu hiện tại', type: 'password', required: true },
              { key: 'next', label: 'Mật khẩu mới', type: 'password', required: true },
              { key: 'confirm', label: 'Nhập lại mật khẩu mới', type: 'password', required: true },
            ]}
            submit="Đổi mật khẩu"
            onSubmit={async (v) => {
              setMessage('');
              if (v.next !== v.confirm) throw Error('Mật khẩu xác nhận không khớp.');
              await auth.changePassword(String(v.current), String(v.next));
              if (auth.mode === 'mock') setMessage('Đã đổi mật khẩu demo.');
            }}
          />
          {auth.mode === 'api' && (
            <p className="muted">
              Mật khẩu mới: 8–100 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Sau khi đổi
              thành công, bạn cần đăng nhập lại.
            </p>
          )}
        </section>
      </div>
      {auth.mode === 'api' && (
        <section className="glass card stack">
          <h2>Phiên đăng nhập</h2>
          <p>
            Thu hồi quyền gia hạn phiên và nhận thông báo trên mọi thiết bị. Phiên truy cập hiện có
            trên thiết bị khác có thể còn hiệu lực đến khi hết hạn.
          </p>
          <button className="btn danger" onClick={() => setConfirmLogoutAll(true)}>
            Đăng xuất tất cả thiết bị
          </button>
        </section>
      )}
      {confirmLogoutAll && (
        <Confirm
          title="Đăng xuất tất cả thiết bị?"
          description="Tab này sẽ đăng xuất ngay. Các thiết bị khác sẽ cần đăng nhập lại khi gia hạn phiên."
          onClose={() => setConfirmLogoutAll(false)}
          onConfirm={auth.logoutAll}
        />
      )}
    </>
  );
}

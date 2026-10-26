import { t } from '../../i18n';
import { useState } from 'react';
import { PushSettings } from '../../components/PushSettings';
import { Form } from '../../components/Form';
import { Confirm, Dialog, PageHead, Toast } from '../../components/UI';
import { useAuth, useSession } from '../../hooks/useService';
export function Profile() {
  const { data: user } = useSession();
  const auth = useAuth();
  const [editor, setEditor] = useState<'profile' | 'password' | null>(null);
  const [message, setMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  if (!user) return null;
  return (
    <>
      <PageHead
        title={t('Hồ sơ của bạn')}
        description={t('Thông tin cá nhân và bảo vệ phiên đăng nhập.')}
      />
      {message && <Toast message={message} onDismiss={() => setMessage('')} />}
      {avatarError && (
        <p className="notice error" role="alert">
          {avatarError}
        </p>
      )}
      <div className="profile-layout">
        <section className="glass card stack">
          <h2>{t('Thông tin cá nhân')}</h2>
          <dl className="profile-details">
            <div>
              <dt>{t('Họ và tên')}</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t('Số điện thoại')}</dt>
              <dd>{user.phone || t('Chưa có số điện thoại')}</dd>
            </div>
          </dl>
          <button className="btn" onClick={() => setEditor('profile')}>
            {t('Chỉnh sửa hồ sơ')}
          </button>
          {editor === 'profile' && (
            <Dialog title={t('Chỉnh sửa hồ sơ')} onClose={() => setEditor(null)}>
              <Form
                fields={[
                  { key: 'name', label: t('Họ và tên'), required: true, min: 2, max: 200 },
                  { key: 'phone', label: t('Số điện thoại') },
                ]}
                initial={{ name: user.name, phone: user.phone }}
                onSubmit={async (v) => {
                  setMessage('');
                  await auth.profile({
                    name: String(v.name),
                    phone: String(v.phone),
                    avatar: user.avatar,
                  });
                  setMessage(t('Đã cập nhật hồ sơ.'));
                  setEditor(null);
                }}
              />
            </Dialog>
          )}
          {auth.mode === 'mock' && (
            <label className="field">
              {t('Ảnh đại diện JPG/PNG · bản demo tối đa 2 MB')}
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarError('');
                  try {
                    if (
                      !['image/png', 'image/jpeg'].includes(file.type) ||
                      file.size > 2 * 1024 * 1024
                    )
                      throw Error(t('Chọn ảnh JPG/PNG dưới 2 MB.'));
                    const avatar = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(String(reader.result));
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                    await auth.profile({ name: user.name, phone: user.phone, avatar });
                    setMessage(t('Đã cập nhật avatar demo.'));
                  } catch (error) {
                    setAvatarError(
                      error instanceof Error ? error.message : t('Không thể đọc ảnh.'),
                    );
                  }
                }}
              />
            </label>
          )}
          {auth.mode === 'api' && (
            <p className="muted">
              {t('Ảnh đại diện hiện tại được giữ nguyên. Chưa tích hợp tải ảnh lên.')}
            </p>
          )}
          {user.avatar && (
            <img src={user.avatar} alt={t('Ảnh đại diện của bạn')} width={80} height={80} />
          )}
        </section>
        <section className="glass card stack">
          <h2>{t('Đổi mật khẩu')}</h2>
          <p className="muted">
            {t('Dùng mật khẩu riêng cho VisionAid. Bạn cần nhập mật khẩu hiện tại để thay đổi.')}
          </p>
          <button className="btn" onClick={() => setEditor('password')}>
            {t('Đổi mật khẩu')}
          </button>
          {editor === 'password' && (
            <Dialog title={t('Đổi mật khẩu')} onClose={() => setEditor(null)}>
              <Form
                fields={[
                  {
                    key: 'current',
                    label: t('Mật khẩu hiện tại'),
                    type: 'password',
                    required: true,
                  },
                  {
                    key: 'next',
                    label: t('Mật khẩu mới'),
                    type: 'password',
                    required: true,
                    autoComplete: 'new-password',
                  },
                  {
                    key: 'confirm',
                    label: t('Nhập lại mật khẩu mới'),
                    type: 'password',
                    required: true,
                    autoComplete: 'new-password',
                  },
                ]}
                submit={t('Đổi mật khẩu')}
                onSubmit={async (v) => {
                  setMessage('');
                  if (v.next !== v.confirm) throw Error(t('Mật khẩu xác nhận không khớp.'));
                  await auth.changePassword(String(v.current), String(v.next));
                  setEditor(null);
                  if (auth.mode === 'mock') setMessage(t('Đã đổi mật khẩu demo.'));
                }}
              />
            </Dialog>
          )}
          {auth.mode === 'api' && (
            <p className="muted">
              {t(
                'Mật khẩu mới: 8–100 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Sau khi đổi thành công, bạn cần đăng nhập lại.',
              )}
            </p>
          )}
        </section>
      </div>
      {auth.mode === 'api' && (
        <div className="profile-notifications">
          <PushSettings key={user.id} userId={user.id} />
        </div>
      )}
      {auth.mode === 'api' && (
        <section className="glass card stack">
          <h2>{t('Phiên đăng nhập')}</h2>
          <p>
            {t(
              'Thu hồi quyền gia hạn phiên và nhận thông báo trên mọi thiết bị. Phiên truy cập hiện có trên thiết bị khác có thể còn hiệu lực đến khi hết hạn.',
            )}
          </p>
          <button className="btn danger" onClick={() => setConfirmLogoutAll(true)}>
            {t('Đăng xuất tất cả thiết bị')}
          </button>
        </section>
      )}
      {confirmLogoutAll && (
        <Confirm
          title={t('Đăng xuất tất cả thiết bị?')}
          description={t(
            'Tab này sẽ đăng xuất ngay. Các thiết bị khác sẽ cần đăng nhập lại khi gia hạn phiên.',
          )}
          onClose={() => setConfirmLogoutAll(false)}
          onConfirm={auth.logoutAll}
        />
      )}
    </>
  );
}

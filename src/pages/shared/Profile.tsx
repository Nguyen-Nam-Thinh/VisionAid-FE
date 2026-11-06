import { t } from '../../i18n';
import { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { PushSettings } from '../../components/PushSettings';
import { Form } from '../../components/Form';
import { Confirm, Dialog, PageHead, Toast } from '../../components/UI';
import { useAuth, useSession } from '../../hooks/useService';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '../../components/Avatar';
import { AVATAR_ACCEPT, avatarApi } from '../../services/api/avatar';
export function Profile() {
  const { data: user } = useSession();
  const auth = useAuth();
  const [editor, setEditor] = useState<'profile' | 'password' | null>(null);
  const [message, setMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);
  const cache = useQueryClient();
  if (!user) return null;
  const uploadAvatar = async (file: File) => {
    setAvatarError('');
    setAvatarBusy(true);
    try {
      if (auth.mode === 'mock') {
        if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024)
          throw Error(t('Chọn ảnh JPG/PNG dưới 2 MB.'));
        const avatar = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await auth.profile({ name: user.name, phone: user.phone, avatar });
        setMessage(t('Đã cập nhật avatar demo.'));
      } else {
        await avatarApi.upload(file);
        await cache.invalidateQueries({ queryKey: ['session'] });
        setMessage(t('Đã cập nhật ảnh đại diện.'));
      }
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : t('Không thể tải ảnh lên.'));
    } finally {
      setAvatarBusy(false);
    }
  };
  return (
    <>
      <PageHead
        title={t('Hồ sơ của bạn')}
        description={t('Thông tin cá nhân và bảo vệ phiên đăng nhập.')}
      />
      {message && <Toast message={message} onDismiss={() => setMessage('')} />}
      <div className="profile-layout">
        <section className="glass card stack">
          <h2>{t('Thông tin cá nhân')}</h2>
          <div className="profile-photo">
            <Avatar
              url={user.avatar}
              name={user.name}
              alt={user.avatar ? t('Ảnh đại diện của bạn') : ''}
              className="avatar profile-avatar"
              size={96}
            />
            <div className="profile-photo-body">
              <strong>{t('Ảnh đại diện')}</strong>
              <p className="muted">
                {auth.mode === 'mock'
                  ? t('JPG hoặc PNG, bản demo tối đa 2 MB.')
                  : t(
                      'JPG, PNG hoặc WebP, tối đa 10 MB. Ảnh được cắt vuông và xóa thông tin vị trí; chỉ người có liên quan đến bạn trong VisionAid xem được.',
                    )}
              </p>
              <div className="row profile-photo-actions">
                <label className={'btn small' + (avatarBusy ? ' disabled' : '')}>
                  <Camera size={16} aria-hidden="true" />
                  {avatarBusy ? t('Đang tải ảnh…') : user.avatar ? t('Đổi ảnh') : t('Tải ảnh lên')}
                  <input
                    className="sr-only"
                    type="file"
                    accept={auth.mode === 'mock' ? 'image/png,image/jpeg' : AVATAR_ACCEPT}
                    disabled={avatarBusy}
                    onChange={(e) => {
                      const input = e.currentTarget;
                      const file = input.files?.[0];
                      input.value = '';
                      if (file) void uploadAvatar(file);
                    }}
                  />
                </label>
                {user.avatar && auth.mode === 'api' && (
                  <button
                    className="btn small danger"
                    disabled={avatarBusy}
                    onClick={() => setConfirmRemoveAvatar(true)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    {t('Xóa ảnh')}
                  </button>
                )}
              </div>
              {avatarError && (
                <p className="notice error" role="alert">
                  {avatarError}
                </p>
              )}
            </div>
          </div>
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
          {confirmRemoveAvatar && (
            <Confirm
              title={t('Xóa ảnh đại diện')}
              description={t('Ảnh đại diện sẽ bị xóa khỏi máy chủ. Bạn có thể tải ảnh khác sau.')}
              onClose={() => setConfirmRemoveAvatar(false)}
              onConfirm={async () => {
                await avatarApi.remove();
                await cache.invalidateQueries({ queryKey: ['session'] });
                setMessage(t('Đã xóa ảnh đại diện.'));
              }}
            />
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

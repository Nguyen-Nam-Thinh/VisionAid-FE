import { t } from '../../i18n';
import { useState } from 'react';
import { z } from 'zod';
import { Form } from '../../components/Form';
import { Confirm, Dialog } from '../../components/UI';
import { caregivingApi } from '../../services/api/caregiving';
import { ServiceError } from '../../services/contracts';

export function ApiCreateLinkedUser({
  caregiverId,
  onLinked,
}: {
  caregiverId: string;
  onLinked: () => void;
}) {
  const key = 'visionaid.pending-viu.' + caregiverId;
  const [pending, setPending] = useState(() => {
    try {
      return sessionStorage.getItem(key) || '';
    } catch {
      return '';
    }
  });
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [discard, setDiscard] = useState(false);
  const save = (id: string) => {
    setPending(id);
    try {
      if (id) sessionStorage.setItem(key, id);
      else sessionStorage.removeItem(key);
    } catch {
      setNotice(t('Không lưu được tiến độ trong tab. Hãy ghi lại mã VIU trước khi tải lại trang.'));
    }
  };
  return (
    <>
      <button className="btn primary" onClick={() => setOpen(true)}>
        {pending ? t('Tiếp tục liên kết người được chăm sóc') : t('Thêm người được chăm sóc')}
      </button>
      {open && (
        <Dialog title={t('Thêm người được chăm sóc')} onClose={() => setOpen(false)}>
          <div className="stack">
            {discard && (
              <Confirm
                title={t('Bỏ tiến độ liên kết')}
                description={
                  t('Hãy lưu mã VIU trước: ') +
                  pending +
                  t(
                    '. Thao tác này chỉ bỏ tiến độ trong tab, không xóa tài khoản trên máy chủ. Chỉ tạo lại khi quản trị viên xác nhận chưa có tài khoản.',
                  )
                }
                onClose={() => setDiscard(false)}
                onConfirm={async () => {
                  save('');
                  setNotice(t('Đã bỏ tiến độ trong tab.'));
                }}
              />
            )}
            {pending && (
              <button className="btn" onClick={() => setDiscard(true)}>
                {t('Bỏ tiến độ trong tab')}
              </button>
            )}
            <p className="notice" role="status">
              {!pending
                ? t('Bước 1/2: Tạo tài khoản')
                : pending === 'unknown'
                  ? t('Cần xác minh tài khoản trước khi tiếp tục')
                  : t('Bước 2/2: Thiết lập liên kết chăm sóc')}
            </p>
            <p>
              {t(
                'Tạo tài khoản trước, sau đó tạo liên kết chăm sóc. Hai bước được lưu riêng trên hệ thống.',
              )}
            </p>
            {notice && (
              <p role="status" className="notice">
                {notice}
              </p>
            )}
            {!pending ? (
              <Form
                key="create"
                submit={t('Bước 1: Tạo tài khoản VIU')}
                fields={[
                  { key: 'fullName', label: t('Họ và tên'), required: true, max: 200 },
                  { key: 'email', label: 'Email', type: 'email', required: true, max: 255 },
                  {
                    key: 'phoneNumber',
                    label: t('Số điện thoại'),
                    hint: t('10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.'),
                  },
                  {
                    key: 'password',
                    label: t('Mật khẩu'),
                    type: 'password',
                    required: true,
                    hint: t('Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.'),
                  },
                  {
                    key: 'confirmation',
                    label: t('Nhập lại mật khẩu'),
                    type: 'password',
                    required: true,
                  },
                ]}
                onSubmit={async (values) => {
                  if (values.password !== values.confirmation)
                    throw new Error(t('Mật khẩu nhập lại không khớp.'));
                  try {
                    const person = await caregivingApi.createUser(
                      {
                        fullName: String(values.fullName),
                        email: String(values.email),
                        phoneNumber: String(values.phoneNumber),
                        password: String(values.password),
                      },
                      caregiverId,
                    );
                    save(person.id);
                  } catch (error) {
                    if (error instanceof ServiceError && error.status >= 500) {
                      save('unknown');
                      setNotice(
                        t(
                          'Chưa xác định được tài khoản đã tạo hay chưa. Nhờ quản trị viên kiểm tra email và cung cấp mã VIU trước khi tiếp tục; không gửi lại yêu cầu tạo tài khoản.',
                        ),
                      );
                    } else throw error;
                  }
                }}
              />
            ) : pending !== 'unknown' ? (
              <>
                <p>
                  {t('Mã VIU đang chờ liên kết:')} <strong>{pending}</strong>
                </p>
                <p>{t('Nếu liên kết thất bại, thử lại bước này. Không cần tạo thêm tài khoản.')}</p>
                <Form
                  key={pending}
                  submit={t('Bước 2: Tạo liên kết')}
                  initial={{
                    canReceiveAlerts: true,
                    canManageRegistry: false,
                    canManageLocations: false,
                  }}
                  fields={[
                    { key: 'canReceiveAlerts', label: t('Nhận cảnh báo'), type: 'checkbox' },
                    { key: 'canManageRegistry', label: t('Quản lý gương mặt'), type: 'checkbox' },
                    { key: 'canManageLocations', label: t('Quản lý địa điểm'), type: 'checkbox' },
                  ]}
                  onSubmit={async (values) => {
                    await caregivingApi.createLink(pending, caregiverId, {
                      canReceiveAlerts: !!values.canReceiveAlerts,
                      canManageRegistry: !!values.canManageRegistry,
                      canManageLocations: !!values.canManageLocations,
                    });
                    save('');
                    setNotice(t('Liên kết đã sẵn sàng. Danh sách đang được tải lại.'));
                    onLinked();
                  }}
                />
              </>
            ) : (
              <p role="alert">
                {t(
                  'Chờ xác minh tài khoản đã tạo với quản trị viên. Nhập mã VIU đã xác minh ở bên dưới để tiếp tục.',
                )}
              </p>
            )}
            {(!pending || pending === 'unknown') && (
              <details>
                <summary>{t('Tiếp tục bằng mã VIU đã có')}</summary>
                <Form
                  submit={t('Dùng mã VIU này')}
                  fields={[{ key: 'id', label: t('Mã VIU đã xác minh'), required: true }]}
                  onSubmit={async (values) => {
                    const id = String(values.id).trim();
                    if (!z.string().uuid().safeParse(id).success)
                      throw new Error(t('Mã VIU phải là UUID hợp lệ.'));
                    save(id);
                  }}
                />
              </details>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}

import { t } from '../../i18n';
import { useState } from 'react';
import { z } from 'zod';
import { Form } from '../../components/Form';
import { Confirm, Dialog, Toast } from '../../components/UI';
import { caregivingApi } from '../../services/api/caregiving';
import { ServiceError } from '../../services/contracts';

/** The account waiting for its care link; the id is only sent to the server, never shown. */
const pendingSchema = z.object({ id: z.string().uuid(), name: z.string(), email: z.string() });
type Pending = z.infer<typeof pendingSchema>;
function readPending(key: string): Pending | null {
  try {
    const raw = sessionStorage.getItem(key) || '';
    // Progress saved by an older version was the bare id.
    if (z.string().uuid().safeParse(raw).success) return { id: raw, name: '', email: '' };
    return pendingSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function ApiCreateLinkedUser({
  caregiverId,
  onLinked,
}: {
  caregiverId: string;
  onLinked: () => void;
}) {
  const key = 'visionaid.pending-viu.' + caregiverId;
  const [pending, setPending] = useState(() => readPending(key));
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  // Shown over the list once the dialog has closed.
  const [done, setDone] = useState('');
  const [discard, setDiscard] = useState(false);
  const save = (next: Pending | null) => {
    setPending(next);
    try {
      if (next) sessionStorage.setItem(key, JSON.stringify(next));
      else sessionStorage.removeItem(key);
    } catch {
      setNotice(
        t('Không lưu được tiến độ. Hãy làm xong bước 2 trước khi tải lại hoặc đóng trang.'),
      );
    }
  };
  const who = pending?.name ? `${pending.name} (${pending.email})` : t('Tài khoản vừa tạo');
  return (
    <>
      <button
        className="btn primary"
        onClick={() => {
          setNotice('');
          setDone('');
          setOpen(true);
        }}
      >
        {pending ? t('Tiếp tục liên kết người được chăm sóc') : t('Thêm người được chăm sóc')}
      </button>
      {open && (
        <Dialog title={t('Thêm người được chăm sóc')} onClose={() => setOpen(false)}>
          <div className="stack">
            {discard && (
              <Confirm
                title={t('Bỏ bước liên kết')}
                description={t(
                  '{who} vẫn còn trên hệ thống nhưng chưa có người chăm sóc. Nếu bỏ bước này, bạn cần nhờ quản trị viên liên kết giúp.',
                  { who },
                )}
                onClose={() => setDiscard(false)}
                onConfirm={async () => {
                  save(null);
                  setNotice(t('Đã bỏ bước liên kết.'));
                }}
              />
            )}
            {pending && (
              <button className="btn" onClick={() => setDiscard(true)}>
                {t('Bỏ bước liên kết')}
              </button>
            )}
            <p className="notice" role="status">
              {!pending ? t('Bước 1/2: Tạo tài khoản') : t('Bước 2/2: Thiết lập liên kết chăm sóc')}
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
                submit={t('Bước 1: Tạo tài khoản người khiếm thị')}
                fields={[
                  { key: 'fullName', label: t('Họ và tên'), required: true, min: 2, max: 200 },
                  {
                    key: 'email',
                    label: 'Email',
                    type: 'email',
                    required: true,
                    max: 255,
                    autoComplete: 'off',
                  },
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
                    autoComplete: 'new-password',
                    hint: t('Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.'),
                  },
                  {
                    key: 'confirmation',
                    label: t('Nhập lại mật khẩu'),
                    type: 'password',
                    autoComplete: 'new-password',
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
                    save({ id: person.id, name: person.fullName, email: person.email });
                  } catch (error) {
                    // The email is unique on the server, so sending the same form again cannot
                    // create a second account.
                    if (error instanceof ServiceError && error.status >= 500)
                      throw new Error(
                        t(
                          'Chưa chắc tài khoản đã được tạo. Hãy thử lại với cùng email; nếu báo email đã được đăng ký, hãy nhờ quản trị viên liên kết giúp.',
                        ),
                        { cause: error },
                      );
                    throw error;
                  }
                }}
              />
            ) : (
              <>
                <p>
                  <strong>{who}</strong>
                </p>
                <p>{t('Nếu liên kết thất bại, thử lại bước này. Không cần tạo thêm tài khoản.')}</p>
                <Form
                  key={pending.id}
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
                    await caregivingApi.createLink(pending.id, caregiverId, {
                      canReceiveAlerts: !!values.canReceiveAlerts,
                      canManageRegistry: !!values.canManageRegistry,
                      canManageLocations: !!values.canManageLocations,
                    });
                    save(null);
                    setNotice('');
                    setOpen(false);
                    setDone(t('Đã thêm người được chăm sóc.'));
                    onLinked();
                  }}
                />
              </>
            )}
          </div>
        </Dialog>
      )}
      {done && <Toast message={done} onDismiss={() => setDone('')} />}
    </>
  );
}

import { t } from '../../i18n';
import { ResourcePage } from '../../components/ResourcePage';
export function Contacts() {
  return (
    <ResourcePage
      kind="contacts"
      title={t('Liên hệ khẩn cấp')}
      description={t('Tối đa 5 liên hệ. Số ưu tiên nhỏ hơn được ưu tiên trước; không được trùng.')}
      defaults={{ type: 'PHONE', phone: '', zalo: '', priority: 1 }}
      fields={[
        {
          key: 'type',
          label: t('Loại liên hệ'),
          type: 'select',
          required: true,
          options: [
            { value: 'PHONE', label: t('Điện thoại') },
            { value: 'ZALO', label: 'Zalo' },
            { value: 'BOTH', label: t('Điện thoại và Zalo') },
          ],
        },
        {
          key: 'phone',
          label: t('Số điện thoại'),
          hint: t('Bắt buộc khi liên hệ qua điện thoại. Để trống nếu chỉ dùng Zalo.'),
        },
        {
          key: 'zalo',
          label: t('Định danh Zalo'),
          hint: t('Bắt buộc khi liên hệ qua Zalo. Để trống nếu chỉ dùng điện thoại.'),
        },
        { key: 'priority', label: t('Thứ tự ưu tiên'), type: 'number', min: 1, step: 1 },
      ]}
      details={(e) => (
        <>
          <strong>{t('Ưu tiên {p1}', { p1: String(e.fields.priority) })}</strong>
          <p>{String(e.fields.phone || e.fields.zalo)}</p>
          <small>
            {e.fields.type === 'PHONE'
              ? t('Điện thoại')
              : e.fields.type === 'ZALO'
                ? 'Zalo'
                : t('Điện thoại và Zalo')}
          </small>
        </>
      )}
    />
  );
}

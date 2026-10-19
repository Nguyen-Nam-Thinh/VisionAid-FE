import { ResourcePage } from '../../components/ResourcePage';
export function Contacts() {
  return (
    <ResourcePage
      kind="contacts"
      title="Liên hệ khẩn cấp"
      description="Tối đa 5 liên hệ. Số ưu tiên nhỏ hơn được ưu tiên trước; không được trùng."
      defaults={{ type: 'PHONE', phone: '', zalo: '', priority: 1 }}
      fields={[
        {
          key: 'type',
          label: 'Loại liên hệ',
          type: 'select',
          required: true,
          options: [
            { value: 'PHONE', label: 'Điện thoại' },
            { value: 'ZALO', label: 'Zalo' },
            { value: 'BOTH', label: 'Điện thoại và Zalo' },
          ],
        },
        { key: 'phone', label: 'Số điện thoại', hint: 'Bắt buộc khi liên hệ qua điện thoại. Để trống nếu chỉ dùng Zalo.' },
        { key: 'zalo', label: 'Định danh Zalo', hint: 'Bắt buộc khi liên hệ qua Zalo. Để trống nếu chỉ dùng điện thoại.' },
        { key: 'priority', label: 'Thứ tự ưu tiên', type: 'number', min: 1, step: 1 },
      ]}
      details={(e) => (
        <>
          <strong>Ưu tiên {String(e.fields.priority)}</strong>
          <p>{String(e.fields.phone || e.fields.zalo)}</p>
          <small>{e.fields.type === 'PHONE' ? 'Điện thoại' : e.fields.type === 'ZALO' ? 'Zalo' : 'Điện thoại và Zalo'}</small>
        </>
      )}
    />
  );
}

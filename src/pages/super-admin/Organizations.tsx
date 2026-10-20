import { t } from '../../i18n';
import { ResourcePage } from '../../components/ResourcePage';
export function Organizations() {
  return (
    <ResourcePage
      kind="organizations"
      scope="global"
      title={t('Tổ chức & trung tâm')}
      description={t(
        'Khởi tạo tổ chức và quản lý trạng thái hoạt động. Vô hiệu hóa tổ chức sẽ chặn phiên đăng nhập của thành viên.',
      )}
      allowDelete={false}
      fields={[
        { key: 'address', label: t('Địa chỉ'), required: true },
        { key: 'phone', label: t('Điện thoại liên hệ') },
        { key: 'email', label: t('Email liên hệ'), type: 'email', required: true },
        { key: 'taxCode', label: t('Mã số thuế / giấy phép') },
      ]}
    />
  );
}

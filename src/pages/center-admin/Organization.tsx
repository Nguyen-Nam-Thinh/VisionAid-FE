import { t, msg } from '../../i18n';
import { ResourcePage } from '../../components/ResourcePage';
import type { FieldSpec } from '../../components/Form';
export const organizationFields: FieldSpec[] = [
  { key: 'address', label: msg('Địa chỉ'), required: true },
  { key: 'phone', label: msg('Điện thoại liên hệ') },
  { key: 'email', label: msg('Email liên hệ'), type: 'email', required: true },
  { key: 'taxCode', label: msg('Mã số thuế / giấy phép') },
];
export function Organization() {
  return (
    <ResourcePage
      kind="organizations"
      title={t('Hồ sơ trung tâm')}
      description={t('Thông tin liên hệ và địa chỉ của tổ chức bạn đang quản lý.')}
      scope="org"
      fields={organizationFields}
      allowCreate={false}
      allowDelete={false}
    />
  );
}

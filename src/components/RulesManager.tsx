import { t } from '../i18n';
import { ResourcePage } from './ResourcePage';
export function RulesManager({ global = false }: { global?: boolean }) {
  return (
    <ResourcePage
      kind="rules"
      scope={global ? 'global' : 'org'}
      title={global ? t('Quy tắc thông báo toàn hệ thống') : t('Định tuyến thông báo')}
      description={
        global
          ? t('Quy định kênh và mức bắt buộc mặc định của các loại sự kiện.')
          : t(
              'Tạo quy tắc ghi đè cho trung tâm. Không có ghi đè thì dùng quy tắc toàn hệ thống; chưa gửi thông báo thật.',
            )
      }
      defaults={{ event: 'FALL', push: true, email: true, mandatory: true, recipient: '' }}
      fields={[
        {
          key: 'event',
          label: t('Loại sự kiện'),
          type: 'select',
          required: true,
          options: [
            { value: 'SOS', label: t('SOS khẩn cấp') },
            { value: 'FALL', label: t('Té ngã') },
            { value: 'GEOFENCE', label: t('Vùng an toàn') },
            { value: 'BATTERY', label: t('Pin yếu') },
          ],
        },
        { key: 'push', label: t('Kênh push'), type: 'checkbox' },
        { key: 'email', label: t('Kênh email'), type: 'checkbox' },
        { key: 'mandatory', label: t('Thông báo bắt buộc'), type: 'checkbox' },
        {
          key: 'recipient',
          label: t('Email bàn trực (tùy chọn)'),
          hint: t('Địa chỉ nhận bổ sung trong quy tắc demo; chờ contract BE cho routing thật.'),
        },
      ]}
      details={(e) => (
        <>
          <strong>{String(e.fields.event)}</strong>
          <p>
            {e.fields.push ? 'Push ' : ''}
            {e.fields.email ? 'Email' : ''} · {e.fields.mandatory ? t('Bắt buộc') : t('Tùy chọn')}
          </p>
          <small>{String(e.fields.recipient || t('Người nhận theo liên kết'))}</small>
        </>
      )}
    />
  );
}

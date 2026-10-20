import { t } from '../../i18n';
import { ResourcePage } from '../../components/ResourcePage';
import { useWorkspace } from '../../hooks/useWorkspace';
export function Tts() {
  const { db, selected } = useWorkspace();
  return (
    <ResourcePage
      kind="tts"
      title={t('Giọng đọc hỗ trợ')}
      description={t(
        'Cấu hình từ xa cho người được chăm sóc. Demo chỉ lưu tùy chọn, chưa đồng bộ xuống thiết bị Mobile.',
      )}
      allowCreate={!db?.entities.tts.some((e) => e.viuId === selected?.id)}
      allowDelete={false}
      defaults={{ speed: 1, volume: 80, voice: t('Nữ') }}
      fields={[
        {
          key: 'speed',
          label: t('Tốc độ đọc (0.5–2 lần)'),
          type: 'number',
          min: 0.5,
          max: 2,
          step: 0.1,
        },
        { key: 'volume', label: t('Âm lượng (0–100)'), type: 'number', min: 0, max: 100 },
        {
          key: 'voice',
          label: t('Giọng đọc'),
          type: 'select',
          required: true,
          options: [
            // Values are the mock service enum; only the labels are translated.
            { value: 'Nam', label: t('Nam') },
            // i18n-ignore: mock enum value.
            { value: 'Nữ', label: t('Nữ') },
          ],
        },
      ]}
    />
  );
}

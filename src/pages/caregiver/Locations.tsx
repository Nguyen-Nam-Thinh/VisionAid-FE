import { t, msg } from '../../i18n';
import { useState } from 'react';
import { ResourcePage } from '../../components/ResourcePage';
import type { FieldSpec } from '../../components/Form';
const coordinates: FieldSpec[] = [
  { key: 'lat', label: msg('Vĩ độ'), type: 'number', min: -90, max: 90 },
  { key: 'lng', label: msg('Kinh độ'), type: 'number', min: -180, max: 180 },
  { key: 'radius', label: msg('Bán kính (m)'), type: 'number', min: 1 },
];
export function Locations() {
  const [zone, setZone] = useState(false);
  return (
    <>
      <div className="row" style={{ marginBottom: 20 }}>
        <button className={'btn ' + (!zone ? 'primary' : '')} onClick={() => setZone(false)}>
          {t('Địa điểm đã lưu')}
        </button>
        <button className={'btn ' + (zone ? 'primary' : '')} onClick={() => setZone(true)}>
          {t('Vùng an toàn')}
        </button>
      </div>
      <ResourcePage
        key={String(zone)}
        kind={zone ? 'geofences' : 'places'}
        title={zone ? t('Vùng an toàn') : t('Địa điểm quen thuộc')}
        description={
          zone
            ? t(
                'Vùng tròn, cảnh báo khi đi vào hoặc ra ngoài. Sơ đồ chỉ là bản xem trước mô phỏng.',
              )
            : t('Lưu nơi thường đến và lời nhắc khi đến nơi. Bán kính mặc định 50 m.')
        }
        defaults={{
          lat: 10.841,
          lng: 106.81,
          radius: zone ? 300 : 50,
          enter: false,
          exit: true,
          message: '',
        }}
        fields={[
          ...coordinates,
          ...(zone
            ? [
                { key: 'enter', label: t('Cảnh báo khi đi vào'), type: 'checkbox' as const },
                { key: 'exit', label: t('Cảnh báo khi đi ra'), type: 'checkbox' as const },
              ]
            : [{ key: 'message', label: t('Lời nhắc khi đến nơi'), type: 'textarea' as const }]),
        ]}
        details={(e) => (
          <>
            <span className="mono">
              {Number(e.fields.lat).toFixed(4)}, {Number(e.fields.lng).toFixed(4)}
            </span>
            <p>
              {String(e.fields.radius)} m{' '}
              {zone
                ? t('· Vào: {p0} · Ra: {p1}', {
                    p0: e.fields.enter ? t('bật') : t('tắt'),
                    p1: e.fields.exit ? t('bật') : t('tắt'),
                  })
                : ''}
            </p>
          </>
        )}
      />
    </>
  );
}

import { t } from '../i18n';
import type { Location, Person } from '../models/domain';
import { project } from '../services/maps/adapter';
export function MapPanel({
  locations,
  people,
  onSelect,
}: {
  locations: Location[];
  people: Person[];
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="map" aria-label={t('Sơ đồ vị trí mô phỏng')}>
      {locations.map((l) => (
        <button
          key={l.viuId}
          className="map-pin"
          style={project(l, locations)}
          aria-label={t('Chọn ') + people.find((p) => p.id === l.viuId)?.name}
          onClick={() => onSelect?.(l.viuId)}
        >
          {people
            .find((p) => p.id === l.viuId)
            ?.name.split(' ')
            .at(-1)
            ?.slice(0, 1)}
        </button>
      ))}
      {!locations.length && <p className="empty">{t('Chưa có dữ liệu vị trí.')}</p>}
      <span className="map-caption">
        {t('Sơ đồ mô phỏng · Không phải bản đồ đường đi · Chưa kết nối Mapbox')}
      </span>
    </div>
  );
}

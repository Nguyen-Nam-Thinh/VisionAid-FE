import { t } from '../i18n';
import { Component, lazy, Suspense, type ReactNode } from 'react';
import { runtime } from '../configs/runtime';
import type { MapPoint } from '../services/maps/adapter';

const Canvas = lazy(() => import('./GpsMapCanvas'));

// A failed chunk or SDK crash must not take the tracking table down with it.
class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="notice error" role="alert">
        {t('Không hiển thị được bản đồ. Dữ liệu tọa độ vẫn ở bảng bên dưới.')}
      </p>
    ) : (
      this.props.children
    );
  }
}

/** FE-17: Mapbox map of the latest server positions; the table stays the keyboard equivalent. */
export function GpsMap(props: {
  points: MapPoint[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  if (!runtime.mapboxToken)
    return (
      <p className="notice">
        {t(
          'Chưa cấu hình VITE_MAPBOX_PUBLIC_TOKEN nên chưa hiển thị bản đồ; dữ liệu tọa độ ở bảng bên dưới.',
        )}
      </p>
    );
  return (
    <MapBoundary>
      <Suspense
        fallback={
          <p role="status" className="gps-map-loading">
            {t('Đang tải bản đồ…')}
          </p>
        }
      >
        <Canvas {...props} />
      </Suspense>
    </MapBoundary>
  );
}

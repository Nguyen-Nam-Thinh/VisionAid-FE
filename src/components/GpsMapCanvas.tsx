import { t, useI18n } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { runtime } from '../configs/runtime';
import { coordinates, mapPoints, mapView, type MapPoint } from '../services/maps/adapter';

const styles = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;
type Base = keyof typeof styles;
const baseKey = 'visionaid.map.base';
// Per-viewer convenience only; storage may be unavailable (private mode, blocked site data).
function savedBase(): Base {
  try {
    return localStorage.getItem(baseKey) === 'satellite' ? 'satellite' : 'streets';
  } catch {
    return 'streets';
  }
}
// Close enough to read alley names around one person; bounds never zoom in past it.
const detailZoom = 17;

// Loaded lazily by GpsMap so the Mapbox bundle is fetched only on the tracking page.
export default function GpsMapCanvas({
  points,
  selected,
  onSelect,
}: {
  points: MapPoint[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { locale } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const framed = useRef('');
  const select = useRef(onSelect);
  const [base, setBase] = useState<Base>(savedBase);
  const applied = useRef(base);
  const [failure, setFailure] = useState(() =>
    mapboxgl.supported() ? '' : t('Trình duyệt không hỗ trợ WebGL nên không hiển thị được bản đồ.'),
  );
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!box.current || !mapboxgl.supported()) return;
    mapboxgl.accessToken = runtime.mapboxToken;
    const instance = new mapboxgl.Map({
      container: box.current,
      style: styles[applied.current],
      center: [106.7, 10.78],
      zoom: 11,
      language: locale,
      cooperativeGestures: true,
    });
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    instance.on('error', (e) => {
      // Token, style or network failures; keep the coordinate table as the source of truth.
      if (!instance.isStyleLoaded())
        setFailure(
          t('Không tải được bản đồ Mapbox ({p1}). Dữ liệu tọa độ vẫn ở bảng bên dưới.', {
            p1: (e.error as { status?: number } | undefined)?.status ?? t('lỗi mạng'),
          }),
        );
    });
    map.current = instance;
    return () => {
      popup.current?.remove();
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      instance.remove();
      map.current = null;
      framed.current = '';
    };
    // The map is created once; language and style changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || applied.current === base) return;
    applied.current = base;
    setFailure('');
    // HTML markers and the popup are not style layers, so they survive the style swap.
    instance.setStyle(styles[base]);
  }, [base]);

  useEffect(() => {
    map.current?.setLanguage(locale);
  }, [locale]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    markers.current.forEach((m) => m.remove());
    const valid = mapPoints(points);
    markers.current = valid.map((p) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className =
        'gps-marker' + (p.stale ? ' stale' : '') + (p.id === selected ? ' selected' : '');
      // textContent/aria only: names come from the API and must never be parsed as HTML.
      el.setAttribute(
        'aria-label',
        t('{name} · {state}', {
          name: p.label,
          state: p.stale ? t('Dữ liệu cũ hơn 2 phút') : t('Ghi nhận trong 2 phút gần đây'),
        }),
      );
      el.title = p.label;
      el.addEventListener('click', (event) => {
        // Otherwise the click reaches the map and its closeOnClick shuts the new popup at once.
        event.stopPropagation();
        select.current(p.id);
        const content = document.createElement('div');
        content.className = 'gps-popup';
        const name = document.createElement('strong');
        name.textContent = p.label;
        content.append(name);
        for (const line of p.details ?? []) {
          const row = document.createElement('p');
          row.textContent = line;
          content.append(row);
        }
        popup.current?.remove();
        popup.current = new mapboxgl.Popup({ offset: 18, maxWidth: '280px' })
          .setLngLat(coordinates(p))
          .setDOMContent(content)
          .addTo(instance);
      });
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coordinates(p)).addTo(instance);
      // Mapbox marks custom markers role="img"; keep the native button so keyboard users can select.
      el.removeAttribute('role');
      return marker;
    });
    // Re-frame only when the set of people changes, not on every 30 s refresh.
    const key = valid
      .map((p) => p.id)
      .sort()
      .join(',');
    if (key && key !== framed.current) {
      framed.current = key;
      const view = mapView(valid);
      if (view && 'center' in view) instance.jumpTo({ center: view.center, zoom: detailZoom });
      else if (view)
        instance.fitBounds(view.bounds, { padding: 60, maxZoom: detailZoom, duration: 0 });
    }
  }, [points, selected]);

  const choose = (next: Base) => {
    setBase(next);
    try {
      localStorage.setItem(baseKey, next);
    } catch {
      // Storage unavailable: the choice still applies to this page view.
    }
  };
  return (
    <div className="gps-map-wrap">
      <div className="row" role="group" aria-label={t('Kiểu bản đồ')}>
        {(
          [
            ['streets', t('Bản đồ')],
            ['satellite', t('Vệ tinh')],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={'btn small' + (base === value ? ' primary' : '')}
            aria-pressed={base === value}
            onClick={() => choose(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={box}
        className="gps-map"
        role="region"
        aria-label={t('Bản đồ vị trí; danh sách tương đương ở bảng bên dưới')}
      />
      {failure && (
        <p className="notice error" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}

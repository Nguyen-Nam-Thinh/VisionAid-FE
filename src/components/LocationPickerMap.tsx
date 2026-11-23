import { t, useI18n } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { runtime } from '../configs/runtime';

const style = 'mapbox://styles/mapbox/streets-v12';
const circleSource = 'picker-radius';

/** A circle of `meters` around the point as a 64-sided polygon, for the radius preview. */
function circle(lng: number, lat: number, meters: number) {
  const points: [number, number][] = [];
  const dLat = meters / 111320;
  const dLng = meters / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    points.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [points] },
  };
}

// Loaded lazily by LocationPicker so the Mapbox bundle is fetched only when a place is edited.
export default function LocationPickerMap({
  lat,
  lng,
  radius,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  radius: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const { locale } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const pick = useRef(onPick);
  const [failure, setFailure] = useState(() =>
    mapboxgl.supported() ? '' : t('Trình duyệt không hỗ trợ WebGL nên không hiển thị được bản đồ.'),
  );
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!box.current || !mapboxgl.supported()) return;
    mapboxgl.accessToken = runtime.mapboxToken;
    const instance = new mapboxgl.Map({
      container: box.current,
      style,
      center: [lng ?? 106.7, lat ?? 10.78],
      zoom: lat === null ? 11 : 16,
      language: locale,
    });
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    instance.on('error', () => {
      if (!instance.isStyleLoaded())
        setFailure(t('Không tải được bản đồ. Bạn vẫn có thể tìm địa chỉ hoặc nhập tọa độ.'));
    });
    instance.on('load', () => {
      instance.addSource(circleSource, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      instance.addLayer({
        id: circleSource,
        type: 'fill',
        source: circleSource,
        paint: { 'fill-color': '#f2c230', 'fill-opacity': 0.25 },
      });
      instance.addLayer({
        id: circleSource + '-line',
        type: 'line',
        source: circleSource,
        paint: { 'line-color': '#1b1d19', 'line-width': 2, 'line-dasharray': [2, 1] },
      });
    });
    instance.on('click', (event) => pick.current(event.lngLat.lat, event.lngLat.lng));
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // The map is created once; later position changes move the marker below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || lat === null || lng === null) return;
    if (!marker.current) {
      marker.current = new mapboxgl.Marker({ draggable: true, color: '#1b1d19' })
        .setLngLat([lng, lat])
        .addTo(instance);
      marker.current.on('dragend', () => {
        const at = marker.current!.getLngLat();
        pick.current(at.lat, at.lng);
      });
    } else marker.current.setLngLat([lng, lat]);
    const draw = () =>
      (instance.getSource(circleSource) as mapboxgl.GeoJSONSource | undefined)?.setData(
        circle(lng, lat, radius),
      );
    if (instance.isStyleLoaded()) draw();
    else instance.once('load', draw);
    // Follow the pin (search result, click or drag), zooming in when it was far away.
    const bounds = instance.getBounds();
    if (bounds && !bounds.contains([lng, lat]))
      instance.flyTo({ center: [lng, lat], zoom: 16, duration: 600 });
    else instance.easeTo({ center: [lng, lat], duration: 300 });
  }, [lat, lng, radius]);

  return (
    <div className="location-picker-map">
      <div ref={box} className="location-picker-canvas" />
      {failure && (
        <p className="notice error" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}

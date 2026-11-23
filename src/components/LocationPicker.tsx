import { t } from '../i18n';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import { MapPin, Search } from 'lucide-react';
import { runtime } from '../configs/runtime';

const LocationPickerMap = lazy(() => import('./LocationPickerMap'));

type Place = { label: string; lat: number; lng: number };

/**
 * Mapbox address search, limited to Vietnam and answered in Vietnamese. Results near the pin
 * (or near the viewer's network location when there is no pin yet) come first, so "Nguyễn Trãi"
 * finds the street in the user's city rather than one in another province.
 */
async function searchAddress(
  text: string,
  near: [number, number] | null,
  signal: AbortSignal,
): Promise<Place[]> {
  const url =
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
    encodeURIComponent(text) +
    '.json?' +
    new URLSearchParams({
      access_token: runtime.mapboxToken,
      country: 'vn',
      language: 'vi',
      limit: '5',
      autocomplete: 'true',
      types: 'address,poi,neighborhood,locality,place',
      proximity: near ? `${near[1]},${near[0]}` : 'ip',
    });
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(String(response.status));
  const data = (await response.json()) as {
    features?: { place_name?: string; center?: [number, number] }[];
  };
  return (data.features ?? [])
    .filter((f) => f.center && f.place_name)
    .map((f) => ({ label: f.place_name!, lng: f.center![0], lat: f.center![1] }));
}

/**
 * Picks a point without typing coordinates: search an address, or click / drag on the map.
 * The coordinates stay in the form (and in `manual` for keyboard users) behind the scenes.
 */
export function LocationPicker({
  lat,
  lng,
  radius,
  onPick,
  manual,
}: {
  lat: number | null;
  lng: number | null;
  radius: number;
  onPick: (lat: number, lng: number) => void;
  /** Coordinate inputs, offered folded for people who already know them. */
  manual: ReactNode;
}) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [chosen, setChosen] = useState('');
  const search = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const controller = new AbortController();
      const near: [number, number] | null =
        lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)
          ? [lat, lng]
          : null;
      setResults(await searchAddress(text.trim(), near, controller.signal));
    } catch {
      setError(t('Không tìm được địa chỉ lúc này. Hãy bấm trực tiếp lên bản đồ.'));
      setResults(null);
    } finally {
      setBusy(false);
    }
  };
  const has = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
  return (
    <div className="field location-picker">
      <span className="location-picker-label">{t('Vị trí *')}</span>
      <div className="row location-picker-search">
        <input
          aria-label={t('Tìm địa chỉ')}
          placeholder={t('Gõ địa chỉ, ví dụ 12 Nguyễn Trãi, Quận 5')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void search();
            }
          }}
        />
        <button type="button" className="btn" disabled={busy || !text.trim()} onClick={search}>
          <Search size={16} aria-hidden="true" />
          {busy ? t('Đang tìm…') : t('Tìm')}
        </button>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {results && (
        <ul className="location-picker-results" aria-label={t('Kết quả tìm địa chỉ')}>
          {results.length ? (
            results.map((place) => (
              <li key={place.label + place.lat}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(place.lat, place.lng);
                    setChosen(place.label);
                    setResults(null);
                  }}
                >
                  <MapPin size={16} aria-hidden="true" />
                  {place.label}
                </button>
              </li>
            ))
          ) : (
            <li className="muted">
              {t('Không thấy địa chỉ này. Thử gõ ngắn hơn hoặc bấm lên bản đồ.')}
            </li>
          )}
        </ul>
      )}
      <Suspense fallback={<div className="location-picker-canvas" aria-hidden="true" />}>
        <LocationPickerMap
          lat={has ? lat : null}
          lng={has ? lng : null}
          radius={radius}
          onPick={(nextLat, nextLng) => {
            onPick(nextLat, nextLng);
            setChosen('');
          }}
        />
      </Suspense>
      <small role="status">
        {has
          ? chosen
            ? t('Đã chọn: {place}. Có thể kéo ghim để chỉnh cho đúng chỗ.', { place: chosen })
            : t('Đã chọn một điểm trên bản đồ. Có thể kéo ghim để chỉnh cho đúng chỗ.')
          : t('Tìm địa chỉ ở trên hoặc bấm lên bản đồ để đặt ghim.')}
      </small>
      <details className="location-picker-manual">
        <summary>{t('Nhập tọa độ (nếu bạn đã có)')}</summary>
        {manual}
      </details>
    </div>
  );
}

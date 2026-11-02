import { RefreshCw } from 'lucide-react';
import { t, msg, tText, formatLocaleDateTime } from '../../i18n';
import { useMemo, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { useNow } from '../../hooks/useNow';
import { caregivingApi } from '../../services/api/caregiving';
import {
  locationsApi,
  filterFleet,
  historyRange,
  locationAge,
  type FleetFilter,
} from '../../services/api/locations';
import { ServiceError } from '../../services/contracts';
import { Badge, PageHead, State } from '../../components/UI';
import { GpsMap } from '../../components/GpsMap';
import { FilterPanel } from '../../components/FilterPanel';
import type { Person } from '../../models/domain';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const time = (value: string) => formatLocaleDateTime(value, { timeZone: timezone, hour12: false });
const optional = (value: number | null, unit: string) =>
  value === null ? t('Không có dữ liệu') : `${value} ${unit}`;
type Viu = { id: string; fullName: string; email: string; isActive: boolean };
export function ApiTracking() {
  const { data: actor } = useSession();
  if (actor?.role === 'CenterAdmin') return <Fleet key={actor.id + actor.orgId} actor={actor} />;
  return actor?.role === 'Caregiver' ? (
    <Tracking key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
const fleetFilters: { value: FleetFilter; label: string }[] = [
  { value: 'all', label: msg('Tất cả') },
  { value: 'safe', label: msg('An toàn') },
  { value: 'alert', label: msg('Cảnh báo') },
];
/** F-25 / TC-FE53-01..04: every active VIU of the organization from one request. */
function Fleet({ actor }: { actor: Person }) {
  const now = useNow();
  const [filter, setFilter] = useState<FleetFilter>('all');
  const [selected, setSelected] = useState('');
  const fleet = useQuery({
    queryKey: ['api-location-fleet', actor.id, actor.orgId],
    queryFn: ({ signal }) => locationsApi.fleet(actor, signal),
    // SignalR refreshes at most every 2 s; this keeps the map current if events are missed.
    refetchInterval: 30000,
    retry: false,
  });
  const all = fleet.data ?? [];
  const shown = filterFleet(all, filter);
  const alerts = all.filter((item) => item.hasOpenAlert).length;
  const freshness = Math.floor(now / 30000);
  const points = useMemo(
    () =>
      shown.flatMap((item) =>
        item.latitude !== null && item.longitude !== null && item.cachedAt
          ? [
              {
                id: item.viuId,
                label: item.fullName,
                lat: item.latitude,
                lng: item.longitude,
                stale: now - Date.parse(item.cachedAt) > 120000,
                alert: item.hasOpenAlert,
                details: [
                  ...(item.hasOpenAlert ? [t('Đang có cảnh báo chưa xử lý xong')] : []),
                  item.formattedAddress || t('Chưa có địa chỉ'),
                  t('Ghi nhận GPS: {time}', { time: time(item.cachedAt) }),
                ],
              },
            ]
          : [],
      ),
    // `now` changes every second; the points only need the 30 s freshness bucket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, freshness],
  );
  // Revoked access: drop the last known data instead of keeping a stale person's history open.
  const forbidden = fleet.error instanceof ServiceError && [401, 403].includes(fleet.error.status);
  const person = forbidden ? undefined : all.find((item) => item.viuId === selected);
  return (
    <>
      <PageHead
        title={t('Bản đồ toàn trung tâm')}
        description={t('Vị trí gần nhất của mọi người khiếm thị đang hoạt động trong trung tâm.')}
      />
      <section className="glass card stack">
        <div className="row between">
          <div className="row" role="group" aria-label={t('Lọc theo tình trạng cảnh báo')}>
            {fleetFilters.map((option) => (
              <button
                key={option.value}
                type="button"
                className={'btn small' + (filter === option.value ? ' primary' : '')}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {tText(option.label)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            disabled={fleet.isFetching}
            onClick={() => void fleet.refetch()}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('Tải lại vị trí')}
          </button>
        </div>
        <State loading={fleet.isPending} error={fleet.error} retry={() => fleet.refetch()}>
          {fleet.data && (
            <>
              <p role="status">
                {t('{total} người khiếm thị · {alerts} đang có cảnh báo · Đang hiện {shown}', {
                  total: all.length,
                  alerts,
                  shown: shown.length,
                })}
              </p>
              <p>{t('Thời gian hiển thị theo {timezone}.', { timezone })}</p>
              <GpsMap points={points} selected={selected} onSelect={setSelected} />
              {!shown.length ? (
                <p>{t('Không có người khiếm thị phù hợp bộ lọc.')}</p>
              ) : (
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label={t('Dữ liệu vị trí')}
                >
                  <table className="tracking-table">
                    <thead>
                      <tr>
                        <th>{t('Người được theo dõi')}</th>
                        <th>{t('Cảnh báo')}</th>
                        <th>{t('Tọa độ (vĩ độ, kinh độ)')}</th>
                        <th>{t('Thời gian ghi nhận')}</th>
                        <th>{t('Thao tác')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((item) => {
                        const located = item.latitude !== null && item.longitude !== null;
                        return (
                          <tr key={item.viuId}>
                            <td>
                              {item.fullName}
                              {item.formattedAddress && (
                                <>
                                  <br />
                                  <small>{item.formattedAddress}</small>
                                </>
                              )}
                            </td>
                            <td>
                              <Badge tone={item.hasOpenAlert ? 'red' : 'green'}>
                                {item.hasOpenAlert ? t('Đang có cảnh báo') : t('An toàn')}
                              </Badge>
                            </td>
                            <td>
                              {located
                                ? `${item.latitude!.toFixed(6)}, ${item.longitude!.toFixed(6)}`
                                : t('Chưa có vị trí')}
                            </td>
                            <td>
                              {item.cachedAt ? (
                                <>
                                  {time(item.cachedAt)}
                                  <br />
                                  <Badge
                                    tone={
                                      now - Date.parse(item.cachedAt) > 120000 ? 'amber' : 'green'
                                    }
                                  >
                                    {locationAge(item.cachedAt, now)}
                                  </Badge>
                                </>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <button
                                className="btn"
                                onClick={() => setSelected(item.viuId)}
                                aria-label={t('Xem GPS của ') + item.fullName}
                              >
                                {t('Vị trí & lịch sử')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </State>
      </section>
      {person && (
        <section className="glass card stack" aria-label={t('GPS của ') + person.fullName}>
          <h2>{t('{fullName}: vị trí và lịch sử', { fullName: person.fullName })}</h2>
          {person.latitude === null && (
            <p>{t('Chưa có vị trí khả dụng. Lịch sử bên dưới có thể vẫn còn dữ liệu.')}</p>
          )}
          <MovementHistory key={person.viuId} actor={actor} viuId={person.viuId} />
        </section>
      )}
    </>
  );
}
function Tracking({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const users = useQuery({
    queryKey: ['api-tracking-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  return (
    <>
      <PageHead
        title={t('Bản đồ theo dõi')}
        description={t('Vị trí ghi nhận và lịch sử di chuyển của người được phép theo dõi.')}
      />
      <section className="glass card stack">
        <FilterPanel
          active={search ? 1 : 0}
          onApply={(form) => {
            setPage(1);
            setSearch(String(new FormData(form).get('search') || '').trim());
          }}
          onReset={() => {
            setPage(1);
            setSearch('');
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={users.isFetching}
              onClick={() => void users.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại danh sách')}
            </button>
          }
        >
          <label className="field wide">
            {t('Tìm người được theo dõi')}
            <input name="search" placeholder={t('Tên, email, điện thoại')} />
          </label>
        </FilterPanel>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          {users.data && (
            <>
              {!users.data.items.length && (
                <p>{t('Chưa có người dùng phù hợp hoặc liên kết được phép xem.')}</p>
              )}
              <div className="row">
                <span>
                  {t('{totalCount} người · Trang {page}/{p4}', {
                    totalCount: users.data.totalCount,
                    page: users.data.page,
                    p4: Math.max(1, users.data.totalPages),
                  })}
                </span>
                <button
                  className="btn"
                  disabled={users.isFetching || !users.data.hasPreviousPage}
                  onClick={() => setPage(page - 1)}
                >
                  {t('Trang người dùng trước')}
                </button>
                <button
                  className="btn"
                  disabled={users.isFetching || !users.data.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  {t('Trang người dùng sau')}
                </button>
              </div>
              <PageLocations key={page + ':' + search} actor={actor} people={users.data.items} />
            </>
          )}
        </State>
      </section>
    </>
  );
}
function PageLocations({ actor, people }: { actor: Person; people: Viu[] }) {
  const cache = useQueryClient();
  const now = useNow();
  const [selected, setSelected] = useState('');
  const live = useQueries({
    queries: people.map((person) => ({
      queryKey: ['api-location-live', actor.id, actor.orgId, person.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => locationsApi.live(actor, person.id, signal),
      refetchInterval: 30000,
      retry: false,
    })),
  });
  const fixes = live.map((q) => (q.isError ? '' : (q.data?.cachedAt ?? ''))).join('|');
  const freshness = Math.floor(now / 30000);
  const points = useMemo(
    () =>
      people.flatMap((person, i) => {
        const point = live[i]?.isError ? undefined : live[i]?.data;
        return point
          ? [
              {
                id: person.id,
                label: person.fullName,
                lat: point.latitude,
                lng: point.longitude,
                stale: now - Date.parse(point.cachedAt) > 120000,
                details: [
                  point.formattedAddress || t('Chưa có địa chỉ'),
                  t('Ghi nhận GPS: {time}', { time: time(point.cachedAt) }),
                ],
              },
            ]
          : [];
      }),
    // `fixes` tracks each person's latest fix; `live` itself is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [people, fixes, freshness],
  );
  const selectedIndex = people.findIndex((p) => p.id === selected);
  const person = people[selectedIndex];
  const current = live[selectedIndex];
  const forbidden =
    current?.error instanceof ServiceError && [401, 403].includes(current.error.status);
  return (
    <div className="stack">
      <p>
        {t(
          'Thời gian hiển thị theo {timezone}. Danh sách này chỉ lấy vị trí của tối đa 10 người trên trang hiện tại.',
          { timezone },
        )}
      </p>
      <GpsMap points={points} selected={selected} onSelect={setSelected} />
      <button
        className="btn"
        disabled={live.some((q) => q.isFetching)}
        onClick={() =>
          void cache.invalidateQueries({ queryKey: ['api-location-live', actor.id, actor.orgId] })
        }
      >
        <RefreshCw size={16} aria-hidden="true" />
        {t('Tải lại vị trí')}
      </button>
      <div className="table-scroll" tabIndex={0} role="region" aria-label={t('Dữ liệu vị trí')}>
        <table className="tracking-table">
          <thead>
            <tr>
              <th>{t('Người được theo dõi')}</th>
              <th>{t('Tọa độ (vĩ độ, kinh độ)')}</th>
              <th>{t('Thời gian ghi nhận')}</th>
              <th>{t('Độ mới / lỗi')}</th>
              <th>{t('Thao tác')}</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person, i) => {
              const q = live[i];
              const point = !q.isError ? q.data : undefined;
              return (
                <tr key={person.id}>
                  <td>
                    {person.fullName}
                    <br />
                    {person.email}
                    {!person.isActive && <p>{t('Tài khoản vô hiệu hóa')}</p>}
                  </td>
                  <td>
                    {point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : '—'}
                  </td>
                  <td>{point ? time(point.cachedAt) : '—'}</td>
                  <td>
                    {q.isPending ? (
                      t('Đang tải…')
                    ) : q.error ? (
                      <span role="status">
                        {q.error instanceof ServiceError && q.error.status === 404
                          ? t('Chưa có vị trí khả dụng')
                          : q.error.message}
                      </span>
                    ) : (
                      point && (
                        <Badge
                          tone={
                            locationAge(point.cachedAt, now).startsWith(t('Ghi nhận'))
                              ? 'green'
                              : 'amber'
                          }
                        >
                          {locationAge(point.cachedAt, now)}
                        </Badge>
                      )
                    )}
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="btn"
                        onClick={() => setSelected(person.id)}
                        aria-label={t('Xem GPS của ') + person.fullName}
                      >
                        {t('Vị trí & lịch sử')}
                      </button>
                      {q.isError && (
                        <button
                          className="btn"
                          disabled={q.isFetching}
                          onClick={() => void q.refetch()}
                        >
                          <RefreshCw size={16} aria-hidden="true" />
                          {t('Thử lại vị trí')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {person && current && (
        <section className="stack" aria-label={t('GPS của ') + person.fullName}>
          <h2>{t('{fullName}: vị trí và lịch sử', { fullName: person.fullName })}</h2>
          {current.error instanceof ServiceError && current.error.status === 404 ? (
            <p>{t('Chưa có vị trí khả dụng. Lịch sử bên dưới có thể vẫn còn dữ liệu.')}</p>
          ) : (
            <State
              loading={current.isPending}
              error={current.error}
              retry={() => current.refetch()}
            >
              {current.data && (
                <>
                  <p>
                    {t('Địa chỉ:')} {current.data.formattedAddress || t('Chưa có địa chỉ')}
                  </p>
                  <p>
                    {t('Vĩ độ: {latitude} · Kinh độ: {longitude}', {
                      latitude: current.data.latitude,
                      longitude: current.data.longitude,
                    })}
                  </p>
                  <p>
                    {t('Ghi nhận GPS: {p1} · Máy chủ cập nhật: {p5}', {
                      p1: time(current.data.cachedAt),
                      p5: time(current.data.updatedAt),
                    })}
                  </p>
                  <p>
                    {t(
                      'Pin, mạng và độ chính xác của vị trí hiện tại không có trong API này. Xem giá trị tại từng bản ghi lịch sử bên dưới.',
                    )}
                  </p>
                </>
              )}
            </State>
          )}
          {!forbidden && <MovementHistory key={person.id} actor={actor} viuId={person.id} />}
        </section>
      )}
    </div>
  );
}
function MovementHistory({ actor, viuId }: { actor: Person; viuId: string }) {
  const [range, setRange] = useState({ dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['api-location-history', actor.id, actor.orgId, viuId, page, range],
    queryFn: ({ signal }) => locationsApi.history(actor, viuId, page, range, signal),
    retry: false,
  });
  return (
    <div className="stack">
      <h3>{t('Lịch sử di chuyển')}</h3>
      <FilterPanel
        active={[range.dateFrom, range.dateTo].filter(Boolean).length}
        submitLabel={t('Lọc lịch sử')}
        onApply={(form) => {
          const data = new FormData(form);
          try {
            setRange(historyRange(String(data.get('from') || ''), String(data.get('to') || '')));
            setPage(1);
            setError('');
          } catch (err) {
            setError(err instanceof Error ? err.message : t('Thời gian không hợp lệ.'));
          }
        }}
        onReset={() => {
          setRange({ dateFrom: '', dateTo: '' });
          setPage(1);
          setError('');
        }}
        tools={
          <button
            type="button"
            className="btn"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('Tải lại lịch sử')}
          </button>
        }
      >
        <div className="filter-range wide">
          <label className="field">
            {t('Từ thời gian')}
            <input type="datetime-local" name="from" />
          </label>
          <label className="field">
            {t('Đến thời gian')}
            <input type="datetime-local" name="to" />
          </label>
        </div>
      </FilterPanel>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            {!query.data.items.length && <p>{t('Không có lịch sử trong khoảng thời gian này.')}</p>}
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={t('Dữ liệu vị trí')}
            >
              <table className="tracking-table">
                <thead>
                  <tr>
                    <th>{t('Ghi nhận ({timezone})', { timezone })}</th>
                    <th>{t('Vĩ độ / kinh độ')}</th>
                    <th>{t('Độ chính xác')}</th>
                    <th>{t('Độ cao')}</th>
                    <th>{t('Tốc độ')}</th>
                    <th>{t('Hướng')}</th>
                    <th>{t('Pin')}</th>
                    <th>{t('Mạng lúc ghi nhận')}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((point) => (
                    <tr key={point.id}>
                      <td>{time(point.recordedAt)}</td>
                      <td>
                        {point.latitude.toFixed(6)} / {point.longitude.toFixed(6)}
                      </td>
                      <td>{optional(point.accuracyMeters, 'm')}</td>
                      <td>{optional(point.altitude, 'm')}</td>
                      <td>{optional(point.speedMps, 'm/s')}</td>
                      <td>{optional(point.heading, '°')}</td>
                      <td>{optional(point.batteryLevel, '%')}</td>
                      <td>
                        {point.networkStatus === null
                          ? t('Không có dữ liệu')
                          : {
                              Wifi: 'Wi-Fi',
                              Mobile4G: '4G',
                              Mobile3G: '3G',
                              Offline: t('Ngoại tuyến'),
                            }[point.networkStatus] || point.networkStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row">
              <span>
                {t('{totalCount} bản ghi · Trang {page}/{p4}', {
                  totalCount: query.data.totalCount,
                  page: query.data.page,
                  p4: Math.max(1, query.data.totalPages),
                })}
              </span>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasPreviousPage}
                onClick={() => setPage(page - 1)}
              >
                {t('Lịch sử trước')}
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                {t('Lịch sử sau')}
              </button>
            </div>
          </>
        )}
      </State>
    </div>
  );
}

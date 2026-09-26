import { useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { useNow } from '../../hooks/useNow';
import { caregivingApi } from '../../services/api/caregiving';
import { accountsApi } from '../../services/api/accounts';
import { locationsApi, historyRange, locationAge } from '../../services/api/locations';
import { ServiceError } from '../../services/contracts';
import { Badge, PageHead, State } from '../../components/UI';
import type { Person } from '../../models/domain';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const time = (value: string) =>
  new Date(value).toLocaleString('vi-VN', { timeZone: timezone, hour12: false });
const optional = (value: number | null, unit: string) =>
  value === null ? 'Không có dữ liệu' : `${value} ${unit}`;
type Viu = { id: string; fullName: string; email: string; isActive: boolean };
export function ApiTracking() {
  const { data: actor } = useSession();
  return actor && ['Caregiver', 'CenterAdmin'].includes(actor.role) ? (
    <Tracking key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function Tracking({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const users = useQuery({
    queryKey: ['api-tracking-users', actor.id, actor.orgId, page, search],
    queryFn: async ({ signal }) =>
      actor.role === 'Caregiver'
        ? caregivingApi.users(page, search, signal)
        : accountsApi.list(
            actor,
            {
              page,
              search,
              role: 'VisuallyImpaired',
              active: '',
              deleted: 'false',
              organizationId: actor.orgId,
            },
            signal,
          ),
    refetchInterval: 30000,
  });
  return (
    <>
      <PageHead
        title={actor.role === 'CenterAdmin' ? 'Theo dõi GPS trung tâm' : 'Theo dõi vị trí GPS'}
        description="Vị trí ghi nhận và lịch sử di chuyển của người được phép theo dõi."
      />
      <p className="notice">
        Tự tải lại vị trí mỗi 30 giây khi tab hoạt động. Chưa có kết nối realtime. Bản đồ nền đang
        chờ cấu hình Mapbox; bên dưới là dữ liệu tọa độ từ máy chủ.
      </p>
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(draft.trim());
          }}
        >
          <label className="field">
            Tìm người được theo dõi
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tên, email, điện thoại"
            />
          </label>
          <button className="btn">Tìm kiếm</button>
          <button
            type="button"
            className="btn"
            disabled={users.isFetching}
            onClick={() => void users.refetch()}
          >
            Tải lại danh sách
          </button>
        </form>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          {users.data && (
            <>
              {!users.data.items.length && (
                <p>Chưa có người dùng phù hợp hoặc liên kết được phép xem.</p>
              )}
              <div className="row">
                <span>
                  {users.data.totalCount} người · Trang {users.data.page}/
                  {Math.max(1, users.data.totalPages)}
                </span>
                <button
                  className="btn"
                  disabled={users.isFetching || !users.data.hasPreviousPage}
                  onClick={() => setPage(page - 1)}
                >
                  Trang người dùng trước
                </button>
                <button
                  className="btn"
                  disabled={users.isFetching || !users.data.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  Trang người dùng sau
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
  const selectedIndex = people.findIndex((p) => p.id === selected);
  const person = people[selectedIndex];
  const current = live[selectedIndex];
  const forbidden =
    current?.error instanceof ServiceError && [401, 403].includes(current.error.status);
  return (
    <div className="stack">
      <p>
        Thời gian hiển thị theo {timezone}. Danh sách này chỉ lấy vị trí của tối đa 10 người trên
        trang hiện tại.
      </p>
      <button
        className="btn"
        disabled={live.some((q) => q.isFetching)}
        onClick={() =>
          void cache.invalidateQueries({ queryKey: ['api-location-live', actor.id, actor.orgId] })
        }
      >
        Tải lại vị trí
      </button>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Người được theo dõi</th>
              <th>Tọa độ (vĩ độ, kinh độ)</th>
              <th>Thời gian ghi nhận</th>
              <th>Độ mới / lỗi</th>
              <th>Thao tác</th>
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
                    {!person.isActive && <p>Tài khoản vô hiệu hóa</p>}
                  </td>
                  <td>
                    {point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : '—'}
                  </td>
                  <td>{point ? time(point.cachedAt) : '—'}</td>
                  <td>
                    {q.isPending ? (
                      'Đang tải…'
                    ) : q.error ? (
                      <span role="status">
                        {q.error instanceof ServiceError && q.error.status === 404
                          ? 'Chưa có vị trí khả dụng'
                          : q.error.message}
                      </span>
                    ) : (
                      point && (
                        <Badge
                          tone={
                            locationAge(point.cachedAt, now).startsWith('Ghi nhận')
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
                    <button
                      className="btn"
                      onClick={() => setSelected(person.id)}
                      aria-label={'Xem GPS của ' + person.fullName}
                    >
                      Vị trí & lịch sử
                    </button>
                    {q.isError && (
                      <button
                        className="btn"
                        disabled={q.isFetching}
                        onClick={() => void q.refetch()}
                      >
                        Thử lại vị trí
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {person && current && (
        <section className="stack" aria-label={'GPS của ' + person.fullName}>
          <h2>{person.fullName} — vị trí & lịch sử</h2>
          {current.error instanceof ServiceError && current.error.status === 404 ? (
            <p>Chưa có vị trí khả dụng. Lịch sử bên dưới có thể vẫn còn dữ liệu.</p>
          ) : (
            <State
              loading={current.isPending}
              error={current.error}
              retry={() => current.refetch()}
            >
              {current.data && (
                <>
                  <p>Địa chỉ: {current.data.formattedAddress || 'Chưa có địa chỉ'}</p>
                  <p>
                    Vĩ độ: {current.data.latitude} · Kinh độ: {current.data.longitude}
                  </p>
                  <p>
                    Ghi nhận GPS: {time(current.data.cachedAt)} · Máy chủ cập nhật:{' '}
                    {time(current.data.updatedAt)}
                  </p>
                  <p>
                    Pin, mạng và độ chính xác của vị trí hiện tại không có trong API này. Xem giá
                    trị tại từng bản ghi lịch sử bên dưới.
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
      <h3>Lịch sử di chuyển</h3>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            setRange(historyRange(from, to));
            setPage(1);
            setError('');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Thời gian không hợp lệ.');
          }
        }}
      >
        <label className="field">
          Từ thời gian
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field">
          Đến thời gian
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button className="btn">Lọc lịch sử</button>
        <button
          type="button"
          className="btn"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Tải lại lịch sử
        </button>
      </form>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            {!query.data.items.length && <p>Không có lịch sử trong khoảng thời gian này.</p>}
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Ghi nhận ({timezone})</th>
                    <th>Vĩ độ / kinh độ</th>
                    <th>Độ chính xác</th>
                    <th>Độ cao</th>
                    <th>Tốc độ</th>
                    <th>Hướng</th>
                    <th>Pin</th>
                    <th>Mạng lúc ghi nhận</th>
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
                          ? 'Không có dữ liệu'
                          : {
                              Wifi: 'Wi-Fi',
                              Mobile4G: '4G',
                              Mobile3G: '3G',
                              Offline: 'Ngoại tuyến',
                            }[point.networkStatus] || point.networkStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row">
              <span>
                {query.data.totalCount} bản ghi · Trang {query.data.page}/
                {Math.max(1, query.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasPreviousPage}
                onClick={() => setPage(page - 1)}
              >
                Lịch sử trước
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Lịch sử sau
              </button>
            </div>
          </>
        )}
      </State>
    </div>
  );
}

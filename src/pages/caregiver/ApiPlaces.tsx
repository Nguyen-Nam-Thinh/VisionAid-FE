import { RefreshCw } from 'lucide-react';
import { t, tText } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { useLimit } from '../../hooks/useLimit';
import { caregivingApi } from '../../services/api/caregiving';
import { placesApi, type Place, type PlaceKind } from '../../services/api/places';
import { FilterPanel } from '../../components/FilterPanel';
import { PageHead, State, Dialog, Confirm, Badge } from '../../components/UI';
import { Form, type FieldSpec } from '../../components/Form';
import type { Person, Fields } from '../../models/domain';
import { uiStore, useUI } from '../../stores/ui';

export function ApiPlaces() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? <Places key={actor.id + actor.orgId} actor={actor} /> : null;
}
function Places({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Shared with the other care-recipient pages; cleared on logout via uiStore.clear().
  const { selectedViu: selected } = useUI();
  const setSelected = (id: string) => uiStore.set({ selectedViu: id });
  const users = useQuery({
    queryKey: ['api-place-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  const person =
    users.data?.items.find((item) => item.id === selected) ??
    // Only one care recipient in scope: select them instead of asking.
    (!selected && users.data?.totalCount === 1 ? users.data.items[0] : undefined);
  return (
    <>
      <PageHead
        title={t('Địa điểm và vùng an toàn')}
        description={t('Lưu nơi thường đến và cấu hình vùng tròn cho người được chăm sóc.')}
      />
      <section className="glass card stack">
        <FilterPanel
          active={search ? 1 : 0}
          onApply={(form) => {
            setSearch(String(new FormData(form).get('search') || '').trim());
            setPage(1);
            setSelected('');
          }}
          onReset={() => {
            setSearch('');
            setPage(1);
            setSelected('');
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={users.isFetching}
              onClick={() => void users.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại người dùng')}
            </button>
          }
        >
          <label className="field wide">
            {t('Tìm người được chăm sóc')}
            <input name="search" placeholder={t('Tên, email hoặc số điện thoại')} />
          </label>
        </FilterPanel>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          <label className="field">
            {t('Người được chăm sóc')}
            <select value={person?.id || ''} onChange={(e) => setSelected(e.target.value)}>
              <option value="">{t('Chọn người được chăm sóc')}</option>
              {users.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} · {item.email}
                </option>
              ))}
            </select>
          </label>
          {!person && (
            <p className="notice">
              {t(
                'Chọn người được chăm sóc ở trên để xem danh sách và thêm mới thông tin cho đúng người.',
              )}
            </p>
          )}
          {users.data && (
            <div className="row pagination">
              <span>
                {t('{totalCount} người · Trang {page}/{p4}', {
                  totalCount: users.data.totalCount,
                  page,
                  p4: Math.max(1, users.data.totalPages),
                })}
              </span>
              <button
                className="btn"
                disabled={!users.data.hasPreviousPage || users.isFetching}
                onClick={() => {
                  setPage(page - 1);
                  setSelected('');
                }}
              >
                {t('Trang trước')}
              </button>
              <button
                className="btn"
                disabled={!users.data.hasNextPage || users.isFetching}
                onClick={() => {
                  setPage(page + 1);
                  setSelected('');
                }}
              >
                {t('Trang sau')}
              </button>
            </div>
          )}
          {!users.data?.items.length && <p>{t('Chưa có người được chăm sóc phù hợp.')}</p>}
        </State>
      </section>
      {!users.error && person && (
        <PlaceList
          key={actor.id + person.id}
          actor={actor}
          viuId={person.id}
          name={person.fullName}
        />
      )}
    </>
  );
}
function PlaceList({ actor, viuId, name }: { actor: Person; viuId: string; name: string }) {
  const [kind, setKind] = useState<PlaceKind>('saved-locations');
  return (
    <section className="glass card stack">
      <h2>{t('Địa điểm của {name}', { name })}</h2>
      <div className="row" aria-label={t('Loại địa điểm')}>
        <button
          className={'btn ' + (kind === 'saved-locations' ? 'primary' : '')}
          aria-pressed={kind === 'saved-locations'}
          onClick={() => setKind('saved-locations')}
        >
          {t('Địa điểm đã lưu')}
        </button>
        <button
          className={'btn ' + (kind === 'geofences' ? 'primary' : '')}
          aria-pressed={kind === 'geofences'}
          onClick={() => setKind('geofences')}
        >
          {t('Vùng an toàn')}
        </button>
      </div>
      <PlaceTable key={kind} actor={actor} viuId={viuId} kind={kind} />
    </section>
  );
}
type Scope = { actor: Person; viuId: string; kind: PlaceKind };
function PlaceTable({ actor, viuId, kind }: Scope) {
  const maxPlaces = useLimit('location.max_saved_locations_per_user');
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [active, setActive] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Place | null>(null);
  const [notice, setNotice] = useState('');
  const key = ['api-places', actor.id, actor.orgId, viuId, kind];
  const query = useQuery({
    queryKey: [...key, page, active],
    queryFn: ({ signal }) => placesApi.list(actor, viuId, kind, page, active, signal),
    refetchInterval: 30000,
    retry: false,
  });
  const refresh = () => cache.invalidateQueries({ queryKey: key });
  const zone = kind === 'geofences';
  return (
    <div className="stack">
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <div className="row">
        <label className="field">
          {t('Trạng thái')}
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              setPage(1);
              setEditing(null);
              setRemoving(null);
            }}
          >
            <option value="">{t('Tất cả trạng thái')}</option>
            <option value="true">{t('Hoạt động')}</option>
            <option value="false">{t('Tạm ngưng')}</option>
          </select>
        </label>
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw size={16} aria-hidden="true" />
          {t('Tải lại địa điểm')}
        </button>
        <button
          className="btn primary"
          disabled={query.isError || !query.data?.canManage}
          onClick={() => setEditing('new')}
        >
          {zone ? t('Thêm vùng an toàn') : t('Thêm địa điểm')}
        </button>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            {!query.data.canManage && (
              <p className="notice">
                {t('Bạn có quyền xem. Cần quyền quản lý vị trí để thêm, sửa hoặc xóa.')}
              </p>
            )}
            {!zone && (
              <p>
                {t('Tối đa {max} địa điểm cho mỗi người, bao gồm địa điểm tạm ngưng.', {
                  max: maxPlaces,
                })}
              </p>
            )}
            {!query.data.items.length && <p>{t('Chưa có địa điểm phù hợp.')}</p>}
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={t('Danh sách địa điểm')}
            >
              <table className="places-table">
                <thead>
                  <tr>
                    <th>{t('Tên')}</th>
                    <th>{t('Tọa độ và bán kính')}</th>
                    <th>{t('Trạng thái')}</th>
                    <th>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        {'alertOnExit' in item && (
                          <p className="care-secondary">
                            {t('Vào:')} {item.alertOnEnter ? t('bật') : t('tắt')} · {t('Ra:')}{' '}
                            {item.alertOnExit ? t('bật') : t('tắt')}
                          </p>
                        )}
                      </td>
                      <td>
                        <span>
                          {t('Vĩ độ: {latitude} · Kinh độ: {longitude}', {
                            latitude: item.latitude,
                            longitude: item.longitude,
                          })}
                        </span>
                        <p>
                          {t('Bán kính: {p3} m', {
                            p3:
                              'radiusMeters' in item ? item.radiusMeters : item.arrivalRadiusMeters,
                          })}
                        </p>
                      </td>
                      <td>
                        <Badge tone={item.isActive ? 'green' : 'amber'}>
                          {item.isActive ? t('Hoạt động') : t('Tạm ngưng')}
                        </Badge>
                      </td>
                      <td>
                        <div className="row">
                          <button className="btn small" onClick={() => setEditing(item.id)}>
                            {query.data.canManage ? t('Xem và sửa') : t('Chi tiết')}
                          </button>
                          {query.data.canManage && (
                            <button className="btn small danger" onClick={() => setRemoving(item)}>
                              {t('Xóa')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row pagination">
              <span>
                {t('{totalCount} kết quả · Trang {page}/{p4}', {
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
                {t('Trang địa điểm trước')}
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                {t('Trang địa điểm sau')}
              </button>
            </div>
            {editing && (
              <PlaceEditor
                key={editing}
                actor={actor}
                viuId={viuId}
                kind={kind}
                id={editing}
                canManage={query.data.canManage}
                onClose={() => setEditing(null)}
                onSave={() => {
                  setEditing(null);
                  setNotice(t('Đã lưu theo dữ liệu máy chủ.'));
                }}
                refresh={refresh}
              />
            )}
            {removing && query.data.canManage && (
              <Confirm
                title={zone ? t('Xóa vùng an toàn') : t('Xóa địa điểm')}
                description={t('Xóa {name}? {p1}', {
                  name: removing.name,
                  p1: zone
                    ? t('Vùng này sẽ không còn được dùng để cảnh báo vào hoặc ra.')
                    : t('Địa điểm này sẽ không còn được dùng để nhắc khi đến nơi.'),
                })}
                onClose={() => setRemoving(null)}
                onConfirm={async () => {
                  try {
                    await placesApi.remove(actor, viuId, kind, removing.id);
                    setNotice(t('Đã xóa theo dữ liệu máy chủ.'));
                    if (query.data.items.length === 1 && page > 1) setPage(page - 1);
                  } finally {
                    await refresh();
                  }
                }}
              />
            )}
          </>
        )}
      </State>
    </div>
  );
}
function PlaceEditor({
  actor,
  viuId,
  kind,
  id,
  canManage,
  onClose,
  onSave,
  refresh,
}: Scope & {
  id: string;
  canManage: boolean;
  onClose: () => void;
  onSave: () => void;
  refresh: () => Promise<unknown>;
}) {
  const creating = id === 'new';
  const zone = kind === 'geofences';
  const defaultRadius = useLimit('location.geofence.default_radius_meters');
  const defaultArrival = useLimit('location.geofence.default_arrival_radius_meters');
  const detail = useQuery({
    queryKey: ['api-place-detail', actor.id, actor.orgId, viuId, kind, id],
    queryFn: ({ signal }) => placesApi.detail(actor, viuId, kind, id, signal),
    enabled: !creating,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const fields: FieldSpec[] = [
    { key: 'name', label: t('Tên'), required: true, max: 200 },
    { key: 'latitude', label: t('Vĩ độ'), type: 'number', required: true, min: -90, max: 90 },
    { key: 'longitude', label: t('Kinh độ'), type: 'number', required: true, min: -180, max: 180 },
    {
      key: zone ? 'radiusMeters' : 'arrivalRadiusMeters',
      label: t('Bán kính (mét)'),
      type: 'number',
      required: true,
      min: zone ? 50 : 10,
      max: zone ? 50000 : 5000,
      step: 1,
      hint: zone ? t('Từ 50 đến 50.000 mét.') : t('Từ 10 đến 5.000 mét.'),
    },
    ...(zone
      ? [
          { key: 'alertOnExit', label: t('Cảnh báo khi ra ngoài'), type: 'checkbox' as const },
          { key: 'alertOnEnter', label: t('Cảnh báo khi đi vào'), type: 'checkbox' as const },
        ]
      : [
          { key: 'description', label: t('Mô tả'), type: 'textarea' as const },
          {
            key: 'ttsAnnouncement',
            label: t('Lời nhắc khi đến nơi'),
            type: 'textarea' as const,
            max: 500,
          },
        ]),
    ...(!creating ? [{ key: 'isActive', label: t('Hoạt động'), type: 'checkbox' as const }] : []),
  ];
  const initial: Fields = creating
    ? {
        latitude: '',
        longitude: '',
        radiusMeters: defaultRadius,
        arrivalRadiusMeters: defaultArrival,
        alertOnExit: true,
        alertOnEnter: false,
      }
    : Object.fromEntries(
        Object.entries(detail.data || {}).map(([key, value]) => [key, value ?? '']),
      );
  return (
    <Dialog
      title={
        (creating ? t('Thêm ') : canManage ? t('Xem và sửa ') : t('Chi tiết ')) +
        (zone ? t('vùng an toàn') : t('địa điểm'))
      }
      onClose={onClose}
    >
      <State
        loading={!creating && detail.isPending}
        error={detail.error}
        retry={() => detail.refetch()}
      >
        {(creating || detail.data) &&
          (canManage ? (
            <Form
              fields={fields}
              initial={initial}
              onSubmit={async (values) => {
                try {
                  await placesApi.save(actor, viuId, kind, values, creating ? undefined : id);
                  onSave();
                } catch (error) {
                  if ((error as { status?: number }).status! >= 500)
                    throw new Error(
                      t(
                        'Chưa xác nhận được kết quả lưu. Tải lại danh sách trước khi gửi lại để tránh tạo trùng.',
                      ),
                      { cause: error },
                    );
                  throw error;
                } finally {
                  await refresh();
                }
              }}
            />
          ) : (
            <dl className="record-details">
              {fields.map((field) => (
                <div key={field.key}>
                  <dt>{tText(field.label)}</dt>
                  <dd>
                    {typeof initial[field.key] === 'boolean'
                      ? initial[field.key]
                        ? t('Bật')
                        : t('Tắt')
                      : String(initial[field.key] ?? '—')}
                  </dd>
                </div>
              ))}
            </dl>
          ))}
      </State>
    </Dialog>
  );
}

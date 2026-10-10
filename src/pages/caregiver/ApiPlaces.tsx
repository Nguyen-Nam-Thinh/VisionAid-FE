import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi } from '../../services/api/caregiving';
import { placesApi, type Place, type PlaceKind } from '../../services/api/places';
import { PageHead, State, Dialog, Confirm, Badge } from '../../components/UI';
import { Form, type FieldSpec } from '../../components/Form';
import type { Person, Fields } from '../../models/domain';

export function ApiPlaces() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? <Places key={actor.id + actor.orgId} actor={actor} /> : null;
}
function Places({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const users = useQuery({
    queryKey: ['api-place-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  const person = users.data?.items.find((item) => item.id === selected);
  return (
    <>
      <PageHead
        title="Địa điểm và vùng an toàn"
        description="Lưu nơi thường đến và cấu hình vùng tròn cho người được chăm sóc."
      />
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(String(new FormData(e.currentTarget).get('search') || '').trim());
            setPage(1);
            setSelected('');
          }}
        >
          <label className="field">
            Tìm người được chăm sóc
            <input name="search" />
          </label>
          <button className="btn">Tìm kiếm</button>
          <button
            type="button"
            className="btn"
            disabled={users.isFetching}
            onClick={() => void users.refetch()}
          >
            Tải lại người dùng
          </button>
        </form>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          <label className="field">
            Người được chăm sóc
            <select value={person?.id || ''} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Chọn người được chăm sóc</option>
              {users.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} · {item.email}
                </option>
              ))}
            </select>
          </label>
          {users.data && (
            <div className="row">
              <span>
                {users.data.totalCount} người · Trang {page}/{Math.max(1, users.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={!users.data.hasPreviousPage || users.isFetching}
                onClick={() => {
                  setPage(page - 1);
                  setSelected('');
                }}
              >
                Trang trước
              </button>
              <button
                className="btn"
                disabled={!users.data.hasNextPage || users.isFetching}
                onClick={() => {
                  setPage(page + 1);
                  setSelected('');
                }}
              >
                Trang sau
              </button>
            </div>
          )}
          {!users.data?.items.length && <p>Chưa có người được chăm sóc phù hợp.</p>}
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
      <h2>Địa điểm của {name}</h2>
      <div className="row" aria-label="Loại địa điểm">
        <button
          className={'btn ' + (kind === 'saved-locations' ? 'primary' : '')}
          aria-pressed={kind === 'saved-locations'}
          onClick={() => setKind('saved-locations')}
        >
          Địa điểm đã lưu
        </button>
        <button
          className={'btn ' + (kind === 'geofences' ? 'primary' : '')}
          aria-pressed={kind === 'geofences'}
          onClick={() => setKind('geofences')}
        >
          Vùng an toàn
        </button>
      </div>
      <p className="muted">
        Nhập tọa độ chính xác để xác định vị trí. Cảnh báo vào, ra và lời nhắc đến nơi phụ thuộc GPS
        trên điện thoại và hệ thống xử lý.
      </p>
      <PlaceTable key={kind} actor={actor} viuId={viuId} kind={kind} />
    </section>
  );
}
type Scope = { actor: Person; viuId: string; kind: PlaceKind };
function PlaceTable({ actor, viuId, kind }: Scope) {
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
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <div className="row">
        <label className="field">
          Trạng thái
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              setPage(1);
              setEditing(null);
              setRemoving(null);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Tạm ngưng</option>
          </select>
        </label>
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Tải lại địa điểm
        </button>
        <button
          className="btn primary"
          disabled={query.isError || !query.data?.canManage}
          onClick={() => setEditing('new')}
        >
          {zone ? 'Thêm vùng an toàn' : 'Thêm địa điểm'}
        </button>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            {!query.data.canManage && (
              <p className="notice">
                Bạn có quyền xem. Cần quyền quản lý vị trí để thêm, sửa hoặc xóa.
              </p>
            )}
            {!zone && <p>Tối đa 20 địa điểm cho mỗi người, bao gồm địa điểm tạm ngưng.</p>}
            {!query.data.items.length && <p>Chưa có địa điểm phù hợp.</p>}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Tọa độ và bán kính</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        {'alertOnExit' in item && (
                          <p>
                            Vào: {item.alertOnEnter ? 'bật' : 'tắt'} · Ra:{' '}
                            {item.alertOnExit ? 'bật' : 'tắt'}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="mono">
                          {item.latitude}, {item.longitude}
                        </span>
                        <p>
                          {'radiusMeters' in item ? item.radiusMeters : item.arrivalRadiusMeters} m
                        </p>
                      </td>
                      <td>
                        <Badge tone={item.isActive ? 'green' : 'amber'}>
                          {item.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                        </Badge>
                      </td>
                      <td>
                        <div className="row">
                          <button className="btn small" onClick={() => setEditing(item.id)}>
                            {query.data.canManage ? 'Xem và sửa' : 'Chi tiết'}
                          </button>
                          {query.data.canManage && (
                            <button className="btn small danger" onClick={() => setRemoving(item)}>
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row">
              <span>
                {query.data.totalCount} kết quả · Trang {query.data.page}/
                {Math.max(1, query.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasPreviousPage}
                onClick={() => setPage(page - 1)}
              >
                Trang địa điểm trước
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Trang địa điểm sau
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
                  setNotice('Đã lưu theo dữ liệu máy chủ.');
                }}
                refresh={refresh}
              />
            )}
            {removing && query.data.canManage && (
              <Confirm
                title={zone ? 'Xóa vùng an toàn' : 'Xóa địa điểm'}
                description={`Xóa ${removing.name}? ${zone ? 'Vùng này sẽ không còn được dùng để cảnh báo vào hoặc ra.' : 'Địa điểm này sẽ không còn được dùng để nhắc khi đến nơi.'}`}
                onClose={() => setRemoving(null)}
                onConfirm={async () => {
                  try {
                    await placesApi.remove(actor, viuId, kind, removing.id);
                    setNotice('Đã xóa theo dữ liệu máy chủ.');
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
  const detail = useQuery({
    queryKey: ['api-place-detail', actor.id, actor.orgId, viuId, kind, id],
    queryFn: ({ signal }) => placesApi.detail(actor, viuId, kind, id, signal),
    enabled: !creating,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const fields: FieldSpec[] = [
    { key: 'name', label: 'Tên', required: true, max: 200 },
    { key: 'latitude', label: 'Vĩ độ', type: 'number', required: true, min: -90, max: 90 },
    { key: 'longitude', label: 'Kinh độ', type: 'number', required: true, min: -180, max: 180 },
    {
      key: zone ? 'radiusMeters' : 'arrivalRadiusMeters',
      label: 'Bán kính — mét',
      type: 'number',
      required: true,
      min: zone ? 50 : 10,
      max: zone ? 50000 : 5000,
      step: 1,
      hint: zone ? 'Từ 50 đến 50.000 mét.' : 'Từ 10 đến 5.000 mét.',
    },
    ...(zone
      ? [
          { key: 'alertOnExit', label: 'Cảnh báo khi ra ngoài', type: 'checkbox' as const },
          { key: 'alertOnEnter', label: 'Cảnh báo khi đi vào', type: 'checkbox' as const },
        ]
      : [
          { key: 'description', label: 'Mô tả', type: 'textarea' as const },
          {
            key: 'ttsAnnouncement',
            label: 'Lời nhắc khi đến nơi',
            type: 'textarea' as const,
            max: 500,
          },
        ]),
    ...(!creating ? [{ key: 'isActive', label: 'Hoạt động', type: 'checkbox' as const }] : []),
  ];
  const initial: Fields = creating
    ? {
        latitude: '',
        longitude: '',
        radiusMeters: 300,
        arrivalRadiusMeters: 50,
        alertOnExit: true,
        alertOnEnter: false,
      }
    : Object.fromEntries(
        Object.entries(detail.data || {}).map(([key, value]) => [key, value ?? '']),
      );
  return (
    <Dialog
      title={
        (creating ? 'Thêm ' : canManage ? 'Xem và sửa ' : 'Chi tiết ') +
        (zone ? 'vùng an toàn' : 'địa điểm')
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
                      'Chưa xác nhận được kết quả lưu. Tải lại danh sách trước khi gửi lại để tránh tạo trùng.',
                      { cause: error },
                    );
                  throw error;
                } finally {
                  await refresh();
                }
              }}
            />
          ) : (
            <dl>
              {fields.map((field) => (
                <div key={field.key}>
                  <dt>{field.label}</dt>
                  <dd>
                    {typeof initial[field.key] === 'boolean'
                      ? initial[field.key]
                        ? 'Bật'
                        : 'Tắt'
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

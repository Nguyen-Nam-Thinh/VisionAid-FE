import { Toast } from '../../components/UI';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi } from '../../services/api/caregiving';
import { registryApi, type RegistryPerson, type RegistryImage } from '../../services/api/registry';
import { onSessionEnded } from '../../services/sessionLifecycle';
import { PageHead, State, Dialog, Confirm, Badge } from '../../components/UI';
import { Form, type FieldSpec } from '../../components/Form';
import type { Person, Fields } from '../../models/domain';
import { uiStore, useUI } from '../../stores/ui';

export function ApiRegistry() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? (
    <Registry key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function Registry({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Shared with the other care-recipient pages; cleared on logout via uiStore.clear().
  const { selectedViu: selected } = useUI();
  const setSelected = (id: string) => uiStore.set({ selectedViu: id });
  const users = useQuery({
    queryKey: ['api-registry-users', actor.id, actor.orgId, page, search],
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
        title="Gương mặt thân quen"
        description="Quản lý người thân và ảnh dùng cho nhận diện của người được chăm sóc."
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
          <button className="btn primary">Tìm kiếm</button>
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
          {!person && (
            <p className="notice">
              Chọn người được chăm sóc ở trên để xem danh sách và thêm mới thông tin cho đúng người.
            </p>
          )}
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
        <RegistryList
          key={actor.id + person.id}
          actor={actor}
          viuId={person.id}
          name={person.fullName}
        />
      )}
    </>
  );
}

type Scope = { actor: Person; viuId: string };
function RegistryList({ actor, viuId, name }: Scope & { name: string }) {
  const cache = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string | null>(null);
  const [removing, setRemoving] = useState<RegistryPerson | null>(null);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [notice, setNotice] = useState('');
  const key = ['api-registry', actor.id, actor.orgId, viuId];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => registryApi.list(actor, viuId, signal),
    refetchInterval: 30000,
    retry: false,
    gcTime: 0,
  });
  const refresh = () => cache.invalidateQueries({ queryKey: key });
  const items =
    query.data?.items.filter(
      (p) =>
        p.displayName.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')) &&
        (!active || String(p.isActive) === active),
    ) || [];
  return (
    <section className="glass card stack">
      <h2>Danh bạ của {name}</h2>
      <p className="notice">
        Tối đa 20 người. Cần ít nhất 3 ảnh để kích hoạt mỗi người. Trạng thái nhận từ máy chủ; khả
        năng nhận diện còn phụ thuộc chất lượng ảnh và hệ thống AI.
      </p>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <div className="row">
        <label className="field">
          Tìm người thân
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="field">
          Trạng thái
          <select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Chưa hoạt động</option>
          </select>
        </label>
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Tải lại danh bạ
        </button>
        <button
          className="btn primary"
          disabled={query.isError || !query.data?.canManage || query.data.items.length >= 20}
          onClick={() => setEditing('new')}
        >
          Thêm người thân
        </button>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            {!query.data.canManage && (
              <p className="notice">
                Bạn có quyền xem. Cần quyền quản lý gương mặt để thêm, sửa hoặc xóa.
              </p>
            )}
            {!items.length && <p>Chưa có người thân phù hợp.</p>}
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Danh sách gương mặt thân quen"
            >
              <table className="registry-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Mối quan hệ</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.displayName}</strong>
                        <p className="care-secondary">{item.imageCount} ảnh</p>
                      </td>
                      <td>{item.relationship || '—'}</td>
                      <td>
                        <Badge tone={item.isActive ? 'green' : 'amber'}>
                          {item.isActive ? 'Hoạt động' : 'Chưa hoạt động'}
                        </Badge>
                      </td>
                      <td>
                        <div className="row">
                          <button className="btn small" onClick={() => setPhotos(item.id)}>
                            Quản lý ảnh
                          </button>
                          <button className="btn small" onClick={() => setEditing(item.id)}>
                            {query.data.canManage ? 'Chỉnh sửa' : 'Chi tiết'}
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
            <p>{items.length} kết quả</p>
            {editing && (
              <RegistryEditor
                key={editing}
                actor={actor}
                viuId={viuId}
                id={editing}
                canManage={query.data.canManage}
                onClose={() => setEditing(null)}
                refresh={refresh}
                onSave={() => {
                  setEditing(null);
                  setNotice('Đã lưu người thân.');
                }}
              />
            )}
            {photos && (
              <RegistryPhotos
                key={photos}
                actor={actor}
                viuId={viuId}
                id={photos}
                onClose={() => setPhotos(null)}
                refresh={refresh}
              />
            )}
            {removing && query.data.canManage && (
              <Confirm
                title="Xóa người thân"
                description={`Xóa ${removing.displayName} khỏi danh bạ và ngừng dùng các ảnh của người này để nhận diện?`}
                onClose={() => setRemoving(null)}
                onConfirm={async () => {
                  try {
                    await registryApi.remove(actor, viuId, removing.id);
                    setNotice('Đã xóa người thân.');
                  } finally {
                    await refresh();
                  }
                }}
              />
            )}
          </>
        )}
      </State>
    </section>
  );
}
const fields: FieldSpec[] = [
  { key: 'displayName', label: 'Tên người thân', required: true, max: 200 },
  { key: 'relationship', label: 'Mối quan hệ', max: 100 },
  { key: 'notes', label: 'Ghi chú', type: 'textarea', max: 1000 },
];
function RegistryEditor({
  actor,
  viuId,
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
  const detail = useQuery({
    queryKey: ['api-registry-person', actor.id, actor.orgId, viuId, id],
    queryFn: ({ signal }) => registryApi.detail(actor, viuId, id, signal),
    enabled: !creating,
    gcTime: 0,
    retry: false,
  });
  const initial: Fields = {
    displayName: detail.data?.person.displayName || '',
    relationship: detail.data?.person.relationship || '',
    notes: detail.data?.person.notes || '',
  };
  const editable = canManage && (creating || detail.data?.canManage);
  return (
    <Dialog title={creating ? 'Thêm người thân' : 'Thông tin người thân'} onClose={onClose}>
      <State
        loading={!creating && detail.isPending}
        error={detail.error}
        retry={() => detail.refetch()}
      >
        {(creating || detail.data) &&
          (editable ? (
            <Form
              fields={fields}
              initial={initial}
              onSubmit={async (values) => {
                try {
                  await registryApi.save(
                    actor,
                    viuId,
                    {
                      ...values,
                      relationship: String(values.relationship || '').trim() || null,
                      notes: String(values.notes || '').trim() || null,
                    },
                    creating ? undefined : id,
                  );
                  onSave();
                } catch (error) {
                  if ((error as { status?: number }).status! >= 500)
                    throw new Error(
                      'Chưa xác nhận được kết quả lưu. Tải lại danh bạ trước khi gửi lại để tránh tạo trùng.',
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
                  <dt>{field.label}</dt>
                  <dd>{String(initial[field.key] || '—')}</dd>
                </div>
              ))}
            </dl>
          ))}
      </State>
    </Dialog>
  );
}

function RegistryPhotos({
  actor,
  viuId,
  id,
  onClose,
  refresh,
}: Scope & { id: string; onClose: () => void; refresh: () => Promise<unknown> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [removing, setRemoving] = useState<RegistryImage | null>(null);
  const detail = useQuery({
    queryKey: ['api-registry-photos', actor.id, actor.orgId, viuId, id],
    queryFn: ({ signal }) => registryApi.detail(actor, viuId, id, signal),
    gcTime: 0,
    retry: false,
    refetchInterval: pending ? false : 30000,
  });
  const reload = async () => {
    await Promise.all([detail.refetch(), refresh()]);
  };
  const person = detail.data?.person;
  return (
    <Dialog
      title={'Ảnh người thân' + (person ? ` — ${person.displayName}` : '')}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <div className="stack">
        <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
          {person && (
            <>
              <p className="notice">
                {person.imageCount} ảnh · {person.isActive ? 'Hoạt động' : 'Chưa hoạt động'}. Xóa
                ảnh khiến số lượng dưới 3 sẽ ngừng kích hoạt người này.
              </p>
              {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              {detail.data?.canManage ? (
                <form
                  className="stack registry-upload"
                  aria-busy={pending}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const data = new FormData(form);
                    const file = data.get('photo');
                    if (!(file instanceof File) || !file.size) {
                      setError('Hãy chọn một ảnh.');
                      return;
                    }
                    setPending(true);
                    setError('');
                    setNotice('');
                    try {
                      await registryApi.upload(actor, viuId, id, file, data.has('primary'));
                      form.reset();
                      setNotice('Đã tải ảnh lên.');
                    } catch (err) {
                      setError(
                        (err instanceof Error ? err.message : 'Không thể tải ảnh.') +
                          ((err as { status?: number }).status! >= 500
                            ? ' Tải lại và kiểm tra số ảnh trước khi gửi lại để tránh trùng.'
                            : ''),
                      );
                    } finally {
                      await reload();
                      setPending(false);
                    }
                  }}
                >
                  <label className="field">
                    Chọn ảnh người thân
                    <input
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      disabled={pending}
                    />
                  </label>
                  <p className="muted">
                    JPEG, PNG hoặc WebP, tối đa 10 MB mỗi ảnh. Chỉ tải ảnh bạn được phép sử dụng.
                    Ảnh được gửi lên máy chủ để xử lý nhận diện.
                  </p>
                  <div className="field field-checkbox">
                    <input
                      id="registry-upload-primary"
                      type="checkbox"
                      name="primary"
                      disabled={pending}
                    />
                    <label htmlFor="registry-upload-primary">Đặt ảnh vừa tải làm ảnh chính</label>
                  </div>
                  <button className="btn primary" disabled={pending}>
                    {pending ? 'Đang xử lý…' : 'Tải ảnh lên'}
                  </button>
                </form>
              ) : (
                <p className="notice">Bạn có quyền xem ảnh, chưa có quyền quản lý gương mặt.</p>
              )}
              <button
                className="btn"
                disabled={pending || detail.isFetching}
                onClick={() => void reload()}
              >
                Tải lại ảnh
              </button>
              {!person.images.length && <p>Chưa có ảnh. Thêm ít nhất 3 ảnh để kích hoạt.</p>}
              <div className="registry-photos">
                {person.images.map((photo, index) => (
                  <article className="stack" key={photo.id} aria-label={`Ảnh ${index + 1}`}>
                    <RegistryPreview
                      actor={actor}
                      viuId={viuId}
                      id={id}
                      photoId={photo.id}
                      name={`${person.displayName} — ảnh ${index + 1}`}
                    />
                    {photo.isPrimaryImage && <Badge tone="green">Ảnh chính</Badge>}
                    {detail.data?.canManage && (
                      <div className="row">
                        {!photo.isPrimaryImage && (
                          <button
                            className="btn small"
                            disabled={pending}
                            onClick={async () => {
                              setPending(true);
                              setError('');
                              setNotice('');
                              try {
                                await registryApi.primary(actor, viuId, id, photo.id);
                                setNotice('Đã đổi ảnh chính.');
                              } catch (err) {
                                setError(
                                  err instanceof Error ? err.message : 'Không thể đổi ảnh chính.',
                                );
                              } finally {
                                await reload();
                                setPending(false);
                              }
                            }}
                          >
                            Đặt ảnh chính
                          </button>
                        )}
                        <button
                          className="btn small danger"
                          disabled={pending}
                          onClick={() => setRemoving(photo)}
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              {removing && detail.data?.canManage && (
                <Confirm
                  title="Xóa ảnh người thân"
                  description="Xóa vĩnh viễn ảnh này? Nếu còn dưới 3 ảnh, người thân sẽ ngừng hoạt động trong nhận diện."
                  onClose={() => setRemoving(null)}
                  onConfirm={async () => {
                    setPending(true);
                    try {
                      await registryApi.removePhoto(actor, viuId, id, removing.id);
                      setNotice('Đã xóa ảnh.');
                    } finally {
                      await reload();
                      setPending(false);
                    }
                  }}
                />
              )}
            </>
          )}
        </State>
      </div>
    </Dialog>
  );
}

function RegistryPreview({
  actor,
  viuId,
  id,
  photoId,
  name,
}: Scope & { id: string; photoId: string; name: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    const clean = () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    const off = onSessionEnded(() => {
      clean();
      setUrl('');
    });
    void registryApi
      .photo(actor, viuId, id, photoId, controller.signal)
      .then((blob) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Không tải được ảnh.');
      });
    return () => {
      off();
      clean();
    };
  }, [actor, viuId, id, photoId, attempt]);
  return error ? (
    <div role="alert">
      <p>{error}</p>
      <button
        className="btn small"
        onClick={() => {
          setUrl('');
          setError('');
          setAttempt(attempt + 1);
        }}
      >
        Thử tải ảnh lại
      </button>
    </div>
  ) : url ? (
    <img src={url} alt={name} onError={() => setError('Ảnh không thể hiển thị.')} />
  ) : (
    <p role="status">Đang tải ảnh…</p>
  );
}

import { t, msg, tText } from '../../i18n';
import { Toast } from '../../components/UI';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { useLimit } from '../../hooks/useLimit';
import { caregivingApi } from '../../services/api/caregiving';
import {
  registryApi,
  serverFailed,
  type RegistryPerson,
  type RegistryImage,
} from '../../services/api/registry';
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
        title={t('Gương mặt thân quen')}
        description={t('Quản lý người thân và ảnh dùng cho nhận diện của người được chăm sóc.')}
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
            {t('Tìm người được chăm sóc')}
            <input name="search" />
          </label>
          <button className="btn primary">{t('Tìm kiếm')}</button>
          <button
            type="button"
            className="btn"
            disabled={users.isFetching}
            onClick={() => void users.refetch()}
          >
            {t('Tải lại người dùng')}
          </button>
        </form>
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
            <div className="row">
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
  const maxPersons = useLimit('face_registry.max_persons_per_registry');
  const minPhotos = useLimit('face_registry.min_photos_to_activate');
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
      <h2>{t('Danh bạ của {name}', { name })}</h2>
      <p className="notice">
        {t(
          'Tối đa {max} người. Cần ít nhất {min} ảnh để kích hoạt mỗi người. Trạng thái nhận từ máy chủ; khả năng nhận diện còn phụ thuộc chất lượng ảnh và hệ thống AI.',
          { max: maxPersons, min: minPhotos },
        )}
      </p>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <div className="row">
        <label className="field">
          {t('Tìm người thân')}
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="field">
          {t('Trạng thái')}
          <select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">{t('Tất cả')}</option>
            <option value="true">{t('Hoạt động')}</option>
            <option value="false">{t('Chưa hoạt động')}</option>
          </select>
        </label>
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          {t('Tải lại danh bạ')}
        </button>
        <button
          className="btn primary"
          disabled={
            query.isError || !query.data?.canManage || query.data.items.length >= maxPersons
          }
          onClick={() => setEditing('new')}
        >
          {t('Thêm người thân')}
        </button>
      </div>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            {!query.data.canManage && (
              <p className="notice">
                {t('Bạn có quyền xem. Cần quyền quản lý gương mặt để thêm, sửa hoặc xóa.')}
              </p>
            )}
            {!items.length && <p>{t('Chưa có người thân phù hợp.')}</p>}
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={t('Danh sách gương mặt thân quen')}
            >
              <table className="registry-table">
                <thead>
                  <tr>
                    <th>{t('Tên')}</th>
                    <th>{t('Mối quan hệ')}</th>
                    <th>{t('Trạng thái')}</th>
                    <th>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.displayName}</strong>
                        <p className="care-secondary">
                          {t('{imageCount} ảnh', { imageCount: item.imageCount })}
                        </p>
                      </td>
                      <td>{item.relationship || '—'}</td>
                      <td>
                        <Badge tone={item.isActive ? 'green' : 'amber'}>
                          {item.isActive ? t('Hoạt động') : t('Chưa hoạt động')}
                        </Badge>
                      </td>
                      <td>
                        <div className="row">
                          <button className="btn small" onClick={() => setPhotos(item.id)}>
                            {t('Quản lý ảnh')}
                          </button>
                          <button className="btn small" onClick={() => setEditing(item.id)}>
                            {query.data.canManage ? t('Chỉnh sửa') : t('Chi tiết')}
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
            <p>{t('{length} kết quả', { length: items.length })}</p>
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
                  setNotice(t('Đã lưu người thân.'));
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
                title={t('Xóa người thân')}
                description={t(
                  'Xóa {displayName} khỏi danh bạ và ngừng dùng các ảnh của người này để nhận diện?',
                  { displayName: removing.displayName },
                )}
                onClose={() => setRemoving(null)}
                onConfirm={async () => {
                  try {
                    await registryApi.remove(actor, viuId, removing.id);
                    setNotice(t('Đã xóa người thân.'));
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
  { key: 'displayName', label: msg('Tên người thân'), required: true, max: 200 },
  { key: 'relationship', label: msg('Mối quan hệ'), max: 100 },
  { key: 'notes', label: msg('Ghi chú'), type: 'textarea', max: 1000 },
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
    <Dialog title={creating ? t('Thêm người thân') : t('Thông tin người thân')} onClose={onClose}>
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
                      t(
                        'Chưa xác nhận được kết quả lưu. Tải lại danh bạ trước khi gửi lại để tránh tạo trùng.',
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
  const minPhotos = useLimit('face_registry.min_photos_to_activate');
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
      title={t('Ảnh người thân') + (person ? ` — ${person.displayName}` : '')}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <div className="stack">
        <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
          {person && (
            <>
              <p className="notice">
                {t('{imageCount} ảnh ·', { imageCount: person.imageCount })}{' '}
                {person.isActive ? t('Hoạt động') : t('Chưa hoạt động')}
                {t('. Xóa ảnh khiến số lượng dưới {min} sẽ ngừng kích hoạt người này.', {
                  min: minPhotos,
                })}
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
                      setError(t('Hãy chọn một ảnh.'));
                      return;
                    }
                    setPending(true);
                    setError('');
                    setNotice('');
                    try {
                      await registryApi.upload(actor, viuId, id, file, data.has('primary'));
                      form.reset();
                      setNotice(t('Đã tải ảnh lên.'));
                    } catch (err) {
                      setError(
                        (err instanceof Error ? err.message : t('Không thể tải ảnh.')) +
                          (serverFailed(err)
                            ? t(' Tải lại và kiểm tra số ảnh trước khi gửi lại để tránh trùng.')
                            : ''),
                      );
                    } finally {
                      await reload();
                      setPending(false);
                    }
                  }}
                >
                  <label className="field">
                    {t('Chọn ảnh người thân')}
                    <input
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      disabled={pending}
                    />
                  </label>
                  <p className="muted">
                    {t(
                      'JPEG, PNG hoặc WebP, tối đa 10 MB mỗi ảnh. Chỉ tải ảnh bạn được phép sử dụng. Ảnh được gửi lên máy chủ để xử lý nhận diện.',
                    )}
                  </p>
                  <div className="field field-checkbox">
                    <input
                      id="registry-upload-primary"
                      type="checkbox"
                      name="primary"
                      disabled={pending}
                    />
                    <label htmlFor="registry-upload-primary">
                      {t('Đặt ảnh vừa tải làm ảnh chính')}
                    </label>
                  </div>
                  <button className="btn primary" disabled={pending}>
                    {pending ? t('Đang xử lý…') : t('Tải ảnh lên')}
                  </button>
                </form>
              ) : (
                <p className="notice">
                  {t('Bạn có quyền xem ảnh, chưa có quyền quản lý gương mặt.')}
                </p>
              )}
              <button
                className="btn"
                disabled={pending || detail.isFetching}
                onClick={() => void reload()}
              >
                {t('Tải lại ảnh')}
              </button>
              {!person.images.length && (
                <p>{t('Chưa có ảnh. Thêm ít nhất {min} ảnh để kích hoạt.', { min: minPhotos })}</p>
              )}
              <div className="registry-photos">
                {person.images.map((photo, index) => (
                  <article
                    className="stack"
                    key={photo.id}
                    aria-label={t('Ảnh {p0}', { p0: index + 1 })}
                  >
                    <RegistryPreview
                      actor={actor}
                      viuId={viuId}
                      id={id}
                      photoId={photo.id}
                      name={t('{displayName} — ảnh {p1}', {
                        displayName: person.displayName,
                        p1: index + 1,
                      })}
                    />
                    {photo.isPrimaryImage && <Badge tone="green">{t('Ảnh chính')}</Badge>}
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
                                setNotice(t('Đã đổi ảnh chính.'));
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : t('Không thể đổi ảnh chính.'),
                                );
                              } finally {
                                await reload();
                                setPending(false);
                              }
                            }}
                          >
                            {t('Đặt ảnh chính')}
                          </button>
                        )}
                        <button
                          className="btn small danger"
                          disabled={pending}
                          onClick={() => setRemoving(photo)}
                        >
                          {t('Xóa ảnh')}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              {removing && detail.data?.canManage && (
                <Confirm
                  title={t('Xóa ảnh người thân')}
                  description={t(
                    'Xóa vĩnh viễn ảnh này? Nếu còn dưới {min} ảnh, người thân sẽ ngừng hoạt động trong nhận diện.',
                    { min: minPhotos },
                  )}
                  onClose={() => setRemoving(null)}
                  onConfirm={async () => {
                    setPending(true);
                    try {
                      await registryApi.removePhoto(actor, viuId, id, removing.id);
                      setNotice(t('Đã xóa ảnh.'));
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
          setError(err instanceof Error ? err.message : t('Không tải được ảnh.'));
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
        {t('Thử tải ảnh lại')}
      </button>
    </div>
  ) : url ? (
    <img src={url} alt={name} onError={() => setError(t('Ảnh không thể hiển thị.'))} />
  ) : (
    <p role="status">{t('Đang tải ảnh…')}</p>
  );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi } from '../../services/api/caregiving';
import { contactsApi, contactTypes, type EmergencyContact } from '../../services/api/contacts';
import { PageHead, State, Dialog, Confirm, Badge } from '../../components/UI';
import { Form } from '../../components/Form';
import type { Person } from '../../models/domain';

export function ApiContacts() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? (
    <Contacts key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function Contacts({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const users = useQuery({
    queryKey: ['api-contact-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  const person = users.data?.items.find((item) => item.id === selected);
  return (
    <>
      <PageHead
        title="Liên hệ khẩn cấp"
        description="Quản lý danh bạ cho người được chăm sóc có liên kết hoạt động. Lưu liên hệ không thực hiện cuộc gọi."
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
        <ContactList
          key={actor.id + person.id}
          actor={actor}
          viuId={person.id}
          name={person.fullName}
        />
      )}
    </>
  );
}
function ContactList({ actor, viuId, name }: { actor: Person; viuId: string; name: string }) {
  const cache = useQueryClient();
  const [editing, setEditing] = useState<EmergencyContact | 'new' | null>(null);
  const [action, setAction] = useState<{ item: EmergencyContact; remove: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const key = ['api-contacts', actor.id, actor.orgId, viuId];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => contactsApi.list(actor, viuId, signal),
    refetchInterval: 30000,
    retry: false,
  });
  const refresh = () => cache.invalidateQueries({ queryKey: key });
  return (
    <section className="glass card stack">
      <h2>Danh bạ của {name}</h2>
      <p>
        Tối đa 5 liên hệ kể cả liên hệ tạm ngưng. Ưu tiên là số nguyên dương và không trùng; số nhỏ
        hơn được ưu tiên trước.
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error.message}
        </p>
      )}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="row">
          <button
            className="btn primary"
            disabled={!query.data || query.data.length >= 5}
            onClick={() => setEditing('new')}
          >
            Thêm liên hệ
          </button>
          <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Tải lại liên hệ
          </button>
        </div>
        {!query.data?.length && <p>Chưa có liên hệ khẩn cấp.</p>}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Liên hệ</th>
                <th>Ưu tiên</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.contactName}</strong>
                    <p>{contactTypes[item.contactType]}</p>
                    <p>{item.phoneNumber}</p>
                    <p style={{ overflowWrap: 'anywhere' }}>{item.zaloDeepLink}</p>
                    <p>{item.notes}</p>
                  </td>
                  <td>{item.priorityOrder}</td>
                  <td>
                    <Badge tone={item.isActive ? 'green' : 'amber'}>
                      {item.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </Badge>
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="btn small"
                        disabled={loadingDetail}
                        onClick={async () => {
                          setLoadingDetail(true);
                          setError(null);
                          try {
                            setEditing(await contactsApi.detail(actor, viuId, item.id));
                          } catch (e) {
                            setError(e as Error);
                            await refresh();
                          } finally {
                            setLoadingDetail(false);
                          }
                        }}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        className="btn small"
                        onClick={() => setAction({ item, remove: false })}
                      >
                        {item.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => setAction({ item, remove: true })}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing && (
          <Dialog
            title={editing === 'new' ? 'Thêm liên hệ khẩn cấp' : 'Sửa liên hệ khẩn cấp'}
            onClose={() => setEditing(null)}
          >
            <p>
              BE hiện chỉ chấp nhận số di động Việt Nam; số ngắn và hotline có thể bị từ chối. Liên
              kết Zalo được lưu như văn bản, không tự mở.
            </p>
            <Form
              fields={[
                { key: 'contactName', label: 'Tên liên hệ', required: true, max: 200 },
                {
                  key: 'contactType',
                  label: 'Loại liên hệ',
                  type: 'select',
                  required: true,
                  options: Object.entries(contactTypes).map(([value, label]) => ({ value, label })),
                },
                {
                  key: 'phoneNumber',
                  label: 'Số điện thoại',
                  max: 20,
                  hint: 'Bắt buộc với Điện thoại hoặc Điện thoại và Zalo.',
                },
                {
                  key: 'zaloDeepLink',
                  label: 'Liên kết Zalo',
                  max: 500,
                  hint: 'Bắt buộc với Zalo hoặc Điện thoại và Zalo.',
                },
                {
                  key: 'priorityOrder',
                  label: 'Thứ tự ưu tiên',
                  type: 'number',
                  min: 1,
                  max: 32767,
                  step: 1,
                },
                { key: 'notes', label: 'Ghi chú', type: 'textarea', max: 500 },
              ]}
              initial={
                editing === 'new'
                  ? { contactType: 'Phone', priorityOrder: 1 }
                  : {
                      ...editing,
                      phoneNumber: editing.phoneNumber || '',
                      zaloDeepLink: editing.zaloDeepLink || '',
                      notes: editing.notes || '',
                    }
              }
              onSubmit={async (values) => {
                try {
                  await contactsApi.save(
                    actor,
                    viuId,
                    values,
                    editing === 'new' ? undefined : editing.id,
                  );
                  setEditing(null);
                  setNotice('Đã lưu liên hệ theo dữ liệu máy chủ.');
                } catch (e) {
                  if ((e as { status?: number }).status! >= 500)
                    throw new Error(
                      'Chưa xác nhận được kết quả lưu. Tải lại danh sách trước khi gửi lại để tránh tạo trùng.',
                      { cause: e },
                    );
                  throw e;
                } finally {
                  await refresh();
                }
              }}
            />
          </Dialog>
        )}
        {action && (
          <Confirm
            title={action.remove ? 'Xóa liên hệ' : 'Đổi trạng thái liên hệ'}
            description={`${action.remove ? 'Xóa' : action.item.isActive ? 'Tạm ngưng' : 'Kích hoạt'} liên hệ ${action.item.contactName}? Thao tác ảnh hưởng danh bạ khẩn cấp của ${name}.`}
            onClose={() => setAction(null)}
            onConfirm={async () => {
              try {
                if (action.remove) await contactsApi.remove(actor, viuId, action.item.id);
                else await contactsApi.status(actor, viuId, action.item.id, !action.item.isActive);
                setNotice('Đã cập nhật danh bạ.');
              } finally {
                await refresh();
              }
            }}
          />
        )}
      </State>
    </section>
  );
}

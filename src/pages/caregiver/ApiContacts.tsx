import { t } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { useLimit } from '../../hooks/useLimit';
import { caregivingApi } from '../../services/api/caregiving';
import { contactsApi, contactTypes, type EmergencyContact } from '../../services/api/contacts';
import { FilterPanel } from '../../components/FilterPanel';
import { PageHead, State, Dialog, Confirm, Badge } from '../../components/UI';
import { Form } from '../../components/Form';
import type { Person } from '../../models/domain';
import { uiStore, useUI } from '../../stores/ui';

export function ApiContacts() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? (
    <Contacts key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function Contacts({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Shared with the other care-recipient pages; cleared on logout via uiStore.clear().
  const { selectedViu: selected } = useUI();
  const setSelected = (id: string) => uiStore.set({ selectedViu: id });
  const users = useQuery({
    queryKey: ['api-contact-users', actor.id, actor.orgId, page, search],
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
        title={t('Liên hệ khẩn cấp')}
        description={t(
          'Danh bạ khẩn cấp của người được chăm sóc. Lưu liên hệ không thực hiện cuộc gọi.',
        )}
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
  const maxContacts = useLimit('emergency.max_contacts_per_user');
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
      <h2>{t('Danh bạ của {name}', { name })}</h2>
      <p>
        {t(
          'Tối đa {max} liên hệ kể cả liên hệ tạm ngưng. Ưu tiên là số nguyên dương và không trùng; số nhỏ hơn được ưu tiên trước.',
          { max: maxContacts },
        )}
      </p>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {error && (
        <p className="notice error" role="alert">
          {error.message}
        </p>
      )}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="row">
          <button
            className="btn primary"
            disabled={!query.data || query.data.length >= maxContacts}
            onClick={() => setEditing('new')}
          >
            {t('Thêm liên hệ')}
          </button>
          <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
            {t('Tải lại liên hệ')}
          </button>
        </div>
        {!query.data?.length && <p>{t('Chưa có liên hệ khẩn cấp.')}</p>}
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t('Danh bạ khẩn cấp')}>
          <table className="care-contacts-table">
            <thead>
              <tr>
                <th>{t('Liên hệ')}</th>
                <th>{t('Ưu tiên')}</th>
                <th>{t('Trạng thái')}</th>
                <th>{t('Thao tác')}</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.contactName}</strong>
                    <p className="care-secondary">{contactTypes[item.contactType]}</p>
                    <p>{item.phoneNumber}</p>
                    <p style={{ overflowWrap: 'anywhere' }}>{item.zaloDeepLink}</p>
                    <p className="care-secondary">{item.notes}</p>
                  </td>
                  <td>{item.priorityOrder}</td>
                  <td>
                    <Badge tone={item.isActive ? 'green' : 'amber'}>
                      {item.isActive ? t('Hoạt động') : t('Tạm ngưng')}
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
                        {t('Chỉnh sửa')}
                      </button>
                      <button
                        className="btn small"
                        onClick={() => setAction({ item, remove: false })}
                      >
                        {item.isActive ? t('Tạm ngưng') : t('Kích hoạt')}
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => setAction({ item, remove: true })}
                      >
                        {t('Xóa')}
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
            title={editing === 'new' ? t('Thêm liên hệ khẩn cấp') : t('Sửa liên hệ khẩn cấp')}
            onClose={() => setEditing(null)}
          >
            <p>
              {t(
                'Chấp nhận số di động Việt Nam (0… hoặc +84…), hotline 112–115 và tổng đài 1800/1900. Liên kết Zalo được lưu như văn bản, không tự mở.',
              )}
            </p>
            <Form
              fields={[
                { key: 'contactName', label: t('Tên liên hệ'), required: true, max: 200 },
                {
                  key: 'contactType',
                  label: t('Loại liên hệ'),
                  type: 'select',
                  required: true,
                  options: Object.entries(contactTypes).map(([value, label]) => ({ value, label })),
                },
                {
                  key: 'phoneNumber',
                  label: t('Số điện thoại'),
                  max: 20,
                  hint: t('Bắt buộc với Điện thoại hoặc Điện thoại và Zalo.'),
                },
                {
                  key: 'zaloDeepLink',
                  label: t('Liên kết Zalo'),
                  max: 500,
                  hint: t('Bắt buộc với Zalo hoặc Điện thoại và Zalo.'),
                },
                {
                  key: 'priorityOrder',
                  label: t('Thứ tự ưu tiên'),
                  type: 'number',
                  min: 1,
                  max: 32767,
                  step: 1,
                },
                { key: 'notes', label: t('Ghi chú'), type: 'textarea', max: 500 },
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
                  setNotice(t('Đã lưu liên hệ theo dữ liệu máy chủ.'));
                } catch (e) {
                  if ((e as { status?: number }).status! >= 500)
                    throw new Error(
                      t(
                        'Chưa xác nhận được kết quả lưu. Tải lại danh sách trước khi gửi lại để tránh tạo trùng.',
                      ),
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
            title={action.remove ? t('Xóa liên hệ') : t('Đổi trạng thái liên hệ')}
            description={t(
              '{p0} liên hệ {contactName}? Thao tác ảnh hưởng danh bạ khẩn cấp của {name}.',
              {
                p0: action.remove
                  ? t('Xóa')
                  : action.item.isActive
                    ? t('Tạm ngưng')
                    : t('Kích hoạt'),
                contactName: action.item.contactName,
                name,
              },
            )}
            onClose={() => setAction(null)}
            onConfirm={async () => {
              try {
                if (action.remove) await contactsApi.remove(actor, viuId, action.item.id);
                else await contactsApi.status(actor, viuId, action.item.id, !action.item.isActive);
                setNotice(t('Đã cập nhật danh bạ.'));
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

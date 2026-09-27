import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import {
  organizationsApi,
  type Organization,
  type OrganizationInput,
} from '../../services/api/organizations';
import { Form, type FieldSpec } from '../../components/Form';
import { Badge, Confirm, Dialog, PageHead, State } from '../../components/UI';
import { roles } from '../../constants/labels';
import type { Person } from '../../models/domain';

const fields: FieldSpec[] = [
  { key: 'name', label: 'Tên tổ chức', required: true, max: 200 },
  { key: 'address', label: 'Địa chỉ', max: 500 },
  {
    key: 'phoneNumber',
    label: 'Điện thoại liên hệ',
    hint: 'Để trống hoặc nhập số Việt Nam có 10 chữ số.',
  },
  // Optional email is validated in the API adapter; the shared Form email rule requires a value.
  { key: 'contactEmail', label: 'Email liên hệ' },
];
function Pagination({
  data,
  busy,
  change,
}: {
  data: {
    page: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  busy: boolean;
  change: (page: number) => void;
}) {
  return (
    <div className="row">
      <span>
        {data.totalCount} kết quả · Trang {data.page}/{Math.max(1, data.totalPages)}
      </span>
      <button
        className="btn"
        disabled={busy || !data.hasPreviousPage}
        onClick={() => change(data.page - 1)}
      >
        Trang trước
      </button>
      <button
        className="btn"
        disabled={busy || !data.hasNextPage}
        onClick={() => change(data.page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
export function ApiOrganizations() {
  const { data: user } = useSession();
  return user && ['Admin', 'CenterAdmin'].includes(user.role) ? (
    <Organizations key={user.id + user.orgId} user={user} />
  ) : null;
}
function Organizations({ user }: { user: Person }) {
  const admin = user.role === 'Admin';
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [active, setActive] = useState('');
  const [deleted, setDeleted] = useState('false');
  const [selected, setSelected] = useState('');
  const [create, setCreate] = useState(false);
  const [notice, setNotice] = useState('');
  const list = useQuery({
    queryKey: ['api-organizations', user.id, page, search, active, deleted],
    queryFn: ({ signal }) => organizationsApi.list(user, page, search, active, deleted, signal),
    enabled: admin,
    refetchInterval: 30000,
  });
  const detail = useQuery({
    queryKey: ['api-organization', user.id, user.orgId, admin ? selected : 'me'],
    queryFn: ({ signal }) =>
      admin ? organizationsApi.detail(user, selected, signal) : organizationsApi.me(user, signal),
    enabled: !admin || !!selected,
    refetchInterval: 30000,
  });
  const refresh = async () => {
    await cache.invalidateQueries({
      predicate: (q) =>
        ['api-organizations', 'api-organization', 'api-organization-members'].includes(
          String(q.queryKey[0]),
        ) && q.queryKey[1] === user.id,
    });
  };
  return (
    <>
      <PageHead
        title={admin ? 'Tổ chức & trung tâm' : 'Hồ sơ trung tâm'}
        description="Thông tin tổ chức và thành viên theo quyền tài khoản."
        actions={
          admin && (
            <button className="btn primary" onClick={() => setCreate(true)}>
              Tạo tổ chức
            </button>
          )
        }
      />
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {create && (
        <OrganizationEditor
          user={user}
          close={() => setCreate(false)}
          saved={async (org) => {
            setCreate(false);
            setSelected(org.id);
            setNotice('Đã tạo tổ chức. Tạo tài khoản Center Admin thuộc đợt 5b.');
            await refresh();
          }}
        />
      )}
      {admin && (
        <section className="glass card stack">
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(draft.trim());
              setPage(1);
              setSelected('');
            }}
          >
            <label className="field">
              Tìm tổ chức
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Tên, mã số thuế, email"
              />
            </label>
            <label className="field">
              Trạng thái
              <select
                value={active}
                onChange={(e) => {
                  setActive(e.target.value);
                  setPage(1);
                  setSelected('');
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Ngừng hoạt động</option>
              </select>
            </label>
            <label className="field">
              Dữ liệu xóa
              <select
                value={deleted}
                onChange={(e) => {
                  setDeleted(e.target.value);
                  setPage(1);
                  setSelected('');
                }}
              >
                <option value="false">Chưa xóa</option>
                <option value="true">Đã xóa</option>
                <option value="">Tất cả</option>
              </select>
            </label>
            <button className="btn" type="submit">
              Tìm kiếm
            </button>
            <button
              className="btn"
              type="button"
              disabled={list.isFetching}
              onClick={() => void refresh()}
            >
              Tải lại
            </button>
          </form>
          <State loading={list.isPending} error={list.error} retry={() => list.refetch()}>
            {list.data && (
              <>
                {!list.data.items.length && <p>Không có tổ chức phù hợp.</p>}
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tên tổ chức</th>
                        <th>Email</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.data.items.map((org) => (
                        <tr key={org.id}>
                          <td>{org.name}</td>
                          <td>{org.contactEmail || 'Chưa có'}</td>
                          <td>
                            <OrganizationStatus org={org} />
                          </td>
                          <td>
                            <button
                              className="btn"
                              onClick={() => setSelected(org.id)}
                              aria-label={'Xem tổ chức ' + org.name}
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  data={list.data}
                  busy={list.isFetching}
                  change={(p) => {
                    setPage(p);
                    setSelected('');
                  }}
                />
              </>
            )}
          </State>
        </section>
      )}
      {(!admin || selected) && (
        <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
          {detail.data && (
            <OrganizationDetails
              key={detail.data.id}
              user={user}
              org={detail.data}
              refresh={refresh}
              removed={() => {
                setSelected('');
                setNotice('Đã xóa mềm tổ chức.');
              }}
            />
          )}
        </State>
      )}
    </>
  );
}
function OrganizationStatus({ org }: { org: Organization }) {
  return (
    <Badge tone={org.isActive ? 'green' : 'amber'}>
      {org.deletedAt ? 'Đã xóa' : org.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
    </Badge>
  );
}
function OrganizationEditor({
  user,
  org,
  close,
  saved,
}: {
  user: Person;
  org?: Organization;
  close: () => void;
  saved: (org: Organization) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title={org ? 'Sửa tổ chức' : 'Tạo tổ chức'}
      onClose={() => {
        if (!busy) close();
      }}
    >
      <Form
        fields={
          org ? fields : [...fields, { key: 'taxCode', label: 'Mã số thuế / giấy phép', max: 50 }]
        }
        initial={
          org
            ? {
                name: org.name,
                address: org.address || '',
                phoneNumber: org.phoneNumber || '',
                contactEmail: org.contactEmail || '',
              }
            : {}
        }
        submit={org ? 'Lưu tổ chức' : 'Tạo tổ chức'}
        onSubmit={async (values) => {
          setBusy(true);
          try {
            const input: OrganizationInput = {
              name: String(values.name),
              address: String(values.address),
              phoneNumber: String(values.phoneNumber),
              contactEmail: String(values.contactEmail),
              taxCode: String(values.taxCode || ''),
            };
            const result = org
              ? await organizationsApi.update(user, org.id, input)
              : await organizationsApi.create(user, input);
            await saved(result);
          } catch (error) {
            const err = error as { status?: number; message?: string };
            if (err.status && err.status >= 500)
              throw new Error(
                (err.message || 'Lỗi máy chủ.') +
                  ' Có thể thay đổi đã được lưu; đóng form và tải lại danh sách để kiểm tra trước khi gửi lại.',
                { cause: error },
              );
            throw error;
          } finally {
            setBusy(false);
          }
        }}
      />
    </Dialog>
  );
}
function OrganizationDetails({
  user,
  org,
  refresh,
  removed,
}: {
  user: Person;
  org: Organization;
  refresh: () => Promise<void>;
  removed: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [action, setAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const members = useQuery({
    queryKey: ['api-organization-members', user.id, user.orgId, org.id, page, search, role, active],
    queryFn: ({ signal }) =>
      organizationsApi.members(user, org.id, page, search, role, active, signal),
    enabled: !org.deletedAt,
    refetchInterval: 30000,
  });
  return (
    <section className="glass card stack">
      <h2>{org.name}</h2>
      <OrganizationStatus org={org} />
      <p>Mã tổ chức: {org.id}</p>
      <p>
        Mã số thuế: {org.taxCode || 'Chưa có'} · Địa chỉ: {org.address || 'Chưa có'}
      </p>
      <p>
        Liên hệ: {org.phoneNumber || 'Chưa có số điện thoại'} ·{' '}
        {org.contactEmail || 'Chưa có email'}
      </p>
      <p>
        Quản trị trung tâm: {org.centerAdminName || 'Chưa có'} · Nhân viên: {org.staffCount} · Người
        khiếm thị: {org.viuCount}
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className="row">
        {!org.deletedAt && (
          <button className="btn" onClick={() => setEdit(true)}>
            Sửa tổ chức
          </button>
        )}
        {user.role === 'Admin' && (
          <>
            <button
              className="btn"
              onClick={() => setAction(org.isActive ? 'deactivate' : 'activate')}
            >
              {org.isActive ? 'Vô hiệu hóa tổ chức' : 'Kích hoạt tổ chức'}
            </button>
            {!org.deletedAt && (
              <button className="btn danger" onClick={() => setAction('delete')}>
                Xóa tổ chức
              </button>
            )}
          </>
        )}
      </div>
      {edit && !org.deletedAt && (
        <OrganizationEditor
          user={user}
          org={org}
          close={() => setEdit(false)}
          saved={async () => {
            setEdit(false);
            setNotice('Đã cập nhật tổ chức.');
            await refresh();
          }}
        />
      )}
      {action && (
        <Confirm
          title={
            action === 'delete'
              ? 'Xóa tổ chức'
              : action === 'activate'
                ? 'Kích hoạt tổ chức'
                : 'Vô hiệu hóa tổ chức'
          }
          description={
            org.name +
            (action === 'activate'
              ? ': khôi phục tổ chức; thành viên vẫn cần được kích hoạt riêng.'
              : ': thành viên đang hoạt động sẽ bị vô hiệu hóa và thu hồi phiên/FCM.' +
                (action === 'delete' ? ' Tổ chức được đánh dấu xóa mềm.' : ''))
          }
          onClose={() => setAction(null)}
          onConfirm={async () => {
            if (action === 'delete') {
              await organizationsApi.remove(user, org.id);
              removed();
            } else {
              await organizationsApi.status(user, org.id, action === 'activate');
              setNotice(
                action === 'activate'
                  ? 'Đã kích hoạt tổ chức; cần kích hoạt từng thành viên riêng.'
                  : 'Đã vô hiệu hóa tổ chức.',
              );
            }
            await refresh();
          }}
        />
      )}
      {!org.deletedAt && (
        <>
          <h3>Thành viên tổ chức</h3>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(draft.trim());
            }}
          >
            <label className="field">
              Tìm thành viên
              <input value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            <label className="field">
              Vai trò
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả vai trò</option>
                {(['CenterAdmin', 'Caregiver', 'VisuallyImpaired'] as const).map((r) => (
                  <option key={r} value={r}>
                    {roles[r]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Trạng thái thành viên
              <select
                value={active}
                onChange={(e) => {
                  setActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="true">Hoạt động</option>
                <option value="false">Vô hiệu hóa</option>
              </select>
            </label>
            <button className="btn">Tìm thành viên</button>
          </form>
          <State loading={members.isPending} error={members.error} retry={() => members.refetch()}>
            {members.data && (
              <>
                {!members.data.items.length && <p>Chưa có thành viên phù hợp.</p>}
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Điện thoại</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.data.items.map((m) => (
                        <tr key={m.id}>
                          <td>{m.fullName}</td>
                          <td>{m.email}</td>
                          <td>{m.phoneNumber || 'Chưa có'}</td>
                          <td>{roles[m.role]}</td>
                          <td>{m.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination data={members.data} busy={members.isFetching} change={setPage} />
              </>
            )}
          </State>
        </>
      )}
    </section>
  );
}

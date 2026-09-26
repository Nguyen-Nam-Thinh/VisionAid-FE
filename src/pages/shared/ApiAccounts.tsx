import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, useSession } from '../../hooks/useService';
import {
  accountsApi,
  type Account,
  type AccountFilters,
  type AccountInput,
} from '../../services/api/accounts';
import { Form, type FieldSpec } from '../../components/Form';
import { Badge, Confirm, Dialog, PageHead, State } from '../../components/UI';
import { roles } from '../../constants/labels';
import type { Person } from '../../models/domain';

const profileFields: FieldSpec[] = [
  { key: 'fullName', label: 'Họ và tên', required: true, max: 200 },
  { key: 'phoneNumber', label: 'Điện thoại', hint: 'Để trống hoặc nhập số Việt Nam có 10 chữ số.' },
  { key: 'avatarUrl', label: 'URL ảnh đại diện', max: 500 },
];
const passwordFields: FieldSpec[] = [
  {
    key: 'password',
    label: 'Mật khẩu mới',
    type: 'password',
    required: true,
    hint: 'Ít nhất 8 ký tự, có chữ hoa/thường, số và ký tự đặc biệt.',
  },
  { key: 'confirmation', label: 'Nhập lại mật khẩu', type: 'password', required: true },
];
export function ApiAccounts({ fixedRole }: { fixedRole?: 'Caregiver' | 'VisuallyImpaired' }) {
  const { data: user } = useSession();
  return user && ['Admin', 'CenterAdmin'].includes(user.role) ? (
    <Accounts key={user.id + user.orgId + fixedRole} actor={user} fixedRole={fixedRole} />
  ) : null;
}
function Accounts({
  actor,
  fixedRole,
}: {
  actor: Person;
  fixedRole?: 'Caregiver' | 'VisuallyImpaired';
}) {
  const cache = useQueryClient();
  const [filters, setFilters] = useState<AccountFilters>({
    page: 1,
    search: '',
    role: fixedRole || '',
    active: '',
    deleted: 'false',
    organizationId: '',
  });
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [selected, setSelected] = useState('');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const list = useQuery({
    queryKey: ['api-accounts', actor.id, actor.orgId, filters],
    queryFn: ({ signal }) => accountsApi.list(actor, filters, signal),
    refetchInterval: 30000,
  });
  const detail = useQuery({
    queryKey: ['api-account', actor.id, actor.orgId, selected],
    queryFn: ({ signal }) => accountsApi.detail(actor, selected, signal),
    enabled: !!selected,
    refetchInterval: 30000,
  });
  const filter = (values: Partial<AccountFilters>) => {
    setFilters((f) => ({ ...f, ...values, page: values.page || 1 }));
    setSelected('');
  };
  const refresh = async () => {
    await cache.invalidateQueries({
      predicate: (q) =>
        [
          'api-accounts',
          'api-account',
          'api-organization-members',
          'api-organization',
          'api-organizations',
          'api-users',
        ].includes(String(q.queryKey[0])) && q.queryKey[1] === actor.id,
    });
  };
  return (
    <>
      <PageHead
        title={
          fixedRole === 'Caregiver'
            ? 'Nhân viên chăm sóc'
            : fixedRole
              ? 'Người dùng VIU'
              : 'Quản lý tài khoản'
        }
        description="Quản lý hồ sơ và trạng thái tài khoản trong phạm vi được cấp quyền."
        actions={
          <button className="btn primary" onClick={() => setCreating(true)}>
            Tạo tài khoản
          </button>
        }
      />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {creating && (
        <AccountEditor
          actor={actor}
          fixedRole={fixedRole}
          close={() => setCreating(false)}
          saved={async (account) => {
            setCreating(false);
            setSelected(account.id);
            setNotice('Đã tạo tài khoản. Phân công chăm sóc được thực hiện ở đợt 5c.');
            await refresh();
          }}
        />
      )}
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            filter({ search: search.trim(), organizationId: orgFilter.trim() });
          }}
        >
          <label className="field">
            Tìm tài khoản
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên, email, điện thoại"
            />
          </label>
          {!fixedRole && (
            <label className="field">
              Vai trò
              <select value={filters.role} onChange={(e) => filter({ role: e.target.value })}>
                <option value="">Tất cả vai trò</option>
                {Object.entries(roles).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {actor.role === 'Admin' && (
            <label className="field">
              Mã tổ chức để lọc
              <input
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                placeholder="UUID; để trống xem tất cả"
              />
            </label>
          )}
          <label className="field">
            Trạng thái
            <select value={filters.active} onChange={(e) => filter({ active: e.target.value })}>
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Vô hiệu hóa</option>
            </select>
          </label>
          <label className="field">
            Dữ liệu xóa
            <select value={filters.deleted} onChange={(e) => filter({ deleted: e.target.value })}>
              <option value="false">Chưa xóa</option>
              <option value="true">Đã xóa</option>
              <option value="">Tất cả</option>
            </select>
          </label>
          <button className="btn">Tìm kiếm</button>
          <button
            type="button"
            className="btn"
            disabled={list.isFetching}
            onClick={() => void refresh()}
          >
            Tải lại
          </button>
        </form>
        <State loading={list.isPending} error={list.error} retry={() => list.refetch()}>
          {list.data && (
            <>
              {!list.data.items.length && <p>Không có tài khoản phù hợp.</p>}
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.items.map((account) => (
                      <tr key={account.id}>
                        <td>{account.fullName}</td>
                        <td>{account.email}</td>
                        <td>{roles[account.role]}</td>
                        <td>
                          <AccountStatus account={account} />
                        </td>
                        <td>
                          <button
                            className="btn"
                            aria-label={'Xem tài khoản ' + account.email}
                            onClick={() => setSelected(account.id)}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row">
                <span>
                  {list.data.totalCount} kết quả · Trang {list.data.page}/
                  {Math.max(1, list.data.totalPages)}
                </span>
                <button
                  className="btn"
                  disabled={list.isFetching || !list.data.hasPreviousPage}
                  onClick={() => filter({ page: filters.page - 1 })}
                >
                  Trang trước
                </button>
                <button
                  className="btn"
                  disabled={list.isFetching || !list.data.hasNextPage}
                  onClick={() => filter({ page: filters.page + 1 })}
                >
                  Trang sau
                </button>
              </div>
            </>
          )}
        </State>
      </section>
      {selected && (
        <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
          {detail.data && (
            <AccountDetails
              key={detail.data.id}
              actor={actor}
              account={detail.data}
              refresh={refresh}
              removed={() => {
                setSelected('');
                setNotice('Đã xóa mềm tài khoản.');
              }}
            />
          )}
        </State>
      )}
    </>
  );
}
function AccountStatus({ account }: { account: Account }) {
  return (
    <Badge tone={account.isActive ? 'green' : 'amber'}>
      {account.deletedAt ? 'Đã xóa' : account.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
    </Badge>
  );
}
function AccountEditor({
  actor,
  account,
  fixedRole,
  close,
  saved,
}: {
  actor: Person;
  account?: Account;
  fixedRole?: 'Caregiver' | 'VisuallyImpaired';
  close: () => void;
  saved: (account: Account) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const fields: FieldSpec[] = account
    ? profileFields
    : [
        ...profileFields,
        { key: 'email', label: 'Email', type: 'email', required: true, max: 255 },
        ...passwordFields,
        ...(fixedRole
          ? []
          : [
              {
                key: 'role',
                label: 'Vai trò tài khoản',
                type: 'select' as const,
                required: true,
                options: Object.entries(roles)
                  .filter(
                    ([role]) =>
                      actor.role === 'Admin' || ['Caregiver', 'VisuallyImpaired'].includes(role),
                  )
                  .map(([value, label]) => ({ value, label })),
              },
            ]),
        ...(actor.role === 'Admin'
          ? [
              {
                key: 'organizationId',
                label: 'Mã tổ chức',
                hint: 'Sao chép UUID từ màn Tổ chức. Bắt buộc với vai trò không phải Admin; tổ chức phải hoạt động.',
              },
            ]
          : []),
      ];
  return (
    <Dialog
      title={account ? 'Sửa hồ sơ tài khoản' : 'Tạo tài khoản'}
      onClose={() => {
        if (!busy) close();
      }}
    >
      {account && (
        <p>
          Email, vai trò và tổ chức giữ nguyên: {account.email} · {roles[account.role]}
        </p>
      )}
      {!account && actor.role === 'CenterAdmin' && (
        <p>
          Tổ chức: {actor.orgId} · Vai trò: {roles[fixedRole || 'Caregiver']}
        </p>
      )}
      <Form
        fields={fields}
        initial={
          account
            ? {
                fullName: account.fullName,
                phoneNumber: account.phoneNumber || '',
                avatarUrl: account.avatarUrl || '',
              }
            : {}
        }
        submit={account ? 'Lưu hồ sơ' : 'Tạo tài khoản'}
        onSubmit={async (values) => {
          if (!account && values.password !== values.confirmation)
            throw new Error('Mật khẩu nhập lại không khớp.');
          setBusy(true);
          try {
            const profile = {
              fullName: String(values.fullName),
              phoneNumber: String(values.phoneNumber),
              avatarUrl: String(values.avatarUrl),
            };
            const result = account
              ? await accountsApi.update(actor, account.id, profile)
              : await accountsApi.create(actor, {
                  ...profile,
                  email: String(values.email),
                  password: String(values.password),
                  role: (fixedRole || values.role) as AccountInput['role'],
                  organizationId: String(values.organizationId || ''),
                });
            await saved(result);
          } catch (error) {
            if ((error as { status?: number }).status! >= 500)
              throw new Error(
                'Chưa xác nhận được kết quả lưu. Đóng form và tải lại/tìm email trước khi gửi lại để tránh tạo trùng tài khoản.',
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
function AccountDetails({
  actor,
  account,
  refresh,
  removed,
}: {
  actor: Person;
  account: Account;
  refresh: () => Promise<void>;
  removed: () => void;
}) {
  const auth = useAuth();
  const cache = useQueryClient();
  const [edit, setEdit] = useState(false);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [notice, setNotice] = useState('');
  return (
    <section className="glass card stack">
      <h2>{account.fullName}</h2>
      <AccountStatus account={account} />
      <p>
        {account.email} · {account.phoneNumber || 'Chưa có điện thoại'} · {roles[account.role]}
      </p>
      <p>
        Mã tài khoản: {account.id} · Tổ chức: {account.organizationId || 'Không thuộc tổ chức'}
      </p>
      <p>URL ảnh: {account.avatarUrl || 'Chưa có'}</p>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {account.deletedAt ? (
        <p>Tài khoản đã xóa. Chưa có API khôi phục tài khoản.</p>
      ) : (
        <div className="row">
          <button className="btn" onClick={() => setEdit(true)}>
            Sửa hồ sơ tài khoản
          </button>
          <button className="btn" onClick={() => setReset(true)}>
            Đặt lại mật khẩu
          </button>
          {account.id !== actor.id && (
            <button
              className="btn"
              onClick={() => setAction(account.isActive ? 'deactivate' : 'activate')}
            >
              {account.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
            </button>
          )}
          {actor.role === 'Admin' && account.id !== actor.id && (
            <button className="btn danger" onClick={() => setAction('delete')}>
              Xóa tài khoản
            </button>
          )}
        </div>
      )}
      {edit && !account.deletedAt && (
        <AccountEditor
          actor={actor}
          account={account}
          close={() => setEdit(false)}
          saved={async () => {
            setEdit(false);
            setNotice('Đã cập nhật hồ sơ.');
            await refresh();
            if (account.id === actor.id) await cache.invalidateQueries({ queryKey: ['session'] });
          }}
        />
      )}
      {action && !account.deletedAt && (
        <Confirm
          title={
            action === 'delete'
              ? 'Xóa tài khoản'
              : action === 'activate'
                ? 'Kích hoạt tài khoản'
                : 'Vô hiệu hóa tài khoản'
          }
          description={
            account.email +
            (action === 'activate'
              ? ': mở lại tài khoản. Tổ chức cũng phải hoạt động để đăng nhập.'
              : ': thu hồi phiên refresh và FCM. ' +
                (action === 'delete'
                  ? 'Xóa mềm, hiện chưa có API khôi phục.'
                  : 'Người dùng sẽ bị chặn đăng nhập.'))
          }
          onClose={() => setAction(null)}
          onConfirm={async () => {
            if (action === 'delete') {
              await accountsApi.remove(actor, account.id);
              removed();
            } else {
              await accountsApi.status(actor, account.id, action === 'activate');
              setNotice('Đã cập nhật trạng thái.');
            }
            await refresh();
          }}
        />
      )}
      {reset && !account.deletedAt && (
        <Dialog
          title="Đặt lại mật khẩu"
          onClose={() => {
            if (!busy) setReset(false);
          }}
        >
          <p>
            Tài khoản: {account.email}. Đặt lại mật khẩu sẽ thu hồi các phiên refresh; người dùng
            cần đăng nhập lại.
          </p>
          <Form
            fields={[
              ...passwordFields,
              {
                key: 'confirm',
                label: 'Tôi xác nhận đặt lại mật khẩu cho tài khoản này',
                type: 'checkbox',
              },
            ]}
            submit="Xác nhận đặt lại mật khẩu"
            onSubmit={async (values) => {
              if (values.password !== values.confirmation)
                throw new Error('Mật khẩu nhập lại không khớp.');
              if (!values.confirm) throw new Error('Vui lòng xác nhận thao tác.');
              setBusy(true);
              try {
                await accountsApi.resetPassword(actor, account.id, String(values.password));
                setReset(false);
                setNotice('Đã đặt lại mật khẩu; người dùng cần đăng nhập lại.');
                if (account.id === actor.id) await auth.logout();
                else await refresh();
              } finally {
                setBusy(false);
              }
            }}
          />
        </Dialog>
      )}
    </section>
  );
}

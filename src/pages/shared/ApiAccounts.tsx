import { RefreshCw } from 'lucide-react';
import { t, msg, formatLocaleDateTime } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, useSession } from '../../hooks/useService';
import {
  accountsApi,
  RESTORE_WINDOW_DAYS,
  type Account,
  type AccountFilters,
  type AccountInput,
} from '../../services/api/accounts';
import { Form, type FieldSpec } from '../../components/Form';
import { useNow } from '../../hooks/useNow';
import { Badge, Confirm, Dialog, PageHead, State } from '../../components/UI';
import { roles } from '../../constants/labels';
import type { Person } from '../../models/domain';
import { Link } from 'react-router-dom';
import { viuLicenseLabel } from '../../services/api/licenses';
import { useOwnOrgName } from '../../hooks/useOrgPeople';
import { SearchPicker } from '../../components/SearchPicker';
import { FilterPanel } from '../../components/FilterPanel';
import { searchOrganizations } from '../../services/api/pickers';
import { organizationsApi } from '../../services/api/organizations';

const profileFields: FieldSpec[] = [
  { key: 'fullName', label: msg('Họ và tên'), required: true, min: 2, max: 200 },
  {
    key: 'phoneNumber',
    label: msg('Điện thoại'),
    hint: msg('Để trống hoặc nhập số Việt Nam có 10 chữ số.'),
  },
  { key: 'avatarUrl', label: msg('URL ảnh đại diện'), max: 500 },
];
const passwordFields: FieldSpec[] = [
  {
    key: 'password',
    label: msg('Mật khẩu mới'),
    type: 'password',
    required: true,
    hint: msg('Ít nhất 8 ký tự, có chữ hoa/thường, số và ký tự đặc biệt.'),
  },
  { key: 'confirmation', label: msg('Nhập lại mật khẩu'), type: 'password', required: true },
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
          'license-pool',
          'license-assignments',
        ].includes(String(q.queryKey[0])) && q.queryKey[1] === actor.id,
    });
  };
  return (
    <>
      <PageHead
        title={
          fixedRole === 'Caregiver'
            ? t('Nhân viên chăm sóc')
            : fixedRole
              ? t('Người khiếm thị')
              : t('Quản lý tài khoản')
        }
        description={t('Hồ sơ và trạng thái tài khoản trong phạm vi của bạn.')}
      />
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {creating && (
        <AccountEditor
          actor={actor}
          fixedRole={fixedRole}
          close={() => setCreating(false)}
          saved={async (account) => {
            setCreating(false);
            setSelected(account.id);
            setNotice(
              t(
                'Đã tạo tài khoản. Kiểm tra thông tin license và phân công chăm sóc cho người dùng.',
              ),
            );
            await refresh();
          }}
        />
      )}
      <section className="glass card stack">
        <FilterPanel
          active={
            [
              filters.search,
              !fixedRole && filters.role,
              filters.organizationId,
              filters.active,
              filters.deleted !== 'false',
            ].filter(Boolean).length
          }
          onApply={(form) => {
            const data = new FormData(form);
            filter({
              search: String(data.get('search') || '').trim(),
              ...(!fixedRole && { role: String(data.get('role') || '') }),
              organizationId: orgFilter,
              active: String(data.get('active') || ''),
              deleted: String(data.get('deleted') ?? 'false'),
            });
          }}
          onReset={() => {
            setOrgFilter('');
            filter({
              search: '',
              ...(!fixedRole && { role: '' }),
              organizationId: '',
              active: '',
              deleted: 'false',
            });
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={list.isFetching}
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại')}
            </button>
          }
          extra={
            <button className="btn primary" onClick={() => setCreating(true)}>
              {t('Tạo tài khoản')}
            </button>
          }
        >
          <label className="field wide">
            {t('Tìm tài khoản')}
            <input
              name="search"
              defaultValue={filters.search}
              placeholder={t('Tên, email, điện thoại')}
            />
          </label>
          {!fixedRole && (
            <label className="field">
              {t('Vai trò')}
              <select name="role" defaultValue={filters.role}>
                <option value="">{t('Tất cả vai trò')}</option>
                {Object.entries(roles).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {actor.role === 'Admin' && (
            <SearchPicker
              label={t('Tổ chức')}
              placeholder={t('Gõ tên tổ chức')}
              value={orgFilter}
              onChange={setOrgFilter}
              search={searchOrganizations(actor)}
              queryKey={['account-org-filter', actor.id]}
            />
          )}
          <label className="field">
            {t('Trạng thái')}
            <select name="active" defaultValue={filters.active}>
              <option value="">{t('Tất cả trạng thái')}</option>
              <option value="true">{t('Hoạt động')}</option>
              <option value="false">{t('Vô hiệu hóa')}</option>
            </select>
          </label>
          <label className="field">
            {t('Dữ liệu xóa')}
            <select name="deleted" defaultValue={filters.deleted}>
              <option value="false">{t('Chưa xóa')}</option>
              <option value="true">{t('Đã xóa')}</option>
              <option value="">{t('Tất cả')}</option>
            </select>
          </label>
        </FilterPanel>
        <State loading={list.isPending} error={list.error} retry={() => list.refetch()}>
          {list.data && (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Họ tên')}</th>
                      <th>Email</th>
                      <th>{t('Vai trò')}</th>
                      <th>{t('Trạng thái')}</th>
                      <th>{t('Thao tác')}</th>
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
                            aria-label={t('Xem tài khoản ') + account.email}
                            onClick={() => setSelected(account.id)}
                          >
                            {t('Chi tiết')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!list.data.items.length && (
                  <p className="empty">{t('Không có tài khoản phù hợp.')}</p>
                )}
              </div>
              <div className="row pagination">
                <span>
                  {t('{totalCount} kết quả · Trang {page}/{p4}', {
                    totalCount: list.data.totalCount,
                    page: list.data.page,
                    p4: Math.max(1, list.data.totalPages),
                  })}
                </span>
                <button
                  className="btn"
                  disabled={list.isFetching || !list.data.hasPreviousPage}
                  onClick={() => filter({ page: filters.page - 1 })}
                >
                  {t('Trang trước')}
                </button>
                <button
                  className="btn"
                  disabled={list.isFetching || !list.data.hasNextPage}
                  onClick={() => filter({ page: filters.page + 1 })}
                >
                  {t('Trang sau')}
                </button>
              </div>
            </>
          )}
        </State>
      </section>
      {selected && (
        <Dialog title={t('Chi tiết tài khoản')} onClose={() => setSelected('')}>
          <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
            {detail.data && (
              <AccountDetails
                key={detail.data.id}
                actor={actor}
                account={detail.data}
                refresh={refresh}
                removed={() => {
                  setSelected('');
                  setNotice(t('Đã xóa mềm tài khoản.'));
                }}
              />
            )}
          </State>
        </Dialog>
      )}
    </>
  );
}
function AccountStatus({ account }: { account: Account }) {
  return (
    <Badge tone={account.isActive ? 'green' : 'amber'}>
      {account.deletedAt ? t('Đã xóa') : account.isActive ? t('Hoạt động') : t('Vô hiệu hóa')}
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
  const cache = useQueryClient();
  const orgName = useOwnOrgName(actor);
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
                label: t('Vai trò tài khoản'),
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
                label: t('Tổ chức'),
                type: 'search' as const,
                search: searchOrganizations(actor),
                searchKey: ['account-org', actor.id],
                hint: t('Bắt buộc với vai trò không phải Admin; tổ chức phải hoạt động.'),
              },
            ]
          : []),
      ];
  return (
    <Dialog
      title={account ? t('Sửa hồ sơ tài khoản') : t('Tạo tài khoản')}
      onClose={() => {
        if (!busy) close();
      }}
    >
      {account && (
        <p>
          {t('Email, vai trò và tổ chức giữ nguyên: {email} · {p3}', {
            email: account.email,
            p3: roles[account.role],
          })}
        </p>
      )}
      {!account && actor.role === 'CenterAdmin' && (
        <div className="stack">
          <p>
            {t('Tổ chức: {p1} · Vai trò: {p3}', {
              p1: orgName ?? t('Tổ chức của bạn'),
              p3: roles[fixedRole || 'Caregiver'],
            })}
          </p>
          <p>
            {t(
              'Nhân viên không dùng suất license. Để tạo người được chăm sóc, tổ chức cần gói license đang hoạt động và còn suất. Nếu không cấp được suất, tài khoản sẽ không được tạo.',
            )}{' '}
            <Link to="/center-admin/licenses">{t('Xem kho license')}</Link>.
          </p>
        </div>
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
        submit={account ? t('Lưu hồ sơ') : t('Tạo tài khoản')}
        onSubmit={async (values) => {
          if (!account && values.password !== values.confirmation)
            throw new Error(t('Mật khẩu nhập lại không khớp.'));
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
            if (
              !account &&
              actor.role === 'CenterAdmin' &&
              (fixedRole || values.role) === 'VisuallyImpaired' &&
              [402, 422].includes((error as { status?: number }).status || 0)
            )
              throw new Error(
                t(
                  '{p0} Kiểm tra dữ liệu và kho license; nếu hết suất, mua thêm gói Business rồi thử lại.',
                  { p0: error instanceof Error ? error.message : t('Không thể tạo tài khoản.') },
                ),
                { cause: error },
              );
            if ((error as { status?: number }).status! >= 500)
              throw new Error(
                t(
                  'Chưa xác nhận được kết quả lưu. Đóng form và tải lại/tìm email trước khi gửi lại để tránh tạo trùng tài khoản.',
                ),
                { cause: error },
              );
            throw error;
          } finally {
            if (!account && actor.role === 'CenterAdmin')
              await cache.invalidateQueries({
                predicate: (q) =>
                  ['license-pool', 'license-assignments'].includes(String(q.queryKey[0])) &&
                  q.queryKey[1] === actor.id,
              });
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
  const [restoring, setRestoring] = useState(false);
  const now = useNow();
  const [notice, setNotice] = useState('');
  const orgName = useOwnOrgName(actor);
  // Admin may open accounts of any organization: name it from the org record, never the raw id.
  const otherOrg = !!account.organizationId && account.organizationId !== actor.orgId;
  const org = useQuery({
    queryKey: ['api-account-org', actor.id, account.organizationId],
    queryFn: ({ signal }) => organizationsApi.detail(actor, account.organizationId!, signal),
    enabled: actor.role === 'Admin' && otherOrg,
    staleTime: 5 * 60000,
    retry: false,
  });
  const orgLabel = !account.organizationId
    ? t('Không thuộc tổ chức')
    : (otherOrg ? org.data?.name : orgName) ||
      (org.isPending && otherOrg ? t('Đang tải…') : t('Một tổ chức'));
  const initials = account.fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <section className="stack account-detail">
      <header className="account-detail-head">
        <span className="avatar account-detail-avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="account-detail-title">
          <h2>{account.fullName}</h2>
          <span className="muted">{roles[account.role]}</span>
        </div>
        <AccountStatus account={account} />
      </header>
      <dl className="record-details">
        <div>
          <dt>Email</dt>
          <dd>{account.email}</dd>
        </div>
        <div>
          <dt>{t('Số điện thoại')}</dt>
          <dd>{account.phoneNumber || t('Chưa có điện thoại')}</dd>
        </div>
        <div>
          <dt>{t('Tổ chức')}</dt>
          <dd>{orgLabel}</dd>
        </div>
        <div>
          <dt>{t('Ảnh đại diện')}</dt>
          <dd>{account.avatarUrl ? t('Đã có') : t('Chưa có')}</dd>
        </div>
        {account.role === 'VisuallyImpaired' && (
          <div>
            <dt>License</dt>
            <dd className="stack account-detail-license">
              <span>
                <Badge tone={account.licenseStatus === 'Active' ? 'green' : 'amber'}>
                  {viuLicenseLabel(account.licenseStatus)}
                </Badge>
                {account.licenseExpiresAt && (
                  <span className="muted">
                    {' '}
                    {t('Hết hạn {p0}', { p0: formatLocaleDateTime(account.licenseExpiresAt) })}
                  </span>
                )}
              </span>
              {actor.role === 'CenterAdmin' && (
                <Link to="/center-admin/licenses">{t('Quản lý cấp và thu hồi')}</Link>
              )}
            </dd>
          </div>
        )}
      </dl>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {account.deletedAt ? (
        <div className="stack">
          <p>
            {t('Tài khoản đã xóa lúc {time}.', { time: formatLocaleDateTime(account.deletedAt) })}{' '}
            {now - Date.parse(account.deletedAt) > RESTORE_WINDOW_DAYS * 86_400_000
              ? t('Đã quá {days} ngày nên máy chủ có thể không cho khôi phục.', {
                  days: RESTORE_WINDOW_DAYS,
                })
              : t('Có thể khôi phục trong {days} ngày kể từ lúc xóa.', {
                  days: RESTORE_WINDOW_DAYS,
                })}
          </p>
          {actor.role === 'Admin' && (
            <div className="row account-detail-actions">
              <button className="btn" onClick={() => setRestoring(true)}>
                {t('Khôi phục tài khoản')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="row account-detail-actions">
          <button className="btn" onClick={() => setEdit(true)}>
            {t('Sửa hồ sơ tài khoản')}
          </button>
          <button className="btn" onClick={() => setReset(true)}>
            {t('Đặt lại mật khẩu')}
          </button>
          {account.id !== actor.id && (
            <button
              className="btn"
              onClick={() => setAction(account.isActive ? 'deactivate' : 'activate')}
            >
              {account.isActive ? t('Vô hiệu hóa tài khoản') : t('Kích hoạt tài khoản')}
            </button>
          )}
          {actor.role === 'Admin' && account.id !== actor.id && (
            <button className="btn danger" onClick={() => setAction('delete')}>
              {t('Xóa tài khoản')}
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
            setNotice(t('Đã cập nhật hồ sơ.'));
            await refresh();
            if (account.id === actor.id) await cache.invalidateQueries({ queryKey: ['session'] });
          }}
        />
      )}
      {action && !account.deletedAt && (
        <Confirm
          title={
            action === 'delete'
              ? t('Xóa tài khoản')
              : action === 'activate'
                ? t('Kích hoạt tài khoản')
                : t('Vô hiệu hóa tài khoản')
          }
          description={
            account.email +
            (action === 'activate'
              ? t(': mở lại tài khoản. Tổ chức cũng phải hoạt động để đăng nhập.')
              : t(': thu hồi phiên refresh và FCM. ') +
                (action === 'delete'
                  ? t('Tài khoản vẫn được giữ lại; Admin có thể khôi phục trong {days} ngày.', {
                      days: RESTORE_WINDOW_DAYS,
                    })
                  : t('Người dùng sẽ bị chặn đăng nhập.')))
          }
          onClose={() => setAction(null)}
          onConfirm={async () => {
            if (action === 'delete') {
              await accountsApi.remove(actor, account.id);
              removed();
            } else {
              await accountsApi.status(actor, account.id, action === 'activate');
              setNotice(t('Đã cập nhật trạng thái.'));
            }
            await refresh();
          }}
        />
      )}
      {restoring && account.deletedAt && (
        <Confirm
          title={t('Khôi phục tài khoản')}
          description={t(
            '{email}: mở lại tài khoản, đăng nhập bằng mật khẩu cũ, giữ nguyên liên kết và dữ liệu còn lưu. Dữ liệu đã bị xóa theo thời hạn lưu trữ sẽ không lấy lại được.',
            { email: account.email },
          )}
          onClose={() => setRestoring(false)}
          onConfirm={async () => {
            const result = await accountsApi.restore(actor, account.id);
            setNotice(
              result.needsLicense
                ? t(
                    'Đã khôi phục tài khoản. Kho của tổ chức hết suất nên người dùng chưa có license; trung tâm cần cấp một suất, trước đó chỉ dùng được SOS.',
                  )
                : t('Đã khôi phục tài khoản.'),
            );
            await refresh();
          }}
        />
      )}
      {reset && !account.deletedAt && (
        <Dialog
          title={t('Đặt lại mật khẩu')}
          onClose={() => {
            if (!busy) setReset(false);
          }}
        >
          <p>
            {t(
              'Tài khoản: {email}. Đặt lại mật khẩu sẽ thu hồi các phiên refresh; người dùng cần đăng nhập lại.',
              { email: account.email },
            )}
          </p>
          <Form
            fields={[
              ...passwordFields,
              {
                key: 'confirm',
                label: t('Tôi xác nhận đặt lại mật khẩu cho tài khoản này'),
                type: 'checkbox',
              },
            ]}
            submit={t('Xác nhận đặt lại mật khẩu')}
            onSubmit={async (values) => {
              if (values.password !== values.confirmation)
                throw new Error(t('Mật khẩu nhập lại không khớp.'));
              if (!values.confirm) throw new Error(t('Vui lòng xác nhận thao tác.'));
              setBusy(true);
              try {
                await accountsApi.resetPassword(actor, account.id, String(values.password));
                setReset(false);
                setNotice(t('Đã đặt lại mật khẩu; người dùng cần đăng nhập lại.'));
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

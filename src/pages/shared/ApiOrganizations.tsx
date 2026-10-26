import { t, msg } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { ServiceError } from '../../services/contracts';
import {
  getAdminOrganizationPool,
  renewPool,
  setPoolSuspended,
  subscriptionLabels,
  type OrganizationPool,
} from '../../services/api/licenses';
import { formatLocaleDateTime } from '../../i18n';
import {
  organizationsApi,
  type Organization,
  type OrganizationInput,
} from '../../services/api/organizations';
import { Form, type FieldSpec } from '../../components/Form';
import { Badge, Confirm, Dialog, PageHead, State } from '../../components/UI';
import { roles } from '../../constants/labels';
import { PoolAutoRenew } from './PoolAutoRenew';
import type { Person } from '../../models/domain';

const fields: FieldSpec[] = [
  { key: 'name', label: msg('Tên tổ chức'), required: true, max: 200 },
  { key: 'address', label: msg('Địa chỉ'), max: 500 },
  {
    key: 'phoneNumber',
    label: msg('Điện thoại liên hệ'),
    hint: msg('Để trống, hoặc nhập số di động, số bàn 02x hay tổng đài 1800/1900.'),
  },
  // Optional email is validated in the API adapter; the shared Form email rule requires a value.
  { key: 'contactEmail', label: msg('Email liên hệ') },
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
    <div className="row pagination">
      <span>
        {t('{totalCount} kết quả · Trang {page}/{p4}', {
          totalCount: data.totalCount,
          page: data.page,
          p4: Math.max(1, data.totalPages),
        })}
      </span>
      <button
        className="btn"
        disabled={busy || !data.hasPreviousPage}
        onClick={() => change(data.page - 1)}
      >
        {t('Trang trước')}
      </button>
      <button
        className="btn"
        disabled={busy || !data.hasNextPage}
        onClick={() => change(data.page + 1)}
      >
        {t('Trang sau')}
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
        title={admin ? t('Tổ chức & trung tâm') : t('Hồ sơ trung tâm')}
        description={t('Thông tin tổ chức và thành viên theo quyền tài khoản.')}
        actions={
          admin && (
            <button className="btn primary" onClick={() => setCreate(true)}>
              {t('Tạo tổ chức')}
            </button>
          )
        }
      />
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {create && (
        <OrganizationEditor
          user={user}
          close={() => setCreate(false)}
          saved={async (org) => {
            setCreate(false);
            setSelected(org.id);
            setNotice(
              t(
                'Đã tạo tổ chức. Tiếp theo, tạo tài khoản Quản trị trung tâm tại Quản lý tài khoản.',
              ),
            );
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
              {t('Tìm tổ chức')}
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('Tên, mã số thuế, email')}
              />
            </label>
            <label className="field">
              {t('Trạng thái')}
              <select
                value={active}
                onChange={(e) => {
                  setActive(e.target.value);
                  setPage(1);
                  setSelected('');
                }}
              >
                <option value="">{t('Tất cả trạng thái')}</option>
                <option value="true">{t('Đang hoạt động')}</option>
                <option value="false">{t('Ngừng hoạt động')}</option>
              </select>
            </label>
            <label className="field">
              {t('Dữ liệu xóa')}
              <select
                value={deleted}
                onChange={(e) => {
                  setDeleted(e.target.value);
                  setPage(1);
                  setSelected('');
                }}
              >
                <option value="false">{t('Chưa xóa')}</option>
                <option value="true">{t('Đã xóa')}</option>
                <option value="">{t('Tất cả')}</option>
              </select>
            </label>
            <button className="btn" type="submit">
              {t('Tìm kiếm')}
            </button>
            <button
              className="btn"
              type="button"
              disabled={list.isFetching}
              onClick={() => void refresh()}
            >
              {t('Tải lại')}
            </button>
          </form>
          <State loading={list.isPending} error={list.error} retry={() => list.refetch()}>
            {list.data && (
              <>
                {!list.data.items.length && <p>{t('Không có tổ chức phù hợp.')}</p>}
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('Tên tổ chức')}</th>
                        <th>Email</th>
                        <th>{t('Trạng thái')}</th>
                        <th>{t('Thao tác')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.data.items.map((org) => (
                        <tr key={org.id}>
                          <td>{org.name}</td>
                          <td>{org.contactEmail || t('Chưa có')}</td>
                          <td>
                            <OrganizationStatus org={org} />
                          </td>
                          <td>
                            <button
                              className="btn"
                              onClick={() => setSelected(org.id)}
                              aria-label={t('Xem tổ chức ') + org.name}
                            >
                              {t('Chi tiết')}
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
      {(!admin || selected) &&
        (admin ? (
          <Dialog title={t('Chi tiết tổ chức')} onClose={() => setSelected('')}>
            <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
              {detail.data && (
                <OrganizationDetails
                  key={detail.data.id}
                  user={user}
                  org={detail.data}
                  refresh={refresh}
                  removed={() => {
                    setSelected('');
                    setNotice(t('Đã xóa mềm tổ chức.'));
                  }}
                />
              )}
            </State>
          </Dialog>
        ) : (
          <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
            {detail.data && (
              <OrganizationDetails
                key={detail.data.id}
                user={user}
                org={detail.data}
                refresh={refresh}
                removed={() => {
                  setSelected('');
                  setNotice(t('Đã xóa mềm tổ chức.'));
                }}
              />
            )}
          </State>
        ))}
    </>
  );
}
function OrganizationStatus({ org }: { org: Organization }) {
  return (
    <Badge tone={org.isActive ? 'green' : 'amber'}>
      {org.deletedAt ? t('Đã xóa') : org.isActive ? t('Đang hoạt động') : t('Ngừng hoạt động')}
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
      title={org ? t('Sửa tổ chức') : t('Tạo tổ chức')}
      onClose={() => {
        if (!busy) close();
      }}
    >
      <Form
        fields={
          org
            ? fields
            : [...fields, { key: 'taxCode', label: t('Mã số thuế / giấy phép'), max: 50 }]
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
        submit={org ? t('Lưu tổ chức') : t('Tạo tổ chức')}
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
                (err.message || t('Lỗi máy chủ.')) +
                  t(
                    ' Có thể thay đổi đã được lưu; đóng form và tải lại danh sách để kiểm tra trước khi gửi lại.',
                  ),
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
      <p>{t('Mã tổ chức: {id}', { id: org.id })}</p>
      <p>
        {t('Mã số thuế:')} {org.taxCode || t('Chưa có')} {t('· Địa chỉ:')}{' '}
        {org.address || t('Chưa có')}
      </p>
      <p>
        {t('Liên hệ:')} {org.phoneNumber || t('Chưa có số điện thoại')} ·{' '}
        {org.contactEmail || t('Chưa có email')}
      </p>
      <p>
        {t('Quản trị trung tâm:')} {org.centerAdminName || t('Chưa có')}{' '}
        {t('· Nhân viên: {staffCount} · Người khiếm thị: {viuCount}', {
          staffCount: org.staffCount,
          viuCount: org.viuCount,
        })}
      </p>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <div className="row">
        {!org.deletedAt && (
          <button className="btn" onClick={() => setEdit(true)}>
            {t('Sửa tổ chức')}
          </button>
        )}
        {user.role === 'Admin' && (
          <>
            <button
              className="btn"
              onClick={() => setAction(org.isActive ? 'deactivate' : 'activate')}
            >
              {org.isActive ? t('Vô hiệu hóa tổ chức') : t('Kích hoạt tổ chức')}
            </button>
            {!org.deletedAt && (
              <button className="btn danger" onClick={() => setAction('delete')}>
                {t('Xóa tổ chức')}
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
            setNotice(t('Đã cập nhật tổ chức.'));
            await refresh();
          }}
        />
      )}
      {action && (
        <Confirm
          title={
            action === 'delete'
              ? t('Xóa tổ chức')
              : action === 'activate'
                ? t('Kích hoạt tổ chức')
                : t('Vô hiệu hóa tổ chức')
          }
          description={
            org.name +
            (action === 'activate'
              ? t(': khôi phục tổ chức; thành viên vẫn cần được kích hoạt riêng.')
              : t(': thành viên đang hoạt động sẽ bị vô hiệu hóa và thu hồi phiên/FCM.') +
                (action === 'delete' ? t(' Tổ chức được đánh dấu xóa mềm.') : ''))
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
                  ? t('Đã kích hoạt tổ chức; cần kích hoạt từng thành viên riêng.')
                  : t('Đã vô hiệu hóa tổ chức.'),
              );
            }
            await refresh();
          }}
        />
      )}
      {user.role === 'Admin' && !org.deletedAt && <OrganizationPoolAdmin user={user} org={org} />}
      {!org.deletedAt && (
        <>
          <h3>{t('Thành viên tổ chức')}</h3>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(draft.trim());
            }}
          >
            <label className="field">
              {t('Tìm thành viên')}
              <input value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            <label className="field">
              {t('Vai trò')}
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('Tất cả vai trò')}</option>
                {(['CenterAdmin', 'Caregiver', 'VisuallyImpaired'] as const).map((r) => (
                  <option key={r} value={r}>
                    {roles[r]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {t('Trạng thái thành viên')}
              <select
                value={active}
                onChange={(e) => {
                  setActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('Tất cả')}</option>
                <option value="true">{t('Hoạt động')}</option>
                <option value="false">{t('Vô hiệu hóa')}</option>
              </select>
            </label>
            <button className="btn">{t('Tìm thành viên')}</button>
          </form>
          <State loading={members.isPending} error={members.error} retry={() => members.refetch()}>
            {members.data && (
              <>
                {!members.data.items.length && <p>{t('Chưa có thành viên phù hợp.')}</p>}
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('Họ tên')}</th>
                        <th>Email</th>
                        <th>{t('Điện thoại')}</th>
                        <th>{t('Vai trò')}</th>
                        <th>{t('Trạng thái')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.data.items.map((m) => (
                        <tr key={m.id}>
                          <td>{m.fullName}</td>
                          <td>{m.email}</td>
                          <td>{m.phoneNumber || t('Chưa có')}</td>
                          <td>{roles[m.role]}</td>
                          <td>{m.isActive ? t('Hoạt động') : t('Vô hiệu hóa')}</td>
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

// UC-130 / WF-04: Super Admin suspends, reactivates or manually renews the organization's pool.
function OrganizationPoolAdmin({ user, org }: { user: Person; org: Organization }) {
  const [action, setAction] = useState<'suspend' | 'reactivate' | 'renew' | null>(null);
  const [notice, setNotice] = useState('');
  const pool = useQuery({
    queryKey: ['api-admin-pool', user.id, org.id],
    queryFn: ({ signal }) => getAdminOrganizationPool(user, org.id, signal),
    retry: false,
  });
  const reload = async () => (await pool.refetch()).data;
  const done = (next?: OrganizationPool) =>
    setNotice(
      !next
        ? t('Đã gửi yêu cầu. Tải lại kho license để xem trạng thái mới.')
        : next.status === 'Suspended'
          ? t('Đã tạm ngưng kho license.')
          : next.status === 'Expired'
            ? t('Đã kích hoạt lại, nhưng kho đã quá hạn nên ở trạng thái Đã hết hạn.')
            : t('Đã kích hoạt lại kho license.'),
    );
  const missing = pool.error instanceof ServiceError && pool.error.status === 404;
  return (
    <section className="stack" aria-labelledby={'pool-' + org.id}>
      <div className="row between">
        <h3 id={'pool-' + org.id}>{t('Kho license')}</h3>
        <button className="btn small" disabled={pool.isFetching} onClick={() => void reload()}>
          {t('Tải lại kho license')}
        </button>
      </div>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {missing ? (
        <p>{t('Tổ chức chưa có kho license.')}</p>
      ) : (
        <State loading={pool.isPending} error={pool.error} retry={() => void reload()}>
          {pool.data && (
            <>
              <dl className="record-details">
                <div>
                  <dt>{t('Gói')}</dt>
                  <dd>{pool.data.package.name}</dd>
                </div>
                <div>
                  <dt>{t('Trạng thái')}</dt>
                  <dd>
                    <Badge tone={pool.data.status === 'Active' ? 'green' : 'amber'}>
                      {subscriptionLabels[pool.data.status]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt>{t('Đã cấp')}</dt>
                  <dd>
                    {t('{used}/{total} suất · còn {available}', {
                      used: pool.data.usedLicenses,
                      total: pool.data.totalLicenses,
                      available: pool.data.availableLicenses,
                    })}
                  </dd>
                </div>
                <div>
                  <dt>{t('Hết hạn')}</dt>
                  <dd>
                    {pool.data.expiresAt
                      ? formatLocaleDateTime(pool.data.expiresAt)
                      : t('Không giới hạn')}
                  </dd>
                </div>
                {pool.data.status === 'Suspended' && (
                  <>
                    <div>
                      <dt>{t('Tạm ngưng lúc')}</dt>
                      <dd>
                        {pool.data.suspendedAt
                          ? formatLocaleDateTime(pool.data.suspendedAt)
                          : t('Chưa ghi nhận')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('Lý do tạm ngưng')}</dt>
                      <dd style={{ whiteSpace: 'pre-wrap' }}>
                        {pool.data.suspendedReason || t('Không ghi lý do')}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              <PoolAutoRenew actor={user} pool={pool.data} reload={reload} />
              <div className="row">
                {pool.data.status === 'Suspended' ? (
                  <button className="btn primary" onClick={() => setAction('reactivate')}>
                    {t('Kích hoạt lại kho')}
                  </button>
                ) : (
                  <>
                    <button className="btn primary" onClick={() => setAction('renew')}>
                      {t('Gia hạn thủ công')}
                    </button>
                    <button className="btn danger" onClick={() => setAction('suspend')}>
                      {t('Tạm ngưng kho')}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </State>
      )}
      {action === 'suspend' && pool.data && (
        <Dialog title={t('Tạm ngưng kho license')} onClose={() => setAction(null)}>
          <div className="stack">
            <p>
              {t(
                '{name}: người được chăm sóc đang dùng license của kho sẽ chuyển về Chưa có license cho tới khi kích hoạt lại. Trung tâm không cấp thêm suất hoặc tạo mã được.',
                { name: org.name },
              )}
            </p>
            <Form
              submit={t('Xác nhận tạm ngưng')}
              fields={[
                {
                  key: 'reason',
                  label: t('Lý do tạm ngưng'),
                  type: 'textarea',
                  max: 500,
                  hint: t('Không bắt buộc. Quản trị trung tâm có thể đọc lý do này.'),
                },
              ]}
              onSubmit={async (values) => {
                try {
                  await setPoolSuspended(user, pool.data!.id, true, String(values.reason ?? ''));
                } catch (error) {
                  // Another admin may have changed it; show the current state behind the error.
                  await reload();
                  throw error;
                }
                done(await reload());
                setAction(null);
              }}
            />
          </div>
        </Dialog>
      )}
      {action === 'renew' && pool.data && (
        <Dialog title={t('Gia hạn kho license')} onClose={() => setAction(null)}>
          <div className="stack">
            <p>
              {t(
                '{name}: kho và mọi mã đã phát cho gia đình được kéo dài đến ngày mới. Hạn hiện tại: {date}. Gia hạn thủ công không tạo giao dịch PayOS.',
                {
                  name: org.name,
                  date: pool.data.expiresAt
                    ? formatLocaleDateTime(pool.data.expiresAt)
                    : t('Không giới hạn'),
                },
              )}
            </p>
            <Form
              submit={t('Xác nhận gia hạn')}
              fields={[
                {
                  key: 'newExpiresAt',
                  label: t('Ngày hết hạn mới'),
                  type: 'date',
                  required: true,
                  hint: t('Hết ngày đã chọn theo giờ máy của bạn; tối đa 5 năm kể từ hôm nay.'),
                },
                {
                  key: 'additionalSeats',
                  label: t('Số suất thêm'),
                  type: 'number',
                  min: 0,
                  max: 10000,
                  step: 1,
                },
              ]}
              onSubmit={async (values) => {
                let next: OrganizationPool | undefined;
                try {
                  next = await renewPool(
                    user,
                    pool.data!,
                    String(values.newExpiresAt) + 'T23:59:59',
                    Number(values.additionalSeats),
                  );
                } catch (error) {
                  if (error instanceof ServiceError && error.status >= 409) await reload();
                  throw error;
                }
                const fresh = await reload();
                const shown = fresh ?? next;
                setNotice(
                  shown?.expiresAt
                    ? t('Đã gia hạn kho license đến {date}.', {
                        date: formatLocaleDateTime(shown.expiresAt),
                      })
                    : t('Đã gửi yêu cầu. Tải lại kho license để xem trạng thái mới.'),
                );
                setAction(null);
              }}
            />
          </div>
        </Dialog>
      )}
      {action === 'reactivate' && pool.data && (
        <Confirm
          title={t('Kích hoạt lại kho license')}
          description={t(
            '{name}: kho trở về Đang hoạt động, hoặc Đã hết hạn nếu đã qua ngày hết hạn. License của người được chăm sóc được khôi phục theo trạng thái đó.',
            { name: org.name },
          )}
          onClose={() => setAction(null)}
          onConfirm={async () => {
            try {
              await setPoolSuspended(user, pool.data!.id, false);
            } catch (error) {
              await reload();
              throw error;
            }
            done(await reload());
          }}
        />
      )}
    </section>
  );
}

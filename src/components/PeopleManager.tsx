import { useState } from 'react';
import type { Person, Role } from '../models/domain';
import { useWorkspace } from '../hooks/useWorkspace';
import { useCommand, useLinkActions } from '../hooks/useService';
import { canManagePerson } from '../services/policy';
import { roles } from '../constants/labels';
import { PageHead, State, DataTable, Dialog, Confirm, Badge } from './UI';
import { Form, type FieldSpec } from './Form';
export function PeopleManager({ role, title }: { role?: Role; title: string }) {
  const { query, db, user } = useWorkspace();
  const cmd = useCommand();
  const actions = useLinkActions();
  const [edit, setEdit] = useState<Person | null>(null);
  const [toggle, setToggle] = useState<Person | null>(null);
  const [reset, setReset] = useState<Person | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const rows =
    db?.people.filter(
      (p) =>
        (!role || p.role === role) &&
        (status === 'all' || p.active === (status === 'active')) &&
        (roleFilter === 'all' || p.role === roleFilter),
    ) ?? [];
  const fields: FieldSpec[] = [
    { key: 'name', label: 'Họ và tên', required: true, max: 200 },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Số điện thoại' },
    ...(!role
      ? [
          {
            key: 'role',
            label: 'Vai trò',
            type: 'select' as const,
            required: true,
            options: Object.entries(roles).map(([value, label]) => ({ value, label })),
          },
          {
            key: 'orgId',
            label: 'Tổ chức (bắt buộc khi tạo Staff/VIU/Center Admin)',
            type: 'select' as const,
            options: db?.entities.organizations
              .filter((o) => o.active)
              .map((o) => ({ value: o.id, label: o.name })),
          },
        ]
      : []),
  ];
  return (
    <>
      <PageHead
        title={title}
        description="Tạo và cập nhật tài khoản trong phạm vi được cấp quyền. Vô hiệu hóa sẽ thu hồi quyền đăng nhập."
        actions={
          <button
            className="btn primary"
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                name: '',
                email: '',
                phone: '',
                role: role ?? 'Caregiver',
                orgId: user.orgId,
                active: true,
              })
            }
          >
            Thêm tài khoản
          </button>
        }
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <DataTable
          title={title}
          rows={rows}
          searchText={(p) => p.name + ' ' + p.email}
          filter={
            <>
              <label className="field">
                <span className="sr-only">Trạng thái tài khoản</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </label>
              {!role && (
                <label className="field">
                  <span className="sr-only">Vai trò tài khoản</span>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">Tất cả vai trò</option>
                    {Object.entries(roles).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          }
          columns={[
            {
              label: 'Tài khoản',
              render: (p) => (
                <>
                  <strong>{p.name}</strong>
                  <p>
                    <small>{p.email}</small>
                  </p>
                </>
              ),
            },
            {
              label: 'Vai trò / tổ chức',
              render: (p) => (
                <>
                  {roles[p.role]}
                  <p>
                    <small>
                      {db?.entities.organizations.find((o) => o.id === p.orgId)?.name ?? 'Cá nhân'}
                    </small>
                  </p>
                </>
              ),
            },
            {
              label: 'Phân công',
              render: (p) =>
                db?.links.filter((l) => l.caregiverId === p.id || l.viuId === p.id).length ?? 0,
            },
            {
              label: 'Trạng thái',
              render: (p) => (
                <Badge tone={p.active ? 'green' : 'amber'}>
                  {p.active ? 'Hoạt động' : 'Đã vô hiệu hóa'}
                </Badge>
              ),
            },
            {
              label: 'Thao tác',
              render: (p) =>
                canManagePerson(user, p) && (
                  <div className="row">
                    <button className="btn small" onClick={() => setEdit(p)}>
                      Chỉnh sửa
                    </button>
                    <button className="btn small" onClick={() => setReset(p)}>
                      Đặt lại mật khẩu
                    </button>
                    <button
                      className={'btn small ' + (p.active ? 'danger' : '')}
                      onClick={() => setToggle(p)}
                    >
                      {p.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </button>
                  </div>
                ),
            },
          ]}
        />
      </State>
      {edit && (
        <Dialog
          title={
            db?.people.some((p) => p.id === edit.id) ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản demo'
          }
          onClose={() => setEdit(null)}
        >
          <div className="stack">
            <p className="notice">
              Tài khoản demo mới dùng mật khẩu Demo@123. Không có email thật được gửi. VIU chỉ đăng
              nhập ứng dụng Mobile.
            </p>
            <Form
              fields={fields}
              initial={{
                name: edit.name,
                email: edit.email,
                phone: edit.phone,
                role: edit.role,
                orgId: edit.orgId,
              }}
              onSubmit={async (v) => {
                await cmd.mutateAsync({
                  type: 'person',
                  person: {
                    ...edit,
                    name: String(v.name),
                    email: String(v.email),
                    phone: String(v.phone),
                    role: role ?? (v.role as Role),
                    orgId: role ? user.orgId : String(v.orgId ?? ''),
                  },
                });
                setEdit(null);
              }}
            />
          </div>
        </Dialog>
      )}
      {toggle && (
        <Confirm
          title={`${toggle.active ? 'Vô hiệu hóa' : 'Kích hoạt'} ${toggle.name}?`}
          description={
            toggle.active
              ? 'Tài khoản sẽ không đăng nhập được. Liên kết vẫn được giữ để quản trị viên phân công lại; không tự chuyển người chăm sóc chính.'
              : 'Khôi phục quyền đăng nhập theo vai trò và liên kết hiện tại.'
          }
          onClose={() => setToggle(null)}
          onConfirm={() =>
            cmd.mutateAsync({ type: 'person', person: { ...toggle, active: !toggle.active } })
          }
        />
      )}{' '}
      {reset && (
        <Confirm
          title={`Đặt lại mật khẩu cho ${reset.name}?`}
          description="Tạo mã đặt lại mật khẩu demo. Không gửi email thật."
          onClose={() => setReset(null)}
          onConfirm={async () => setCode(await actions.resetPassword(reset.id))}
        />
      )}{' '}
      {code && (
        <Dialog title="Mã khôi phục demo" onClose={() => setCode('')}>
          <p className="mono">{code}</p>
          <p>Dùng mã ở trang khôi phục mật khẩu. Chưa gửi email thật.</p>
        </Dialog>
      )}
    </>
  );
}

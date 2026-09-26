import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { linksApi, canManageLink, type CareLink, type LinkFilters } from '../../services/api/links';
import { Form, type FieldSpec } from '../../components/Form';
import { Badge, Confirm, Dialog, PageHead, State } from '../../components/UI';
import type { Person } from '../../models/domain';

const permissionFields: FieldSpec[] = [
  { key: 'canReceiveAlerts', label: 'Nhận cảnh báo', type: 'checkbox' },
  { key: 'canManageRegistry', label: 'Quản lý gương mặt', type: 'checkbox' },
  { key: 'canManageLocations', label: 'Quản lý địa điểm', type: 'checkbox' },
];
export function ApiLinks() {
  const { data: actor } = useSession();
  return actor ? <Links key={actor.id + actor.orgId} actor={actor} /> : null;
}
function Links({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const [filters, setFilters] = useState<LinkFilters>({
    page: 1,
    caregiverId: '',
    viuId: '',
    linkType: '',
    active: 'true',
  });
  const [draftCg, setDraftCg] = useState('');
  const [draftViu, setDraftViu] = useState('');
  const [selected, setSelected] = useState('');
  const [create, setCreate] = useState(false);
  const [notice, setNotice] = useState('');
  const list = useQuery({
    queryKey: ['api-managed-links', actor.id, actor.orgId, filters],
    queryFn: ({ signal }) => linksApi.list(actor, filters, signal),
    refetchInterval: 30000,
  });
  const detail = useQuery({
    queryKey: ['api-managed-link', actor.id, actor.orgId, selected],
    queryFn: ({ signal }) => linksApi.detail(actor, selected, signal),
    enabled: !!selected,
    refetchInterval: 30000,
  });
  const filter = (values: Partial<LinkFilters>) => {
    setFilters((f) => ({ ...f, ...values, page: values.page || 1 }));
    setSelected('');
  };
  const refresh = async () => {
    await cache.invalidateQueries({
      predicate: (q) =>
        [
          'api-managed-links',
          'api-managed-link',
          'api-links',
          'api-link-detail',
          'api-users',
        ].includes(String(q.queryKey[0])) && q.queryKey[1] === actor.id,
    });
  };
  return (
    <>
      <PageHead
        title={actor.role === 'Caregiver' ? 'Liên kết của tôi' : 'Phân công chăm sóc'}
        description={
          actor.role === 'Caregiver'
            ? 'Chỉ hiển thị liên kết của chính bạn. Chưa có API mời người chăm sóc phụ bằng email hoặc QR.'
            : 'Phân công tài khoản Caregiver và VIU đã có; tối đa 3 liên kết hoạt động cho mỗi bên.'
        }
        actions={
          <button className="btn primary" onClick={() => setCreate(true)}>
            Tạo liên kết
          </button>
        }
      />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {create && (
        <LinkEditor
          actor={actor}
          close={() => setCreate(false)}
          saved={async (link) => {
            setCreate(false);
            setSelected(link.id);
            setNotice('Đã tạo liên kết. Trạng thái chính/phụ do máy chủ quyết định.');
            await refresh();
          }}
        />
      )}
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            filter({ caregiverId: draftCg.trim(), viuId: draftViu.trim() });
          }}
        >
          {actor.role !== 'Caregiver' && (
            <label className="field">
              Mã Caregiver
              <input
                value={draftCg}
                onChange={(e) => setDraftCg(e.target.value)}
                placeholder="UUID; để trống xem tất cả"
              />
            </label>
          )}
          <label className="field">
            Mã VIU
            <input
              value={draftViu}
              onChange={(e) => setDraftViu(e.target.value)}
              placeholder="UUID; để trống xem tất cả"
            />
          </label>
          {actor.role !== 'CenterAdmin' && (
            <label className="field">
              Loại liên kết
              <select
                value={filters.linkType}
                onChange={(e) => filter({ linkType: e.target.value })}
              >
                <option value="">Tất cả loại</option>
                <option value="Personal">Cá nhân</option>
                <option value="Organization">Tổ chức</option>
              </select>
            </label>
          )}
          <label className="field">
            Trạng thái liên kết
            <select value={filters.active} onChange={(e) => filter({ active: e.target.value })}>
              <option value="true">Đang liên kết</option>
              <option value="false">Đã gỡ</option>
              <option value="">Tất cả</option>
            </select>
          </label>
          <button className="btn">Lọc liên kết</button>
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
              {!list.data.items.length && <p>Không có liên kết phù hợp.</p>}
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Caregiver</th>
                      <th>Người được chăm sóc</th>
                      <th>Loại</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.items.map((link) => (
                      <tr key={link.id}>
                        <td>
                          {link.caregiverFullName}
                          <br />
                          {link.caregiverEmail}
                        </td>
                        <td>
                          {link.viuFullName}
                          <br />
                          {link.viuEmail}
                        </td>
                        <td>{link.linkType === 'Personal' ? 'Cá nhân' : 'Tổ chức'}</td>
                        <td>
                          <LinkStatus link={link} />
                        </td>
                        <td>
                          <button
                            className="btn"
                            aria-label={'Xem liên kết ' + link.id}
                            onClick={() => setSelected(link.id)}
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
            <LinkDetails
              key={detail.data.id}
              actor={actor}
              link={detail.data}
              refresh={refresh}
              removed={() => {
                setSelected('');
                setNotice(
                  'Đã gỡ liên kết. BE sẽ chọn lại người chăm sóc chính nếu cần và còn liên kết hoạt động.',
                );
              }}
            />
          )}
        </State>
      )}
    </>
  );
}
function LinkStatus({ link }: { link: CareLink }) {
  return (
    <Badge tone={link.unlinkedAt ? 'amber' : 'green'}>
      {link.unlinkedAt ? 'Đã gỡ' : link.isPrimary ? 'Chăm sóc chính' : 'Chăm sóc phụ'}
    </Badge>
  );
}
function LinkEditor({
  actor,
  link,
  close,
  saved,
}: {
  actor: Person;
  link?: CareLink;
  close: () => void;
  saved: (link: CareLink) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const fields: FieldSpec[] = [
    ...(!link
      ? [
          ...(actor.role !== 'Caregiver'
            ? [
                {
                  key: 'caregiverId',
                  label: 'Mã Caregiver',
                  required: true,
                  hint: 'UUID từ chi tiết tài khoản nhân viên.',
                },
              ]
            : []),
          {
            key: 'viuId',
            label: 'Mã VIU',
            required: true,
            hint: 'UUID từ tài khoản người được chăm sóc đã tạo.',
          },
          ...(actor.role === 'Admin'
            ? [
                {
                  key: 'linkType',
                  label: 'Loại liên kết',
                  type: 'select' as const,
                  required: true,
                  options: [
                    { value: 'Personal', label: 'Cá nhân' },
                    { value: 'Organization', label: 'Tổ chức' },
                  ],
                },
              ]
            : []),
        ]
      : []),
    ...permissionFields,
    {
      key: 'confirmed',
      label: link
        ? 'Tôi xác nhận cập nhật các quyền trên'
        : 'Tôi xác nhận tạo liên kết giữa các tài khoản trên',
      type: 'checkbox',
    },
  ];
  return (
    <Dialog
      title={link ? 'Sửa quyền liên kết' : 'Tạo liên kết'}
      onClose={() => {
        if (!busy) close();
      }}
    >
      <p>
        {link
          ? link.caregiverEmail + ' → ' + link.viuEmail
          : actor.role === 'Caregiver'
            ? 'Tạo liên kết cá nhân cho chính bạn, không mời hoặc cấp quyền cho người chăm sóc khác.'
            : 'Hai tài khoản phải hoạt động. Liên kết tổ chức yêu cầu Caregiver và VIU cùng tổ chức.'}
      </p>
      <Form
        fields={fields}
        initial={{
          canReceiveAlerts: link?.canReceiveAlerts ?? true,
          canManageRegistry: link?.canManageRegistry ?? false,
          canManageLocations: link?.canManageLocations ?? false,
          linkType: 'Organization',
        }}
        submit={link ? 'Lưu quyền liên kết' : 'Tạo liên kết'}
        onSubmit={async (values) => {
          if (!values.confirmed) throw new Error('Vui lòng xác nhận thao tác.');
          setBusy(true);
          try {
            const permissions = {
              canReceiveAlerts: !!values.canReceiveAlerts,
              canManageRegistry: !!values.canManageRegistry,
              canManageLocations: !!values.canManageLocations,
            };
            const result = link
              ? await linksApi.permissions(actor, link.id, permissions)
              : await linksApi.create(actor, {
                  ...permissions,
                  caregiverId: String(values.caregiverId || ''),
                  viuId: String(values.viuId || ''),
                  linkType: String(values.linkType || ''),
                });
            await saved(result);
          } catch (error) {
            const status = (error as { status?: number }).status || 0;
            if (status === 409 || status >= 500)
              throw new Error(
                'Chưa xác nhận được kết quả hoặc liên kết đã tồn tại. Đóng form, lọc theo mã hai tài khoản và tải lại trước khi gửi lại.',
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
function LinkDetails({
  actor,
  link,
  refresh,
  removed,
}: {
  actor: Person;
  link: CareLink;
  refresh: () => Promise<void>;
  removed: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [action, setAction] = useState<'promote' | 'remove' | null>(null);
  const [notice, setNotice] = useState('');
  const manage = canManageLink(actor, link);
  return (
    <section className="glass card stack">
      <h2>Chi tiết liên kết</h2>
      <LinkStatus link={link} />
      <p>
        Caregiver: {link.caregiverFullName} · {link.caregiverEmail} · {link.caregiverId}
      </p>
      <p>
        VIU: {link.viuFullName} · {link.viuEmail} · {link.visuallyImpairedUserId}
      </p>
      <p>Mã liên kết: {link.id}</p>
      <dl>
        <dt>Nhận cảnh báo</dt>
        <dd>{link.canReceiveAlerts ? 'Có' : 'Không'}</dd>
        <dt>Quản lý gương mặt</dt>
        <dd>{link.canManageRegistry ? 'Có' : 'Không'}</dd>
        <dt>Quản lý địa điểm</dt>
        <dd>{link.canManageLocations ? 'Có' : 'Không'}</dd>
      </dl>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {manage && (
        <div className="row">
          <button className="btn" onClick={() => setEdit(true)}>
            Sửa quyền liên kết
          </button>
          {actor.role !== 'Caregiver' && !link.isPrimary && (
            <button className="btn" onClick={() => setAction('promote')}>
              Chuyển thành chăm sóc chính
            </button>
          )}
          <button className="btn danger" onClick={() => setAction('remove')}>
            Gỡ liên kết
          </button>
        </div>
      )}
      {!manage && <p>Liên kết này chỉ được xem trong tài khoản hiện tại.</p>}
      {edit && manage && (
        <LinkEditor
          actor={actor}
          link={link}
          close={() => setEdit(false)}
          saved={async () => {
            setEdit(false);
            setNotice('Đã lưu quyền liên kết.');
            await refresh();
          }}
        />
      )}
      {action && manage && (
        <Confirm
          title={action === 'promote' ? 'Chuyển người chăm sóc chính' : 'Gỡ liên kết'}
          description={
            link.caregiverEmail +
            ' → ' +
            link.viuEmail +
            (action === 'promote'
              ? ': người chăm sóc chính hiện tại sẽ chuyển thành phụ. Quyền truy cập vẫn theo các cờ quyền.'
              : ': mất quyền qua liên kết này; không xóa tài khoản. Nếu gỡ người chăm sóc chính, BE chọn liên kết còn hoạt động lâu nhất thay thế.')
          }
          onClose={() => setAction(null)}
          onConfirm={async () => {
            if (action === 'promote') {
              await linksApi.promote(actor, link.id);
              setNotice('Đã chuyển người chăm sóc chính.');
            } else {
              await linksApi.remove(actor, link.id);
              removed();
            }
            await refresh();
          }}
        />
      )}
    </section>
  );
}

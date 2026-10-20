import { t, msg } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { personField, useOrgPeople } from '../../hooks/useOrgPeople';
import { linksApi, canManageLink, type CareLink, type LinkFilters } from '../../services/api/links';
import { Form, type FieldSpec } from '../../components/Form';
import { Badge, Confirm, Dialog, PageHead, State } from '../../components/UI';
import type { Person } from '../../models/domain';

const permissionFields: FieldSpec[] = [
  { key: 'canReceiveAlerts', label: msg('Nhận cảnh báo'), type: 'checkbox' },
  { key: 'canManageRegistry', label: msg('Quản lý gương mặt'), type: 'checkbox' },
  { key: 'canManageLocations', label: msg('Quản lý địa điểm'), type: 'checkbox' },
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
          'api-accounts',
          'api-account',
        ].includes(String(q.queryKey[0])) && q.queryKey[1] === actor.id,
    });
  };
  return (
    <>
      <PageHead
        title={actor.role === 'Caregiver' ? t('Liên kết của tôi') : t('Phân công chăm sóc')}
        description={
          actor.role === 'Caregiver'
            ? t(
                'Chỉ hiển thị liên kết của chính bạn. Chưa có API mời người chăm sóc phụ bằng email hoặc QR.',
              )
            : t(
                'Phân công tài khoản Caregiver và VIU đã có; tối đa 3 liên kết hoạt động cho mỗi bên.',
              )
        }
        actions={
          <button className="btn primary" onClick={() => setCreate(true)}>
            {t('Tạo liên kết')}
          </button>
        }
      />
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {create && (
        <LinkEditor
          actor={actor}
          close={() => setCreate(false)}
          saved={async (link) => {
            setCreate(false);
            setSelected(link.id);
            setNotice(t('Đã tạo liên kết. Trạng thái chính/phụ do máy chủ quyết định.'));
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
              {t('Mã Caregiver')}
              <input
                value={draftCg}
                onChange={(e) => setDraftCg(e.target.value)}
                placeholder={t('UUID; để trống xem tất cả')}
              />
            </label>
          )}
          <label className="field">
            {t('Mã VIU')}
            <input
              value={draftViu}
              onChange={(e) => setDraftViu(e.target.value)}
              placeholder={t('UUID; để trống xem tất cả')}
            />
          </label>
          {actor.role !== 'CenterAdmin' && (
            <label className="field">
              {t('Loại liên kết')}
              <select
                value={filters.linkType}
                onChange={(e) => filter({ linkType: e.target.value })}
              >
                <option value="">{t('Tất cả loại')}</option>
                <option value="Personal">{t('Cá nhân')}</option>
                <option value="Organization">{t('Tổ chức')}</option>
              </select>
            </label>
          )}
          <label className="field">
            {t('Trạng thái liên kết')}
            <select value={filters.active} onChange={(e) => filter({ active: e.target.value })}>
              <option value="true">{t('Đang liên kết')}</option>
              <option value="false">{t('Đã gỡ')}</option>
              <option value="">{t('Tất cả')}</option>
            </select>
          </label>
          <button className="btn primary">{t('Lọc liên kết')}</button>
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
              {!list.data.items.length && <p>{t('Không có liên kết phù hợp.')}</p>}
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label={t('Danh sách liên kết chăm sóc')}
              >
                <table className="care-links-table">
                  <thead>
                    <tr>
                      <th>Caregiver</th>
                      <th>{t('Người được chăm sóc')}</th>
                      <th>{t('Loại')}</th>
                      <th>{t('Trạng thái')}</th>
                      <th>{t('Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.items.map((link) => (
                      <tr key={link.id}>
                        <td>
                          <strong>{link.caregiverFullName}</strong>
                          <p className="care-secondary">{link.caregiverEmail}</p>
                        </td>
                        <td>
                          <strong>{link.viuFullName}</strong>
                          <p className="care-secondary">{link.viuEmail}</p>
                        </td>
                        <td>{link.linkType === 'Personal' ? t('Cá nhân') : t('Tổ chức')}</td>
                        <td>
                          <LinkStatus link={link} />
                        </td>
                        <td>
                          <button
                            className="btn"
                            aria-label={t('Xem liên kết ') + link.id}
                            onClick={() => setSelected(link.id)}
                          >
                            {t('Chi tiết')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        <Dialog title={t('Thông tin liên kết')} onClose={() => setSelected('')}>
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
                    t(
                      'Đã gỡ liên kết. BE sẽ chọn lại người chăm sóc chính nếu cần và còn liên kết hoạt động.',
                    ),
                  );
                }}
              />
            )}
          </State>
        </Dialog>
      )}
    </>
  );
}
function LinkStatus({ link }: { link: CareLink }) {
  return (
    <Badge tone={link.unlinkedAt ? 'amber' : 'green'}>
      {link.unlinkedAt ? t('Đã gỡ') : link.isPrimary ? t('Chăm sóc chính') : t('Chăm sóc phụ')}
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
  const picking = !link && actor.role === 'CenterAdmin';
  const staff = useOrgPeople(actor, 'Caregiver', picking);
  const vius = useOrgPeople(actor, 'VisuallyImpaired', picking);
  const fields: FieldSpec[] = [
    ...(!link
      ? [
          ...(actor.role !== 'Caregiver'
            ? [
                personField(
                  {
                    key: 'caregiverId',
                    label: picking ? t('Nhân viên chăm sóc') : t('Mã Caregiver'),
                    required: true,
                    hint: t('UUID từ chi tiết tài khoản nhân viên.'),
                  },
                  staff,
                  t('Trung tâm chưa có nhân viên đang hoạt động. Tạo nhân viên trước.'),
                ),
              ]
            : []),
          personField(
            {
              key: 'viuId',
              label: picking ? t('Người được chăm sóc') : t('Mã VIU'),
              required: true,
              hint: t('UUID từ tài khoản người được chăm sóc đã tạo.'),
            },
            vius,
            t('Trung tâm chưa có người được chăm sóc đang hoạt động. Tạo tài khoản VIU trước.'),
          ),
          ...(actor.role === 'Admin'
            ? [
                {
                  key: 'linkType',
                  label: t('Loại liên kết'),
                  type: 'select' as const,
                  required: true,
                  options: [
                    { value: 'Personal', label: t('Cá nhân') },
                    { value: 'Organization', label: t('Tổ chức') },
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
        ? t('Tôi xác nhận cập nhật các quyền trên')
        : t('Tôi xác nhận tạo liên kết giữa các tài khoản trên'),
      type: 'checkbox',
    },
  ];
  return (
    <Dialog
      title={link ? t('Sửa quyền liên kết') : t('Tạo liên kết')}
      onClose={() => {
        if (!busy) close();
      }}
    >
      <p>
        {link
          ? link.caregiverEmail + ' → ' + link.viuEmail
          : actor.role === 'Caregiver'
            ? t(
                'Tạo liên kết cá nhân cho chính bạn, không mời hoặc cấp quyền cho người chăm sóc khác.',
              )
            : t(
                'Hai tài khoản phải hoạt động. Liên kết tổ chức yêu cầu Caregiver và VIU cùng tổ chức.',
              )}
      </p>
      {picking && (staff.isLoading || vius.isLoading) ? (
        <p role="status">{t('Đang tải danh sách nhân viên và người được chăm sóc…')}</p>
      ) : (
        <Form
          fields={fields}
          initial={{
            canReceiveAlerts: link?.canReceiveAlerts ?? true,
            canManageRegistry: link?.canManageRegistry ?? false,
            canManageLocations: link?.canManageLocations ?? false,
            linkType: 'Organization',
          }}
          submit={link ? t('Lưu quyền liên kết') : t('Tạo liên kết')}
          onSubmit={async (values) => {
            if (!values.confirmed) throw new Error(t('Vui lòng xác nhận thao tác.'));
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
                  t(
                    'Chưa xác nhận được kết quả hoặc liên kết đã tồn tại. Đóng form, lọc theo mã hai tài khoản và tải lại trước khi gửi lại.',
                  ),
                  { cause: error },
                );
              throw error;
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      {picking && (staff.isError || vius.isError) && (
        <p className="muted">{t('Không tải được danh sách tổ chức; nhập mã UUID thay thế.')}</p>
      )}
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
    <section className="stack">
      <h2>{t('Chi tiết liên kết')}</h2>
      <LinkStatus link={link} />
      <dl className="record-details">
        <div>
          <dt>{t('Người chăm sóc')}</dt>
          <dd>
            <strong>{link.caregiverFullName}</strong>
            <p>{link.caregiverEmail}</p>
            <p className="care-secondary">
              {t('Mã: {caregiverId}', { caregiverId: link.caregiverId })}
            </p>
          </dd>
        </div>
        <div>
          <dt>{t('Người được chăm sóc')}</dt>
          <dd>
            <strong>{link.viuFullName}</strong>
            <p>{link.viuEmail}</p>
            <p className="care-secondary">
              {t('Mã: {visuallyImpairedUserId}', {
                visuallyImpairedUserId: link.visuallyImpairedUserId,
              })}
            </p>
          </dd>
        </div>
        <div>
          <dt>{t('Mã liên kết')}</dt>
          <dd>{link.id}</dd>
        </div>
        <div>
          <dt>{t('Nhận cảnh báo')}</dt>
          <dd>{link.canReceiveAlerts ? t('Có') : t('Không')}</dd>
        </div>
        <div>
          <dt>{t('Quản lý gương mặt')}</dt>
          <dd>{link.canManageRegistry ? t('Có') : t('Không')}</dd>
        </div>
        <div>
          <dt>{t('Quản lý địa điểm')}</dt>
          <dd>{link.canManageLocations ? t('Có') : t('Không')}</dd>
        </div>
      </dl>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      {manage && (
        <div className="row">
          <button className="btn" onClick={() => setEdit(true)}>
            {t('Sửa quyền liên kết')}
          </button>
          {actor.role !== 'Caregiver' && !link.isPrimary && (
            <button className="btn" onClick={() => setAction('promote')}>
              {t('Chuyển thành chăm sóc chính')}
            </button>
          )}
          <button className="btn danger" onClick={() => setAction('remove')}>
            {t('Gỡ liên kết')}
          </button>
        </div>
      )}
      {!manage && <p>{t('Liên kết này chỉ được xem trong tài khoản hiện tại.')}</p>}
      {edit && manage && (
        <LinkEditor
          actor={actor}
          link={link}
          close={() => setEdit(false)}
          saved={async () => {
            setEdit(false);
            setNotice(t('Đã lưu quyền liên kết.'));
            await refresh();
          }}
        />
      )}
      {action && manage && (
        <Confirm
          title={action === 'promote' ? t('Chuyển người chăm sóc chính') : t('Gỡ liên kết')}
          description={
            link.caregiverEmail +
            ' → ' +
            link.viuEmail +
            (action === 'promote'
              ? t(
                  ': người chăm sóc chính hiện tại sẽ chuyển thành phụ. Quyền truy cập vẫn theo các cờ quyền.',
                )
              : t(
                  ': mất quyền qua liên kết này; không xóa tài khoản. Nếu gỡ người chăm sóc chính, BE chọn liên kết còn hoạt động lâu nhất thay thế.',
                ))
          }
          onClose={() => setAction(null)}
          onConfirm={async () => {
            if (action === 'promote') {
              await linksApi.promote(actor, link.id);
              setNotice(t('Đã chuyển người chăm sóc chính.'));
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

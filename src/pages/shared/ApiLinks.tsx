import { RefreshCw } from 'lucide-react';
import { t, msg } from '../../i18n';
import { Toast } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { useLimit } from '../../hooks/useLimit';
import { personField, useOrgPeople } from '../../hooks/useOrgPeople';
import { linksApi, linkAccess, type CareLink, type LinkFilters } from '../../services/api/links';
import { Form, type FieldSpec } from '../../components/Form';
import { Badge, Confirm, Dialog, PageHead, State } from '../../components/UI';
import type { Person } from '../../models/domain';
import { SearchPicker } from '../../components/SearchPicker';
import {
  searchAccounts,
  searchCareRecipients,
  searchPrimaryCareRecipients,
} from '../../services/api/pickers';

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
            ? t('Những người cùng chăm sóc và quyền của từng người.')
            : t('Gán người chăm sóc cho người khiếm thị và chỉnh quyền của từng liên kết.')
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
        <FilterPanel
          active={
            [
              filters.caregiverId,
              filters.viuId,
              actor.role !== 'CenterAdmin' && filters.linkType,
              filters.active !== 'true',
            ].filter(Boolean).length
          }
          submitLabel={t('Lọc liên kết')}
          onApply={(form) => {
            const data = new FormData(form);
            filter({
              caregiverId: draftCg,
              viuId: draftViu,
              ...(actor.role !== 'CenterAdmin' && { linkType: String(data.get('linkType') || '') }),
              active: String(data.get('active') ?? 'true'),
            });
          }}
          onReset={() => {
            setDraftCg('');
            setDraftViu('');
            filter({ caregiverId: '', viuId: '', linkType: '', active: 'true' });
          }}
          tools={
            <button
              className="btn"
              type="button"
              disabled={list.isFetching}
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại')}
            </button>
          }
          extra={
            <button className="btn primary" onClick={() => setCreate(true)}>
              {actor.role === 'Caregiver' ? t('Thêm người chăm sóc phụ') : t('Tạo liên kết')}
            </button>
          }
        >
          {actor.role !== 'Caregiver' && (
            <SearchPicker
              label={t('Người chăm sóc')}
              placeholder={t('Gõ tên hoặc email')}
              value={draftCg}
              onChange={setDraftCg}
              search={searchAccounts(actor, 'Caregiver')}
              queryKey={['link-filter-caregiver', actor.id, actor.orgId]}
            />
          )}
          <SearchPicker
            label={t('Người được chăm sóc')}
            placeholder={t('Gõ tên hoặc email')}
            value={draftViu}
            onChange={setDraftViu}
            search={
              actor.role === 'Caregiver'
                ? searchCareRecipients()
                : searchAccounts(actor, 'VisuallyImpaired')
            }
            queryKey={['link-filter-viu', actor.id, actor.orgId]}
          />
          {actor.role !== 'CenterAdmin' && (
            <label className="field">
              {t('Loại liên kết')}
              <select name="linkType" defaultValue={filters.linkType}>
                <option value="">{t('Tất cả loại')}</option>
                <option value="Personal">{t('Cá nhân')}</option>
                <option value="Organization">{t('Tổ chức')}</option>
              </select>
            </label>
          )}
          <label className="field">
            {t('Trạng thái liên kết')}
            <select name="active" defaultValue={filters.active}>
              <option value="true">{t('Đang liên kết')}</option>
              <option value="false">{t('Đã gỡ')}</option>
              <option value="">{t('Tất cả')}</option>
            </select>
          </label>
        </FilterPanel>
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
  const maxCaregivers = useLimit('caregiving.max_caregivers_per_viu');
  const maxVius = useLimit('caregiving.max_vius_per_caregiver');
  const picking = !link && actor.role === 'CenterAdmin';
  const staff = useOrgPeople(actor, 'Caregiver', picking);
  const vius = useOrgPeople(actor, 'VisuallyImpaired', picking);
  const fields: FieldSpec[] = [
    ...(!link
      ? [
          ...(actor.role === 'Caregiver'
            ? [
                {
                  key: 'caregiverEmail',
                  label: t('Email người chăm sóc phụ'),
                  type: 'email' as const,
                  required: true,
                  max: 255,
                  autoComplete: 'off',
                  hint: t(
                    'Nhập đúng email tài khoản Caregiver cá nhân của người được mời. Họ cần đăng ký tài khoản trước.',
                  ),
                },
              ]
            : [
                personField(
                  {
                    key: 'caregiverId',
                    label: picking ? t('Nhân viên chăm sóc') : t('Người chăm sóc'),
                    required: true,
                  },
                  staff,
                  t('Trung tâm chưa có nhân viên đang hoạt động. Tạo nhân viên trước.'),
                  {
                    search: searchAccounts(actor, 'Caregiver'),
                    searchKey: ['link-caregiver', actor.id, actor.orgId],
                  },
                ),
              ]),
          personField(
            { key: 'viuId', label: t('Người được chăm sóc'), required: true },
            vius,
            t('Trung tâm chưa có người được chăm sóc đang hoạt động. Tạo tài khoản VIU trước.'),
            {
              search:
                actor.role === 'Caregiver'
                  ? searchPrimaryCareRecipients(actor)
                  : searchAccounts(actor, 'VisuallyImpaired'),
              searchKey: ['link-viu', actor.id, actor.orgId],
            },
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
      title={
        link
          ? t('Sửa quyền liên kết')
          : actor.role === 'Caregiver'
            ? t('Thêm người chăm sóc phụ')
            : t('Tạo liên kết')
      }
      onClose={() => {
        if (!busy) close();
      }}
    >
      <p>
        {link
          ? link.caregiverEmail + ' → ' + link.viuEmail
          : actor.role === 'Caregiver'
            ? t(
                'Chỉ chọn được người bạn đang chăm sóc chính. Người được thêm là người chăm sóc phụ với các quyền bạn chọn bên dưới.',
              )
            : t(
                'Hai tài khoản phải đang hoạt động; liên kết tổ chức cần cùng một trung tâm. Mỗi người khiếm thị có tối đa {maxCaregivers} người chăm sóc, mỗi người chăm sóc theo dõi tối đa {maxVius} người.',
                { maxCaregivers, maxVius },
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
          submit={
            link
              ? t('Lưu quyền liên kết')
              : actor.role === 'Caregiver'
                ? t('Thêm người chăm sóc phụ')
                : t('Tạo liên kết')
          }
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
                    caregiverEmail: String(values.caregiverEmail || ''),
                    viuId: String(values.viuId || ''),
                    linkType: String(values.linkType || ''),
                  });
              await saved(result);
            } catch (error) {
              const status = (error as { status?: number }).status || 0;
              if (status === 409 || status >= 500)
                throw new Error(
                  t(
                    'Chưa xác nhận được kết quả hoặc liên kết đã tồn tại. Đóng form, lọc theo hai tài khoản và tải lại trước khi gửi lại.',
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
        <p className="muted">{t('Không tải được danh sách tổ chức; tìm theo tên hoặc email.')}</p>
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
  const primary = useQuery({
    queryKey: ['api-primary-vius', actor.id, actor.orgId],
    queryFn: ({ signal }) => linksApi.primaryVius(actor, signal),
    enabled: actor.role === 'Caregiver',
    refetchInterval: 30000,
  });
  const access = linkAccess(actor, link, primary.data ?? new Set());
  const manage = access.edit || access.remove || access.promote;
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
          {access.edit && (
            <button className="btn" onClick={() => setEdit(true)}>
              {t('Sửa quyền liên kết')}
            </button>
          )}
          {access.promote && !link.isPrimary && (
            <button className="btn" onClick={() => setAction('promote')}>
              {t('Chuyển thành chăm sóc chính')}
            </button>
          )}
          {access.remove && (
            <button className="btn danger" onClick={() => setAction('remove')}>
              {actor.role === 'Caregiver' && link.caregiverId === actor.id
                ? t('Hủy liên kết của tôi')
                : t('Gỡ liên kết')}
            </button>
          )}
        </div>
      )}
      {actor.role === 'Caregiver' &&
        link.caregiverId === actor.id &&
        !link.isPrimary &&
        !link.unlinkedAt && (
          <p className="notice">
            {t(
              'Bạn là người chăm sóc phụ: quyền của liên kết do người chăm sóc chính quyết định. Bạn chỉ có thể tự hủy liên kết.',
            )}
          </p>
        )}
      {!manage && <p>{t('Liên kết này chỉ được xem trong tài khoản hiện tại.')}</p>}
      {edit && access.edit && (
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
      {action && access[action] && (
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

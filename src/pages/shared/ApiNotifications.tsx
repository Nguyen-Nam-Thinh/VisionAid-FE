import { t, msg } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { searchOrganizations } from '../../services/api/pickers';
import { useOwnOrgName } from '../../hooks/useOrgPeople';
import { Form, type FieldSpec } from '../../components/Form';
import { CardActions, Confirm, Dialog, PageHead, State } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import { roles } from '../../constants/labels';
import type { Person, Fields } from '../../models/domain';
import {
  notificationsApi,
  notificationTypes,
  channels,
  canEditRule,
  type NotificationRule,
  type RuleFilters,
} from '../../services/api/notifications';
const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
const pairFields: FieldSpec[] = [
  {
    key: 'notificationType',
    label: msg('Loại thông báo'),
    type: 'select',
    required: true,
    options: options(notificationTypes),
  },
  {
    key: 'channel',
    label: msg('Kênh thông báo'),
    type: 'select',
    required: true,
    options: options(channels),
  },
];
const flagFields: FieldSpec[] = [
  { key: 'isMandatory', label: msg('Bắt buộc nhận'), type: 'checkbox' },
  { key: 'isActive', label: msg('Đang áp dụng'), type: 'checkbox' },
];
const targetRoles = {
  Admin: roles.Admin,
  CenterAdmin: roles.CenterAdmin,
  Caregiver: roles.Caregiver,
};
export function ApiNotifications() {
  const { data: actor } = useSession();
  return actor ? <Notifications key={actor.id + actor.role + actor.orgId} actor={actor} /> : null;
}
function Notifications({ actor }: { actor: Person }) {
  const personal = actor.role === 'Caregiver';
  const allowed =
    personal || actor.role === 'Admin' || (actor.role === 'CenterAdmin' && !!actor.orgId);
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<RuleFilters>({
    notificationType: '',
    channel: '',
    targetRole: '',
    isActive: '',
  });
  const [editor, setEditor] = useState<Fields | null>(null);
  const [selected, setSelected] = useState<NotificationRule | null>(null);
  const [deleting, setDeleting] = useState<NotificationRule | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const prefix = ['api-notifications', actor.id, actor.orgId];
  const prefs = useQuery({
    queryKey: [...prefix, 'preferences'],
    queryFn: ({ signal }) => notificationsApi.preferences(actor, signal),
    enabled: personal,
    refetchInterval: 30000,
  });
  const rules = useQuery({
    queryKey: [...prefix, 'rules', page, filters],
    queryFn: ({ signal }) => notificationsApi.rules(actor, page, filters, signal),
    enabled: allowed && !personal,
    refetchInterval: 30000,
  });
  const query = personal ? prefs : rules;
  const orgName = useOwnOrgName(actor);
  const scope = (orgId: string | null) =>
    orgId ? (orgId === actor.orgId && orgName) || orgId : t('Toàn hệ thống');
  async function changed(
    message = t(
      'Đã lưu trên máy chủ. Việc gửi thông báo còn phụ thuộc quy tắc và dịch vụ phân phối.',
    ),
  ) {
    setNotice(message);
    await cache.invalidateQueries({ queryKey: prefix });
  }
  const close = () => {
    if (!pending) {
      setEditor(null);
      setSelected(null);
    }
  };
  if (!allowed)
    return (
      <p className="notice error">{t('Tài khoản cần thuộc một trung tâm để quản lý quy tắc.')}</p>
    );
  return (
    <>
      <PageHead
        title={personal ? t('Tùy chọn thông báo') : t('Quy tắc thông báo')}
        description={
          personal
            ? t('Thiết lập theo loại và kênh cho tài khoản của bạn.')
            : t('Quy tắc toàn hệ thống và quy tắc riêng của trung tâm.')
        }
      />
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <section className="glass card stack">
        {personal && (
          <p className="muted">
            {t(
              'Lưu tùy chọn Push chưa bật nhận thông báo trên trình duyệt này. Để nhận push, vào Hồ sơ và chọn Bật thông báo trình duyệt.',
            )}
          </p>
        )}

        {personal && (
          <CardActions>
            <button
              className="btn primary"
              disabled={query.isPending || query.isError}
              onClick={() => {
                setSelected(null);
                setEditor(personal ? { isEnabled: true } : { isMandatory: false, isActive: true });
              }}
            >
              {personal ? t('Thiết lập tùy chọn') : t('Thêm quy tắc')}
            </button>
          </CardActions>
        )}
        {!personal && (
          <FilterPanel
            extra={
              <button
                className="btn primary"
                disabled={query.isPending || query.isError}
                onClick={() => {
                  setSelected(null);
                  setEditor(
                    personal ? { isEnabled: true } : { isMandatory: false, isActive: true },
                  );
                }}
              >
                {personal ? t('Thiết lập tùy chọn') : t('Thêm quy tắc')}
              </button>
            }
            active={Object.values(filters).filter(Boolean).length}
            onApply={(form) => {
              const data = new FormData(form);
              setFilters({
                notificationType: String(data.get('notificationType') || ''),
                channel: String(data.get('channel') || ''),
                targetRole: String(data.get('targetRole') || ''),
                isActive: String(data.get('isActive') || ''),
              });
              setPage(1);
              setEditor(null);
              setSelected(null);
            }}
            onReset={() => {
              setFilters({ notificationType: '', channel: '', targetRole: '', isActive: '' });
              setPage(1);
              setEditor(null);
              setSelected(null);
            }}
          >
            {(
              [
                ['notificationType', t('Loại thông báo'), notificationTypes],
                ['channel', t('Kênh'), channels],
                ['targetRole', t('Vai trò'), targetRoles],
                [
                  'isActive',
                  t('Trạng thái'),
                  { true: t('Đang áp dụng'), false: t('Ngừng áp dụng') },
                ],
              ] as const
            ).map(([key, label, labels]) => (
              <label className="field" key={key}>
                {label}
                <select name={key} defaultValue={filters[key]}>
                  <option value="">{t('Tất cả')}</option>
                  {options(labels).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </FilterPanel>
        )}
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {personal ? (
            <>
              {!prefs.data?.length && (
                <p>{t('Chưa lưu tùy chọn nào. Máy chủ áp dụng quy tắc mặc định.')}</p>
              )}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Loại')}</th>
                      <th>{t('Kênh')}</th>
                      <th>{t('Tùy chọn đã lưu')}</th>
                      <th>{t('Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prefs.data?.map((item) => (
                      <tr key={item.id}>
                        <td>{notificationTypes[item.notificationType]}</td>
                        <td>{channels[item.channel]}</td>
                        <td>{item.isEnabled ? t('Bật') : t('Tắt nếu không bắt buộc')}</td>
                        <td>
                          <button
                            className="btn small"
                            onClick={() =>
                              setEditor({
                                notificationType: item.notificationType,
                                channel: item.channel,
                                isEnabled: item.isEnabled,
                              })
                            }
                          >
                            {t('Chỉnh sửa')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {!rules.data?.items.length && <p>{t('Không có quy tắc phù hợp.')}</p>}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Loại / Kênh')}</th>
                      <th>{t('Người nhận')}</th>
                      <th>{t('Phạm vi')}</th>
                      <th>{t('Trạng thái')}</th>
                      <th>{t('Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.data?.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {notificationTypes[item.notificationType]}
                          <br />
                          {channels[item.channel]}
                        </td>
                        <td>{targetRoles[item.targetRole]}</td>
                        <td>
                          {item.organizationId ? (
                            <>
                              {t('Riêng trung tâm')}
                              <br />
                              <small>{scope(item.organizationId)}</small>
                            </>
                          ) : (
                            t('Toàn hệ thống')
                          )}
                        </td>
                        <td>
                          {item.isActive ? t('Đang áp dụng') : t('Ngừng áp dụng')}
                          <br />
                          {item.isMandatory ? t('Bắt buộc') : t('Theo tùy chọn')}
                        </td>
                        <td>
                          {canEditRule(actor, item) ? (
                            <div className="row">
                              <button
                                className="btn small"
                                onClick={() => {
                                  setSelected(item);
                                  setEditor({
                                    isMandatory: item.isMandatory,
                                    isActive: item.isActive,
                                  });
                                }}
                              >
                                {t('Chỉnh sửa')}
                              </button>
                              <button
                                className="btn danger small"
                                onClick={() => setDeleting(item)}
                              >
                                {t('Xóa')}
                              </button>
                            </div>
                          ) : (
                            t('Chỉ xem')
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rules.data && (
                <div className="row pagination">
                  <span>
                    {t('{totalCount} kết quả · Trang {page}/{p4}', {
                      totalCount: rules.data.totalCount,
                      page,
                      p4: Math.max(1, rules.data.totalPages),
                    })}
                  </span>
                  <button
                    className="btn"
                    disabled={rules.isFetching || !rules.data.hasPreviousPage}
                    onClick={() => setPage(page - 1)}
                  >
                    {t('Trang trước')}
                  </button>
                  <button
                    className="btn"
                    disabled={rules.isFetching || !rules.data.hasNextPage}
                    onClick={() => setPage(page + 1)}
                  >
                    {t('Trang sau')}
                  </button>
                </div>
              )}
            </>
          )}
        </State>
      </section>
      {editor && !query.isError && (
        <Dialog
          title={personal ? t('Lưu tùy chọn') : selected ? t('Sửa quy tắc') : t('Thêm quy tắc')}
          onClose={close}
        >
          {selected && (
            <p>
              {notificationTypes[selected.notificationType]} · {channels[selected.channel]} ·{' '}
              {targetRoles[selected.targetRole]}
            </p>
          )}
          <Form
            initial={editor}
            fields={
              personal
                ? [
                    ...pairFields,
                    { key: 'isEnabled', label: t('Bật nhận khi không bắt buộc'), type: 'checkbox' },
                  ]
                : [
                    ...(selected
                      ? []
                      : [
                          ...pairFields,
                          {
                            key: 'targetRole',
                            label: t('Vai trò nhận'),
                            type: 'select' as const,
                            required: true,
                            options: options(targetRoles),
                          },
                          ...(actor.role === 'Admin'
                            ? [
                                {
                                  key: 'organizationId',
                                  label: t('Trung tâm'),
                                  type: 'search' as const,
                                  search: searchOrganizations(actor),
                                  searchKey: ['rule-org', actor.id],
                                  hint: t('Để trống để áp dụng toàn hệ thống.'),
                                },
                              ]
                            : []),
                        ]),
                    ...flagFields,
                    {
                      key: 'confirm',
                      label: t('Tôi xác nhận thay đổi quy tắc gửi thông báo'),
                      type: 'checkbox',
                    },
                  ]
            }
            onSubmit={async (values) => {
              setPending(true);
              try {
                if (personal) await notificationsApi.savePreference(actor, values);
                else {
                  if (!values.confirm) throw new Error(t('Cần xác nhận thay đổi quy tắc.'));
                  if (selected) await notificationsApi.updateRule(actor, selected, values);
                  else
                    await notificationsApi.createRule(actor, {
                      ...values,
                      organizationId:
                        actor.role === 'CenterAdmin'
                          ? actor.orgId
                          : String(values.organizationId ?? '').trim() || null,
                    });
                }
                setEditor(null);
                setSelected(null);
                await changed();
              } finally {
                setPending(false);
              }
            }}
          />
        </Dialog>
      )}
      {deleting && !query.isError && (
        <Confirm
          title={t('Xóa quy tắc thông báo?')}
          description={
            notificationTypes[deleting.notificationType] +
            ' · ' +
            channels[deleting.channel] +
            ' · ' +
            targetRoles[deleting.targetRole] +
            ' · ' +
            scope(deleting.organizationId) +
            t(
              '. Việc gửi thông báo có thể thay đổi sau khi xóa; quy tắc toàn hệ thống có thể được áp dụng lại.',
            )
          }
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await notificationsApi.removeRule(actor, deleting);
            await changed(t('Đã xóa quy tắc trên máy chủ.'));
          }}
        />
      )}
    </>
  );
}

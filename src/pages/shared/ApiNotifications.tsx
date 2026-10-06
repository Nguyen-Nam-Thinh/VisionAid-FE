import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { Form, type FieldSpec } from '../../components/Form';
import { Confirm, Dialog, PageHead, State } from '../../components/UI';
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
    label: 'Loại thông báo',
    type: 'select',
    required: true,
    options: options(notificationTypes),
  },
  {
    key: 'channel',
    label: 'Kênh thông báo',
    type: 'select',
    required: true,
    options: options(channels),
  },
];
const flagFields: FieldSpec[] = [
  { key: 'isMandatory', label: 'Bắt buộc nhận', type: 'checkbox' },
  { key: 'isActive', label: 'Đang áp dụng', type: 'checkbox' },
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
  async function changed() {
    setNotice(
      'Đã lưu trên máy chủ. Việc gửi thông báo còn phụ thuộc quy tắc và dịch vụ phân phối.',
    );
    await cache.invalidateQueries({ queryKey: prefix });
  }
  const close = () => {
    if (!pending) {
      setEditor(null);
      setSelected(null);
    }
  };
  if (!allowed)
    return <p className="notice error">Tài khoản cần thuộc một trung tâm để quản lý quy tắc.</p>;
  return (
    <>
      <PageHead
        title={personal ? 'Tùy chọn thông báo' : 'Quy tắc thông báo'}
        description={
          personal
            ? 'Thiết lập theo loại và kênh cho tài khoản của bạn.'
            : 'Quy tắc toàn hệ thống và quy tắc riêng của trung tâm.'
        }
        actions={
          <button
            className="btn primary"
            disabled={query.isPending || query.isError}
            onClick={() => {
              setSelected(null);
              setEditor(personal ? { isEnabled: true } : { isMandatory: false, isActive: true });
            }}
          >
            {personal ? 'Thiết lập tùy chọn' : 'Thêm quy tắc'}
          </button>
        }
      />
      <p className="notice">
        {personal
          ? 'Tùy chọn chỉ áp dụng khi quy tắc không bắt buộc. Thông báo bắt buộc vẫn được gửi dù bạn chọn tắt. Máy chủ chưa cung cấp danh sách quy tắc bắt buộc cho tài khoản này.'
          : 'Quy tắc riêng được máy chủ xử lý theo phạm vi trung tâm. Center Admin chỉ xem quy tắc toàn hệ thống, không được sửa hoặc xóa.'}
      </p>
      {personal && (
        <p className="muted">
          Lưu tùy chọn Push chưa đăng ký nhận push trên trình duyệt. Phần FCM sẽ tích hợp ở đợt 8c.
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {!personal && (
        <div className="row">
          {(
            [
              ['notificationType', 'Lọc loại thông báo', notificationTypes],
              ['channel', 'Lọc kênh', channels],
              ['targetRole', 'Lọc vai trò', targetRoles],
              ['isActive', 'Lọc trạng thái', { true: 'Đang áp dụng', false: 'Ngừng áp dụng' }],
            ] as const
          ).map(([key, label, labels]) => (
            <label className="field" key={key}>
              {label}
              <select
                value={filters[key]}
                onChange={(e) => {
                  setFilters({ ...filters, [key]: e.target.value });
                  setPage(1);
                  setEditor(null);
                  setSelected(null);
                }}
              >
                <option value="">Tất cả</option>
                {options(labels).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <section className="glass card stack">
          {personal ? (
            <>
              {!prefs.data?.length && (
                <p>Chưa lưu tùy chọn nào. Máy chủ áp dụng quy tắc mặc định.</p>
              )}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Loại</th>
                      <th>Kênh</th>
                      <th>Tùy chọn đã lưu</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prefs.data?.map((item) => (
                      <tr key={item.id}>
                        <td>{notificationTypes[item.notificationType]}</td>
                        <td>{channels[item.channel]}</td>
                        <td>{item.isEnabled ? 'Bật' : 'Tắt nếu không bắt buộc'}</td>
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
                            Chỉnh sửa
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
              {!rules.data?.items.length && <p>Không có quy tắc phù hợp.</p>}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Loại / Kênh</th>
                      <th>Người nhận</th>
                      <th>Phạm vi</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
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
                              Trung tâm
                              <br />
                              <small>{item.organizationId}</small>
                            </>
                          ) : (
                            'Toàn hệ thống'
                          )}
                        </td>
                        <td>
                          {item.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                          <br />
                          {item.isMandatory ? 'Bắt buộc' : 'Theo tùy chọn'}
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
                                Chỉnh sửa
                              </button>
                              <button
                                className="btn danger small"
                                onClick={() => setDeleting(item)}
                              >
                                Xóa
                              </button>
                            </div>
                          ) : (
                            'Chỉ xem'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rules.data && (
                <div className="row">
                  <span>
                    {rules.data.totalCount} kết quả · Trang {page}/
                    {Math.max(1, rules.data.totalPages)}
                  </span>
                  <button
                    className="btn"
                    disabled={rules.isFetching || !rules.data.hasPreviousPage}
                    onClick={() => setPage(page - 1)}
                  >
                    Trang trước
                  </button>
                  <button
                    className="btn"
                    disabled={rules.isFetching || !rules.data.hasNextPage}
                    onClick={() => setPage(page + 1)}
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </State>
      {editor && !query.isError && (
        <Dialog
          title={personal ? 'Lưu tùy chọn' : selected ? 'Sửa quy tắc' : 'Thêm quy tắc'}
          onClose={close}
        >
          <p className="notice">
            Nếu có lỗi hoặc mất kết nối khi lưu, hãy đóng và tải lại để kiểm tra trước khi gửi lại.
          </p>
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
                    { key: 'isEnabled', label: 'Bật nhận khi không bắt buộc', type: 'checkbox' },
                  ]
                : [
                    ...(selected
                      ? []
                      : [
                          ...pairFields,
                          {
                            key: 'targetRole',
                            label: 'Vai trò nhận',
                            type: 'select' as const,
                            required: true,
                            options: options(targetRoles),
                          },
                          ...(actor.role === 'Admin'
                            ? [
                                {
                                  key: 'organizationId',
                                  label: 'Mã trung tâm (UUID)',
                                  hint: 'Để trống để áp dụng toàn hệ thống. Lấy mã từ trang Tổ chức.',
                                },
                              ]
                            : []),
                        ]),
                    ...flagFields,
                    {
                      key: 'confirm',
                      label: 'Tôi xác nhận thay đổi quy tắc gửi thông báo',
                      type: 'checkbox',
                    },
                  ]
            }
            onSubmit={async (values) => {
              setPending(true);
              try {
                if (personal) await notificationsApi.savePreference(actor, values);
                else {
                  if (!values.confirm) throw new Error('Cần xác nhận thay đổi quy tắc.');
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
          title="Xóa quy tắc thông báo?"
          description={
            notificationTypes[deleting.notificationType] +
            ' · ' +
            channels[deleting.channel] +
            ' · ' +
            targetRoles[deleting.targetRole] +
            ' · ' +
            (deleting.organizationId || 'Toàn hệ thống') +
            '. Việc gửi thông báo có thể thay đổi sau khi xóa; quy tắc toàn hệ thống có thể được áp dụng lại.'
          }
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await notificationsApi.removeRule(actor, deleting);
            await changed();
          }}
        />
      )}
    </>
  );
}

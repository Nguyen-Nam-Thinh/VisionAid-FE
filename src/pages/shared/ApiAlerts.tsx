import { t, msg, labelMap, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import {
  emergenciesApi,
  alertLabels,
  actionLabels,
  alertActions,
  type AlertAction,
  type AlertFilters,
  type Escalation,
} from '../../services/api/emergencies';
import { historyRange } from '../../services/api/locations';
import { PageHead, State, Dialog, Confirm } from '../../components/UI';
import type { Person } from '../../models/domain';
const time = (value: string) => formatLocaleDateTime(value);
const methods: Record<string, string> = labelMap({
  AccelerometerCamera: msg('Cảm biến / camera'),
  Manual: msg('Thủ công'),
  VoiceCommand: msg('Giọng nói'),
  Gesture: msg('Cử chỉ'),
});
export function ApiAlerts() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? <Alerts key={actor.id} actor={actor} /> : null;
}
function Alerts({ actor }: { actor: Person }) {
  const [filters, setFilters] = useState<AlertFilters>({
    viuId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['api-alerts', actor.id, actor.orgId, filters],
    queryFn: ({ signal }) => emergenciesApi.list(actor, filters, signal),
    refetchInterval: 30000,
    retry: false,
  });
  return (
    <>
      <PageHead
        title={t('Trung tâm cảnh báo')}
        description={t(
          'Cảnh báo trong phạm vi liên kết được phép xem. Cập nhật qua SignalR và tải lại dự phòng mỗi 30 giây.',
        )}
      />
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            try {
              const range = historyRange(String(data.get('from')), String(data.get('to')));
              setFilters({
                ...range,
                viuId: String(data.get('viuId')).trim(),
                status: String(data.get('status')),
                page: 1,
              });
              setSelected('');
              setError('');
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <label className="field">
            {t('Mã VIU (để trống xem tất cả)')}
            <input name="viuId" />
          </label>
          <label className="field">
            {t('Trạng thái cảnh báo')}
            <select name="status">
              <option value="">{t('Tất cả')}</option>
              {Object.entries(alertLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t('Từ thời gian')}
            <input name="from" type="datetime-local" />
          </label>
          <label className="field">
            {t('Đến thời gian')}
            <input name="to" type="datetime-local" />
          </label>
          <button className="btn primary">{t('Lọc cảnh báo')}</button>
          <button
            type="button"
            className="btn"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('Tải lại cảnh báo')}
          </button>
        </form>
        <small>
          {t('Thời gian theo {timeZone}. API trả mã VIU, chưa có tên người dùng trong cảnh báo.', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })}
        </small>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {query.data && (
            <>
              {!query.data.items.length && <p>{t('Không có cảnh báo phù hợp.')}</p>}
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label={t('Danh sách cảnh báo')}
              >
                <table className="alerts-table">
                  <thead>
                    <tr>
                      <th>VIU</th>
                      <th>{t('Phát hiện')}</th>
                      <th>{t('Trạng thái')}</th>
                      <th>{t('Thời gian')}</th>
                      <th>{t('Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((event) => (
                      <tr key={event.id}>
                        <td>{event.visuallyImpairedUserId}</td>
                        <td>{methods[event.detectionMethod] || event.detectionMethod}</td>
                        <td>
                          <strong>{alertLabels[event.currentStatus]}</strong>
                        </td>
                        <td>{time(event.detectedAt)}</td>
                        <td>
                          <button className="btn" onClick={() => setSelected(event.id)}>
                            {t('Xem chi tiết')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row pagination">
                <span>
                  {t('{totalCount} cảnh báo · Trang {page}/{p4}', {
                    totalCount: query.data.totalCount,
                    page: query.data.page,
                    p4: Math.max(1, query.data.totalPages),
                  })}
                </span>
                <button
                  className="btn"
                  disabled={query.isFetching || !query.data.hasPreviousPage}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  {t('Trang trước')}
                </button>
                <button
                  className="btn"
                  disabled={query.isFetching || !query.data.hasNextPage}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  {t('Trang sau')}
                </button>
              </div>
            </>
          )}
        </State>
      </section>
      {selected && !query.isError && (
        <AlertDetail key={selected} actor={actor} id={selected} onClose={() => setSelected('')} />
      )}
    </>
  );
}
function AlertDetail({ actor, id, onClose }: { actor: Person; id: string; onClose: () => void }) {
  const cache = useQueryClient();
  const [action, setAction] = useState<AlertAction | null>(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState<Escalation | null>(null);
  const [pending, setPending] = useState(false);
  const key = ['api-alert-detail', actor.id, actor.orgId, id];
  const detail = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => emergenciesApi.detail(actor, id, signal),
    refetchInterval: pending ? false : 30000,
    retry: false,
  });
  const event = detail.data;
  const permission = useQuery({
    queryKey: ['api-alert-permission', actor.id, actor.orgId, event?.visuallyImpairedUserId],
    queryFn: ({ signal }) => emergenciesApi.canAct(actor, event!.visuallyImpairedUserId, signal),
    enabled: !!event && !detail.isError,
    refetchInterval: pending ? false : 30000,
    retry: false,
  });
  return (
    <>
      <Dialog
        title={t('Chi tiết cảnh báo')}
        onClose={() => {
          if (!pending) onClose();
        }}
      >
        <div className="stack">
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
            {event && (
              <>
                <strong>{alertLabels[event.currentStatus]}</strong>
                <dl className="record-details">
                  <div>
                    <dt>{t('Mã VIU')}</dt>
                    <dd>{event.visuallyImpairedUserId}</dd>
                  </div>
                  <div>
                    <dt>{t('Phát hiện')}</dt>
                    <dd>{methods[event.detectionMethod] || event.detectionMethod}</dd>
                  </div>
                  <div>
                    <dt>{t('Thời gian')}</dt>
                    <dd>{time(event.detectedAt)}</dd>
                  </div>
                  <div>
                    <dt>{t('Vị trí ghi nhận')}</dt>
                    <dd>
                      {t('Vĩ độ:')} {event.latitude ?? t('Không có dữ liệu')} {t('· Kinh độ:')}{' '}
                      {event.longitude ?? t('Không có dữ liệu')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Ghi chú')}</dt>
                    <dd>{event.notes || t('Không có')}</dd>
                  </div>
                </dl>
                <p>
                  {event.snapshotPath
                    ? t(
                        'Có thông tin ảnh trên máy chủ nhưng API chưa cung cấp URL tải ảnh được xác thực.',
                      )
                    : t('Không có ảnh chụp sự kiện.')}
                </p>
                <State
                  loading={permission.isPending}
                  error={permission.error}
                  retry={() => permission.refetch()}
                >
                  {permission.data ? (
                    <>
                      <label className="field">
                        {t('Ghi chú xử lý')}
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          disabled={pending}
                        />
                      </label>
                      <div className="row">
                        {alertActions(event.currentStatus).map((a) => (
                          <button
                            className="btn"
                            key={a}
                            disabled={pending || detail.isFetching || permission.isFetching}
                            onClick={() => setAction(a)}
                          >
                            {actionLabels[a]}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p>{t('Bạn có quyền xem nhưng không có quyền xử lý cảnh báo.')}</p>
                  )}
                </State>
                {contacts && !permission.isError && permission.data && (
                  <section className="stack">
                    <h3>{t('Liên hệ khẩn cấp')}</h3>
                    <p>
                      {t(
                        'Chuyển cấp không có nghĩa cuộc gọi đã diễn ra. Web không tự gọi hoặc mở Zalo.',
                      )}
                    </p>
                    {contacts.emergencyContacts.length ? (
                      [...contacts.emergencyContacts]
                        .sort((a, b) => a.priorityOrder - b.priorityOrder)
                        .map((c) => (
                          <p key={c.id}>
                            {c.priorityOrder}. {c.contactName} · {c.contactType} ·{' '}
                            {c.phoneNumber || t('Không có số điện thoại')}
                            {c.zaloDeepLink && <span> · Zalo: {c.zaloDeepLink}</span>}
                          </p>
                        ))
                    ) : (
                      <p>{t('Chưa có liên hệ khẩn cấp.')}</p>
                    )}
                  </section>
                )}
                <h3>{t('Lịch sử xử lý')}</h3>
                {!event.statusHistory.length && <p>{t('Chưa có lịch sử xử lý.')}</p>}
                {event.statusHistory.map((h) => (
                  <div key={h.id}>
                    <strong>
                      {alertLabels[h.fromStatus]} → {alertLabels[h.toStatus]}
                    </strong>
                    <p>
                      {time(h.changedAt)} · {h.changedBy || t('Hệ thống')}
                    </p>
                    <p>{h.reason || t('Không có ghi chú')}</p>
                  </div>
                ))}
              </>
            )}
          </State>
        </div>
      </Dialog>
      {action && event && !detail.isError && (
        <Confirm
          title={actionLabels[action]}
          description={
            action === 'called'
              ? t(
                  'Chỉ xác nhận khi bạn đã thực sự gọi cho người được chăm sóc, người thân hoặc 115; Web không tự gọi. Sau khi xác nhận, cảnh báo kết thúc ở trạng thái Đã gọi và không chuyển sang Đã giải quyết được nữa. {p1}',
                  { p1: notes || t('Không có ghi chú.') },
                )
              : t('Xác nhận xử lý cảnh báo {id}? {p1}', {
                  id,
                  p1: notes || t('Không có ghi chú.'),
                })
          }
          onClose={() => setAction(null)}
          onConfirm={async () => {
            setPending(true);
            setMessage('');
            setContacts(null);
            try {
              const result = await emergenciesApi.act(
                actor,
                id,
                event.currentStatus,
                action,
                notes,
              );
              setContacts(result);
              setNotes('');
              setMessage(t('Máy chủ đã xác nhận cập nhật.'));
            } catch (err) {
              setMessage(
                (err instanceof Error ? err.message : t('Không thể xử lý.')) +
                  t(' Chưa xác nhận thành công; kiểm tra trạng thái mới trước khi thử lại.'),
              );
            } finally {
              await Promise.all([
                cache.invalidateQueries({ queryKey: ['api-alerts', actor.id, actor.orgId] }),
                cache.invalidateQueries({ queryKey: key }),
                cache.invalidateQueries({
                  queryKey: ['api-alert-permission', actor.id, actor.orgId],
                }),
              ]);
              setAction(null);
              setPending(false);
            }
          }}
        />
      )}
    </>
  );
}

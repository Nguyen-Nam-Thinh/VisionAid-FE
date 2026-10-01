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
const time = (value: string) => new Date(value).toLocaleString('vi-VN');
const methods: Record<string, string> = {
  AccelerometerCamera: 'Cảm biến / camera',
  Manual: 'Thủ công',
  VoiceCommand: 'Giọng nói',
  Gesture: 'Cử chỉ',
};
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
        title="Trung tâm cảnh báo"
        description="Cảnh báo trong phạm vi liên kết được phép xem. Tự tải lại mỗi 30 giây, chưa có realtime."
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
            Mã VIU (để trống xem tất cả)
            <input name="viuId" />
          </label>
          <label className="field">
            Trạng thái cảnh báo
            <select name="status">
              <option value="">Tất cả</option>
              {Object.entries(alertLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Từ thời gian
            <input name="from" type="datetime-local" />
          </label>
          <label className="field">
            Đến thời gian
            <input name="to" type="datetime-local" />
          </label>
          <button className="btn">Lọc cảnh báo</button>
          <button
            type="button"
            className="btn"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Tải lại cảnh báo
          </button>
        </form>
        <small>
          Thời gian theo {Intl.DateTimeFormat().resolvedOptions().timeZone}. API trả mã VIU, chưa có
          tên người dùng trong cảnh báo.
        </small>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {query.data && (
            <>
              {!query.data.items.length && <p>Không có cảnh báo phù hợp.</p>}
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>VIU</th>
                      <th>Phát hiện</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((event) => (
                      <tr key={event.id}>
                        <td>{event.visuallyImpairedUserId}</td>
                        <td>{methods[event.detectionMethod] || event.detectionMethod}</td>
                        <td>{alertLabels[event.currentStatus]}</td>
                        <td>{time(event.detectedAt)}</td>
                        <td>
                          <button className="btn" onClick={() => setSelected(event.id)}>
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row">
                <span>
                  {query.data.totalCount} cảnh báo · Trang {query.data.page}/
                  {Math.max(1, query.data.totalPages)}
                </span>
                <button
                  className="btn"
                  disabled={query.isFetching || !query.data.hasPreviousPage}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  Trang trước
                </button>
                <button
                  className="btn"
                  disabled={query.isFetching || !query.data.hasNextPage}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Trang sau
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
        title="Chi tiết cảnh báo"
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
                <p>Mã VIU: {event.visuallyImpairedUserId}</p>
                <p>
                  Phát hiện: {methods[event.detectionMethod] || event.detectionMethod} ·{' '}
                  {time(event.detectedAt)}
                </p>
                <p>
                  Vĩ độ: {event.latitude ?? 'Không có dữ liệu'} · Kinh độ:{' '}
                  {event.longitude ?? 'Không có dữ liệu'}
                </p>
                <p>Ghi chú: {event.notes || 'Không có'}</p>
                <p>
                  {event.snapshotPath
                    ? 'Có thông tin ảnh trên máy chủ nhưng API chưa cung cấp URL tải ảnh được xác thực.'
                    : 'Không có ảnh chụp sự kiện.'}
                </p>
                <State
                  loading={permission.isPending}
                  error={permission.error}
                  retry={() => permission.refetch()}
                >
                  {permission.data ? (
                    <>
                      <label className="field">
                        Ghi chú xử lý
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
                    <p>Bạn có quyền xem nhưng không có quyền xử lý cảnh báo.</p>
                  )}
                </State>
                {contacts && !permission.isError && permission.data && (
                  <section className="stack">
                    <h3>Liên hệ khẩn cấp do BE trả về</h3>
                    <p>
                      Chuyển cấp không có nghĩa cuộc gọi đã diễn ra. Web không tự gọi hoặc mở Zalo.
                    </p>
                    {contacts.emergencyContacts.length ? (
                      [...contacts.emergencyContacts]
                        .sort((a, b) => a.priorityOrder - b.priorityOrder)
                        .map((c) => (
                          <p key={c.id}>
                            {c.priorityOrder}. {c.contactName} · {c.contactType} ·{' '}
                            {c.phoneNumber || 'Không có số điện thoại'}
                            {c.zaloDeepLink && <span> · Zalo: {c.zaloDeepLink}</span>}
                          </p>
                        ))
                    ) : (
                      <p>Chưa có liên hệ khẩn cấp.</p>
                    )}
                  </section>
                )}
                <h3>Lịch sử xử lý</h3>
                {!event.statusHistory.length && <p>Chưa có lịch sử xử lý.</p>}
                {event.statusHistory.map((h) => (
                  <div key={h.id}>
                    <strong>
                      {alertLabels[h.fromStatus]} → {alertLabels[h.toStatus]}
                    </strong>
                    <p>
                      {time(h.changedAt)} · {h.changedBy || 'Hệ thống'}
                    </p>
                    <p>{h.reason || 'Không có ghi chú'}</p>
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
          description={`Xác nhận xử lý cảnh báo ${id}? ${notes || 'Không có ghi chú.'}`}
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
              setMessage('Máy chủ đã xác nhận cập nhật.');
            } catch (err) {
              setMessage(
                (err instanceof Error ? err.message : 'Không thể xử lý.') +
                  ' Chưa xác nhận thành công; kiểm tra trạng thái mới trước khi thử lại.',
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

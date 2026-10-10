import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import {
  callsApi,
  callStatuses,
  callTriggers,
  type CallFilters,
  type CallHistoryItem,
} from '../../services/api/calls';
import { PageHead, State, Dialog } from '../../components/UI';
import type { Person } from '../../models/domain';
const time = (value: string | null) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';
export function ApiCalls() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? (
    <History key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function History({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CallFilters>({ viuUserId: '', dateFrom: '', dateTo: '' });
  const [selected, setSelected] = useState<CallHistoryItem | null>(null);
  const result = useQuery({
    queryKey: ['api-calls', actor.id, actor.orgId, page, filters],
    queryFn: ({ signal }) => callsApi.history(actor, page, filters, signal),
    retry: false,
  });
  return (
    <>
      <PageHead
        title="Lịch sử cuộc gọi"
        description="Các phiên gọi bạn đã tham gia. Thời gian hiển thị theo múi giờ trình duyệt."
      />
      <p className="notice">
        Để bắt đầu gọi, vào Người được chăm sóc và chọn Gọi hỗ trợ. Kết quả dưới đây do máy chủ ghi
        nhận.
      </p>
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setFilters({
              viuUserId: String(data.get('viuUserId') || '').trim(),
              dateFrom: String(data.get('dateFrom') || ''),
              dateTo: String(data.get('dateTo') || ''),
            });
            setPage(1);
            setSelected(null);
          }}
        >
          <label className="field">
            Mã người được chăm sóc
            <input name="viuUserId" placeholder="UUID · để trống xem tất cả" />
          </label>
          <label className="field">
            Từ thời điểm
            <input name="dateFrom" type="datetime-local" />
          </label>
          <label className="field">
            Đến thời điểm
            <input name="dateTo" type="datetime-local" />
          </label>
          <button className="btn primary">Lọc lịch sử</button>
          <button
            type="button"
            className="btn"
            disabled={result.isFetching}
            onClick={() => {
              setSelected(null);
              void result.refetch();
            }}
          >
            Tải lại
          </button>
        </form>
        <State loading={result.isPending} error={result.error} retry={() => result.refetch()}>
          {!result.data?.items.length && <p>Chưa có cuộc gọi phù hợp.</p>}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Bắt đầu</th>
                  <th>Loại cuộc gọi</th>
                  <th>Trạng thái</th>
                  <th>Thời lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {result.data?.items.map((call) => (
                  <tr key={call.sessionId}>
                    <td>{time(call.startedAt)}</td>
                    <td>{callTriggers[call.triggerType]}</td>
                    <td>{callStatuses[call.status]}</td>
                    <td>
                      {call.durationSeconds === null ? 'Chưa có' : `${call.durationSeconds} giây`}
                    </td>
                    <td>
                      <button className="btn small" onClick={() => setSelected(call)}>
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
              {result.data?.totalCount ?? 0} cuộc gọi · Trang {page}/
              {Math.max(1, result.data?.totalPages ?? 1)}
            </span>
            <button
              className="btn"
              disabled={!result.data?.hasPreviousPage || result.isFetching}
              onClick={() => {
                setPage(page - 1);
                setSelected(null);
              }}
            >
              Trang trước
            </button>
            <button
              className="btn"
              disabled={!result.data?.hasNextPage || result.isFetching}
              onClick={() => {
                setPage(page + 1);
                setSelected(null);
              }}
            >
              Trang sau
            </button>
          </div>
          {selected && (
            <Dialog title="Chi tiết cuộc gọi" onClose={() => setSelected(null)}>
              <div className="stack" style={{ overflowWrap: 'anywhere' }}>
                <p>Mã phiên: {selected.sessionId}</p>
                <p>Người được chăm sóc: {selected.viuUserId || 'Không còn thông tin'}</p>
                <p>Trạng thái: {callStatuses[selected.status]}</p>
                <p>Bắt đầu: {time(selected.startedAt)}</p>
                <p>Chấp nhận: {time(selected.connectedAt)}</p>
                <p>Kết thúc: {time(selected.endedAt)}</p>
                <p>Lý do: {selected.endReason || 'Chưa có'}</p>
                <p className="muted">
                  Trạng thái chấp nhận do máy chủ ghi nhận không chứng minh âm thanh hoặc hình ảnh
                  đã kết nối.
                </p>
              </div>
            </Dialog>
          )}
        </State>
      </section>
    </>
  );
}

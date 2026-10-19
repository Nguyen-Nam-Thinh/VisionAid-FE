import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PageHead, State, Dialog } from '../../components/UI';
import { formatTime } from '../../constants/labels';
import {
  monitoringApi,
  auditActions,
  guidanceEngines,
  type MonitoringKind,
  type MonitoringFilters,
  type MonitoringRecord,
} from '../../services/api/monitoring';
import type { Person } from '../../models/domain';

const titles = {
  metrics: 'Hiệu năng AI',
  audit: 'Nhật ký kiểm toán',
  delivery: 'Theo dõi thông báo',
  guidance: 'Nhật ký Hybrid',
};
const labels: Record<string, string> = {
  sessionId: 'Mã phiên điều hướng',
  userId: 'Mã người dùng',
  frameId: 'Mã khung hình',
  decision: 'Quyết định',
  engineUsed: 'Engine',
  isOfflineFallback: 'Fallback theo máy chủ',
  latencyMs: 'Thời gian xử lý',
  id: 'Mã bản ghi',
  modelName: 'Mô hình',
  modelVersion: 'Phiên bản',
  metricDate: 'Ngày UTC',
  sourceTable: 'Nguồn dữ liệu',
  totalRequests: 'Tổng lượt',
  successfulRequests: 'Thành công',
  failedRequests: 'Thất bại',
  avgConfidence: 'Confidence trung bình',
  avgLatencyMs: 'Thời gian trung bình',
  p95LatencyMs: 'Thời gian P95',
  p99LatencyMs: 'Thời gian P99',
  errorCount: 'Số lỗi',
  aggregatedBy: 'Nguồn tổng hợp',
  recordedAt: 'Tổng hợp lúc',
  actorId: 'Mã người thực hiện',
  actionType: 'Hành động',
  targetTable: 'Bảng đối tượng',
  targetRecordId: 'Mã đối tượng',
  performedAt: 'Thời gian',
  sourceType: 'Nguồn thông báo',
  emergencyEventId: 'Mã cảnh báo khẩn cấp',
  locationBoundaryEventId: 'Mã sự kiện vùng an toàn',
  recipientId: 'Mã người nhận',
  notificationType: 'Loại thông báo',
  channel: 'Kênh gửi',
  status: 'Trạng thái',
  failureReason: 'Lý do thất bại',
  createdAt: 'Thời gian tạo',
};
const columns = {
  guidance: ['createdAt', 'engineUsed', 'decision', 'latencyMs', 'isOfflineFallback'],
  metrics: [
    'metricDate',
    'modelName',
    'modelVersion',
    'totalRequests',
    'successfulRequests',
    'failedRequests',
    'avgLatencyMs',
  ],
  audit: ['performedAt', 'actorId', 'actionType', 'targetTable'],
  delivery: ['createdAt', 'channel', 'notificationType', 'status'],
};
const channelLabels: Record<string, string> = {
  Fcm: 'Push FCM',
  SignalR: 'SignalR',
  Email: 'Email',
};
const decisions = new Map([
  ['STOP', 'Dừng lại'],
  ['TURN_LEFT', 'Rẽ trái'],
  ['TURN_RIGHT', 'Rẽ phải'],
  ['PROCEED', 'Tiếp tục'],
]);
function valueText(key: string, value: string | number | boolean | null) {
  if (value === null) return key === 'actorId' ? 'Hệ thống hoặc chưa ghi nhận' : 'Chưa có dữ liệu';
  if (key === 'isOfflineFallback') return value ? 'Có' : 'Không';
  if (key === 'decision') return decisions.get(String(value)) ?? String(value);
  if (key.endsWith('At')) return formatTime(String(value)) + ' · UTC+7';
  if (key.endsWith('Ms')) return value + ' ms';
  if (key === 'avgConfidence') return (Number(value) * 100).toFixed(1) + '%';
  if (key === 'channel') return channelLabels[String(value)] ?? String(value);
  if (key === 'status' && value === 'Failed') return 'Thất bại';
  return String(value);
}
export function ApiMonitoring({ kind }: { kind: MonitoringKind }) {
  const { data: actor } = useSession();
  if (actor?.role !== 'Admin')
    return (
      <p className="notice error" role="alert">
        Chỉ quản trị viên hệ thống được xem dữ liệu này.
      </p>
    );
  return <Monitoring key={actor.id + kind} actor={actor} kind={kind} />;
}
function Monitoring({ actor, kind }: { actor: Person; kind: MonitoringKind }) {
  const [filters, setFilters] = useState<MonitoringFilters>({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MonitoringRecord | null>(null);
  const query = useQuery({
    queryKey: ['api-monitoring', actor.id, kind, filters, page],
    queryFn: ({ signal }) => monitoringApi.list(actor, kind, page, filters, signal),
    retry: false,
    gcTime: 0,
  });
  return (
    <>
      <PageHead
        title={titles[kind]}
        description={
          kind === 'metrics'
            ? 'Số liệu theo mô hình và ngày UTC. Confidence và tỷ lệ xử lý thành công không phải độ chính xác AI.'
            : kind === 'guidance'
              ? 'Theo dõi quyết định và thời gian xử lý do máy chủ ghi nhận. Đây là lịch sử, không phải hướng dẫn di chuyển trực tiếp.'
              : kind === 'audit'
                ? 'Tra cứu thao tác quản trị. Nhật ký chỉ đọc, không sửa hoặc xóa.'
                : 'Thống kê gửi cảnh báo và tra cứu thông báo thất bại.'
        }
      />
      <div className="stack">
        {kind === 'delivery' && <DeliveryStatus actor={actor} />}
        <section className="glass card stack">
          <h2>{kind === 'delivery' ? 'Thông báo thất bại' : 'Tra cứu bản ghi'}</h2>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setFilters(
                Object.fromEntries(
                  Array.from(data.entries()).map(([key, value]) => [key, String(value).trim()]),
                ),
              );
              setPage(1);
              setSelected(null);
            }}
          >
            {kind === 'guidance' && (
              <>
                <label className="field">
                  Mã người dùng
                  <input name="userId" placeholder="UUID" />
                </label>
                <label className="field">
                  Mã phiên điều hướng
                  <input name="sessionId" placeholder="UUID" />
                </label>
                <label className="field">
                  Engine
                  <select name="engineUsed">
                    <option value="">Tất cả engine</option>
                    {guidanceEngines.map((engine) => (
                      <option key={engine}>{engine}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Fallback
                  <select name="isOfflineFallback">
                    <option value="">Tất cả bản ghi</option>
                    <option value="true">Có fallback</option>
                    <option value="false">Không fallback</option>
                  </select>
                </label>
              </>
            )}
            {kind === 'metrics' && (
              <label className="field">
                Tên mô hình
                <input name="modelName" placeholder="Tên chính xác từ máy chủ" />
              </label>
            )}
            {kind === 'audit' && (
              <>
                <label className="field">
                  Mã người thực hiện
                  <input name="actorId" placeholder="UUID" />
                </label>
                <label className="field">
                  Hành động
                  <select name="actionType">
                    <option value="">Tất cả hành động</option>
                    {auditActions.map((action) => (
                      <option key={action}>{action}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Bảng đối tượng
                  <input name="targetTable" maxLength={100} />
                </label>
                <label className="field">
                  Mã đối tượng
                  <input name="targetRecordId" placeholder="UUID" />
                </label>
              </>
            )}
            {kind === 'delivery' && (
              <label className="field">
                Kênh gửi
                <select name="channel">
                  <option value="">Tất cả kênh</option>
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              {kind === 'metrics' ? 'Từ ngày UTC' : 'Từ ngày Việt Nam'}
              <input type="date" name="from" />
            </label>
            <label className="field">
              {kind === 'metrics' ? 'Đến ngày UTC' : 'Đến ngày Việt Nam'}
              <input type="date" name="to" />
            </label>
            <button className="btn primary">Lọc bản ghi</button>
            <button
              className="btn"
              type="button"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Tải lại
            </button>
          </form>
          {kind === 'metrics' ? (
            <p>
              Máy chủ tổng hợp ngày trước vào 07:00 giờ Việt Nam. Ngày UTC bắt đầu lúc 07:00 và kết
              thúc trước 07:00 hôm sau. Giữ nguyên tên mô hình do máy chủ trả về; số thành công phụ
              thuộc quy tắc tổng hợp từng nguồn.
            </p>
          ) : (
            <p>
              Bộ lọc gồm cả ngày kết thúc theo giờ Việt Nam. Để trống ngày để xem dữ liệu còn lưu.
            </p>
          )}
          {kind === 'audit' && (
            <p>
              Chi tiết hiển thị thông tin thao tác. Nội dung trước/sau, ghi chú và thông tin thiết
              bị chưa hiển thị vì có thể chứa dữ liệu nhạy cảm.
            </p>
          )}
          {kind === 'guidance' && (
            <div className="stack">
              <p>
                Chỉ hiển thị thông tin vận hành, không hiển thị cảnh vật hoặc nội dung giọng nói.
                Fallback là cờ do máy chủ ghi nhận, không chứng minh điện thoại đang offline hoặc
                ghi lại mọi lần chuyển engine. Độ trễ không phải thời gian toàn bộ yêu cầu từ điện
                thoại.
              </p>
              <div className="row">
                <Link className="btn" to="/admin/metrics">
                  Xem số liệu AI
                </Link>
                <Link className="btn" to="/admin/configurations">
                  Cấu hình engine
                </Link>
              </div>
              <p>
                Trong cấu hình hệ thống, tìm hybrid_navigation_enabled, hybrid_navigation_engine
                hoặc navigation_near_threshold_ms. Số liệu AI tổng hợp dùng tên JEV, Groq và
                RuleBased.
              </p>
            </div>
          )}
          {kind === 'metrics' && (
            <p>
              Với nguồn navigation_guidance_logs, máy chủ tính bản ghi thiếu độ trễ vào nhóm thất
              bại, kể cả RuleBased đã trả quyết định. Các số này không đánh giá độ đúng hoặc an toàn
              của hướng dẫn.
            </p>
          )}
          <State loading={query.isPending} error={query.error} retry={() => void query.refetch()}>
            {query.data && (
              <>
                {!query.data.items.length ? (
                  <p role="status">Không có bản ghi phù hợp.</p>
                ) : (
                  <div
                    className="table-scroll"
                    role="region"
                    aria-label={titles[kind]}
                    tabIndex={0}
                  >
                    <table style={{ minWidth: 720 }}>
                      <thead>
                        <tr>
                          {columns[kind].map((key) => (
                            <th key={key}>{labels[key]}</th>
                          ))}
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {query.data.items.map((row) => (
                          <tr key={row.id}>
                            {columns[kind].map((key) => (
                              <td key={key}>{valueText(key, row[key])}</td>
                            ))}
                            <td>
                              <button className="btn small" onClick={() => setSelected(row)}>
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="row pagination">
                  <span role="status">
                    {query.data.totalCount} bản ghi · Trang {query.data.page}/
                    {Math.max(1, query.data.totalPages)}
                  </span>
                  <div className="row">
                    <button
                      className="btn"
                      disabled={!query.data.hasPreviousPage || query.isFetching}
                      onClick={() => {
                        setPage(page - 1);
                        setSelected(null);
                      }}
                    >
                      Trang trước
                    </button>
                    <button
                      className="btn"
                      disabled={!query.data.hasNextPage || query.isFetching}
                      onClick={() => {
                        setPage(page + 1);
                        setSelected(null);
                      }}
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              </>
            )}
          </State>
        </section>
      </div>
      {selected && (
        <Dialog title="Chi tiết bản ghi" onClose={() => setSelected(null)}>
          <dl className="record-details">
            {Object.entries(selected).map(([key, value]) => (
              <div key={key}>
                <dt>{labels[key] ?? key}</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{valueText(key, value)}</dd>
              </div>
            ))}
          </dl>
        </Dialog>
      )}
    </>
  );
}
function DeliveryStatus({ actor }: { actor: Person }) {
  const query = useQuery({
    queryKey: ['api-delivery-status', actor.id],
    queryFn: ({ signal }) => monitoringApi.status(actor, signal),
    retry: false,
    gcTime: 0,
  });
  return (
    <section className="glass card stack">
      <div className="row between">
        <h2>Tổng quan gửi cảnh báo</h2>
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Tải lại thống kê
        </button>
      </div>
      <p>
        Chỉ tính bản ghi cảnh báo do máy chủ theo dõi. Đã gửi gồm trạng thái Sent và Delivered,
        không xác nhận người nhận đã đọc. Bộ lọc bên dưới chỉ áp dụng danh sách thất bại.
      </p>
      <State loading={query.isPending} error={query.error} retry={() => void query.refetch()}>
        {query.data && (
          <>
            <div
              className="table-scroll"
              role="region"
              aria-label="Thống kê gửi cảnh báo"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Khoảng thời gian</th>
                    <th>Đã gửi</th>
                    <th>Thất bại</th>
                    <th>Đang chờ</th>
                  </tr>
                </thead>
                <tbody>
                  {(['last24Hours', 'last7Days'] as const).map((key) => (
                    <tr key={key}>
                      <th>{key === 'last24Hours' ? '24 giờ gần nhất' : '7 ngày gần nhất'}</th>
                      <td>{query.data[key].totalSent}</td>
                      <td>{query.data[key].totalFailed}</td>
                      <td>{query.data[key].totalPending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(['last24Hours', 'last7Days'] as const).map((key) => (
              <div key={key}>
                <h3>Kênh gửi · {key === 'last24Hours' ? '24 giờ gần nhất' : '7 ngày gần nhất'}</h3>
                {query.data[key].byChannel.length ? (
                  <ul>
                    {query.data[key].byChannel.map((row) => (
                      <li key={row.channel}>
                        {channelLabels[row.channel] ?? row.channel}: {row.sent} đã gửi ·{' '}
                        {row.failed} thất bại
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Chưa ghi nhận gửi thành công hoặc thất bại theo kênh.</p>
                )}
              </div>
            ))}
          </>
        )}
      </State>
    </section>
  );
}

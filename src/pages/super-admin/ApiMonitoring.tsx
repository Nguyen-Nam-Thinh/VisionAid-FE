import { t, msg, labelMap, tText } from '../../i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PageHead, State, Dialog } from '../../components/UI';
import { formatTime } from '../../constants/labels';
import {
  monitoringApi,
  auditActions,
  auditActionLabels,
  guidanceEngines,
  type MonitoringKind,
  type MonitoringFilters,
  type MonitoringRecord,
} from '../../services/api/monitoring';
import type { Person } from '../../models/domain';
import { SearchPicker } from '../../components/SearchPicker';
import { searchAccounts } from '../../services/api/pickers';
import { FilterPanel } from '../../components/FilterPanel';

const titles = labelMap({
  metrics: msg('Hiệu năng AI'),
  audit: msg('Nhật ký thao tác'),
  delivery: msg('Theo dõi thông báo'),
  guidance: msg('Nhật ký Hybrid'),
});
const labels: Record<string, string> = labelMap({
  sessionId: msg('Mã phiên điều hướng'),
  userId: msg('Mã người dùng'),
  frameId: msg('Mã khung hình'),
  decision: msg('Quyết định'),
  engineUsed: 'Engine',
  isOfflineFallback: msg('Fallback theo máy chủ'),
  latencyMs: msg('Thời gian xử lý'),
  id: msg('Mã bản ghi'),
  modelName: msg('Mô hình'),
  modelVersion: msg('Phiên bản'),
  metricDate: msg('Ngày UTC'),
  sourceTable: msg('Nguồn dữ liệu'),
  totalRequests: msg('Tổng lượt'),
  successfulRequests: msg('Thành công'),
  failedRequests: msg('Thất bại'),
  avgConfidence: msg('Confidence trung bình'),
  avgLatencyMs: msg('Thời gian trung bình'),
  p95LatencyMs: msg('Thời gian P95'),
  p99LatencyMs: msg('Thời gian P99'),
  errorCount: msg('Số lỗi'),
  aggregatedBy: msg('Nguồn tổng hợp'),
  recordedAt: msg('Tổng hợp lúc'),
  actorName: msg('Người thực hiện'),
  actorEmail: msg('Email người thực hiện'),
  actorId: msg('Mã người thực hiện'),
  actionType: msg('Hành động'),
  targetTable: msg('Bảng đối tượng'),
  targetRecordId: msg('Mã đối tượng'),
  performedAt: msg('Thời gian'),
  sourceType: msg('Nguồn thông báo'),
  emergencyEventId: msg('Mã cảnh báo khẩn cấp'),
  locationBoundaryEventId: msg('Mã sự kiện vùng an toàn'),
  recipientId: msg('Mã người nhận'),
  notificationType: msg('Loại thông báo'),
  channel: msg('Kênh gửi'),
  status: msg('Trạng thái'),
  failureReason: msg('Lý do thất bại'),
  createdAt: msg('Thời gian tạo'),
});
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
  audit: ['performedAt', 'actorName', 'actionType', 'targetTable'],
  delivery: ['createdAt', 'channel', 'notificationType', 'status'],
};
const channelLabels: Record<string, string> = {
  Fcm: 'Push FCM',
  SignalR: 'SignalR',
  Email: 'Email',
};
const decisions = new Map([
  ['STOP', msg('Dừng lại')],
  ['TURN_LEFT', msg('Rẽ trái')],
  ['TURN_RIGHT', msg('Rẽ phải')],
  ['PROCEED', msg('Tiếp tục')],
]);
function valueText(key: string, value: string | number | boolean | null) {
  if (value === null || value === undefined)
    return key === 'actorId' || key === 'actorName'
      ? t('Hệ thống hoặc chưa ghi nhận')
      : t('Chưa có dữ liệu');
  if (key === 'isOfflineFallback') return value ? t('Có') : t('Không');
  if (key === 'decision') return tText(decisions.get(String(value)) ?? String(value));
  if (key.endsWith('At')) return formatTime(String(value)) + ' · UTC+7';
  if (key.endsWith('Ms')) return value + ' ms';
  if (key === 'avgConfidence') return (Number(value) * 100).toFixed(1) + '%';
  if (key === 'channel') return channelLabels[String(value)] ?? String(value);
  if (key === 'actionType')
    return auditActionLabels[String(value) as keyof typeof auditActionLabels] ?? String(value);
  if (key === 'status' && value === 'Failed') return t('Thất bại');
  return String(value);
}
// Audit actions are a fixed list: match the typed text against the translated labels and codes.
const searchActions = async (term: string) => {
  const q = term.trim().toLowerCase();
  return auditActions
    .filter((a) => auditActionLabels[a].toLowerCase().includes(q) || a.toLowerCase().includes(q))
    .map((a) => ({ value: a, label: auditActionLabels[a] }));
};
export function ApiMonitoring({ kind }: { kind: MonitoringKind }) {
  const { data: actor } = useSession();
  if (actor?.role !== 'Admin')
    return (
      <p className="notice error" role="alert">
        {t('Chỉ quản trị viên hệ thống được xem dữ liệu này.')}
      </p>
    );
  return <Monitoring key={actor.id + kind} actor={actor} kind={kind} />;
}
function Monitoring({ actor, kind }: { actor: Person; kind: MonitoringKind }) {
  const [filters, setFilters] = useState<MonitoringFilters>({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MonitoringRecord | null>(null);
  // Person filters are picked by name/email; session/record ids only come from a record's details.
  const [person, setPerson] = useState('');
  const [action, setAction] = useState('');
  const scope = (next: MonitoringFilters) => {
    setFilters(next);
    setPage(1);
    setSelected(null);
  };
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
            ? t('Số lần xử lý, thời gian và độ tin cậy của từng mô hình AI theo ngày.')
            : kind === 'guidance'
              ? t('Các chỉ dẫn di chuyển AI đã đưa ra và thời gian xử lý.')
              : kind === 'audit'
                ? t('Ai đã thao tác gì và khi nào trên hệ thống. Nhật ký chỉ đọc.')
                : t('Thống kê gửi cảnh báo và tra cứu thông báo thất bại.')
        }
      />
      <div className="stack">
        {kind === 'delivery' && <DeliveryStatus actor={actor} />}
        <section className="glass card stack">
          <h2>{kind === 'delivery' ? t('Thông báo thất bại') : t('Tra cứu bản ghi')}</h2>
          <FilterPanel
            active={
              Object.entries(filters).filter(
                ([key, value]) => value && key !== 'sessionId' && key !== 'targetRecordId',
              ).length
            }
            submitLabel={t('Lọc bản ghi')}
            onReset={() => {
              setPerson('');
              setAction('');
              scope({});
            }}
            tools={
              <button
                className="btn"
                type="button"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t('Tải lại')}
              </button>
            }
            onApply={(form) => {
              const data = new FormData(form);
              scope({
                ...Object.fromEntries(
                  Array.from(data.entries()).map(([key, value]) => [key, String(value).trim()]),
                ),
                ...(kind === 'audit' && {
                  actorId: person,
                  actionType: action,
                  targetRecordId: filters.targetRecordId,
                }),
                ...(kind === 'guidance' && { userId: person, sessionId: filters.sessionId }),
              });
            }}
          >
            {kind === 'guidance' && (
              <>
                <SearchPicker
                  wide
                  label={t('Người dùng')}
                  value={person}
                  onChange={setPerson}
                  search={searchAccounts(actor, 'VisuallyImpaired')}
                  queryKey={['guidance-user', actor.id]}
                />
                <label className="field">
                  Engine
                  <select name="engineUsed">
                    <option value="">{t('Tất cả engine')}</option>
                    {guidanceEngines.map((engine) => (
                      <option key={engine}>{engine}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Fallback
                  <select name="isOfflineFallback">
                    <option value="">{t('Tất cả bản ghi')}</option>
                    <option value="true">{t('Có fallback')}</option>
                    <option value="false">{t('Không fallback')}</option>
                  </select>
                </label>
              </>
            )}
            {kind === 'metrics' && (
              <label className="field wide">
                {t('Tên mô hình')}
                <input name="modelName" placeholder={t('Tên chính xác từ máy chủ')} />
              </label>
            )}
            {kind === 'audit' && (
              <>
                <SearchPicker
                  label={t('Người thực hiện')}
                  value={person}
                  onChange={setPerson}
                  search={searchAccounts(actor)}
                  queryKey={['audit-actor', actor.id]}
                />
                <SearchPicker
                  label={t('Hành động')}
                  placeholder={t('Gõ tên hành động')}
                  value={action}
                  onChange={setAction}
                  search={searchActions}
                  queryKey={['audit-action', actor.id]}
                />
                <label className="field wide">
                  {t('Bảng đối tượng')}
                  <input name="targetTable" maxLength={100} />
                </label>
              </>
            )}
            {kind === 'delivery' && (
              <label className="field wide">
                {t('Kênh gửi')}
                <select name="channel">
                  <option value="">{t('Tất cả kênh')}</option>
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {/* The date range always sits on one row of its own. */}
            <div className="filter-range wide">
              <label className="field">
                {kind === 'metrics' ? t('Từ ngày UTC') : t('Từ ngày Việt Nam')}
                <input type="date" name="from" />
              </label>
              <label className="field">
                {kind === 'metrics' ? t('Đến ngày UTC') : t('Đến ngày Việt Nam')}
                <input type="date" name="to" />
              </label>
            </div>
          </FilterPanel>
          {(filters.sessionId || filters.targetRecordId) && (
            <div className="row notice">
              <span>
                {filters.sessionId
                  ? t('Đang xem các bản ghi của một phiên điều hướng.')
                  : t('Đang xem các thao tác trên một bản ghi của bảng {table}.', {
                      table: filters.targetTable || t('đã chọn'),
                    })}
              </span>
              <button
                type="button"
                className="btn small"
                onClick={() => scope({ ...filters, sessionId: '', targetRecordId: '' })}
              >
                {t('Bỏ lọc này')}
              </button>
            </div>
          )}
          {kind === 'metrics' ? (
            <p>
              {t(
                'Máy chủ tổng hợp ngày trước vào 07:00 giờ Việt Nam. Ngày UTC bắt đầu lúc 07:00 và kết thúc trước 07:00 hôm sau. Giữ nguyên tên mô hình do máy chủ trả về; số thành công phụ thuộc quy tắc tổng hợp từng nguồn.',
              )}
            </p>
          ) : (
            <p>
              {t(
                'Bộ lọc gồm cả ngày kết thúc theo giờ Việt Nam. Để trống ngày để xem dữ liệu còn lưu.',
              )}
            </p>
          )}
          {kind === 'audit' && (
            <p>
              {t(
                'Chi tiết hiển thị thông tin thao tác. Nội dung trước/sau, ghi chú và thông tin thiết bị chưa hiển thị vì có thể chứa dữ liệu nhạy cảm.',
              )}
            </p>
          )}
          {kind === 'guidance' && (
            <div className="stack">
              <p>
                {t(
                  'Chỉ hiển thị thông tin vận hành, không hiển thị cảnh vật hoặc nội dung giọng nói. Fallback là cờ do máy chủ ghi nhận, không chứng minh điện thoại đang offline hoặc ghi lại mọi lần chuyển engine. Độ trễ không phải thời gian toàn bộ yêu cầu từ điện thoại.',
                )}
              </p>
              <div className="row">
                <Link className="btn" to="/admin/metrics">
                  {t('Xem số liệu AI')}
                </Link>
                <Link className="btn" to="/admin/configurations">
                  {t('Cấu hình engine')}
                </Link>
              </div>
              <p>
                {t(
                  'Trong cấu hình hệ thống, tìm hybrid_navigation_enabled, hybrid_navigation_engine hoặc navigation_near_threshold_ms. Số liệu AI tổng hợp dùng tên JEV, Groq và RuleBased.',
                )}
              </p>
            </div>
          )}
          {kind === 'metrics' && (
            <p>
              {t(
                'Với nguồn navigation_guidance_logs, máy chủ tính bản ghi thiếu độ trễ vào nhóm thất bại, kể cả RuleBased đã trả quyết định. Các số này không đánh giá độ đúng hoặc an toàn của hướng dẫn.',
              )}
            </p>
          )}
          <State loading={query.isPending} error={query.error} retry={() => void query.refetch()}>
            {query.data && (
              <>
                {!query.data.items.length ? (
                  <p role="status">{t('Không có bản ghi phù hợp.')}</p>
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
                          <th>{t('Thao tác')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {query.data.items.map((row) => (
                          <tr key={row.id}>
                            {columns[kind].map((key) => (
                              <td key={key}>
                                {valueText(
                                  key,
                                  // Older BE deploys have no actorName: fall back to the actor ID.
                                  key === 'actorName'
                                    ? (row.actorName ?? row.actorId ?? null)
                                    : row[key],
                                )}
                              </td>
                            ))}
                            <td>
                              <button className="btn small" onClick={() => setSelected(row)}>
                                {t('Chi tiết')}
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
                    {t('{totalCount} bản ghi · Trang {page}/{p4}', {
                      totalCount: query.data.totalCount,
                      page: query.data.page,
                      p4: Math.max(1, query.data.totalPages),
                    })}
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
                      {t('Trang trước')}
                    </button>
                    <button
                      className="btn"
                      disabled={!query.data.hasNextPage || query.isFetching}
                      onClick={() => {
                        setPage(page + 1);
                        setSelected(null);
                      }}
                    >
                      {t('Trang sau')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </State>
        </section>
      </div>
      {selected && (
        <Dialog title={t('Chi tiết bản ghi')} onClose={() => setSelected(null)}>
          <dl className="record-details">
            {Object.entries(selected).map(([key, value]) => (
              <div key={key}>
                <dt>{labels[key] ?? key}</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{valueText(key, value)}</dd>
              </div>
            ))}
          </dl>
          {kind === 'guidance' && selected.sessionId && (
            <button
              className="btn"
              onClick={() => scope({ ...filters, sessionId: String(selected.sessionId) })}
            >
              {t('Xem cùng phiên điều hướng')}
            </button>
          )}
          {kind === 'audit' && selected.targetRecordId && (
            <button
              className="btn"
              onClick={() =>
                scope({
                  ...filters,
                  targetTable: String(selected.targetTable ?? ''),
                  targetRecordId: String(selected.targetRecordId),
                })
              }
            >
              {t('Xem các thao tác trên đối tượng này')}
            </button>
          )}
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
        <h2>{t('Tổng quan gửi cảnh báo')}</h2>
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          {t('Tải lại thống kê')}
        </button>
      </div>
      <p>
        {t(
          'Chỉ tính bản ghi cảnh báo do máy chủ theo dõi. Đã gửi gồm trạng thái Sent và Delivered, không xác nhận người nhận đã đọc. Bộ lọc bên dưới chỉ áp dụng danh sách thất bại.',
        )}
      </p>
      <State loading={query.isPending} error={query.error} retry={() => void query.refetch()}>
        {query.data && (
          <>
            <div
              className="table-scroll"
              role="region"
              aria-label={t('Thống kê gửi cảnh báo')}
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>{t('Khoảng thời gian')}</th>
                    <th>{t('Đã gửi')}</th>
                    <th>{t('Thất bại')}</th>
                    <th>{t('Đang chờ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(['last24Hours', 'last7Days'] as const).map((key) => (
                    <tr key={key}>
                      <th>{key === 'last24Hours' ? t('24 giờ gần nhất') : t('7 ngày gần nhất')}</th>
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
                <h3>
                  {t('Kênh gửi ·')}{' '}
                  {key === 'last24Hours' ? t('24 giờ gần nhất') : t('7 ngày gần nhất')}
                </h3>
                {query.data[key].byChannel.length ? (
                  <ul>
                    {query.data[key].byChannel.map((row) => (
                      <li key={row.channel}>
                        {t('{p0}: {sent} đã gửi · {failed} thất bại', {
                          p0: channelLabels[row.channel] ?? row.channel,
                          sent: row.sent,
                          failed: row.failed,
                        })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{t('Chưa ghi nhận gửi thành công hoặc thất bại theo kênh.')}</p>
                )}
              </div>
            ))}
          </>
        )}
      </State>
    </section>
  );
}

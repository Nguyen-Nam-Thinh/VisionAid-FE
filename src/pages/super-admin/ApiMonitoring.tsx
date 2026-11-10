import { BarChart3, CircleCheck, CircleX, Clock, ListChecks, RefreshCw } from 'lucide-react';
import { PageTabs } from '../../components/PageTabs';
import { t, msg, labelMap, tText, formatNumber } from '../../i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PageHead, State, Dialog } from '../../components/UI';
import { formatTime } from '../../constants/labels';
import {
  monitoringApi,
  retryBlockedLabels,
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
  guidance: msg('Nhật ký chỉ dẫn di chuyển'),
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
  targetTable: msg('Đối tượng'),
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
// UC-117: BE logs delivery for FCM and Email only; SignalR has no delivery rows to filter or count.
const channelLabels: Record<string, string> = {
  Fcm: 'Push FCM',
  Email: 'Email',
};
const decisions = new Map([
  ['STOP', msg('Dừng lại')],
  ['TURN_LEFT', msg('Rẽ trái')],
  ['TURN_RIGHT', msg('Rẽ phải')],
  ['PROCEED', msg('Tiếp tục')],
]);
// Record ids and aggregation internals stay out of the details dialog; ids are only used to
// filter (e.g. "same navigation session"), never shown.
const hiddenDetail = (key: string) => key === 'id' || key.endsWith('Id') || key === 'aggregatedBy';
// Server-side table/entity names in plain words; unknown ones fall back to the raw name.
const entities: Record<string, string> = labelMap({
  user: msg('Tài khoản'),
  organization: msg('Tổ chức'),
  caregiverlink: msg('Liên kết chăm sóc'),
  emergencyevent: msg('Cảnh báo khẩn cấp'),
  emergencycontact: msg('Liên hệ khẩn cấp'),
  faceregistryperson: msg('Người quen trong danh bạ khuôn mặt'),
  faceregistryimage: msg('Ảnh khuôn mặt'),
  facerecognitionlog: msg('Nhận diện khuôn mặt'),
  savedlocation: msg('Địa điểm đã lưu'),
  geofence: msg('Vùng an toàn'),
  systemconfiguration: msg('Cấu hình hệ thống'),
  systemconfigurationhistory: msg('Lịch sử cấu hình'),
  globalnotificationrule: msg('Quy tắc thông báo'),
  organizationlicensepool: msg('Kho license tổ chức'),
  licensepackage: msg('Gói dịch vụ'),
  licensesubscription: msg('Đăng ký gói'),
  paymenttransaction: msg('Giao dịch thanh toán'),
  webrtcsession: msg('Cuộc gọi'),
  webrtciceserver: msg('Máy chủ hỗ trợ cuộc gọi'),
  obstacledetectionsession: msg('Phiên phát hiện vật cản'),
  ocrrequest: msg('Đọc chữ (OCR)'),
  qrscanresult: msg('Quét mã QR'),
  voicecommandlog: msg('Lệnh giọng nói'),
  navigationguidancelog: msg('Hướng dẫn di chuyển'),
});
const entityText = (raw: string) => {
  const key = raw.toLowerCase().replace(/_/g, '').replace(/logs$/, 'log').replace(/s$/, '');
  return entities[key] ?? entities[key + 's'] ?? raw;
};
function valueText(key: string, value: string | number | boolean | null) {
  if (value === null || value === undefined)
    return key === 'actorId' || key === 'actorName'
      ? t('Hệ thống hoặc chưa ghi nhận')
      : t('Chưa có dữ liệu');
  if (key === 'isOfflineFallback') return value ? t('Có') : t('Không');
  if (key === 'sourceTable' || key === 'targetTable') return entityText(String(value));
  if (key === 'decision') return tText(decisions.get(String(value)) ?? String(value));
  if (key.endsWith('At')) return formatTime(String(value));
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
/** Resend one failed notification; disabled with the reason when the BE says it would mislead. */
function RetryButton({
  actor,
  row,
  done,
}: {
  actor: Person;
  row: MonitoringRecord;
  done: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const blocked =
    row.canRetry === false
      ? retryBlockedLabels[String(row.retryBlockedCode)] ||
        t('Máy chủ không cho gửi lại thông báo này.')
      : '';
  return (
    <>
      <button
        className="btn small"
        disabled={pending || !!blocked}
        title={blocked || undefined}
        aria-describedby={blocked ? 'retry-' + row.id : undefined}
        onClick={async () => {
          setPending(true);
          try {
            const result = await monitoringApi.retry(actor, row.id);
            done(
              result.status === 'Sent'
                ? t('Đã gửi lại thành công.')
                : result.status === 'Pending'
                  ? t('Đang gửi lại; trạng thái sẽ được cập nhật sau.')
                  : t('Gửi lại vẫn thất bại: {reason}', {
                      reason: result.failureReason || t('không rõ lý do'),
                    }),
            );
          } catch (error) {
            done(error instanceof Error ? error.message : t('Không thể thực hiện.'));
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? t('Đang gửi lại…') : t('Gửi lại')}
      </button>
      {blocked && (
        <small id={'retry-' + row.id} className="muted">
          {blocked}
        </small>
      )}
    </>
  );
}
function Monitoring({ actor, kind }: { actor: Person; kind: MonitoringKind }) {
  const [filters, setFilters] = useState<MonitoringFilters>({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MonitoringRecord | null>(null);
  const [retryNotice, setRetryNotice] = useState('');
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
            ? t('Mỗi ngày AI đã nhận diện bao nhiêu lần, mất bao lâu và chắc chắn đến mức nào.')
            : kind === 'guidance'
              ? t('Các chỉ dẫn tránh vật cản đã đọc cho người khiếm thị và thời gian phản hồi.')
              : kind === 'audit'
                ? t('Ai đã làm gì và vào lúc nào trên hệ thống. Chỉ xem, không sửa được.')
                : t(
                    'Số cảnh báo đã gửi được hoặc bị lỗi, và danh sách thông báo gửi không thành công.',
                  )
        }
      />
      <PageTabs
        label={t('Phần của trang')}
        tabs={[
          kind === 'delivery' && {
            value: 'overview',
            label: t('Tổng quan'),
            icon: BarChart3,
            content: <DeliveryStatus actor={actor} />,
          },
          {
            value: 'records',
            label: kind === 'delivery' ? t('Thông báo thất bại') : t('Tra cứu bản ghi'),
            icon: ListChecks,
            content: (
              <section className="glass card stack">
                <h2>{kind === 'delivery' ? t('Thông báo thất bại') : t('Tra cứu bản ghi')}</h2>
                {retryNotice && (
                  <p className="notice" role="status">
                    {retryNotice}
                  </p>
                )}
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
                      <RefreshCw size={16} aria-hidden="true" />
                      {t('Tải lại')}
                    </button>
                  }
                  onApply={(form) => {
                    const data = new FormData(form);
                    scope({
                      ...Object.fromEntries(
                        Array.from(data.entries()).map(([key, value]) => [
                          key,
                          String(value).trim(),
                        ]),
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
                      {t('Từ ngày')}
                      <input type="date" name="from" />
                    </label>
                    <label className="field">
                      {t('Đến ngày')}
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
                      'Số liệu của ngày hôm trước được tổng hợp lúc 07:00 sáng. Số thành công phụ thuộc quy tắc tổng hợp của từng nguồn.',
                    )}
                  </p>
                ) : (
                  <p>
                    {t(
                      'Bộ lọc gồm cả ngày kết thúc. Để trống ngày để xem dữ liệu còn lưu.',
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
                    <p>
                      {t(
                        'OnDeviceRules là quyết định điện thoại tự đưa ra khi mất mạng, chưa có phiên hoặc máy chủ chậm; ứng dụng gửi lại sau để truy vết. Câu đã đọc và vị trí chỉ hiển thị cho người chăm sóc có liên kết.',
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
                <State
                  loading={query.isPending}
                  error={query.error}
                  retry={() => void query.refetch()}
                >
                  {query.data && (
                    <>
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
                                      // Older BE deploys have no actorName; never show the raw actor ID.
                                      key === 'actorName' ? (row.actorName ?? null) : row[key],
                                    )}
                                  </td>
                                ))}
                                <td>
                                  <div className="row">
                                    <button className="btn small" onClick={() => setSelected(row)}>
                                      {t('Chi tiết')}
                                    </button>
                                    {kind === 'delivery' && (
                                      <RetryButton
                                        actor={actor}
                                        row={row}
                                        done={(message) => {
                                          setRetryNotice(message);
                                          void query.refetch();
                                        }}
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {!query.data.items.length && (
                          <p className="empty">{t('Không có bản ghi phù hợp.')}</p>
                        )}
                      </div>
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
            ),
          },
        ]}
      />
      {selected && (
        <Dialog title={t('Chi tiết bản ghi')} onClose={() => setSelected(null)}>
          <dl className="record-details">
            {Object.entries(selected)
              .filter(([key]) => !hiddenDetail(key))
              .map(([key, value]) => (
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
  const [period, setPeriod] = useState<'last24Hours' | 'last7Days'>('last24Hours');
  const query = useQuery({
    queryKey: ['api-delivery-status', actor.id],
    queryFn: ({ signal }) => monitoringApi.status(actor, signal),
    retry: false,
    gcTime: 0,
  });
  const stats = query.data?.[period];
  return (
    <section className="glass card stack" aria-labelledby="delivery-overview-title">
      <div className="row between">
        <h2 id="delivery-overview-title">{t('Tổng quan gửi cảnh báo')}</h2>
        <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw size={16} aria-hidden="true" />
          {t('Tải lại thống kê')}
        </button>
      </div>
      <div className="segmented" role="group" aria-label={t('Khoảng thời gian')}>
        {(['last24Hours', 'last7Days'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={'btn small' + (period === key ? ' is-active' : '')}
            aria-pressed={period === key}
            onClick={() => setPeriod(key)}
          >
            {key === 'last24Hours' ? t('24 giờ qua') : t('7 ngày qua')}
          </button>
        ))}
      </div>
      <State loading={query.isPending} error={query.error} retry={() => void query.refetch()}>
        {stats && (
          <>
            <div className="report-tiles delivery-tiles">
              {(
                [
                  [t('Đã gửi đi'), stats.totalSent, CircleCheck, 'success'],
                  [t('Gửi thất bại'), stats.totalFailed, CircleX, 'danger'],
                  [t('Đang chờ gửi'), stats.totalPending, Clock, 'warning'],
                ] as const
              ).map(([label, count, Icon, tone]) => (
                <div key={label} className="report-tile" role="group" aria-label={label}>
                  <span className={'report-tile-icon ' + tone} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <strong className="report-tile-value">{formatNumber(count)}</strong>
                  <span className="report-tile-label">{label}</span>
                </div>
              ))}
            </div>
            <h3>{t('Theo cách gửi')}</h3>
            {stats.byChannel.length ? (
              <ul className="delivery-channels">
                {stats.byChannel.map((row) => {
                  const total = row.sent + row.failed;
                  const ok = total ? (row.sent / total) * 100 : 0;
                  return (
                    <li key={row.channel}>
                      <span className="delivery-channel-name">
                        {channelLabels[row.channel] ?? row.channel}
                      </span>
                      <span className="delivery-channel-track" aria-hidden="true">
                        <span style={{ width: ok + '%' }} />
                      </span>
                      <span className="delivery-channel-count">
                        {t('{sent} đã gửi · {failed} thất bại', {
                          sent: formatNumber(row.sent),
                          failed: formatNumber(row.failed),
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">{t('Chưa có cảnh báo nào được gửi trong khoảng này.')}</p>
            )}
            <p className="report-note">
              {t(
                '"Đã gửi đi" nghĩa là máy chủ đã chuyển cảnh báo đi, chưa chắc người nhận đã mở xem. Bộ lọc bên dưới chỉ áp dụng cho danh sách thông báo thất bại.',
              )}
            </p>
          </>
        )}
      </State>
    </section>
  );
}

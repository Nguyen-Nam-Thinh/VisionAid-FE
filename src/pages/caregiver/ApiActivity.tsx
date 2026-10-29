import { RefreshCw } from 'lucide-react';
import { t, msg, labelMap, tText, getLocale } from '../../i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi } from '../../services/api/caregiving';
import {
  activityApi,
  activityKinds,
  activityDateRange,
  type ActivityKind,
  type ActivityRecord,
  type ActivityPage,
} from '../../services/api/activity';
import { FilterPanel } from '../../components/FilterPanel';
import { PageHead, State, Dialog } from '../../components/UI';
import { formatTime } from '../../constants/labels';
import type { Person } from '../../models/domain';
import { uiStore, useUI } from '../../stores/ui';

const labels: Record<string, string> = labelMap({
  startedAt: msg('Bắt đầu'),
  endedAt: msg('Kết thúc'),
  detectionMode: msg('Chế độ phát hiện'),
  totalDetections: msg('Số phát hiện'),
  totalAlertsIssued: msg('Số cảnh báo'),
  deviceModel: msg('Thiết bị'),
  appVersion: msg('Phiên bản ứng dụng'),
  isActive: msg('Phiên đang hoạt động'),
  requestType: msg('Loại đọc chữ'),
  triggerMethod: msg('Cách kích hoạt'),
  rawText: msg('Văn bản gốc'),
  processedText: msg('Văn bản đã xử lý'),
  confidenceScore: msg('Độ tin cậy'),
  ocrEngine: msg('Bộ nhận dạng'),
  languageDetected: msg('Ngôn ngữ'),
  processingTimeMs: msg('Thời gian xử lý'),
  resultStatus: msg('Kết quả'),
  errorMessage: msg('Thông tin lỗi'),
  ttsAnnounced: msg('Đã phát giọng đọc'),
  requestedAt: msg('Thời gian yêu cầu'),
  latitude: msg('Vĩ độ'),
  longitude: msg('Kinh độ'),
  qrContent: msg('Nội dung QR'),
  qrType: msg('Loại QR'),
  isUrl: msg('Là đường dẫn'),
  urlDomain: msg('Tên miền trong QR'),
  scannedAt: msg('Thời gian quét'),
  matchedPersonName: msg('Người được nhận diện'),
  similarityScore: msg('Độ tương đồng'),
  recognitionResult: msg('Kết quả nhận diện'),
  estimatedDistance: msg('Khoảng cách ước tính'),
  recognizedAt: msg('Thời gian nhận diện'),
  rawTranscript: msg('Lời nói được ghi nhận'),
  matchedCommand: msg('Lệnh nhận dạng'),
  recognitionEngine: msg('Bộ nhận dạng'),
  executionStatus: msg('Kết quả thực hiện'),
  requiredConfirmation: msg('Yêu cầu xác nhận'),
  confirmedAt: msg('Thời gian xác nhận'),
  audioDurationMs: msg('Thời lượng âm thanh'),
  isOffline: msg('Xử lý ngoại tuyến'),
  executedAt: msg('Thời gian thực hiện'),
});
const values: Record<string, string> = labelMap({
  Full: msg('Đầy đủ'),
  Minimal: msg('Tối giản'),
  Success: msg('Thành công'),
  Failed: msg('Thất bại'),
  Retried: msg('Đã thử lại'),
  LowConfidence: msg('Độ tin cậy thấp'),
  Matched: msg('Nhận diện được'),
  NotMatched: msg('Chưa nhận diện được'),
  Error: msg('Lỗi'),
  Unrecognized: msg('Không nhận dạng được'),
  Confirmed: msg('Đã xác nhận'),
  Cancelled: msg('Đã hủy'),
  Near: msg('Gần'),
  Medium: msg('Trung bình'),
  Far: msg('Xa'),
});
// Vietnamese reads "Chi tiết di chuyển"; English keeps the capital ("Movement details").
const lowerFirst = (text: string) =>
  getLocale() === 'vi' ? text.charAt(0).toLowerCase() + text.slice(1) : text;
function display(key: string, value: ActivityRecord[string]) {
  if (value === null || value === undefined || value === '') return t('Chưa có');
  if (typeof value === 'boolean') return value ? t('Có') : t('Không');
  if (key.endsWith('At')) return formatTime(String(value));
  if (key.endsWith('Score')) return `${(Number(value) * 100).toFixed(1)}%`;
  if (key.endsWith('Ms')) return `${value} ms`;
  return [
    'detectionMode',
    'resultStatus',
    'recognitionResult',
    'executionStatus',
    'distanceRange',
  ].includes(key)
    ? values[String(value)] || String(value)
    : String(value);
}
function Pager({
  data,
  busy,
  onPage,
}: {
  data: ActivityPage;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="row pagination">
      <span>
        {t('{totalCount} kết quả · Trang {page}/{p4}', {
          totalCount: data.totalCount,
          page: data.page,
          p4: Math.max(1, data.totalPages),
        })}
      </span>
      <button
        className="btn"
        disabled={busy || !data.hasPreviousPage}
        onClick={() => onPage(data.page - 1)}
      >
        {t('Trang trước')}
      </button>
      <button
        className="btn"
        disabled={busy || !data.hasNextPage}
        onClick={() => onPage(data.page + 1)}
      >
        {t('Trang sau')}
      </button>
    </div>
  );
}
function Events({ actor, viuId, sessionId }: { actor: Person; viuId: string; sessionId: string }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['api-activity-events', actor.id, actor.orgId, viuId, sessionId, page],
    queryFn: ({ signal }) => activityApi.events(actor, viuId, sessionId, page, signal),
    retry: false,
    gcTime: 0,
    refetchInterval: 30000,
  });
  return (
    <section className="stack">
      <h3>{t('Phát hiện trong phiên')}</h3>
      <p>
        {t('Sắp xếp từ cũ đến mới. Đây là nhật ký phát hiện, không phải toàn bộ lộ trình GPS.')}
      </p>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data?.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('Thời gian')}</th>
                  <th>{t('Đối tượng')}</th>
                  <th>{t('Độ tin cậy')}</th>
                  <th>{t('Khoảng cách')}</th>
                  <th>{t('Đã cảnh báo')}</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((item) => (
                  <tr key={item.id}>
                    <td>{display('detectedAt', item.detectedAt)}</td>
                    <td>{item.objectClass}</td>
                    <td>{display('confidenceScore', item.confidenceScore)}</td>
                    <td>{display('distanceRange', item.distanceRange)}</td>
                    <td>{display('alertIssued', item.alertIssued)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('Chưa có phát hiện được lưu trong phiên này.')}</p>
        )}
        {query.data && <Pager data={query.data} busy={query.isFetching} onPage={setPage} />}
      </State>
    </section>
  );
}
function Detail({
  actor,
  viuId,
  kind,
  id,
  onClose,
}: {
  actor: Person;
  viuId: string;
  kind: ActivityKind;
  id: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ['api-activity-detail', actor.id, actor.orgId, viuId, kind, id],
    queryFn: ({ signal }) => activityApi.detail(actor, viuId, kind, id, signal),
    retry: false,
    gcTime: 0,
    refetchInterval: 30000,
  });
  return (
    <Dialog
      title={t('Chi tiết {kind}', { kind: lowerFirst(tText(activityKinds[kind].label)) })}
      onClose={onClose}
    >
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <div className="stack">
            <p>{t('Thời gian hiển thị theo giờ Việt Nam.')}</p>
            <dl className="record-details">
              {Object.entries(query.data)
                .filter(([key]) => labels[key])
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{labels[key]}</dt>
                    <dd>{display(key, value)}</dd>
                  </div>
                ))}
            </dl>
            {kind === 'navigation' && <Events actor={actor} viuId={viuId} sessionId={id} />}
          </div>
        )}
      </State>
    </Dialog>
  );
}
function ActivityHistory({ actor, viuId, name }: { actor: Person; viuId: string; name: string }) {
  const [kind, setKind] = useState<ActivityKind>('navigation');
  const [page, setPage] = useState(1);
  const [range, setRange] = useState({ dateFrom: '', dateTo: '' });
  const [error, setError] = useState('');
  const [detail, setDetail] = useState('');
  const query = useQuery({
    queryKey: ['api-activity', actor.id, actor.orgId, viuId, kind, range, page],
    queryFn: ({ signal }) => activityApi.list(actor, viuId, kind, page, range, signal),
    retry: false,
    gcTime: 0,
    refetchInterval: detail ? false : 30000,
  });
  return (
    <section className="glass card stack">
      <h2>{t('Lịch sử của {name}', { name })}</h2>
      <label className="field">
        {t('Loại hoạt động')}
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as ActivityKind);
            setPage(1);
            setDetail('');
          }}
        >
          {Object.entries(activityKinds).map(([key, item]) => (
            <option key={key} value={key}>
              {tText(item.label)}
            </option>
          ))}
        </select>
      </label>
      <FilterPanel
        active={[range.dateFrom, range.dateTo].filter(Boolean).length}
        submitLabel={t('Lọc lịch sử')}
        onApply={(form) => {
          const fields = new FormData(form);
          try {
            setRange(
              activityDateRange(String(fields.get('from') || ''), String(fields.get('to') || '')),
            );
            setPage(1);
            setDetail('');
            setError('');
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        onReset={() => {
          setRange({ dateFrom: '', dateTo: '' });
          setPage(1);
          setDetail('');
          setError('');
        }}
        tools={
          <button
            type="button"
            className="btn"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('Tải lại lịch sử')}
          </button>
        }
      >
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
      <p>
        {t(
          'Ngày lọc và thời gian hiển thị theo giờ Việt Nam. Để trống ngày để xem toàn bộ thời gian còn lưu.',
        )}
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data?.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('Thời gian')}</th>
                  <th>{kind === 'navigation' ? t('Chế độ phát hiện') : t('Kết quả')}</th>
                  <th>{t('Thao tác')}</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((item) => (
                  <tr key={item.id}>
                    <td>{display(activityKinds[kind].at, item[activityKinds[kind].at])}</td>
                    <td>
                      {display(activityKinds[kind].summary, item[activityKinds[kind].summary])}
                    </td>
                    <td>
                      <button className="btn small" onClick={() => setDetail(item.id)}>
                        {t('Chi tiết')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('Chưa có lịch sử phù hợp với bộ lọc.')}</p>
        )}
        {query.data && (
          <Pager
            data={query.data}
            busy={query.isFetching}
            onPage={(value) => {
              setPage(value);
              setDetail('');
            }}
          />
        )}
        {detail && (
          <Detail
            actor={actor}
            viuId={viuId}
            kind={kind}
            id={detail}
            onClose={() => setDetail('')}
          />
        )}
      </State>
    </section>
  );
}
export function ApiActivity() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? (
    <Activity key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}
function Activity({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Shared with the other care-recipient pages; cleared on logout via uiStore.clear().
  const { selectedViu: selected } = useUI();
  const setSelected = (id: string) => uiStore.set({ selectedViu: id });
  const users = useQuery({
    queryKey: ['api-activity-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  const person =
    users.data?.items.find((item) => item.id === selected) ??
    // Only one care recipient in scope: select them instead of asking.
    (!selected && users.data?.totalCount === 1 ? users.data.items[0] : undefined);
  return (
    <>
      <PageHead
        title={t('Lịch sử hoạt động')}
        description={t('Xem các hoạt động đã được ghi nhận của người bạn chăm sóc.')}
      />
      <section className="glass card stack">
        <FilterPanel
          active={search ? 1 : 0}
          onApply={(form) => {
            setSearch(String(new FormData(form).get('search') || '').trim());
            setPage(1);
            setSelected('');
          }}
          onReset={() => {
            setSearch('');
            setPage(1);
            setSelected('');
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={users.isFetching}
              onClick={() => void users.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại người dùng')}
            </button>
          }
        >
          <label className="field wide">
            {t('Tìm người được chăm sóc')}
            <input name="search" placeholder={t('Tên, email hoặc số điện thoại')} />
          </label>
        </FilterPanel>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          <label className="field">
            {t('Người được chăm sóc')}
            <select value={person?.id || ''} onChange={(e) => setSelected(e.target.value)}>
              <option value="">{t('Chọn người được chăm sóc')}</option>
              {users.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} · {item.email}
                </option>
              ))}
            </select>
          </label>
          {users.data && (
            <div className="row">
              <span>
                {t('{totalCount} người · Trang {page}/{p4}', {
                  totalCount: users.data.totalCount,
                  page,
                  p4: Math.max(1, users.data.totalPages),
                })}
              </span>
              <button
                className="btn"
                disabled={!users.data.hasPreviousPage || users.isFetching}
                onClick={() => {
                  setPage(page - 1);
                  setSelected('');
                }}
              >
                {t('Trang trước')}
              </button>
              <button
                className="btn"
                disabled={!users.data.hasNextPage || users.isFetching}
                onClick={() => {
                  setPage(page + 1);
                  setSelected('');
                }}
              >
                {t('Trang sau')}
              </button>
            </div>
          )}
          {!users.data?.items.length && <p>{t('Chưa có người được chăm sóc phù hợp.')}</p>}
        </State>
      </section>
      {!users.error && person && (
        <ActivityHistory
          key={actor.id + person.id}
          actor={actor}
          viuId={person.id}
          name={person.fullName}
        />
      )}
    </>
  );
}

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
import { PageHead, State, Dialog } from '../../components/UI';
import { formatTime } from '../../constants/labels';
import type { Person } from '../../models/domain';

const labels: Record<string, string> = {
  startedAt: 'Bắt đầu',
  endedAt: 'Kết thúc',
  detectionMode: 'Chế độ phát hiện',
  totalDetections: 'Số phát hiện',
  totalAlertsIssued: 'Số cảnh báo',
  deviceModel: 'Thiết bị',
  appVersion: 'Phiên bản ứng dụng',
  isActive: 'Phiên đang hoạt động',
  requestType: 'Loại đọc chữ',
  triggerMethod: 'Cách kích hoạt',
  rawText: 'Văn bản gốc',
  processedText: 'Văn bản đã xử lý',
  confidenceScore: 'Độ tin cậy',
  ocrEngine: 'Bộ nhận dạng',
  languageDetected: 'Ngôn ngữ',
  processingTimeMs: 'Thời gian xử lý',
  resultStatus: 'Kết quả',
  errorMessage: 'Thông tin lỗi',
  ttsAnnounced: 'Đã phát giọng đọc',
  requestedAt: 'Thời gian yêu cầu',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  qrContent: 'Nội dung QR',
  qrType: 'Loại QR',
  isUrl: 'Là đường dẫn',
  urlDomain: 'Tên miền trong QR',
  scannedAt: 'Thời gian quét',
  matchedPersonName: 'Người được nhận diện',
  similarityScore: 'Độ tương đồng',
  recognitionResult: 'Kết quả nhận diện',
  estimatedDistance: 'Khoảng cách ước tính',
  recognizedAt: 'Thời gian nhận diện',
  rawTranscript: 'Lời nói được ghi nhận',
  matchedCommand: 'Lệnh nhận dạng',
  recognitionEngine: 'Bộ nhận dạng',
  executionStatus: 'Kết quả thực hiện',
  requiredConfirmation: 'Yêu cầu xác nhận',
  confirmedAt: 'Thời gian xác nhận',
  audioDurationMs: 'Thời lượng âm thanh',
  isOffline: 'Xử lý ngoại tuyến',
  executedAt: 'Thời gian thực hiện',
};
const values: Record<string, string> = {
  Full: 'Đầy đủ',
  Minimal: 'Tối giản',
  Success: 'Thành công',
  Failed: 'Thất bại',
  Retried: 'Đã thử lại',
  LowConfidence: 'Độ tin cậy thấp',
  Matched: 'Nhận diện được',
  NotMatched: 'Chưa nhận diện được',
  Error: 'Lỗi',
  Unrecognized: 'Không nhận dạng được',
  Confirmed: 'Đã xác nhận',
  Cancelled: 'Đã hủy',
  Near: 'Gần',
  Medium: 'Trung bình',
  Far: 'Xa',
};
function display(key: string, value: ActivityRecord[string]) {
  if (value === null || value === undefined || value === '') return 'Chưa có';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
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
    <div className="row">
      <span>
        {data.totalCount} kết quả · Trang {data.page}/{Math.max(1, data.totalPages)}
      </span>
      <button
        className="btn"
        disabled={busy || !data.hasPreviousPage}
        onClick={() => onPage(data.page - 1)}
      >
        Trang trước
      </button>
      <button
        className="btn"
        disabled={busy || !data.hasNextPage}
        onClick={() => onPage(data.page + 1)}
      >
        Trang sau
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
      <h3>Phát hiện trong phiên</h3>
      <p>Sắp xếp từ cũ đến mới. Đây là nhật ký phát hiện, không phải toàn bộ lộ trình GPS.</p>
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data?.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Đối tượng</th>
                  <th>Độ tin cậy</th>
                  <th>Khoảng cách</th>
                  <th>Đã cảnh báo</th>
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
          <p>Chưa có phát hiện được lưu trong phiên này.</p>
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
      title={`Chi tiết ${activityKinds[kind].label[0].toLowerCase()}${activityKinds[kind].label.slice(1)}`}
      onClose={onClose}
    >
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <div className="stack">
            <p>Thời gian hiển thị theo giờ Việt Nam.</p>
            <dl className="stack">
              {Object.entries(query.data)
                .filter(([key]) => labels[key])
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      <strong>{labels[key]}</strong>
                    </dt>
                    <dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {display(key, value)}
                    </dd>
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
      <h2>Lịch sử của {name}</h2>
      <p>
        Dữ liệu do Mobile gửi lên, trong thời hạn lưu trữ của máy chủ. Không có bản ghi không có
        nghĩa là người dùng không hoạt động.
      </p>
      <label className="field">
        Loại hoạt động
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
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          const fields = new FormData(e.currentTarget);
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
      >
        <label className="field">
          Từ ngày
          <input type="date" name="from" />
        </label>
        <label className="field">
          Đến ngày
          <input type="date" name="to" />
        </label>
        <button className="btn">Lọc lịch sử</button>
        <button
          type="button"
          className="btn"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Tải lại lịch sử
        </button>
      </form>
      <p>
        Ngày lọc và thời gian hiển thị theo giờ Việt Nam. Để trống ngày để xem toàn bộ thời gian còn
        lưu.
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
                  <th>Thời gian</th>
                  <th>{kind === 'navigation' ? 'Chế độ phát hiện' : 'Kết quả'}</th>
                  <th>Thao tác</th>
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
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Chưa có lịch sử phù hợp với bộ lọc.</p>
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
  const [selected, setSelected] = useState('');
  const users = useQuery({
    queryKey: ['api-activity-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  const person = users.data?.items.find((item) => item.id === selected);
  return (
    <>
      <PageHead
        title="Lịch sử hoạt động"
        description="Xem các hoạt động đã được ghi nhận của người bạn chăm sóc."
      />
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(String(new FormData(e.currentTarget).get('search') || '').trim());
            setPage(1);
            setSelected('');
          }}
        >
          <label className="field">
            Tìm người được chăm sóc
            <input name="search" />
          </label>
          <button className="btn">Tìm kiếm</button>
          <button
            type="button"
            className="btn"
            disabled={users.isFetching}
            onClick={() => void users.refetch()}
          >
            Tải lại người dùng
          </button>
        </form>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          <label className="field">
            Người được chăm sóc
            <select value={person?.id || ''} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Chọn người được chăm sóc</option>
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
                {users.data.totalCount} người · Trang {page}/{Math.max(1, users.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={!users.data.hasPreviousPage || users.isFetching}
                onClick={() => {
                  setPage(page - 1);
                  setSelected('');
                }}
              >
                Trang trước
              </button>
              <button
                className="btn"
                disabled={!users.data.hasNextPage || users.isFetching}
                onClick={() => {
                  setPage(page + 1);
                  setSelected('');
                }}
              >
                Trang sau
              </button>
            </div>
          )}
          {!users.data?.items.length && <p>Chưa có người được chăm sóc phù hợp.</p>}
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

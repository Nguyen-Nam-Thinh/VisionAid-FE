import { RefreshCw } from 'lucide-react';
import { t, msg, labelMap, formatLocaleDateTime } from '../../i18n';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import {
  emergenciesApi,
  alertLabels,
  actionLabels,
  alertActions,
  overdueAlerts,
  type AlertAction,
  type AlertFilters,
  type Escalation,
} from '../../services/api/emergencies';
import {
  historyRange,
  locationsApi,
  boundaryEventTypes,
  type BoundaryFilters,
} from '../../services/api/locations';
import { caregivingApi } from '../../services/api/caregiving';
import { PageHead, State, Dialog, Confirm } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import { SearchPicker } from '../../components/SearchPicker';
import { searchCareRecipients } from '../../services/api/pickers';
import { useNow } from '../../hooks/useNow';
import { onSessionEnded } from '../../services/sessionLifecycle';
import type { Person } from '../../models/domain';
const time = (value: string) => formatLocaleDateTime(value);
const methods: Record<string, string> = labelMap({
  AccelerometerCamera: msg('Cảm biến / camera'),
  Manual: msg('Thủ công'),
  VoiceCommand: msg('Giọng nói'),
  Gesture: msg('Cử chỉ'),
});
const boundaryLabels: Record<string, string> = labelMap({
  Entered: msg('Đi vào vùng an toàn'),
  Exited: msg('Ra khỏi vùng an toàn'),
  Arrived: msg('Đến địa điểm đã lưu'),
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
  const cache = useQueryClient();
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [viu, setViu] = useState('');
  // Alerts only carry the VIU id; show the care recipient's name when it is in the first page.
  const recipients = useQuery({
    queryKey: ['alert-recipients', actor.id, actor.orgId],
    queryFn: ({ signal }) => caregivingApi.users(1, '', signal),
    retry: false,
  });
  const nameOf = (id: string) =>
    recipients.data?.items.find((person) => person.id === id)?.fullName ?? id;
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
          'Cảnh báo của người bạn được phép theo dõi, tự cập nhật theo thời gian thực.',
        )}
      />
      <EscalationBanner actor={actor} open={setSelected} />
      <section className="glass card stack">
        <FilterPanel
          active={
            [filters.viuId, filters.status, filters.dateFrom, filters.dateTo].filter(Boolean).length
          }
          submitLabel={t('Lọc cảnh báo')}
          onApply={(form) => {
            const data = new FormData(form);
            try {
              const range = historyRange(String(data.get('from')), String(data.get('to')));
              setFilters({ ...range, viuId: viu, status: String(data.get('status')), page: 1 });
              setSelected('');
              setError('');
            } catch (err) {
              setError((err as Error).message);
            }
          }}
          onReset={() => {
            setViu('');
            setFilters({ viuId: '', status: '', dateFrom: '', dateTo: '', page: 1 });
            setSelected('');
            setError('');
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={query.isFetching}
              onClick={() =>
                void cache.invalidateQueries({ queryKey: ['api-alerts', actor.id, actor.orgId] })
              }
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại cảnh báo')}
            </button>
          }
        >
          <SearchPicker
            label={t('Người được chăm sóc')}
            placeholder={t('Gõ tên hoặc email')}
            value={viu}
            onChange={setViu}
            search={searchCareRecipients()}
            queryKey={['alert-viu', actor.id, actor.orgId]}
          />
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
          <div className="filter-range wide">
            <label className="field">
              {t('Từ thời gian')}
              <input name="from" type="datetime-local" />
            </label>
            <label className="field">
              {t('Đến thời gian')}
              <input name="to" type="datetime-local" />
            </label>
          </div>
        </FilterPanel>
        <small>
          {t('Thời gian theo {timeZone}.', {
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
                      <th>{t('Người được chăm sóc')}</th>
                      <th>{t('Phát hiện')}</th>
                      <th>{t('Trạng thái')}</th>
                      <th>{t('Thời gian')}</th>
                      <th>{t('Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((event) => (
                      <tr key={event.id}>
                        <td>{nameOf(event.visuallyImpairedUserId)}</td>
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
      <BoundaryAlerts actor={actor} />
    </>
  );
}
// FE-18 / WF-05: geofence entries/exits and saved-place arrivals are read-only history of one
// VIU (the API needs viuId). SignalR GeofenceBreach refreshes the 'api-boundary-events' query.
function BoundaryAlerts({ actor }: { actor: Person }) {
  const [viu, setViu] = useState('');
  const [viuId, setViuId] = useState('');
  const [filters, setFilters] = useState<BoundaryFilters>({
    eventType: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['api-boundary-events', actor.id, actor.orgId, viuId, filters],
    queryFn: ({ signal }) => locationsApi.boundaryEvents(actor, viuId, filters, signal),
    enabled: Boolean(viuId),
    refetchInterval: 30000,
    retry: false,
  });
  return (
    <section className="glass card stack" aria-labelledby="boundary-alerts-title">
      <h2 id="boundary-alerts-title">{t('Cảnh báo vùng an toàn')}</h2>
      <FilterPanel
        active={[viuId, filters.eventType, filters.dateFrom, filters.dateTo].filter(Boolean).length}
        submitLabel={t('Xem sự kiện vùng')}
        onApply={(form) => {
          const data = new FormData(form);
          if (!viu) {
            setError(t('Chọn người được chăm sóc trước.'));
            return;
          }
          try {
            const range = historyRange(String(data.get('from')), String(data.get('to')));
            const type = String(data.get('eventType'));
            setFilters({
              ...range,
              eventType: boundaryEventTypes.find((v) => v === type) ?? '',
              page: 1,
            });
            setViuId(viu);
            setError('');
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        onReset={() => {
          setViu('');
          setViuId('');
          setFilters({ eventType: '', dateFrom: '', dateTo: '', page: 1 });
          setError('');
        }}
      >
        <SearchPicker
          label={t('Người được chăm sóc')}
          placeholder={t('Gõ tên hoặc email')}
          value={viu}
          onChange={setViu}
          search={searchCareRecipients()}
          queryKey={['boundary-viu', actor.id, actor.orgId]}
        />
        <label className="field">
          {t('Loại sự kiện')}
          <select name="eventType">
            <option value="">{t('Tất cả')}</option>
            {boundaryEventTypes.map((v) => (
              <option key={v} value={v}>
                {boundaryLabels[v]}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-range wide">
          <label className="field">
            {t('Từ thời gian')}
            <input name="from" type="datetime-local" />
          </label>
          <label className="field">
            {t('Đến thời gian')}
            <input name="to" type="datetime-local" />
          </label>
        </div>
      </FilterPanel>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {!viuId ? (
        <p>{t('Chưa chọn người được chăm sóc.')}</p>
      ) : (
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {query.data && (
            <>
              {!query.data.items.length && <p>{t('Không có sự kiện vùng an toàn phù hợp.')}</p>}
              {query.data.items.length > 0 && (
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label={t('Danh sách sự kiện vùng an toàn')}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>{t('Sự kiện')}</th>
                        <th>{t('Vùng / địa điểm')}</th>
                        <th>{t('Đã gửi cảnh báo')}</th>
                        <th>{t('Vị trí')}</th>
                        <th>{t('Thời gian')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {query.data.items.map((event) => (
                        <tr key={event.id}>
                          <td>
                            <strong>{boundaryLabels[event.eventType]}</strong>
                          </td>
                          <td>
                            {event.geofenceName ??
                              event.savedLocationName ??
                              t('Vùng hoặc địa điểm đã bị xóa')}
                          </td>
                          <td>{event.alertSent ? t('Đã gửi') : t('Không gửi')}</td>
                          <td>
                            {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                          </td>
                          <td>{time(event.occurredAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="row pagination">
                <span>
                  {t('{totalCount} sự kiện · Trang {page}/{p4}', {
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
      )}
    </section>
  );
}
// BR-29 / UC-132: alerts still Sent after 5 minutes. SignalR EscalationSuggestion (every minute)
// refreshes this 'api-alerts' query; the Web only suggests and never calls or escalates by itself.
function EscalationBanner({ actor, open }: { actor: Person; open: (id: string) => void }) {
  const now = useNow();
  const sent = useQuery({
    queryKey: ['api-alerts', actor.id, actor.orgId, 'escalation-suggestion'],
    queryFn: ({ signal }) =>
      emergenciesApi.list(
        actor,
        { viuId: '', status: 'Sent', dateFrom: '', dateTo: '', page: 1 },
        signal,
      ),
    refetchInterval: 30000,
    retry: false,
  });
  const overdue = sent.data ? overdueAlerts(sent.data.items, now) : [];
  // Events carry only the VIU id; resolve names from the caregiver's linked VIUs (BE-scoped list).
  const names = useQuery({
    queryKey: ['api-alert-viu-names', actor.id, actor.orgId],
    queryFn: async ({ signal }) => {
      const map: Record<string, string> = {};
      for (let page = 1; page <= 5; page++) {
        const result = await caregivingApi.users(page, '', signal);
        for (const user of result.items) map[user.id] = user.fullName;
        if (!result.hasNextPage) break;
      }
      return map;
    },
    enabled: overdue.length > 0,
    staleTime: 5 * 60000,
    retry: false,
  });
  if (!overdue.length) return null;
  return (
    <section
      className="glass card stack escalation-banner"
      aria-labelledby="escalation-banner-title"
    >
      <h2 id="escalation-banner-title">{t('Gợi ý chuyển cấp lên 115')}</h2>
      {/* Only the count is announced, so the minute counter does not re-read every tick. */}
      <p role="status">
        {t('{count} cảnh báo chưa có ai tiếp nhận sau hơn 5 phút.', { count: overdue.length })}
      </p>
      <ul className="stack">
        {overdue.map(({ event, minutes }) => (
          <li key={event.id} className="row between">
            <span>
              <strong>
                {t('Chưa có ai tiếp nhận sau {minutes} phút — cân nhắc gọi 115.', { minutes })}
              </strong>{' '}
              {t('{viu} · gửi lúc {time}', {
                viu: names.data?.[event.visuallyImpairedUserId] ?? t('Một người được chăm sóc'),
                time: time(event.sentAt!),
              })}
            </span>
            <button className="btn danger" onClick={() => open(event.id)}>
              {t('Xem và chuyển cấp')}
            </button>
          </li>
        ))}
      </ul>
      {sent.data?.hasNextPage && (
        <small>{t('Còn cảnh báo Đã gửi khác; lọc theo trạng thái Đã gửi để xem đủ.')}</small>
      )}
      <div className="row">
        <a className="btn" href="tel:115">
          {t('Mở trình gọi 115')}
        </a>
        <small>
          {t(
            'Mở trình gọi không xác nhận cuộc gọi đã diễn ra. Web không tự gọi hoặc tự chuyển trạng thái “Đã gọi”.',
          )}
        </small>
      </div>
    </section>
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
                <AlertSnapshot
                  actor={actor}
                  id={event.id}
                  hasSnapshot={!!event.snapshotPath}
                  canView={permission.data}
                />
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

/** WF-01: scene photo taken by Mobile when the alert fired. Loaded with auth as a blob, never a raw URL. */
function AlertSnapshot({
  actor,
  id,
  hasSnapshot,
  canView,
}: {
  actor: Person;
  id: string;
  hasSnapshot: boolean;
  /** BE serves the photo only to caregivers allowed to handle the alert; undefined while checking. */
  canView: boolean | undefined;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const enabled = hasSnapshot && emergenciesApi.snapshotReady && canView === true;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let objectUrl = '';
    const clean = () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    const off = onSessionEnded(() => {
      clean();
      setUrl('');
    });
    void emergenciesApi
      .snapshot(actor, id, controller.signal)
      .then((blob) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : t('Không tải được ảnh.'));
      });
    return () => {
      off();
      clean();
    };
  }, [actor, id, enabled, attempt]);
  let body;
  if (!hasSnapshot) body = <p>{t('Không có ảnh chụp sự kiện.')}</p>;
  else if (!emergenciesApi.snapshotReady)
    body = (
      <p>
        {t(
          'Sự kiện này có ảnh hiện trường. Ảnh sẽ xem được tại đây khi máy chủ mở chức năng tải ảnh.',
        )}
      </p>
    );
  else if (canView === undefined) body = <p role="status">{t('Đang kiểm tra quyền xem ảnh…')}</p>;
  else if (!canView)
    body = <p>{t('Chỉ người có quyền nhận và xử lý cảnh báo mới xem được ảnh hiện trường.')}</p>;
  else if (error)
    body = (
      <div role="alert">
        <p>{error}</p>
        <button
          className="btn small"
          onClick={() => {
            setUrl('');
            setError('');
            setAttempt(attempt + 1);
          }}
        >
          {t('Thử tải ảnh lại')}
        </button>
      </div>
    );
  else if (url)
    body = (
      <a href={url} target="_blank" rel="noreferrer" className="alert-snapshot">
        <img
          src={url}
          alt={t('Ảnh hiện trường lúc phát hiện cảnh báo')}
          onError={() => setError(t('Ảnh không thể hiển thị.'))}
        />
        <span>{t('Mở ảnh cỡ lớn')}</span>
      </a>
    );
  else body = <p role="status">{t('Đang tải ảnh…')}</p>;
  return (
    <section className="stack" aria-label={t('Ảnh hiện trường')}>
      <h3>{t('Ảnh hiện trường')}</h3>
      {body}
    </section>
  );
}

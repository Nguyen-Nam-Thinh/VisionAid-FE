import { t, msg, labelMap, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import * as AnimatedTabs from '@animate-ui/react/primitives/radix-ui/tabs';
import { FilterPanel } from '../../components/FilterPanel';
import { Badge, State } from '../../components/UI';
import {
  activityApi,
  activityDateRange,
  engineLabels,
  mapLink,
  timelineTypeLabels,
  timelineTypes,
} from '../../services/api/activity';
import type { HistoryRange } from '../../services/api/locations';
import type { Person } from '../../models/domain';

const decisionLabels: Record<string, string> = labelMap({
  STOP: msg('Dừng lại'),
  TURN_LEFT: msg('Rẽ trái'),
  TURN_RIGHT: msg('Rẽ phải'),
  PROCEED: msg('Tiếp tục'),
});

function Place({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const href = mapLink(latitude, longitude);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {t('Xem bản đồ')}
    </a>
  ) : (
    <>—</>
  );
}

function Pages({
  page,
  pages,
  total,
  busy,
  previous,
  next,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  busy: boolean;
  previous: boolean;
  next: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="row pagination">
      <span>
        {t('{totalCount} kết quả · Trang {page}/{p4}', {
          totalCount: total,
          page,
          p4: Math.max(1, pages),
        })}
      </span>
      <button className="btn" disabled={busy || !previous} onClick={() => onPage(page - 1)}>
        {t('Trang trước')}
      </button>
      <button className="btn" disabled={busy || !next} onClick={() => onPage(page + 1)}>
        {t('Trang sau')}
      </button>
    </div>
  );
}

/**
 * Traceability for one care recipient: every activity on one timeline (with what the app said and
 * where), and every guidance sentence, whether the server or the phone decided it.
 */
export function ActivityTimeline({
  actor,
  viuId,
  name,
}: {
  actor: Person;
  viuId: string;
  name: string;
}) {
  const [range, setRange] = useState<HistoryRange>({ dateFrom: '', dateTo: '' });
  const [types, setTypes] = useState<string[]>([]);
  const [error, setError] = useState('');
  return (
    <section className="glass card stack" aria-labelledby="timeline-title">
      <h2 id="timeline-title">{t('Truy vết hoạt động của {name}', { name })}</h2>
      <FilterPanel
        active={[range.dateFrom, range.dateTo, types.length ? 'x' : ''].filter(Boolean).length}
        submitLabel={t('Lọc lịch sử')}
        onApply={(form) => {
          const fields = new FormData(form);
          try {
            setRange(
              activityDateRange(String(fields.get('from') || ''), String(fields.get('to') || '')),
            );
            const type = String(fields.get('type') || '');
            setTypes(type ? [type] : []);
            setError('');
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        onReset={() => {
          setRange({ dateFrom: '', dateTo: '' });
          setTypes([]);
          setError('');
        }}
      >
        <label className="field">
          {t('Loại hoạt động')}
          <select name="type" defaultValue={types[0] ?? ''}>
            <option value="">{t('Tất cả hoạt động')}</option>
            {timelineTypes.map((type) => (
              <option key={type} value={type}>
                {timelineTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
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
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <AnimatedTabs.Root defaultValue="timeline" className="stack trace-tabs">
        <AnimatedTabs.List className="tabs-list" aria-label={t('Cách xem')}>
          <AnimatedTabs.Trigger value="timeline" className="tabs-trigger">
            {t('Dòng thời gian')}
          </AnimatedTabs.Trigger>
          <AnimatedTabs.Trigger value="guidance" className="tabs-trigger">
            {t('Hướng dẫn dẫn đường')}
          </AnimatedTabs.Trigger>
        </AnimatedTabs.List>
        <AnimatedTabs.Content value="timeline">
          <Timeline
            key={JSON.stringify([range, types])}
            actor={actor}
            viuId={viuId}
            range={range}
            types={types}
          />
        </AnimatedTabs.Content>
        <AnimatedTabs.Content value="guidance">
          <Guidance key={JSON.stringify(range)} actor={actor} viuId={viuId} range={range} />
        </AnimatedTabs.Content>
      </AnimatedTabs.Root>
    </section>
  );
}

function Timeline({
  actor,
  viuId,
  range,
  types,
}: {
  actor: Person;
  viuId: string;
  range: HistoryRange;
  types: string[];
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['api-activity-timeline', actor.id, actor.orgId, viuId, range, types, page],
    queryFn: ({ signal }) => activityApi.timeline(actor, viuId, page, range, types, signal),
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: 30000,
  });
  const data = query.data;
  return (
    <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
      <div className="row">
        <button className="btn small" disabled={query.isFetching} onClick={() => query.refetch()}>
          <RefreshCw size={16} aria-hidden="true" />
          {t('Tải lại')}
        </button>
      </div>
      {data && (
        <div className="table-scroll" role="region" aria-label={t('Dòng thời gian')} tabIndex={0}>
          <table style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th scope="col">{t('Thời gian')}</th>
                <th scope="col">{t('Hoạt động')}</th>
                <th scope="col">{t('Chi tiết')}</th>
                <th scope="col">{t('Kết quả')}</th>
                <th scope="col">{t('Câu đã đọc')}</th>
                <th scope="col">{t('Vị trí')}</th>
                <th scope="col">{t('Người xử lý')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.activityType + item.sourceId}>
                  <td>{formatLocaleDateTime(item.occurredAt)}</td>
                  <td>{timelineTypeLabels[item.activityType] ?? item.activityLabel}</td>
                  <td>{item.detail || '—'}</td>
                  <td>{item.result || '—'}</td>
                  <td>{item.spokenText || '—'}</td>
                  <td>
                    <Place latitude={item.latitude} longitude={item.longitude} />
                  </td>
                  <td>{item.actorName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && <p className="empty">{t('Chưa có hoạt động phù hợp.')}</p>}
        </div>
      )}
      {data && (
        <Pages
          page={data.page}
          pages={data.totalPages}
          total={data.totalCount}
          busy={query.isFetching}
          previous={data.hasPreviousPage}
          next={data.hasNextPage}
          onPage={setPage}
        />
      )}
    </State>
  );
}

function Guidance({ actor, viuId, range }: { actor: Person; viuId: string; range: HistoryRange }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['api-activity-guidance', actor.id, actor.orgId, viuId, range, page],
    queryFn: ({ signal }) => activityApi.guidance(actor, viuId, page, range, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const data = query.data;
  return (
    <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
      <p>
        {t(
          'Mỗi dòng là một quyết định dẫn đường. "Điện thoại tự quyết định" là khi máy chủ chậm, mất mạng hoặc chưa có phiên; câu đã đọc trống nghĩa là ứng dụng không nói gì.',
        )}
      </p>
      {data && (
        <div
          className="table-scroll"
          role="region"
          aria-label={t('Hướng dẫn dẫn đường')}
          tabIndex={0}
        >
          <table style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th scope="col">{t('Thời gian')}</th>
                <th scope="col">{t('Quyết định')}</th>
                <th scope="col">{t('Nơi quyết định')}</th>
                <th scope="col">{t('Câu đã đọc')}</th>
                <th scope="col">{t('Vị trí')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>{formatLocaleDateTime(item.spokenAt ?? item.createdAt)}</td>
                  <td>{decisionLabels[item.decision] ?? item.decision}</td>
                  <td>
                    <Badge tone={item.engineUsed === 'OnDeviceRules' ? 'amber' : 'blue'}>
                      {engineLabels[item.engineUsed] ?? item.engineUsed}
                    </Badge>
                  </td>
                  <td>{item.spokenText || t('Không nói gì')}</td>
                  <td>
                    <Place latitude={item.latitude} longitude={item.longitude} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && (
            <p className="empty">{t('Chưa có hướng dẫn dẫn đường được ghi nhận.')}</p>
          )}
        </div>
      )}
      {data && (
        <Pages
          page={data.page}
          pages={data.totalPages}
          total={data.totalCount}
          busy={query.isFetching}
          previous={data.hasPreviousPage}
          next={data.hasNextPage}
          onPage={setPage}
        />
      )}
    </State>
  );
}

import { t, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useSession } from '../../hooks/useService';
import { Badge, PageHead, State } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import { SearchPicker } from '../../components/SearchPicker';
import { searchAccounts, searchCareRecipients } from '../../services/api/pickers';
import {
  deliveryChannelLabels,
  deliveryStatusLabels,
  inboxApi,
  inboxTypeLabels,
  inboxTypes,
  parseDelivery,
  type InboxFilters,
  type InboxItem,
} from '../../services/api/inbox';
import type { Person } from '../../models/domain';

/** Topbar bell: unread notices of the signed-in user, refreshed by polling and SignalR alerts. */
export function InboxBell({ actor }: { actor: Person }) {
  const count = useQuery({
    queryKey: ['api-inbox-unread', actor.id, actor.orgId],
    queryFn: ({ signal }) => inboxApi.unreadCount(undefined, signal),
    refetchInterval: 45000,
    retry: false,
  });
  const unread = count.data ?? 0;
  return (
    <Link
      to="/inbox"
      className="btn inbox-bell"
      aria-label={unread ? t('Thông báo, {count} chưa đọc', { count: unread }) : t('Thông báo')}
    >
      <Bell size={18} aria-hidden="true" />
      {unread > 0 && (
        <span className="inbox-bell-count" aria-hidden="true">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}

export function ApiInbox() {
  const { data: actor } = useSession();
  return actor ? <Inbox key={actor.id + actor.orgId} actor={actor} /> : null;
}

function Inbox({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InboxFilters>({ page: 1 });
  const [viu, setViu] = useState('');
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['api-inbox', actor.id, actor.orgId, filters],
    queryFn: ({ signal }) => inboxApi.list(filters, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 45000,
    retry: false,
  });
  const refresh = () =>
    cache.invalidateQueries({
      predicate: (q) =>
        ['api-inbox', 'api-inbox-unread'].includes(String(q.queryKey[0])) &&
        q.queryKey[1] === actor.id,
    });
  const caregiver = actor.role === 'Caregiver';
  // Only caregivers have the alerts page to open; other roles read the notice here.
  const target = (item: InboxItem) =>
    !caregiver
      ? null
      : item.emergencyEventId
        ? '/caregiver/alerts?event=' + item.emergencyEventId
        : item.locationBoundaryEventId
          ? '/caregiver/alerts?tab=boundary'
          : null;
  const open = async (item: InboxItem) => {
    setNotice('');
    try {
      if (!item.readAt) await inboxApi.markRead(item);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('Không thể thực hiện.'));
    }
    await refresh();
    const to = target(item);
    if (to) navigate(to);
  };
  const data = query.data;
  return (
    <>
      <PageHead
        title={t('Hộp thư thông báo')}
        description={t(
          'Mọi thông báo đã gửi cho bạn. Mỗi thông báo là một mục, gộp chung các kênh Push, Email và Realtime.',
        )}
      />
      <section className="glass card stack">
        <FilterPanel
          active={Object.entries(filters).filter(([key, value]) => key !== 'page' && value).length}
          submitLabel={t('Lọc thông báo')}
          onReset={() => {
            setViu('');
            setFilters({ page: 1 });
          }}
          tools={
            <>
              <button
                className="btn"
                type="button"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                <RefreshCw size={16} aria-hidden="true" />
                {t('Tải lại')}
              </button>
              <button
                className="btn"
                type="button"
                onClick={async () => {
                  setNotice('');
                  try {
                    const count = await inboxApi.markAllRead(filters.viuId);
                    setNotice(t('Đã đánh dấu {count} thông báo là đã xem.', { count }));
                  } catch (error) {
                    setNotice(error instanceof Error ? error.message : t('Không thể thực hiện.'));
                  }
                  await refresh();
                }}
              >
                <CheckCheck size={16} aria-hidden="true" />
                {t('Đánh dấu tất cả đã xem')}
              </button>
            </>
          }
          onApply={(form) => {
            const values = new FormData(form);
            setFilters({
              page: 1,
              viuId: viu,
              type: String(values.get('type') || ''),
              from: String(values.get('from') || ''),
              to: String(values.get('to') || ''),
              unreadOnly: values.get('unreadOnly') === 'on',
            });
          }}
        >
          {actor.role !== 'VisuallyImpaired' && (
            <SearchPicker
              wide
              label={t('Người được chăm sóc')}
              value={viu}
              onChange={setViu}
              search={
                caregiver ? searchCareRecipients() : searchAccounts(actor, 'VisuallyImpaired')
              }
              queryKey={['inbox-viu', actor.id, actor.orgId]}
            />
          )}
          <label className="field">
            {t('Loại thông báo')}
            <select name="type" defaultValue={filters.type ?? ''}>
              <option value="">{t('Tất cả loại')}</option>
              {inboxTypes.map((type) => (
                <option key={type} value={type}>
                  {inboxTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t('Đã xem')}
            <select name="unreadOnly" defaultValue={filters.unreadOnly ? 'on' : ''}>
              <option value="">{t('Tất cả thông báo')}</option>
              <option value="on">{t('Chỉ thông báo chưa xem')}</option>
            </select>
          </label>
          <div className="filter-range wide">
            <label className="field">
              {t('Từ ngày Việt Nam')}
              <input type="date" name="from" defaultValue={filters.from} />
            </label>
            <label className="field">
              {t('Đến ngày Việt Nam')}
              <input type="date" name="to" defaultValue={filters.to} />
            </label>
          </div>
        </FilterPanel>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {data && !data.items.length && (
            <div className="table-scroll">
              <p className="empty">{t('Không có thông báo phù hợp.')}</p>
            </div>
          )}
          {data && data.items.length > 0 && (
            <ul className="inbox-list">
              {data.items.map((item) => {
                const to = target(item);
                return (
                  <li key={item.id} className={item.readAt ? 'inbox-item' : 'inbox-item unread'}>
                    <div className="inbox-item-head">
                      <strong>
                        {item.title ||
                          inboxTypeLabels[item.notificationType] ||
                          item.notificationType}
                      </strong>
                      {!item.readAt && <Badge tone="amber">{t('Chưa xem')}</Badge>}
                    </div>
                    {item.body && <p>{item.body}</p>}
                    <p className="muted inbox-item-meta">
                      <span>{inboxTypeLabels[item.notificationType] ?? item.notificationType}</span>
                      {item.visuallyImpairedUserName && (
                        <span>{item.visuallyImpairedUserName}</span>
                      )}
                      <time dateTime={item.createdAt}>{formatLocaleDateTime(item.createdAt)}</time>
                      {item.readAt && (
                        <span>
                          {t('Đã xem lúc {time}', { time: formatLocaleDateTime(item.readAt) })}
                        </span>
                      )}
                    </p>
                    <div className="row inbox-item-actions">
                      {item.deliveries.map((value) => {
                        const { channel, status } = parseDelivery(value);
                        return (
                          <Badge
                            key={value}
                            tone={
                              status === 'Sent' ? 'green' : status === 'Failed' ? 'red' : 'gray'
                            }
                          >
                            {(deliveryChannelLabels[channel] ?? channel) +
                              ' · ' +
                              (deliveryStatusLabels[status] ?? status)}
                          </Badge>
                        );
                      })}
                      {to ? (
                        <button className="btn small" onClick={() => void open(item)}>
                          {t('Mở chi tiết')}
                        </button>
                      ) : (
                        !item.readAt && (
                          <button className="btn small" onClick={() => void open(item)}>
                            {t('Đánh dấu đã xem')}
                          </button>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {data && (
            <footer className="pagination">
              <span>
                {t('{length} kết quả · Trang {current}/{pages}', {
                  length: data.totalCount,
                  current: data.page,
                  pages: Math.max(1, data.totalPages),
                })}
              </span>
              <div className="row">
                <button
                  className="btn small"
                  disabled={!data.hasPreviousPage || query.isFetching}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
                >
                  {t('Trang trước')}
                </button>
                <button
                  className="btn small"
                  disabled={!data.hasNextPage || query.isFetching}
                  onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
                >
                  {t('Trang sau')}
                </button>
              </div>
            </footer>
          )}
        </State>
      </section>
    </>
  );
}

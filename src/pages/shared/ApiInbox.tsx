import { t, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, ChevronRight, RefreshCw } from 'lucide-react';
import * as DropdownMenu from '@animate-ui/react/primitives/radix-ui/dropdown-menu';
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

/** Where a notice opens. Only caregivers have the alerts page; other roles read it in the inbox. */
function inboxTarget(actor: Person, item: InboxItem) {
  if (actor.role !== 'Caregiver') return null;
  if (item.emergencyEventId) return '/caregiver/alerts?event=' + item.emergencyEventId;
  if (item.locationBoundaryEventId) return '/caregiver/alerts?tab=boundary';
  return null;
}
const noticeTitle = (item: InboxItem) =>
  item.title || inboxTypeLabels[item.notificationType] || item.notificationType;

/** Mark-read actions shared by the bell and the inbox page; both refresh the same queries. */
function useInboxActions(actor: Person) {
  const cache = useQueryClient();
  const refresh = () =>
    cache.invalidateQueries({
      predicate: (q) =>
        ['api-inbox', 'api-inbox-unread', 'api-inbox-latest'].includes(String(q.queryKey[0])) &&
        q.queryKey[1] === actor.id,
    });
  return {
    refresh,
    async markRead(item: InboxItem) {
      if (!item.readAt) await inboxApi.markRead(item);
      await refresh();
    },
    async markAll(viuId?: string) {
      const count = await inboxApi.markAllRead(viuId);
      await refresh();
      return count;
    },
  };
}

/**
 * Topbar bell: unread count and the latest notices in a dropdown. A notice opens its alert (and is
 * marked read); "Xem tất cả" goes to the inbox page.
 */
export function InboxBell({ actor }: { actor: Person }) {
  const navigate = useNavigate();
  const actions = useInboxActions(actor);
  const [open, setOpen] = useState(false);
  const count = useQuery({
    queryKey: ['api-inbox-unread', actor.id, actor.orgId],
    queryFn: ({ signal }) => inboxApi.unreadCount(undefined, signal),
    refetchInterval: 45000,
    retry: false,
  });
  const latest = useQuery({
    queryKey: ['api-inbox-latest', actor.id, actor.orgId],
    queryFn: ({ signal }) => inboxApi.list({ page: 1 }, signal),
    enabled: open,
    retry: false,
  });
  const unread = count.data ?? 0;
  const items = latest.data?.items.slice(0, 6) ?? [];
  return (
    <DropdownMenu.Root modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger
        className="btn inbox-bell"
        aria-label={unread ? t('Thông báo, {count} chưa đọc', { count: unread }) : t('Thông báo')}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && (
          <span className="inbox-bell-count" aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="account-menu inbox-menu" align="end" sideOffset={8}>
          <div className="inbox-menu-head">
            <strong>{t('Thông báo')}</strong>
            <span className="muted">
              {unread ? t('{count} chưa xem', { count: unread }) : t('Đã xem hết')}
            </span>
          </div>
          {latest.isPending ? (
            <p className="inbox-menu-empty" role="status">
              {t('Đang tải dữ liệu…')}
            </p>
          ) : latest.isError ? (
            <p className="inbox-menu-empty" role="alert">
              {t('Không tải được thông báo.')}
            </p>
          ) : !items.length ? (
            <p className="inbox-menu-empty">{t('Chưa có thông báo nào.')}</p>
          ) : (
            items.map((item) => (
              <DropdownMenu.Item
                key={item.id}
                className={'inbox-menu-item' + (item.readAt ? '' : ' unread')}
                onSelect={async () => {
                  await actions.markRead(item).catch(() => {});
                  navigate(inboxTarget(actor, item) ?? '/inbox');
                }}
              >
                <span className="inbox-menu-dot" aria-hidden="true" />
                <span className="inbox-menu-text">
                  <span className="inbox-menu-title">{noticeTitle(item)}</span>
                  <small className="muted">
                    {[item.visuallyImpairedUserName, formatLocaleDateTime(item.createdAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </span>
                {!item.readAt && <span className="sr-only">{t('Chưa xem')}</span>}
              </DropdownMenu.Item>
            ))
          )}
          <div className="inbox-menu-foot">
            <DropdownMenu.Item
              className="inbox-menu-action"
              disabled={!unread}
              onSelect={async (event) => {
                // Stay open so the list turns read in place.
                event.preventDefault();
                await actions.markAll().catch(() => {});
              }}
            >
              <CheckCheck size={16} aria-hidden="true" />
              {t('Đánh dấu tất cả đã xem')}
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild className="inbox-menu-action">
              <Link to="/inbox">
                {t('Xem tất cả')}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function ApiInbox() {
  const { data: actor } = useSession();
  return actor ? <Inbox key={actor.id + actor.orgId} actor={actor} /> : null;
}

function Inbox({ actor }: { actor: Person }) {
  const navigate = useNavigate();
  const actions = useInboxActions(actor);
  const [filters, setFilters] = useState<InboxFilters>({ page: 1 });
  const [viu, setViu] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const query = useQuery({
    queryKey: ['api-inbox', actor.id, actor.orgId, filters],
    queryFn: ({ signal }) => inboxApi.list(filters, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 45000,
    retry: false,
  });
  // Unread count for the person being filtered (or all), so "mark all" says what it will do.
  const unread = useQuery({
    queryKey: ['api-inbox-unread', actor.id, actor.orgId, filters.viuId ?? ''],
    queryFn: ({ signal }) => inboxApi.unreadCount(filters.viuId || undefined, signal),
    refetchInterval: 45000,
    retry: false,
  });
  const unreadCount = unread.data ?? 0;
  const caregiver = actor.role === 'Caregiver';
  const run = async (key: string, task: () => Promise<unknown>) => {
    setNotice('');
    setBusy(key);
    try {
      await task();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('Không thể thực hiện.'));
    } finally {
      setBusy('');
    }
  };
  const data = query.data;
  return (
    <>
      <PageHead
        title={t('Hộp thư thông báo')}
        description={t(
          'Mọi thông báo đã gửi cho bạn. Một thông báo gửi qua nhiều cách (ứng dụng, email, trên web) chỉ hiện thành một mục.',
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
            <button
              className="btn"
              type="button"
              disabled={query.isFetching}
              onClick={() => void actions.refresh()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại')}
            </button>
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
              {t('Từ ngày')}
              <input type="date" name="from" defaultValue={filters.from} />
            </label>
            <label className="field">
              {t('Đến ngày')}
              <input type="date" name="to" defaultValue={filters.to} />
            </label>
          </div>
        </FilterPanel>
        <div className="inbox-summary">
          <p>
            {unreadCount
              ? filters.viuId
                ? t('{count} thông báo chưa xem của người đang lọc.', { count: unreadCount })
                : t('{count} thông báo chưa xem.', { count: unreadCount })
              : t('Bạn đã xem hết thông báo.')}
          </p>
          <button
            className="btn"
            type="button"
            disabled={!unreadCount || busy === 'all'}
            onClick={() =>
              void run('all', async () => {
                const count = await actions.markAll(filters.viuId || undefined);
                setNotice(t('Đã đánh dấu {count} thông báo là đã xem.', { count }));
              })
            }
          >
            <CheckCheck size={16} aria-hidden="true" />
            {busy === 'all' ? t('Đang xử lý…') : t('Đánh dấu tất cả đã xem')}
          </button>
        </div>
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
                const to = inboxTarget(actor, item);
                return (
                  <li key={item.id} className={item.readAt ? 'inbox-item' : 'inbox-item unread'}>
                    <div className="inbox-item-head">
                      <strong>{noticeTitle(item)}</strong>
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
                    <div className="inbox-item-foot">
                      <div className="row inbox-item-channels">
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
                      </div>
                      <div className="row inbox-item-actions">
                        {!item.readAt && (
                          <button
                            className="btn small"
                            disabled={busy === item.id}
                            onClick={() => void run(item.id, () => actions.markRead(item))}
                          >
                            <Check size={16} aria-hidden="true" />
                            {t('Đánh dấu đã xem')}
                          </button>
                        )}
                        {to && (
                          <button
                            className="btn small primary"
                            disabled={busy === item.id}
                            onClick={() =>
                              void run(item.id, async () => {
                                await actions.markRead(item);
                                navigate(to);
                              })
                            }
                          >
                            {t('Mở chi tiết')}
                            <ChevronRight size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
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

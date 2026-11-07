import { t, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useSession } from '../../hooks/useService';
import { Badge, PageHead, State } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import { SearchPicker } from '../../components/SearchPicker';
import { searchAccounts } from '../../services/api/pickers';
import { roles } from '../../constants/labels';
import {
  deliveryChannelLabels,
  deliveryStatusLabels,
  inboxApi,
  inboxTypeLabels,
  inboxTypes,
  type LookupFilters,
} from '../../services/api/inbox';
import type { Person } from '../../models/domain';

/** Super Admin / Center Admin: who was told what about which person, on which channel. */
export function ApiNotificationLookup() {
  const { data: actor } = useSession();
  return actor && (actor.role === 'Admin' || (actor.role === 'CenterAdmin' && actor.orgId)) ? (
    <Lookup key={actor.id + actor.orgId} actor={actor} />
  ) : null;
}

function Lookup({ actor }: { actor: Person }) {
  const [filters, setFilters] = useState<LookupFilters>({ page: 1 });
  const [recipient, setRecipient] = useState('');
  const [viu, setViu] = useState('');
  const query = useQuery({
    queryKey: ['api-notification-lookup', actor.id, actor.orgId, filters],
    queryFn: ({ signal }) => inboxApi.lookup(actor, filters, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const data = query.data;
  return (
    <>
      <PageHead
        title={t('Tra cứu thông báo')}
        description={
          actor.role === 'Admin'
            ? t(
                'Mỗi lần gửi thông báo: người nhận, người được chăm sóc, kênh gửi, trạng thái và thời điểm đã xem.',
              )
            : t('Thông báo gửi cho người nhận hoặc về người được chăm sóc trong trung tâm của bạn.')
        }
      />
      <section className="glass card stack">
        <FilterPanel
          active={Object.entries(filters).filter(([key, value]) => key !== 'page' && value).length}
          submitLabel={t('Lọc thông báo')}
          onReset={() => {
            setRecipient('');
            setViu('');
            setFilters({ page: 1 });
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
            const values = new FormData(form);
            const text = (key: string) => String(values.get(key) || '');
            setFilters({
              page: 1,
              recipientId: recipient,
              viuId: viu,
              type: text('type'),
              channel: text('channel'),
              status: text('status'),
              from: text('from'),
              to: text('to'),
            });
          }}
        >
          <SearchPicker
            label={t('Người nhận')}
            value={recipient}
            onChange={setRecipient}
            search={searchAccounts(actor)}
            queryKey={['lookup-recipient', actor.id, actor.orgId]}
          />
          <SearchPicker
            label={t('Người được chăm sóc')}
            value={viu}
            onChange={setViu}
            search={searchAccounts(actor, 'VisuallyImpaired')}
            queryKey={['lookup-viu', actor.id, actor.orgId]}
          />
          <label className="field">
            {t('Loại thông báo')}
            <select name="type">
              <option value="">{t('Tất cả loại')}</option>
              {inboxTypes.map((type) => (
                <option key={type} value={type}>
                  {inboxTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t('Kênh gửi')}
            <select name="channel">
              <option value="">{t('Tất cả kênh')}</option>
              {Object.entries(deliveryChannelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t('Trạng thái')}
            <select name="status">
              <option value="">{t('Tất cả trạng thái')}</option>
              {Object.entries(deliveryStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-range wide">
            <label className="field">
              {t('Từ ngày Việt Nam')}
              <input type="date" name="from" />
            </label>
            <label className="field">
              {t('Đến ngày Việt Nam')}
              <input type="date" name="to" />
            </label>
          </div>
        </FilterPanel>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {data && (
            <div
              className="table-scroll"
              role="region"
              aria-label={t('Tra cứu thông báo')}
              tabIndex={0}
            >
              <table style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th scope="col">{t('Thời gian')}</th>
                    <th scope="col">{t('Loại thông báo')}</th>
                    <th scope="col">{t('Người nhận')}</th>
                    <th scope="col">{t('Người được chăm sóc')}</th>
                    <th scope="col">{t('Kênh')}</th>
                    <th scope="col">{t('Trạng thái')}</th>
                    <th scope="col">{t('Đã xem')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{formatLocaleDateTime(item.createdAt)}</td>
                      <td>
                        {inboxTypeLabels[item.notificationType] ?? item.notificationType}
                        {item.title && (
                          <>
                            <br />
                            <small>{item.title}</small>
                          </>
                        )}
                      </td>
                      <td>
                        {item.recipientName || t('Không rõ tên')}
                        {item.recipientRole && (
                          <>
                            <br />
                            <small>
                              {roles[item.recipientRole as keyof typeof roles] ??
                                item.recipientRole}
                              {item.caregiverLinkId ? ' · ' + t('qua liên kết chăm sóc') : ''}
                            </small>
                          </>
                        )}
                      </td>
                      <td>{item.visuallyImpairedUserName || '—'}</td>
                      <td>{deliveryChannelLabels[item.channel] ?? item.channel}</td>
                      <td>
                        <Badge
                          tone={
                            item.status === 'Sent'
                              ? 'green'
                              : item.status === 'Failed'
                                ? 'red'
                                : 'amber'
                          }
                        >
                          {deliveryStatusLabels[item.status] ?? item.status}
                        </Badge>
                        {item.status === 'Failed' && item.failureReason && (
                          <>
                            <br />
                            <small>{item.failureReason}</small>
                          </>
                        )}
                      </td>
                      <td>{item.readAt ? formatLocaleDateTime(item.readAt) : t('Chưa xem')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.items.length && <p className="empty">{t('Không có thông báo phù hợp.')}</p>}
            </div>
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

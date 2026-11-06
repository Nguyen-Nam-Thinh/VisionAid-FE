import { RefreshCw } from 'lucide-react';
import { t, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '../../services/api/organizations';
import { alertLabels } from '../../services/api/emergencies';
import { searchOrganizationMembers } from '../../services/api/pickers';
import { State } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import { SearchPicker } from '../../components/SearchPicker';
import type { Person } from '../../models/domain';

const statusLabel = (status: string) =>
  (alertLabels as Record<string, string | undefined>)[status] ?? status;

/**
 * UC-173: alert handling by the organization's caregivers. BE scopes the data: Admin sees any
 * organization, CenterAdmin only their own. Center Admin actions are not part of this log.
 */
export function CaregiverActivityLog({
  actor,
  organizationId,
}: {
  actor: Person;
  organizationId: string;
}) {
  const empty = { caregiverId: '', caregiverName: '', dateFrom: '', dateTo: '' };
  const [filters, setFilters] = useState(empty);
  const [caregiver, setCaregiver] = useState({ id: '', name: '' });
  const [page, setPage] = useState(1);
  const log = useQuery({
    queryKey: [
      'api-caregiver-activity',
      actor.id,
      organizationId,
      filters.caregiverId,
      filters.dateFrom,
      filters.dateTo,
      page,
    ],
    queryFn: ({ signal }) =>
      organizationsApi.caregiverActivity(
        actor,
        organizationId,
        {
          page,
          caregiverId: filters.caregiverId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        signal,
      ),
    retry: false,
    gcTime: 0,
  });
  return (
    <section className="glass card stack">
      <h2>{t('Hoạt động xử lý cảnh báo của người chăm sóc')}</h2>
      <p className="muted">
        {t(
          'Các lần người chăm sóc của trung tâm đổi trạng thái cảnh báo. Thao tác của quản trị trung tâm không nằm trong danh sách này.',
        )}
      </p>
      <FilterPanel
        active={[filters.caregiverId, filters.dateFrom, filters.dateTo].filter(Boolean).length}
        submitLabel={t('Lọc hoạt động')}
        onApply={(form) => {
          const data = new FormData(form);
          setFilters({
            caregiverId: caregiver.id,
            caregiverName: caregiver.name,
            dateFrom: String(data.get('dateFrom') || ''),
            dateTo: String(data.get('dateTo') || ''),
          });
          setPage(1);
        }}
        onReset={() => {
          setCaregiver({ id: '', name: '' });
          setFilters(empty);
          setPage(1);
        }}
        tools={
          <button
            type="button"
            className="btn"
            disabled={log.isFetching}
            onClick={() => void log.refetch()}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('Tải lại hoạt động')}
          </button>
        }
      >
        <SearchPicker
          wide
          label={t('Người chăm sóc')}
          value={caregiver.id}
          onChange={(id, option) => setCaregiver({ id, name: option?.label ?? '' })}
          search={searchOrganizationMembers(actor, organizationId, 'Caregiver')}
          queryKey={['org-caregivers', actor.id, organizationId]}
        />
        <div className="filter-range wide">
          <label className="field">
            {t('Thao tác từ ngày (UTC)')}
            <input type="date" name="dateFrom" defaultValue={filters.dateFrom} />
          </label>
          <label className="field">
            {t('Thao tác đến ngày (UTC)')}
            <input type="date" name="dateTo" defaultValue={filters.dateTo} />
          </label>
        </div>
      </FilterPanel>
      {filters.caregiverName && (
        <p role="status">{t('Đang lọc theo: {name}', { name: filters.caregiverName })}</p>
      )}
      <State loading={log.isPending} error={log.error} retry={() => log.refetch()}>
        <div
          className="table-scroll"
          role="region"
          aria-label={t('Bảng hoạt động xử lý cảnh báo')}
          tabIndex={0}
        >
          <table style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>{t('Thời điểm')}</th>
                <th>{t('Người chăm sóc')}</th>
                <th>{t('Người khiếm thị')}</th>
                <th>{t('Đổi trạng thái')}</th>
                <th>{t('Lý do')}</th>
              </tr>
            </thead>
            <tbody>
              {log.data?.items.map((item) => (
                <tr key={`${item.emergencyEventId}-${item.changedAt}-${item.toStatus}`}>
                  <td>{formatLocaleDateTime(item.changedAt)}</td>
                  <td>
                    <strong>{item.caregiverName}</strong>
                  </td>
                  <td>{item.viuName}</td>
                  <td>
                    {t('{from} → {to}', {
                      from: statusLabel(item.fromStatus),
                      to: statusLabel(item.toStatus),
                    })}
                  </td>
                  <td style={{ overflowWrap: 'anywhere' }}>{item.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!log.data?.items.length && <p className="empty">{t('Chưa có hoạt động phù hợp.')}</p>}
        </div>
        {log.data && (
          <div className="row pagination">
            <span>
              {t('{totalCount} hoạt động · Trang {page}/{pages}', {
                totalCount: log.data.totalCount,
                page,
                pages: Math.max(1, log.data.totalPages),
              })}
            </span>
            {(log.data.totalPages > 1 || page > 1) && (
              <>
                <button
                  className="btn"
                  disabled={log.isFetching || !log.data.hasPreviousPage}
                  onClick={() => setPage(page - 1)}
                >
                  {t('Trang trước')}
                </button>
                <button
                  className="btn"
                  disabled={log.isFetching || !log.data.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  {t('Trang sau')}
                </button>
              </>
            )}
          </div>
        )}
      </State>
    </section>
  );
}

import { t, formatLocaleDateTime, formatNumber } from '../../i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PageHead, State, Badge } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import {
  licensePoolsApi,
  poolStatusLabels,
  type LicensePoolFilters,
} from '../../services/api/licensePools';
import type { Person } from '../../models/domain';

const empty: LicensePoolFilters = { status: '', search: '', expiringWithinDays: '' };

export function ApiLicensePools() {
  const { data: actor } = useSession();
  return actor?.role === 'Admin' ? <Pools key={actor.id} actor={actor} /> : null;
}

function Pools({ actor }: { actor: Person }) {
  const [filters, setFilters] = useState(empty);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['api-license-pools', actor.id, filters, page],
    queryFn: ({ signal }) => licensePoolsApi.list(actor, page, filters, signal),
    retry: false,
  });
  const summary = query.data?.summary;
  const pools = query.data?.pools;
  return (
    <>
      <PageHead
        title={t('Kho license các trung tâm')}
        description={t('Số license đã dùng, còn trống và hạn dùng của từng trung tâm.')}
      />
      <section className="glass card stack">
        <FilterPanel
          active={Object.values(filters).filter(Boolean).length}
          onApply={(form) => {
            const data = new FormData(form);
            setFilters({
              status: String(data.get('status') || ''),
              search: String(data.get('search') || '').trim(),
              expiringWithinDays: String(data.get('expiringWithinDays') || ''),
            });
            setPage(1);
          }}
          onReset={() => {
            setFilters(empty);
            setPage(1);
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t('Tải lại')}
            </button>
          }
        >
          <label className="field wide">
            {t('Tên trung tâm')}
            <input name="search" maxLength={200} placeholder={t('Gõ tên trung tâm')} />
          </label>
          <label className="field">
            {t('Trạng thái')}
            <select name="status">
              <option value="">{t('Tất cả')}</option>
              {Object.entries(poolStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t('Hết hạn trong (ngày)')}
            <input name="expiringWithinDays" type="number" min={0} max={365} step={1} />
          </label>
        </FilterPanel>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {summary && pools && (
            <>
              <dl className="overview-stats">
                <div>
                  <dt>{t('Kho đang hoạt động')}</dt>
                  <dd>
                    {t('{active}/{total} kho', {
                      active: formatNumber(summary.activePools),
                      total: formatNumber(summary.totalPools),
                    })}
                  </dd>
                </div>
                <div>
                  <dt>{t('License đã dùng')}</dt>
                  <dd>
                    {t('{used}/{total} ({percent}%)', {
                      used: formatNumber(summary.usedSeats),
                      total: formatNumber(summary.totalSeats),
                      percent: formatNumber(summary.seatUtilizationPercent),
                    })}
                  </dd>
                </div>
                <div>
                  <dt>{t('Cần chú ý')}</dt>
                  <dd>
                    {t('{soon} sắp hết hạn · {suspended} tạm ngưng · {expired} hết hạn', {
                      soon: formatNumber(summary.expiringSoonPools),
                      suspended: formatNumber(summary.suspendedPools),
                      expired: formatNumber(summary.expiredPools),
                    })}
                  </dd>
                </div>
              </dl>
              {summary.organizationsWithoutPool > 0 && (
                <p className="muted">
                  {t('{count} trung tâm đang hoạt động chưa mua kho license.', {
                    count: formatNumber(summary.organizationsWithoutPool),
                  })}
                </p>
              )}
              {!pools.items.length && <p>{t('Không có kho license phù hợp.')}</p>}
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label={t('Danh sách kho license')}
              >
                <table>
                  <thead>
                    <tr>
                      <th>{t('Trung tâm')}</th>
                      <th>{t('Gói')}</th>
                      <th>{t('Đã dùng / tổng')}</th>
                      <th>{t('Còn trống')}</th>
                      <th>{t('Trạng thái')}</th>
                      <th>{t('Hết hạn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.items.map((pool) => (
                      <tr key={pool.poolId}>
                        <td>
                          {pool.organizationName}
                          {!pool.organizationIsActive && (
                            <>
                              {' '}
                              <Badge>{t('Trung tâm ngưng hoạt động')}</Badge>
                            </>
                          )}
                        </td>
                        <td>{pool.package.name}</td>
                        <td>
                          {t('{used}/{total} ({percent}%)', {
                            used: formatNumber(pool.usedLicenses),
                            total: formatNumber(pool.totalLicenses),
                            percent: formatNumber(pool.utilizationPercent),
                          })}
                        </td>
                        <td>{formatNumber(pool.availableLicenses)}</td>
                        <td>
                          <strong>{poolStatusLabels[pool.status]}</strong>
                          {pool.status === 'Suspended' && pool.suspendedReason && (
                            <small className="muted"> · {pool.suspendedReason}</small>
                          )}
                        </td>
                        <td>
                          {pool.expiresAt
                            ? formatLocaleDateTime(pool.expiresAt)
                            : t('Không hết hạn')}
                          {pool.isExpiringSoon && pool.daysUntilExpiry !== null && (
                            <>
                              {' '}
                              <Badge>{t('còn {days} ngày', { days: pool.daysUntilExpiry })}</Badge>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row pagination">
                <span>
                  {t('{totalCount} kho · Trang {page}/{p4}', {
                    totalCount: pools.totalCount,
                    page: pools.page,
                    p4: Math.max(1, pools.totalPages),
                  })}
                </span>
                <button
                  className="btn"
                  disabled={query.isFetching || !pools.hasPreviousPage}
                  onClick={() => setPage(page - 1)}
                >
                  {t('Trang trước')}
                </button>
                <button
                  className="btn"
                  disabled={query.isFetching || !pools.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  {t('Trang sau')}
                </button>
              </div>
            </>
          )}
        </State>
      </section>
    </>
  );
}

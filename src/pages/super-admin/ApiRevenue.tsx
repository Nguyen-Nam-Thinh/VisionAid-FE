import { CalendarRange, Clock, Receipt, RefreshCw, TrendingUp, Users, Wallet } from 'lucide-react';
import { t, formatMoney, formatNumber } from '../../i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { Badge, Disclosure, PageHead, State } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import {
  revenueApi,
  channelLabels,
  transactionTypeLabels,
  type RevenueFilters,
  type RevenueReport,
} from '../../services/api/revenue';
import type { Person } from '../../models/domain';

export function ApiRevenue() {
  const { data: actor } = useSession();
  return actor?.role === 'Admin' ? <Revenue key={actor.id} actor={actor} /> : null;
}

function Revenue({ actor }: { actor: Person }) {
  const [filters, setFilters] = useState<RevenueFilters>({
    dateFrom: '',
    dateTo: '',
    groupBy: 'Month',
  });
  const report = useQuery({
    queryKey: ['api-revenue-report', actor.id, filters],
    queryFn: ({ signal }) => revenueApi.report(actor, filters, signal),
    retry: false,
  });
  return (
    <>
      <PageHead
        title={t('Báo cáo doanh thu')}
        description={t('Doanh thu từ giao dịch PayOS đã thanh toán, theo kênh, gói và trung tâm.')}
      />
      <section className="glass card stack">
        <FilterPanel
          active={
            [filters.dateFrom, filters.dateTo, filters.groupBy === 'Day'].filter(Boolean).length
          }
          submitLabel={t('Xem báo cáo')}
          onApply={(form) => {
            const data = new FormData(form);
            setFilters({
              dateFrom: String(data.get('dateFrom') || ''),
              dateTo: String(data.get('dateTo') || ''),
              groupBy: data.get('groupBy') === 'Day' ? 'Day' : 'Month',
            });
          }}
          onReset={() => setFilters({ dateFrom: '', dateTo: '', groupBy: 'Month' })}
          tools={
            <button
              type="button"
              className="btn"
              disabled={report.isFetching}
              onClick={() => void report.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại báo cáo')}
            </button>
          }
        >
          <label className="field wide">
            {t('Xem theo')}
            <select name="groupBy" defaultValue="Month">
              <option value="Month">{t('Tháng')}</option>
              <option value="Day">{t('Ngày')}</option>
            </select>
          </label>
          <div className="filter-range wide">
            <label className="field">
              {t('Từ ngày')}
              <input type="date" name="dateFrom" />
            </label>
            <label className="field">
              {t('Đến ngày')}
              <input type="date" name="dateTo" />
            </label>
          </div>
        </FilterPanel>
        <State loading={report.isPending} error={report.error} retry={() => report.refetch()}>
          {report.data && <ReportView data={report.data} />}
        </State>
      </section>
    </>
  );
}

type Row = { label: string; revenue: number; transactions: number; extra?: string };

function ReportView({ data }: { data: RevenueReport }) {
  const money = (value: number) => formatMoney(value, data.currency, 0);
  const s = data.summary;
  const unpaid = s.pendingTransactions + s.failedTransactions + s.cancelledTransactions;
  return (
    <div className="stack revenue">
      <p role="status" className="revenue-period">
        <CalendarRange size={16} aria-hidden="true" />
        {t('Kỳ báo cáo: {from} → {to}', { from: data.dateFrom, to: data.dateTo })}
      </p>
      <div className="revenue-kpis">
        <article className="revenue-kpi hero">
          <span className="revenue-kpi-label">
            <Wallet size={18} aria-hidden="true" />
            {t('Doanh thu ròng')}
          </span>
          <strong className="revenue-kpi-value">{money(s.netRevenue)}</strong>
          <span className="revenue-kpi-foot">
            {t('Gộp {gross} · hoàn {refunded}', {
              gross: money(s.grossRevenue),
              refunded: money(s.refundedAmount),
            })}
          </span>
        </article>
        <article className="revenue-kpi">
          <span className="revenue-kpi-label">
            <TrendingUp size={18} aria-hidden="true" />
            {t('Doanh thu gộp')}
          </span>
          <strong className="revenue-kpi-value">{money(s.grossRevenue)}</strong>
          <span className="revenue-kpi-foot">
            {t('Đã hoàn tiền {value}', { value: money(s.refundedAmount) })}
          </span>
        </article>
        <article className="revenue-kpi">
          <span className="revenue-kpi-label">
            <Receipt size={18} aria-hidden="true" />
            {t('Giao dịch đã thanh toán')}
          </span>
          <strong className="revenue-kpi-value">{formatNumber(s.paidTransactions)}</strong>
          <span className="revenue-kpi-foot">
            {t('trung bình {value}/đơn', { value: money(s.averageOrderValue) })}
          </span>
        </article>
        <article className="revenue-kpi">
          <span className="revenue-kpi-label">
            <Users size={18} aria-hidden="true" />
            {t('Khách hàng trả tiền')}
          </span>
          <strong className="revenue-kpi-value">
            {formatNumber(s.payingCaregivers + s.payingOrganizations)}
          </strong>
          <span className="revenue-kpi-foot">
            {t('{caregivers} người chăm sóc · {organizations} trung tâm', {
              caregivers: formatNumber(s.payingCaregivers),
              organizations: formatNumber(s.payingOrganizations),
            })}
          </span>
        </article>
        <article className="revenue-kpi">
          <span className="revenue-kpi-label">
            <Clock size={18} aria-hidden="true" />
            {t('Giao dịch chưa thu tiền')}
          </span>
          <strong className="revenue-kpi-value">{formatNumber(unpaid)}</strong>
          <span className="revenue-kpi-foot">
            {t('{pending} đang chờ · {failed} thất bại · {cancelled} đã hủy', {
              pending: formatNumber(s.pendingTransactions),
              failed: formatNumber(s.failedTransactions),
              cancelled: formatNumber(s.cancelledTransactions),
            })}
          </span>
        </article>
      </div>
      <Timeline data={data} money={money} />
      <div className="revenue-breakdowns">
        <Breakdown
          caption={t('Theo kênh')}
          head={t('Kênh')}
          money={money}
          rows={data.byChannel.map((c) => ({
            label: channelLabels[c.channel] ?? c.channel,
            revenue: c.revenue,
            transactions: c.transactions,
          }))}
        />
        <Breakdown
          caption={t('Theo loại giao dịch')}
          head={t('Loại giao dịch')}
          money={money}
          rows={data.byTransactionType.map((x) => ({
            label: transactionTypeLabels[x.transactionType],
            revenue: x.revenue,
            transactions: x.transactions,
          }))}
        />
        <Breakdown
          caption={t('Theo gói')}
          head={t('Gói')}
          money={money}
          rows={data.byPackage.map((p) => ({
            label: p.packageName,
            extra: p.packageType ?? undefined,
            revenue: p.revenue,
            transactions: p.transactions,
          }))}
        />
        <Breakdown
          caption={t('Trung tâm có doanh thu cao nhất')}
          head={t('Trung tâm')}
          money={money}
          rows={data.topOrganizations.map((o) => ({
            label: o.organizationName,
            revenue: o.revenue,
            transactions: o.transactions,
          }))}
        />
      </div>
    </div>
  );
}

/** Revenue per period as one-hue columns; hover shows exact values and the table lists them all. */
function Timeline({ data, money }: { data: RevenueReport; money: (value: number) => string }) {
  const caption = data.groupBy === 'Month' ? t('Doanh thu theo tháng') : t('Doanh thu theo ngày');
  const points = data.timeline;
  const max = Math.max(0, ...points.map((p) => p.revenue));
  // Three recessive gridlines with compact labels so the axis never crowds.
  const ticks = max > 0 ? [max, max / 2, 0] : [0];
  const compact = (value: number) => formatNumber(value, { notation: 'compact' });
  // At most about eight period labels under the axis.
  const step = Math.max(1, Math.ceil(points.length / 8));
  return (
    <section className="revenue-card stack" role="region" aria-label={caption}>
      <header className="row between">
        <h2>{caption}</h2>
        <span className="muted">{data.currency}</span>
      </header>
      {points.length ? (
        <>
          <div className="revenue-chart" aria-hidden="true">
            <div className="revenue-chart-axis">
              {ticks.map((tick) => (
                <span key={tick}>{compact(tick)}</span>
              ))}
            </div>
            <div className="revenue-chart-plot">
              <div className="revenue-chart-gridlayer">
                {ticks.map((tick) => (
                  <i
                    key={tick}
                    className="revenue-chart-grid"
                    style={{ bottom: max ? (tick / max) * 100 + '%' : 0 }}
                  />
                ))}
              </div>
              {points.map((p, i) => (
                <div key={p.period} className="revenue-chart-col">
                  <div className="revenue-chart-slot">
                    <div
                      className="revenue-chart-bar"
                      style={{
                        height: max
                          ? Math.max((p.revenue / max) * 100, p.revenue ? 1 : 0) + '%'
                          : 0,
                      }}
                    />
                    <span className="revenue-chart-tip">
                      <strong>{p.period}</strong>
                      <span>{money(p.revenue)}</span>
                      <span>{t('{count} giao dịch', { count: formatNumber(p.transactions) })}</span>
                    </span>
                  </div>
                  <span className="revenue-chart-label">{i % step === 0 ? p.period : ''}</span>
                </div>
              ))}
            </div>
          </div>
          <Disclosure summary={t('Xem bảng số liệu')}>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">{caption}</caption>
                <thead>
                  <tr>
                    <th scope="col">{data.groupBy === 'Month' ? t('Tháng') : t('Ngày')}</th>
                    <th scope="col">{t('Doanh thu')}</th>
                    <th scope="col">{t('Giao dịch')}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.period}>
                      <td>{p.period}</td>
                      <td>{money(p.revenue)}</td>
                      <td>{formatNumber(p.transactions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Disclosure>
          {/* Screen readers get every period even while the table is closed. */}
          <ul className="sr-only">
            {points.map((p) => (
              <li key={p.period}>
                {p.period}: {money(p.revenue)} ·{' '}
                {t('{count} giao dịch', { count: formatNumber(p.transactions) })}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{t('Không có dữ liệu trong kỳ.')}</p>
      )}
    </section>
  );
}

/** Ranked rows with a share bar each, so the largest item reads at a glance. */
function Breakdown({
  caption,
  head,
  rows,
  money,
}: {
  caption: string;
  head: string;
  rows: Row[];
  money: (value: number) => string;
}) {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);
  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);
  return (
    <section className="revenue-card stack" role="region" aria-label={caption}>
      <h2>{caption}</h2>
      {sorted.length ? (
        <table className="revenue-share">
          <caption className="sr-only">{caption}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{head}</th>
              <th scope="col">{t('Doanh thu')}</th>
              <th scope="col">{t('Tỷ trọng')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const share = total ? (row.revenue / total) * 100 : 0;
              return (
                <tr key={row.label + i}>
                  <th scope="row">
                    <span className="revenue-share-name">
                      {row.label}
                      {row.extra && <Badge tone="gray">{row.extra}</Badge>}
                    </span>
                    <span className="revenue-share-track" aria-hidden="true">
                      <span style={{ width: share + '%' }} />
                    </span>
                  </th>
                  <td>
                    <strong>{money(row.revenue)}</strong>
                    <span className="muted">
                      {t('{count} giao dịch', { count: formatNumber(row.transactions) })}
                    </span>
                  </td>
                  <td className="revenue-share-pct">
                    {formatNumber(share, { maximumFractionDigits: 1 })}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>{t('Không có dữ liệu trong kỳ.')}</p>
      )}
    </section>
  );
}

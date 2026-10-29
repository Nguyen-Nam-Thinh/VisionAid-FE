import { RefreshCw } from 'lucide-react';
import { t, formatMoney, formatNumber } from '../../i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PageHead, State } from '../../components/UI';
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

function ReportView({ data }: { data: RevenueReport }) {
  const money = (value: number) => formatMoney(value, data.currency, 0);
  const s = data.summary;
  return (
    <div className="stack">
      <p role="status">
        {t('Kỳ báo cáo: {from} → {to}', { from: data.dateFrom, to: data.dateTo })}
      </p>
      <dl className="record-details">
        <div>
          <dt>{t('Doanh thu ròng')}</dt>
          <dd>
            <strong>{money(s.netRevenue)}</strong>
          </dd>
        </div>
        <div>
          <dt>{t('Doanh thu gộp')}</dt>
          <dd>{money(s.grossRevenue)}</dd>
        </div>
        <div>
          <dt>{t('Đã hoàn tiền')}</dt>
          <dd>{money(s.refundedAmount)}</dd>
        </div>
        <div>
          <dt>{t('Giao dịch đã thanh toán')}</dt>
          <dd>
            {formatNumber(s.paidTransactions)} ·{' '}
            {t('trung bình {value}/đơn', { value: money(s.averageOrderValue) })}
          </dd>
        </div>
        <div>
          <dt>{t('Giao dịch chưa thu tiền')}</dt>
          <dd>
            {t('{pending} đang chờ · {failed} thất bại · {cancelled} đã hủy', {
              pending: formatNumber(s.pendingTransactions),
              failed: formatNumber(s.failedTransactions),
              cancelled: formatNumber(s.cancelledTransactions),
            })}
          </dd>
        </div>
        <div>
          <dt>{t('Khách hàng trả tiền')}</dt>
          <dd>
            {t('{caregivers} người chăm sóc · {organizations} trung tâm', {
              caregivers: formatNumber(s.payingCaregivers),
              organizations: formatNumber(s.payingOrganizations),
            })}
          </dd>
        </div>
      </dl>
      <Table
        caption={data.groupBy === 'Month' ? t('Doanh thu theo tháng') : t('Doanh thu theo ngày')}
        head={[data.groupBy === 'Month' ? t('Tháng') : t('Ngày'), t('Doanh thu'), t('Giao dịch')]}
        rows={data.timeline.map((p) => [p.period, money(p.revenue), formatNumber(p.transactions)])}
      />
      <Table
        caption={t('Theo kênh')}
        head={[t('Kênh'), t('Doanh thu'), t('Giao dịch')]}
        rows={data.byChannel.map((c) => [
          channelLabels[c.channel] ?? c.channel,
          money(c.revenue),
          formatNumber(c.transactions),
        ])}
      />
      <Table
        caption={t('Theo loại giao dịch')}
        head={[t('Loại giao dịch'), t('Doanh thu'), t('Giao dịch')]}
        rows={data.byTransactionType.map((x) => [
          transactionTypeLabels[x.transactionType],
          money(x.revenue),
          formatNumber(x.transactions),
        ])}
      />
      <Table
        caption={t('Theo gói')}
        head={[t('Gói'), t('Loại gói'), t('Doanh thu'), t('Giao dịch')]}
        rows={data.byPackage.map((p) => [
          p.packageName,
          p.packageType ?? '—',
          money(p.revenue),
          formatNumber(p.transactions),
        ])}
      />
      <Table
        caption={t('Trung tâm có doanh thu cao nhất')}
        head={[t('Trung tâm'), t('Doanh thu'), t('Giao dịch')]}
        rows={data.topOrganizations.map((o) => [
          o.organizationName,
          money(o.revenue),
          formatNumber(o.transactions),
        ])}
      />
    </div>
  );
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <section className="stack">
      <h2>{caption}</h2>
      {rows.length ? (
        <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}>
          <table>
            <thead>
              <tr>
                {head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{t('Không có dữ liệu trong kỳ.')}</p>
      )}
    </section>
  );
}

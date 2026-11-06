import { CalendarRange, MapPinned, RefreshCw, ScanFace, ScanText, Siren } from 'lucide-react';
import { t, formatNumber } from '../../i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { organizationsApi } from '../../services/api/organizations';
import { PageHead, State, Badge } from '../../components/UI';
import { FilterPanel } from '../../components/FilterPanel';
import { CaregiverActivityLog } from '../shared/CaregiverActivityLog';
import { roles } from '../../constants/labels';
import type { Person } from '../../models/domain';

export function ApiReports() {
  const { data: actor } = useSession();
  if (actor?.role !== 'CenterAdmin' || !actor.orgId)
    return (
      <p role="alert" className="notice error">
        {t('Tài khoản cần thuộc một trung tâm để xem báo cáo.')}
      </p>
    );
  return <Reports key={actor.id + actor.orgId} actor={actor} />;
}
function Reports({ actor }: { actor: Person }) {
  const [dates, setDates] = useState({ from: '', to: '' });
  const [filters, setFilters] = useState({ search: '', role: '', active: '' });
  const [page, setPage] = useState(1);
  const summary = useQuery({
    queryKey: ['api-org-report', actor.id, actor.orgId, dates],
    queryFn: ({ signal }) =>
      organizationsApi.summary(actor, actor.orgId, dates.from, dates.to, signal),
    retry: false,
    gcTime: 0,
  });
  const members = useQuery({
    queryKey: ['api-report-members', actor.id, actor.orgId, filters, page],
    queryFn: ({ signal }) =>
      organizationsApi.members(
        actor,
        actor.orgId,
        page,
        filters.search,
        filters.role,
        filters.active,
        signal,
      ),
    retry: false,
    gcTime: 0,
  });
  return (
    <>
      <PageHead
        title={t('Báo cáo hoạt động')}
        description={t(
          'Tổng hợp hoạt động của người khiếm thị thuộc trung tâm và tra cứu thành viên.',
        )}
      />
      <section className="glass card stack">
        <h2>{t('Hoạt động của trung tâm')}</h2>
        <FilterPanel
          active={[dates.from, dates.to].filter(Boolean).length}
          submitLabel={t('Xem báo cáo')}
          onApply={(form) => {
            const data = new FormData(form);
            setDates({ from: String(data.get('from') || ''), to: String(data.get('to') || '') });
          }}
          onReset={() => setDates({ from: '', to: '' })}
          tools={
            <button
              type="button"
              className="btn"
              disabled={summary.isFetching}
              onClick={() => void summary.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại báo cáo')}
            </button>
          }
        >
          <div className="filter-range wide">
            <label className="field">
              {t('Từ ngày UTC')}
              <input type="date" name="from" />
            </label>
            <label className="field">
              {t('Đến ngày UTC')}
              <input type="date" name="to" />
            </label>
          </div>
        </FilterPanel>
        <State loading={summary.isPending} error={summary.error} retry={() => summary.refetch()}>
          {summary.data && (
            <>
              <p role="status" className="revenue-period">
                <CalendarRange size={16} aria-hidden="true" />
                {t('Kỳ báo cáo UTC:')} {summary.data.dateFrom || t('Không giới hạn đầu kỳ')} →{' '}
                {summary.data.dateTo || t('Không giới hạn cuối kỳ')}
              </p>
              <div className="report-tiles">
                {(
                  [
                    [t('Sự kiện khẩn cấp'), summary.data.emergencyEventCount, Siren, 'danger'],
                    [
                      t('Sự kiện ranh giới vùng an toàn'),
                      summary.data.geofenceBreachCount,
                      MapPinned,
                      'warning',
                    ],
                    [
                      t('Yêu cầu đọc chữ và quét QR'),
                      summary.data.ocrRequestCount,
                      ScanText,
                      'primary',
                    ],
                    [
                      t('Lượt nhận diện khuôn mặt'),
                      summary.data.faceRecognitionCount,
                      ScanFace,
                      'primary',
                    ],
                  ] as const
                ).map(([label, count, Icon, tone]) => (
                  <div key={label} className="report-tile" role="group" aria-label={label}>
                    <span className={'report-tile-icon ' + tone} aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <strong className="report-tile-value">{formatNumber(count)}</strong>
                    <span className="report-tile-label">{label}</span>
                  </div>
                ))}
              </div>
              <p className="report-note">
                {t(
                  'Số liệu do máy chủ tổng hợp cho các thành viên khiếm thị hiện thuộc trung tâm, chưa bị xóa. Các nhóm có thể trùng sự kiện nên không cộng thành một tổng chung.',
                )}
              </p>
            </>
          )}
        </State>
      </section>
      <section className="glass card stack">
        <h2>{t('Thành viên hiện tại')}</h2>
        <FilterPanel
          active={Object.values(filters).filter(Boolean).length}
          submitLabel={t('Lọc thành viên')}
          onApply={(form) => {
            const data = new FormData(form);
            setFilters({
              search: String(data.get('search') || '').trim(),
              role: String(data.get('role') || ''),
              active: String(data.get('active') || ''),
            });
            setPage(1);
          }}
          onReset={() => {
            setFilters({ search: '', role: '', active: '' });
            setPage(1);
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={members.isFetching}
              onClick={() => void members.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {t('Tải lại thành viên')}
            </button>
          }
        >
          <label className="field wide">
            {t('Tìm thành viên')}
            <input name="search" />
          </label>
          <label className="field">
            {t('Vai trò')}
            <select name="role">
              <option value="">{t('Tất cả vai trò')}</option>
              {(['CenterAdmin', 'Caregiver', 'VisuallyImpaired'] as const).map((role) => (
                <option key={role} value={role}>
                  {roles[role]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t('Trạng thái')}
            <select name="active">
              <option value="">{t('Tất cả trạng thái')}</option>
              <option value="true">{t('Hoạt động')}</option>
              <option value="false">{t('Vô hiệu hóa')}</option>
            </select>
          </label>
        </FilterPanel>
        <State loading={members.isPending} error={members.error} retry={() => members.refetch()}>
          <div
            className="table-scroll"
            role="region"
            aria-label={t('Bảng thành viên')}
            tabIndex={0}
          >
            <table style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>{t('Họ tên')}</th>
                  <th>Email</th>
                  <th>{t('Vai trò')}</th>
                  <th>{t('Trạng thái')}</th>
                </tr>
              </thead>
              <tbody>
                {members.data?.items.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.fullName}</strong>
                    </td>
                    <td style={{ overflowWrap: 'anywhere' }}>{member.email}</td>
                    <td>
                      <Badge tone="blue">{roles[member.role]}</Badge>
                    </td>
                    <td>
                      <Badge tone={member.isActive ? 'green' : 'gray'}>
                        {member.isActive ? t('Hoạt động') : t('Vô hiệu hóa')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!members.data?.items.length && (
              <p className="empty">{t('Chưa có thành viên phù hợp.')}</p>
            )}
          </div>
          {members.data && (
            <div className="row pagination">
              <span>
                {t('{totalCount} thành viên · Trang {page}/{p4}', {
                  totalCount: members.data.totalCount,
                  page,
                  p4: Math.max(1, members.data.totalPages),
                })}
              </span>
              <button
                className="btn"
                disabled={members.isFetching || !members.data.hasPreviousPage}
                onClick={() => setPage(page - 1)}
              >
                {t('Trang trước')}
              </button>
              <button
                className="btn"
                disabled={members.isFetching || !members.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                {t('Trang sau')}
              </button>
            </div>
          )}
        </State>
      </section>
      <CaregiverActivityLog actor={actor} organizationId={actor.orgId} />
    </>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { organizationsApi } from '../../services/api/organizations';
import { PageHead, State, Badge } from '../../components/UI';
import { roles } from '../../constants/labels';
import type { Person } from '../../models/domain';

export function ApiReports() {
  const { data: actor } = useSession();
  if (actor?.role !== 'CenterAdmin' || !actor.orgId)
    return (
      <p role="alert" className="notice error">
        Tài khoản cần thuộc một trung tâm để xem báo cáo.
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
        title="Báo cáo hoạt động"
        description="Tổng hợp hoạt động của người khiếm thị thuộc trung tâm và tra cứu thành viên."
      />
      <section className="glass card stack">
        <h2>Hoạt động của trung tâm</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setDates({ from: String(form.get('from') || ''), to: String(form.get('to') || '') });
          }}
        >
          <label className="field">
            Từ ngày UTC
            <input type="date" name="from" />
          </label>
          <label className="field">
            Đến ngày UTC
            <input type="date" name="to" />
          </label>
          <button className="btn primary">Xem báo cáo</button>
          <button
            type="button"
            className="btn"
            disabled={summary.isFetching}
            onClick={() => void summary.refetch()}
          >
            Tải lại báo cáo
          </button>
        </form>
        <p className="notice">
          Máy chủ tính theo ngày UTC: một ngày bắt đầu lúc 07:00 giờ Việt Nam và kết thúc ngay trước
          07:00 hôm sau. Để trống ngày để xem toàn bộ dữ liệu còn lưu.
        </p>
        <State loading={summary.isPending} error={summary.error} retry={() => summary.refetch()}>
          {summary.data && (
            <>
              <p role="status">
                Kỳ báo cáo UTC: {summary.data.dateFrom || 'Không giới hạn đầu kỳ'} →{' '}
                {summary.data.dateTo || 'Không giới hạn cuối kỳ'}
              </p>
              <div className="table-scroll">
                <table className="report-totals">
                  <caption className="sr-only">Số bản ghi hoạt động trong kỳ báo cáo</caption>
                  <thead>
                    <tr>
                      <th>Hoạt động</th>
                      <th>Số bản ghi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sự kiện khẩn cấp</td>
                      <td>{summary.data.emergencyEventCount}</td>
                    </tr>
                    <tr>
                      <td>Sự kiện ranh giới vùng an toàn</td>
                      <td>{summary.data.geofenceBreachCount}</td>
                    </tr>
                    <tr>
                      <td>Yêu cầu đọc chữ và quét QR</td>
                      <td>{summary.data.ocrRequestCount}</td>
                    </tr>
                    <tr>
                      <td>Lượt nhận diện khuôn mặt</td>
                      <td>{summary.data.faceRecognitionCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="report-note">
                Số liệu do máy chủ tổng hợp cho các thành viên khiếm thị hiện thuộc trung tâm, chưa
                bị xóa. Các nhóm có thể trùng sự kiện nên không cộng thành một tổng chung.
              </p>
            </>
          )}
        </State>
      </section>
      <section className="glass card stack">
        <h2>Thành viên hiện tại</h2>
        <p>Danh sách thành viên có bộ lọc riêng, không phụ thuộc khoảng ngày báo cáo.</p>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setFilters({
              search: String(form.get('search') || '').trim(),
              role: String(form.get('role') || ''),
              active: String(form.get('active') || ''),
            });
            setPage(1);
          }}
        >
          <label className="field">
            Tìm thành viên
            <input name="search" />
          </label>
          <label className="field">
            Vai trò
            <select name="role">
              <option value="">Tất cả vai trò</option>
              {(['CenterAdmin', 'Caregiver', 'VisuallyImpaired'] as const).map((role) => (
                <option key={role} value={role}>
                  {roles[role]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Trạng thái
            <select name="active">
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Vô hiệu hóa</option>
            </select>
          </label>
          <button className="btn primary">Lọc thành viên</button>
          <button
            type="button"
            className="btn"
            disabled={members.isFetching}
            onClick={() => void members.refetch()}
          >
            Tải lại thành viên
          </button>
        </form>
        <State loading={members.isPending} error={members.error} retry={() => members.refetch()}>
          {members.data?.items.length ? (
            <div className="table-scroll" role="region" aria-label="Bảng thành viên" tabIndex={0}>
              <table style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {members.data.items.map((member) => (
                    <tr key={member.id}>
                      <td><strong>{member.fullName}</strong></td>
                      <td style={{ overflowWrap: 'anywhere' }}>{member.email}</td>
                      <td>{roles[member.role]}</td>
                      <td>
                        <Badge tone={member.isActive ? 'green' : 'gray'}>
                          {member.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Chưa có thành viên phù hợp.</p>
          )}
          {members.data && (
            <div className="row pagination">
              <span>
                {members.data.totalCount} thành viên · Trang {page}/
                {Math.max(1, members.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={members.isFetching || !members.data.hasPreviousPage}
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </button>
              <button
                className="btn"
                disabled={members.isFetching || !members.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Trang sau
              </button>
            </div>
          )}
        </State>
      </section>
    </>
  );
}

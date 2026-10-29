import { RefreshCw } from 'lucide-react';
import { t, formatLocaleDateTime } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Confirm, Dialog, State } from '../../components/UI';
import { Form } from '../../components/Form';
import { personField, useOrgPeople } from '../../hooks/useOrgPeople';
import {
  licenseAssignmentsApi,
  type LicenseAssignment,
} from '../../services/api/licenseAssignments';
import type { Person } from '../../models/domain';
import { searchAccounts } from '../../services/api/pickers';

export function LicenseAssignments({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [active, setActive] = useState('true');
  const [assigning, setAssigning] = useState(false);
  const vius = useOrgPeople(actor, 'VisuallyImpaired', assigning);
  const [revoking, setRevoking] = useState<LicenseAssignment | null>(null);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['license-assignments', actor.id, actor.orgId, page, active],
    queryFn: ({ signal }) => licenseAssignmentsApi.list(actor, page, active, signal),
    retry: false,
  });
  const refresh = () =>
    cache.invalidateQueries({
      predicate: (q) =>
        [
          'license-assignments',
          'license-pool',
          'api-accounts',
          'api-account',
          'api-users',
        ].includes(String(q.queryKey[0])) && q.queryKey[1] === actor.id,
    });
  return (
    <section className="glass card stack" aria-label={t('Danh sách cấp license')}>
      <h2>{t('License đã cấp')}</h2>
      <p>
        {t(
          'Cấp license cho người được chăm sóc đã có tài khoản trong tổ chức. Nhân viên chăm sóc không sử dụng suất license.',
        )}
      </p>
      <div className="row page-head-actions">
        <label className="field">
          {t('Trạng thái cấp')}
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              setPage(1);
            }}
          >
            <option value="true">{t('Chưa thu hồi')}</option>
            <option value="false">{t('Đã thu hồi')}</option>
            <option value="">{t('Tất cả')}</option>
          </select>
        </label>
        <button className="btn primary" onClick={() => setAssigning(true)}>
          {t('Cấp license')}
        </button>
        <button className="btn" disabled={query.isFetching} onClick={() => void refresh()}>
          <RefreshCw size={16} aria-hidden="true" />
          {t('Tải lại danh sách')}
        </button>
        <Link className="btn" to="/packages">
          {t('Mua thêm license')}
        </Link>
      </div>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            <div className="table-scroll">
              <table className="assignment-table">
                <caption className="sr-only">{t('License đã cấp cho người được chăm sóc')}</caption>
                <thead>
                  <tr>
                    <th>{t('Người được chăm sóc')}</th>
                    <th>{t('Ngày cấp')}</th>
                    <th>{t('Trạng thái')}</th>
                    <th>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.viuUser.fullName}</strong>
                        <p className="assignment-meta">{item.viuUser.email}</p>
                        <small className="assignment-meta">
                          {t('Mã: {id}', { id: item.viuUser.id })}
                        </small>
                      </td>
                      <td>{formatLocaleDateTime(item.assignedAt)}</td>
                      <td>
                        {item.isActive
                          ? t('Chưa thu hồi')
                          : t('Đã thu hồi · {p0}', {
                              p0: formatLocaleDateTime(item.revokedAt!),
                            })}
                      </td>
                      <td>
                        {item.isActive && (
                          <button className="btn danger small" onClick={() => setRevoking(item)}>
                            {t('Thu hồi')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.data.items.length && <p>{t('Không có license phù hợp bộ lọc.')}</p>}
            <p>
              {t(
                'Chưa thu hồi không đồng nghĩa còn hạn sử dụng; thời hạn và quyền truy cập do máy chủ kiểm tra.',
              )}
            </p>
            <div className="row pagination">
              <span>
                {t('{totalCount} kết quả · Trang {page}/{p4}', {
                  totalCount: query.data.totalCount,
                  page,
                  p4: Math.max(1, query.data.totalPages),
                })}
              </span>
              <button
                className="btn"
                disabled={!query.data.hasPreviousPage}
                onClick={() => setPage(page - 1)}
              >
                {t('Trang trước')}
              </button>
              <button
                className="btn"
                disabled={!query.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                {t('Trang sau')}
              </button>
            </div>
          </>
        )}
      </State>
      {assigning && (
        <Dialog title={t('Cấp license')} onClose={() => setAssigning(false)}>
          <p>
            {t(
              'Chọn người được chăm sóc của tổ chức. Thao tác sử dụng một suất trong kho hiện tại; có thể cấp lại cho người đã bị thu hồi.',
            )}
          </p>
          {vius.isLoading ? (
            <p role="status">{t('Đang tải danh sách người được chăm sóc…')}</p>
          ) : (
            <Form
              fields={[
                personField(
                  { key: 'viuId', label: t('Người được chăm sóc'), required: true },
                  vius,
                  t('Trung tâm chưa có người được chăm sóc đang hoạt động.'),
                  {
                    search: searchAccounts(actor, 'VisuallyImpaired'),
                    searchKey: ['license-viu', actor.id, actor.orgId],
                  },
                ),
              ]}
              submit={t('Xác nhận cấp license')}
              onSubmit={async (values) => {
                try {
                  await licenseAssignmentsApi.assign(actor, String(values.viuId).trim());
                  setNotice(t('Đã cấp license. Số lượng trong kho được tải lại từ máy chủ.'));
                  setAssigning(false);
                } finally {
                  await refresh();
                }
              }}
            />
          )}
          <p>
            {t(
              'Nếu báo lỗi hoặc mất kết nối, kiểm tra lại danh sách trước khi gửi lại. Hết suất hoặc hết hạn:',
            )}{' '}
            <Link to="/packages">{t('xem gói Business')}</Link>.
          </p>
        </Dialog>
      )}
      {revoking && (
        <Confirm
          title={t('Thu hồi license')}
          description={t(
            'Thu hồi license của {fullName}? Người này sẽ mất quyền sử dụng theo license tổ chức. Tài khoản và phân công chăm sóc vẫn được giữ.',
            { fullName: revoking.viuUser.fullName },
          )}
          onClose={() => setRevoking(null)}
          onConfirm={async () => {
            try {
              await licenseAssignmentsApi.revoke(actor, revoking.viuUser.id);
              setNotice(t('Đã thu hồi license. Số lượng trong kho được tải lại từ máy chủ.'));
            } finally {
              await refresh();
            }
          }}
        />
      )}
    </section>
  );
}

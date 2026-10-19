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
    <section className="glass card stack" aria-label="Danh sách cấp license">
      <h2>License đã cấp</h2>
      <p>
        Cấp license cho người được chăm sóc đã có tài khoản trong tổ chức. Nhân viên chăm sóc không
        sử dụng suất license.
      </p>
      <div className="row page-head-actions">
        <label className="field">
          Trạng thái cấp
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              setPage(1);
            }}
          >
            <option value="true">Chưa thu hồi</option>
            <option value="false">Đã thu hồi</option>
            <option value="">Tất cả</option>
          </select>
        </label>
        <button className="btn primary" onClick={() => setAssigning(true)}>
          Cấp license
        </button>
        <button className="btn" disabled={query.isFetching} onClick={() => void refresh()}>
          Tải lại danh sách
        </button>
        <Link to="/packages">Mua thêm license</Link>
      </div>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {query.data && (
          <>
            <div className="table-scroll">
              <table className="assignment-table">
                <caption className="sr-only">License đã cấp cho người được chăm sóc</caption>
                <thead>
                  <tr>
                    <th>Người được chăm sóc</th>
                    <th>Ngày cấp</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.viuUser.fullName}</strong>
                        <p className="assignment-meta">{item.viuUser.email}</p>
                        <small className="assignment-meta">Mã: {item.viuUser.id}</small>
                      </td>
                      <td>{new Date(item.assignedAt).toLocaleString('vi-VN')}</td>
                      <td>
                        {item.isActive
                          ? 'Chưa thu hồi'
                          : `Đã thu hồi · ${new Date(item.revokedAt!).toLocaleString('vi-VN')}`}
                      </td>
                      <td>
                        {item.isActive && (
                          <button className="btn danger small" onClick={() => setRevoking(item)}>
                            Thu hồi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.data.items.length && <p>Không có license phù hợp bộ lọc.</p>}
            <p>
              Chưa thu hồi không đồng nghĩa còn hạn sử dụng; thời hạn và quyền truy cập do máy chủ
              kiểm tra.
            </p>
            <div className="row pagination">
              <span>
                {query.data.totalCount} kết quả · Trang {page}/{Math.max(1, query.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={!query.data.hasPreviousPage}
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </button>
              <button
                className="btn"
                disabled={!query.data.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </State>
      {assigning && (
        <Dialog title="Cấp license" onClose={() => setAssigning(false)}>
          <p>
            Chọn người được chăm sóc của tổ chức. Thao tác sử dụng một suất trong kho hiện tại; có
            thể cấp lại cho người đã bị thu hồi.
          </p>
          {vius.isLoading ? (
            <p role="status">Đang tải danh sách người được chăm sóc…</p>
          ) : (
            <Form
              fields={[
                personField(
                  {
                    key: 'viuId',
                    label: 'Người được chăm sóc',
                    required: true,
                    hint: 'Nhập mã UUID tài khoản VIU của tổ chức.',
                  },
                  vius,
                  'Trung tâm chưa có người được chăm sóc đang hoạt động.',
                ),
              ]}
              submit="Xác nhận cấp license"
              onSubmit={async (values) => {
                try {
                  await licenseAssignmentsApi.assign(actor, String(values.viuId).trim());
                  setNotice('Đã cấp license. Số lượng trong kho được tải lại từ máy chủ.');
                  setAssigning(false);
                } finally {
                  await refresh();
                }
              }}
            />
          )}
          <p>
            Nếu báo lỗi hoặc mất kết nối, kiểm tra lại danh sách trước khi gửi lại. Hết suất hoặc
            hết hạn: <Link to="/packages">xem gói Business</Link>.
          </p>
        </Dialog>
      )}
      {revoking && (
        <Confirm
          title="Thu hồi license"
          description={`Thu hồi license của ${revoking.viuUser.fullName}? Người này sẽ mất quyền sử dụng theo license tổ chức. Tài khoản và phân công chăm sóc vẫn được giữ.`}
          onClose={() => setRevoking(null)}
          onConfirm={async () => {
            try {
              await licenseAssignmentsApi.revoke(actor, revoking.viuUser.id);
              setNotice('Đã thu hồi license. Số lượng trong kho được tải lại từ máy chủ.');
            } finally {
              await refresh();
            }
          }}
        />
      )}
    </section>
  );
}

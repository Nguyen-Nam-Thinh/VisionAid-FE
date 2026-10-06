import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useService';
import { PageHead, State } from '../../components/UI';
import {
  getMySubscription,
  isPersonalCaregiver,
  licenseSummary,
  subscriptionLabels,
} from '../../services/api/licenses';
import { ServiceError } from '../../services/contracts';
import { canBrowsePackages } from '../../services/api/packages';

const dateLabel = (date?: string | null) =>
  date
    ? new Date(date).toLocaleString('vi-VN', { timeZoneName: 'short' })
    : 'Chưa có thời hạn từ máy chủ';

export function ApiLicense() {
  const session = useSession();
  const cache = useQueryClient();
  const user = session.data;
  const personal = !!user && isPersonalCaregiver(user);
  const detail = useQuery({
    queryKey: ['license-subscription', user?.id, user?.orgId],
    queryFn: ({ signal }) => getMySubscription(user!, signal),
    enabled: personal,
    retry: false,
    refetchInterval: 60000,
  });
  const [checking, setChecking] = useState(false);
  if (!user) return null;
  return (
    <>
      <PageHead
        title="License"
        description="Trạng thái và thời hạn sử dụng của tài khoản."
        actions={
          <button
            className="btn small"
            aria-label="Tải lại thông tin license"
            disabled={checking || session.isFetching || detail.isFetching}
            onClick={async () => {
              setChecking(true);
              try {
                // Refetch reads only. Never replay a mutation that returned 402.
                await cache.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
                await session.refetch();
              } finally {
                setChecking(false);
              }
            }}
          >
            <RefreshCw size={16} aria-hidden="true" /> Tải lại
          </button>
        }
      />
      <section className="glass card stack license-card" aria-label="Thông tin license">
        <h2>Trạng thái tài khoản</h2>
        <p>{licenseSummary(user)}</p>
        {canBrowsePackages(user) && (
          <Link
            className="btn small license-catalog"
            to={user.role === 'Admin' ? '/admin/packages' : '/packages'}
          >
            Xem danh mục gói
          </Link>
        )}
        {personal && <p>Thời hạn hồ sơ: {dateLabel(user.licenseExpiresAt)}</p>}
      </section>
      {personal && (
        <section className="glass card stack license-card">
          <h2>Subscription cá nhân</h2>
          {detail.error instanceof ServiceError && detail.error.status === 404 ? (
            <p className="notice">Máy chủ chưa tìm thấy subscription cho tài khoản này.</p>
          ) : (
            <State loading={detail.isPending} error={detail.error}>
              {detail.data && (
                <dl className="license-details">
                  <div>
                    <dt>Gói</dt>
                    <dd>{detail.data.package.name}</dd>
                  </div>
                  <div>
                    <dt>Trạng thái subscription</dt>
                    <dd>{subscriptionLabels[detail.data.status]}</dd>
                  </div>
                  <div>
                    <dt>Hết hạn kỳ sử dụng</dt>
                    <dd>
                      {dateLabel(
                        detail.data.status === 'Trial'
                          ? detail.data.trialEndsAt
                          : detail.data.currentPeriodEnd,
                      )}
                    </dd>
                  </div>
                </dl>
              )}
            </State>
          )}
          <p>
            Trial và Personal hỗ trợ tối đa 3 người được chăm sóc. Quyền truy cập từng người vẫn
            theo liên kết.
          </p>
          <p className="notice">
            Bạn có thể mua hoặc gia hạn gói Personal từ danh mục gói. Nhập key chưa được mở. Nếu
            license đã được cập nhật qua kênh khác, hãy tải lại thông tin tại đây.
          </p>
        </section>
      )}
      {user.role === 'CenterAdmin' && user.orgId ? (
        <Link className="btn" to="/center-admin/licenses">
          Xem kho license tổ chức
        </Link>
      ) : (
        !personal && (
          <p className="notice">
            Kho license và thanh toán tổ chức do quản trị trung tâm phụ trách.
          </p>
        )
      )}
    </>
  );
}

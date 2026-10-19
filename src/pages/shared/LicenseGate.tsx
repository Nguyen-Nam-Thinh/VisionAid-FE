import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useService';
import { personalLicenseBlock } from '../../services/api/licenses';
import { StatusPage } from './StatusPage';

/**
 * Shows a "buy a plan" screen instead of a licensed Caregiver screen when the personal license is
 * missing or past grace. The BE remains the authority: pages still handle 402 if this view is stale.
 */
export function LicenseGate({ children, licensed }: { children: ReactNode; licensed: boolean }) {
  const { data: user } = useSession();
  const block = licensed && user ? personalLicenseBlock(user) : null;
  if (!block) return <>{children}</>;
  return (
    <StatusPage
      kind="license"
      description={
        block === 'expired'
          ? 'Gói Personal của bạn đã hết hạn quá 3 ngày gia hạn. Gia hạn qua PayOS hoặc kích hoạt key do trung tâm cấp để dùng lại chức năng này.'
          : undefined
      }
      actions={
        <>
          <Link className="btn primary" to="/packages">
            {block === 'expired' ? 'Gia hạn gói Personal' : 'Chọn gói Personal'}
          </Link>
          <Link className="btn" to="/license">
            Kích hoạt bằng key
          </Link>
        </>
      }
    >
      <p className="status-note">
        Khi chưa có gói, bạn vẫn nhận và xử lý <Link to="/caregiver/alerts">cảnh báo khẩn cấp</Link>{' '}
        và xem <Link to="/caregiver/calls">lịch sử cuộc gọi</Link>. Sau khi thanh toán thành công,
        trang sẽ tự mở khóa khi máy chủ xác nhận.
      </p>
    </StatusPage>
  );
}

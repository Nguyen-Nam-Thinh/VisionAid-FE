import { useEffect, useRef, type ReactNode } from 'react';
import { Compass, RotateCw, ShieldAlert, TriangleAlert, UserX } from 'lucide-react';

export type StatusKind = 'not-found' | 'forbidden' | 'error' | 'unsupported';

const content: Record<
  StatusKind,
  { code?: string; icon: typeof Compass; title: string; description: string }
> = {
  'not-found': {
    code: '404',
    icon: Compass,
    title: 'Không tìm thấy trang',
    description:
      'Đường dẫn không tồn tại, đã được đổi hoặc bạn gõ nhầm. Dữ liệu của bạn không bị ảnh hưởng.',
  },
  forbidden: {
    code: '403',
    icon: ShieldAlert,
    title: 'Bạn không có quyền xem trang này',
    description:
      'Trang này dành cho vai trò khác. Nếu bạn cần truy cập, hãy liên hệ quản trị trung tâm hoặc quản trị hệ thống.',
  },
  error: {
    icon: TriangleAlert,
    title: 'Màn hình này gặp sự cố',
    description:
      'Một lỗi bất ngờ khiến màn hình không hiển thị được. Thao tác đang gửi có thể chưa hoàn tất — hãy tải lại và kiểm tra trước khi làm lại.',
  },
  unsupported: {
    icon: UserX,
    title: 'Tài khoản này không dùng trên Web',
    description:
      'Người khiếm thị sử dụng VisionAid qua ứng dụng di động. Web dành cho người chăm sóc, quản trị trung tâm và quản trị hệ thống.',
  },
};

/**
 * Shared 404 / 403 / error screen. `standalone` renders a full page with its own brand bar for places
 * outside the app shell (no session, or the root error boundary, where router links are unavailable).
 */
export function StatusPage({
  kind,
  standalone = false,
  actions,
  detail,
}: {
  kind: StatusKind;
  standalone?: boolean;
  actions: ReactNode;
  detail?: string;
}) {
  const { code, icon: Icon, title, description } = content[kind];
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus to the explanation so keyboard and screen-reader users land on what happened.
  useEffect(() => heading.current?.focus(), [kind]);
  const body = (
    <section
      className={'status-page' + (standalone ? '' : ' glass card')}
      role={kind === 'error' ? 'alert' : undefined}
      aria-labelledby="status-title"
    >
      <div className="status-mark" aria-hidden="true">
        <Icon size={30} strokeWidth={1.75} />
      </div>
      {code && (
        <p className="status-code" aria-hidden="true">
          {code}
        </p>
      )}
      <h1 id="status-title" ref={heading} tabIndex={-1}>
        {title}
      </h1>
      <p className="status-description">{description}</p>
      {detail && (
        <details className="status-detail">
          <summary>Thông tin kỹ thuật</summary>
          <code>{detail}</code>
        </details>
      )}
      <div className="status-actions">{actions}</div>
    </section>
  );
  if (!standalone) return body;
  return (
    <div className="status-standalone">
      <header className="status-bar">
        <a className="brand" href="/">
          <img
            className="brand-icon"
            src="/branding/visionaid-icon.png"
            alt=""
            width={40}
            height={40}
          />
          <span>
            VisionAid<span style={{ color: 'var(--primary)' }}>.</span>
          </span>
        </a>
      </header>
      <main id="main" className="status-main">
        {body}
      </main>
    </div>
  );
}

export const reloadAction = (
  <button className="btn primary" onClick={() => window.location.reload()}>
    <RotateCw size={18} aria-hidden="true" />
    Tải lại trang
  </button>
);

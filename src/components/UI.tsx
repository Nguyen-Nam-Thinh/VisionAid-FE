import { t } from '../i18n';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServiceError } from '../services/contracts';
import { useSession } from '../hooks/useService';
import { canBrowsePackages } from '../services/api/packages';
export const Brand = () => (
  <Link className="brand" to="/">
    <img className="brand-icon" src="/branding/visionaid-icon.png" alt="" width={40} height={40} />
    <span>
      VisionAid<span style={{ color: 'var(--primary)' }}>.</span>
    </span>
  </Link>
);
export const PageHead = ({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) => (
  <header className="page-head">
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {actions && <div className="row page-head-actions">{actions}</div>}
  </header>
);
/** Page-level buttons placed inside the card they act on, aligned to its top-right. */
export const CardActions = ({ children }: { children: ReactNode }) =>
  children ? <div className="card-actions">{children}</div> : null;
export const Badge = ({ children, tone = 'blue' }: { children: ReactNode; tone?: string }) => (
  <span className={'badge ' + tone}>{children}</span>
);
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    ref.current?.showPopover();
  }, []);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [message, onDismiss, paused]);
  return (
    <div
      ref={ref}
      popover="manual"
      className="feedback-toast"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <span role="status" aria-live="polite" aria-atomic="true">
        {message}
      </span>
      <button type="button" aria-label={t('Đóng thông báo')} onClick={onDismiss}>
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
/** 402 follow-up. Organization staff (UC-79) cannot buy a Personal plan; their license comes from the center. */
function LicenseActions() {
  const { data: user } = useSession();
  return (
    <>
      {user && !canBrowsePackages(user) && (
        <p>
          {t(
            'License của tài khoản do trung tâm quản lý. Hãy liên hệ quản trị trung tâm để gia hạn.',
          )}
        </p>
      )}
      <div className="row">
        {user && canBrowsePackages(user) && (
          <Link className="btn primary" to="/packages">
            {t('Chọn gói dịch vụ')}
          </Link>
        )}
        <Link className="btn" to="/license">
          {t('Xem trạng thái license')}
        </Link>
      </div>
    </>
  );
}
export function State({
  loading,
  error,
  retry,
  children,
}: {
  loading?: boolean;
  error?: Error | null;
  retry?: () => void;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="glass empty" role="status">
        {t('Đang tải dữ liệu…')}
      </div>
    );
  if (error)
    return (
      <div className="notice error stack" role="alert">
        <strong>{error.message}</strong>
        {error instanceof ServiceError && error.status === 402 && <LicenseActions />}
        {retry && (
          <button className="btn" onClick={retry}>
            <RefreshCw size={16} aria-hidden="true" />
            {t('Thử lại')}
          </button>
        )}
      </div>
    );
  return <>{children}</>;
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  const close = () => {
    if (!ref.current?.querySelector('form[aria-busy="true"]')) onClose();
  };
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={label}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <header className="dialog-header row between">
        <h2 id={label}>{title}</h2>
        <button className="btn small" aria-label={t('Đóng hộp thoại')} onClick={close}>
          <X size={18} />
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <Dialog
      title={title}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <div className="stack">
        <p>{description}</p>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <div className="row">
          <button className="btn" disabled={pending} onClick={onClose}>
            {t('Hủy')}
          </button>
          <button
            className="btn danger"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await onConfirm();
                onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : t('Không thể thực hiện.'));
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? t('Đang xử lý…') : t('Xác nhận')}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchText,
  title,
  filter,
}: {
  rows: T[];
  columns: { label: string; render: (row: T) => ReactNode }[];
  searchText: (row: T) => string;
  title: string;
  filter?: ReactNode;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const filtered = rows.filter((r) =>
    searchText(r).toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const current = Math.min(page, pages);
  return (
    <section className="glass card stack">
      <div className="row between">
        <h2>{title}</h2>
        <div className="row">
          <label className="table-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">{t('Tìm kiếm {title}', { title })}</span>
            <input
              className="search"
              placeholder={t('Tìm kiếm…')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {filter}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice((current - 1) * 6, current * 6).map((row) => (
              <tr key={row.id}>
                {columns.map((c, i) => (
                  <td key={i}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="empty">
            {t('Chưa có dữ liệu phù hợp. Thử thay đổi bộ lọc hoặc thêm dữ liệu mới.')}
          </p>
        )}
      </div>
      <footer className="pagination">
        <span>
          {t('{length} kết quả · Trang {current}/{pages}', {
            length: filtered.length,
            current,
            pages,
          })}
        </span>
        <div className="row">
          <button
            className="btn small"
            aria-label={t('Trang trước')}
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn small"
            aria-label={t('Trang sau')}
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}

import { t } from '../i18n';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as AnimatedDialog from '@animate-ui/react/primitives/radix-ui/dialog';
import * as AnimatedSwitch from '@animate-ui/react/primitives/radix-ui/switch';
import * as AnimatedCollapsible from '@animate-ui/react/primitives/radix-ui/collapsible';
import * as AnimatedCheckbox from '@animate-ui/react/primitives/radix-ui/checkbox';
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
// True inside a Dialog, whose own toasts stay in the dialog so they are announced and scoped with it.
const InDialog = createContext(false);
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const inDialog = useContext(InDialog);
  useEffect(() => {
    ref.current?.showPopover();
  }, []);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [message, onDismiss, paused]);
  // Outside a dialog it renders straight into <body>: an open modal hides the app root from
  // assistive technology, and a toast inside it would never be announced.
  const toast = (
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
  return inDialog ? toast : createPortal(toast, document.body);
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
/**
 * On/off switch on the animate-ui Radix primitive (role="switch", Space/Enter toggle, animated
 * thumb). Controlled: `checked` is the server value and `onChange` asks for the next one.
 */
export function Toggle({
  checked,
  disabled,
  onChange,
  labelledBy,
  describedBy,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
  describedBy?: string;
}) {
  return (
    <AnimatedSwitch.Root
      className="toggle"
      checked={checked}
      disabled={disabled}
      onCheckedChange={onChange}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      <AnimatedSwitch.Thumb className="toggle-thumb" />
    </AnimatedSwitch.Root>
  );
}
/** Show/hide block on the animate-ui Collapsible: the content slides open and closed. */
export function Disclosure({
  summary,
  className,
  children,
}: {
  summary: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <AnimatedCollapsible.Root className={'disclosure' + (className ? ' ' + className : '')}>
      <AnimatedCollapsible.Trigger className="disclosure-trigger">
        <ChevronRight size={16} aria-hidden="true" />
        {summary}
      </AnimatedCollapsible.Trigger>
      <AnimatedCollapsible.Content className="disclosure-content">
        {children}
      </AnimatedCollapsible.Content>
    </AnimatedCollapsible.Root>
  );
}
/**
 * Uncontrolled checkbox on the animate-ui primitive (drawn check). Inside a form it submits
 * `name` like a native checkbox, so FormData.has(name) still tells whether it is ticked.
 */
export function Checkbox({ id, name, disabled }: { id: string; name: string; disabled?: boolean }) {
  return (
    <AnimatedCheckbox.Root id={id} name={name} disabled={disabled} className="checkbox">
      <AnimatedCheckbox.Indicator className="checkbox-indicator" />
    </AnimatedCheckbox.Root>
  );
}
// Exit animation of the animate-ui dialog; the parent unmounts the dialog only after it.
const DIALOG_EXIT_MS = 180;
/**
 * Modal built on the animate-ui Radix primitive (motion enter/exit, focus trap, Escape).
 * Callers keep the "render it to open it" pattern: the dialog opens on mount and tells the
 * parent to unmount it once the closing animation has finished.
 */
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  // Focus returns to whatever opened the dialog, captured before focus moves inside it.
  const [trigger] = useState(() => document.activeElement as HTMLElement | null);
  const done = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(done.current), []);
  const close = () => {
    // A form that is still saving keeps the dialog open.
    if (!open || ref.current?.querySelector('form[aria-busy="true"]')) return;
    setOpen(false);
    done.current = setTimeout(onClose, DIALOG_EXIT_MS);
  };
  return (
    <AnimatedDialog.Root open={open} onOpenChange={(next) => !next && close()}>
      <AnimatedDialog.Portal>
        <AnimatedDialog.Overlay className="dialog-overlay" />
        <AnimatedDialog.Content
          ref={ref}
          className="dialog"
          aria-describedby={undefined}
          from="bottom"
          // Clicking the backdrop must not throw away a half-filled form; Escape and the close button do close.
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger?.focus();
          }}
        >
          <header className="dialog-header row between">
            <AnimatedDialog.Title>{title}</AnimatedDialog.Title>
            <button className="btn small" aria-label={t('Đóng hộp thoại')} onClick={close}>
              <X size={18} />
            </button>
          </header>
          <div className="dialog-body">
            <InDialog.Provider value>{children}</InDialog.Provider>
          </div>
        </AnimatedDialog.Content>
      </AnimatedDialog.Portal>
    </AnimatedDialog.Root>
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

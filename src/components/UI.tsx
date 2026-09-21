import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
export const Brand = () => (
  <Link className="brand" to="/">
    <Eye size={32} />
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
      <p className="eyebrow no-margin">Không gian đồng hành</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {actions && <div className="row page-head-actions">{actions}</div>}
  </header>
);
export const Badge = ({ children, tone = 'blue' }: { children: ReactNode; tone?: string }) => (
  <span className={'badge ' + tone}>{children}</span>
);
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
        Đang tải dữ liệu…
      </div>
    );
  if (error)
    return (
      <div className="notice error stack" role="alert">
        <strong>{error.message}</strong>
        {retry && (
          <button className="btn" onClick={retry}>
            Thử lại
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
        onClose();
      }}
    >
      <header className="dialog-header row between">
        <h2 id={label}>{title}</h2>
        <button className="btn small" aria-label="Đóng hộp thoại" onClick={onClose}>
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
            Hủy
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
                setError(e instanceof Error ? e.message : 'Không thể thực hiện.');
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? 'Đang xử lý…' : 'Xác nhận'}
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
          <label className="row">
            <Search size={17} />
            <span className="sr-only">Tìm kiếm {title}</span>
            <input
              className="search"
              style={{ width: 220, maxWidth: '100%' }}
              placeholder="Tìm kiếm…"
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
            Chưa có dữ liệu phù hợp. Thử thay đổi bộ lọc hoặc thêm dữ liệu mới.
          </p>
        )}
      </div>
      <footer className="pagination">
        <span>
          {filtered.length} kết quả · Trang {current}/{pages}
        </span>
        <div className="row">
          <button
            className="btn small"
            aria-label="Trang trước"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn small"
            aria-label="Trang sau"
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

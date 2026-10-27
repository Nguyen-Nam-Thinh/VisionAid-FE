import { t } from '../i18n';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';

/**
 * Collapses a list's filters behind a "Bộ lọc" button. The panel stays mounted while closed so
 * uncontrolled inputs keep their values; `active` counts the filters currently applied.
 */
export function FilterPanel({
  active,
  onApply,
  onReset,
  submitLabel = t('Tìm kiếm'),
  tools,
  extra,
  children,
}: {
  active: number;
  onApply: (form: HTMLFormElement) => void;
  onReset: (form: HTMLFormElement) => void;
  submitLabel?: string;
  /** Buttons beside the filter button on the left, e.g. reload. */
  tools?: ReactNode;
  /** Buttons on the right, e.g. create. */
  extra?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!anchor.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      // A picker's own Escape closes its list first; only close when focus is not in an open list.
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  useEffect(() => {
    if (open) form.current?.querySelector<HTMLElement>('input, select')?.focus();
  }, [open]);
  return (
    <div className="filter-bar">
      <div className="filter-left">
        <div className="filter-anchor" ref={anchor}>
          <button
            ref={toggle}
            type="button"
            className={'btn' + (open || active ? ' is-active' : '')}
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen(!open)}
          >
            <Filter size={16} aria-hidden="true" />
            {t('Bộ lọc')}
            {active > 0 && (
              <span className="filter-count" aria-label={t('{count} điều kiện', { count: active })}>
                {active}
              </span>
            )}
          </button>
          <form
            id={id}
            ref={form}
            className="filter-popover"
            aria-label={t('Bộ lọc')}
            hidden={!open}
            onSubmit={(e) => {
              e.preventDefault();
              onApply(e.currentTarget);
              setOpen(false);
            }}
          >
            <h3>{t('Bộ lọc')}</h3>
            <div className="filter-fields">{children}</div>
            <div className="filter-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  form.current?.reset();
                  onReset(form.current!);
                }}
              >
                <RotateCcw size={16} aria-hidden="true" />
                {t('Xóa điều kiện')}
              </button>
              <button className="btn primary">
                <Search size={16} aria-hidden="true" />
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
        {tools}
      </div>
      {extra && <div className="row">{extra}</div>}
    </div>
  );
}

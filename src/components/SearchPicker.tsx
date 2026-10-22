import { t } from '../i18n';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { PickerOption } from '../services/api/pickers';

export type PickerSearch = (term: string, signal?: AbortSignal) => Promise<PickerOption[]>;

/**
 * Combobox that finds a record by name/email and reports its id, so users never type UUIDs.
 * `queryKey` must identify the actor/scope of `search` to keep cached results apart.
 */
export function SearchPicker({
  id,
  label,
  value,
  onChange,
  search,
  queryKey,
  placeholder = t('Gõ tên hoặc email để tìm'),
  required,
  disabled,
  invalid,
  describedBy,
  children,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string, option?: PickerOption) => void;
  search: PickerSearch;
  queryKey: unknown[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Rendered under the control, e.g. a hint or field error. */
  children?: ReactNode;
}) {
  const auto = useId();
  const inputId = id ?? auto + '-input';
  const listId = auto + '-list';
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [chosen, setChosen] = useState<PickerOption | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);
  // Parent reset (e.g. "clear filters") drops the chosen record.
  const shown = value && chosen?.value === value ? chosen : null;
  const results = useQuery({
    queryKey: ['search-picker', ...queryKey, debounced],
    queryFn: ({ signal }) => search(debounced, signal),
    enabled: open && !disabled,
    retry: false,
    staleTime: 30000,
  });
  // Hide results of an older term until the debounced search catches up, so a quick
  // click or Enter never picks a record that does not match what was typed.
  const settled = term.trim() === debounced;
  const options = settled ? (results.data ?? []) : [];
  const choose = (option: PickerOption) => {
    setChosen(option);
    setTerm('');
    setOpen(false);
    onChange(option.value, option);
  };
  const clear = () => {
    setChosen(null);
    setTerm('');
    onChange('');
  };
  return (
    <div className="field picker">
      <label htmlFor={inputId}>
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="picker-control">
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={shown && !open ? shown.label : term}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setTerm('');
          }}
          onChange={(e) => {
            setTerm(e.target.value);
            setActive(0);
            setOpen(true);
            if (value) {
              setChosen(null);
              onChange('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setOpen(true);
              if (options.length)
                setActive(
                  (i) => (i + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length,
                );
            } else if (e.key === 'Enter' && open) {
              e.preventDefault();
              if (options[active]) choose(options[active]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
        />
        {shown && !disabled && (
          <button
            type="button"
            className="picker-clear"
            aria-label={t('Bỏ chọn {name}', { name: shown.label })}
            onClick={clear}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <ul id={listId} role="listbox" className="picker-list" aria-label={label}>
          {!settled || results.isPending ? (
            <li className="muted" role="presentation">
              {t('Đang tìm…')}
            </li>
          ) : results.isError ? (
            <li className="muted" role="presentation">
              {t('Không tải được kết quả. Thử gõ lại.')}
            </li>
          ) : !options.length ? (
            <li className="muted" role="presentation">
              {t('Không có kết quả phù hợp.')}
            </li>
          ) : (
            options.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={index === active ? 'active' : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.detail && <small>{option.detail}</small>}
              </li>
            ))
          )}
        </ul>
      )}
      {children}
    </div>
  );
}

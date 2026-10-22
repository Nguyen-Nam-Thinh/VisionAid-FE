import { t, tText } from '../i18n';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Fields } from '../models/domain';
import { SearchPicker, type PickerSearch } from './SearchPicker';

/** `label`, `hint` and option labels may be message ids (`msg()`); they are translated at render. */
export interface FieldSpec {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'checkbox'
    | 'select'
    | 'textarea'
    | 'date'
    | 'search';
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  hint?: string;
  step?: number;
  autoComplete?: string;
  /** For type 'search': finds records by name/email; the field value is the chosen id. */
  search?: PickerSearch;
  /** Cache key identifying the actor/scope of `search`. */
  searchKey?: unknown[];
}

export function Form({
  fields,
  initial = {},
  submit = t('Lưu thay đổi'),
  onSubmit,
}: {
  fields: FieldSpec[];
  initial?: Fields;
  submit?: string;
  onSubmit: (values: Fields) => Promise<unknown>;
}) {
  const prefix = useId();
  const shape: Record<string, z.ZodType<string | number | boolean, string | number | boolean>> = {};
  for (const field of fields) {
    if (field.type === 'checkbox') shape[field.key] = z.boolean();
    else if (field.type === 'number') {
      let rule = z.number({ error: t('Cần nhập một số hợp lệ.') });
      if (field.min !== undefined)
        rule = rule.min(field.min, t('Giá trị tối thiểu {min}.', { min: field.min }));
      if (field.max !== undefined)
        rule = rule.max(field.max, t('Giá trị tối đa {max}.', { max: field.max }));
      shape[field.key] = rule;
    } else {
      let rule = z.string();
      if (field.required)
        rule = rule.min(
          field.type === 'password' ? 8 : field.key === 'name' ? 2 : 1,
          field.type === 'password'
            ? t('Mật khẩu cần ít nhất 8 ký tự.')
            : t('Vui lòng nhập thông tin.'),
        );
      if (field.max) rule = rule.max(field.max, t('Tối đa {max} ký tự.', { max: field.max }));
      shape[field.key] = field.type === 'email' ? rule.email(t('Email không hợp lệ.')) : rule;
    }
  }
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Fields>({
    resolver: zodResolver(z.object(shape)),
    defaultValues: Object.fromEntries(
      fields.map((f) => [
        f.key,
        initial[f.key] ?? (f.type === 'checkbox' ? false : f.type === 'number' ? (f.min ?? 0) : ''),
      ]),
    ),
  });
  const values = useWatch({ control });
  const [failure, setFailure] = useState('');
  const hasCoordinates = fields.some((f) => f.key === 'lat') && fields.some((f) => f.key === 'lng');
  return (
    <form
      className="stack"
      aria-busy={isSubmitting}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFailure('');
        try {
          await onSubmit(values);
        } catch (error) {
          const err = error as { message?: string; fields?: Record<string, string> };
          setFailure(err.message ?? t('Không thể lưu thay đổi.'));
          Object.entries(err.fields ?? {}).forEach(([key, message], index) =>
            setError(key, { message }, { shouldFocus: index === 0 }),
          );
        }
      })}
    >
      {fields.map((field) => {
        const fieldId = prefix + '-' + field.key;
        const props = {
          id: fieldId,
          disabled: field.disabled || isSubmitting,
          'aria-invalid': !!errors[field.key],
          'aria-describedby':
            (errors[field.key] ? fieldId + '-error ' : '') + (field.hint ? fieldId + '-hint' : ''),
        };
        const feedback = (
          <>
            {errors[field.key] && (
              <span id={fieldId + '-error'} className="field-error" role="alert">
                {errors[field.key]?.message as string}
              </span>
            )}
            {field.hint && <small id={fieldId + '-hint'}>{tText(field.hint)}</small>}
          </>
        );
        if (field.type === 'search' && field.search)
          return (
            <SearchPicker
              key={field.key}
              id={fieldId}
              label={tText(field.label)}
              required={field.required}
              disabled={props.disabled}
              invalid={props['aria-invalid']}
              describedBy={props['aria-describedby'] || undefined}
              value={String(values[field.key] ?? '')}
              onChange={(id) => setValue(field.key, id, { shouldValidate: true })}
              search={field.search}
              queryKey={field.searchKey ?? [field.key]}
            >
              {feedback}
            </SearchPicker>
          );
        return (
          <div
            className={field.type === 'checkbox' ? 'field field-checkbox' : 'field'}
            key={field.key}
          >
            <label htmlFor={fieldId}>
              {tText(field.label)}
              {field.required ? ' *' : ''}
            </label>
            {field.type === 'select' ? (
              <select {...register(field.key)} {...props}>
                <option value="">{t('Chọn…')}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {tText(option.label)}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea {...register(field.key)} {...props} />
            ) : (
              <input
                {...register(field.key, { valueAsNumber: field.type === 'number' })}
                {...props}
                type={field.type ?? 'text'}
                step={field.step ?? 'any'}
                autoComplete={
                  field.autoComplete ??
                  (field.type === 'password'
                    ? 'current-password'
                    : field.type === 'email'
                      ? 'email'
                      : 'off')
                }
              />
            )}
            {feedback}
          </div>
        );
      })}
      {hasCoordinates && (
        <div className="stack">
          <p className="notice">
            {t(
              'Chọn điểm trên sơ đồ demo hoặc nhập tọa độ chính xác ở trên. Không phải bản đồ địa lý.',
            )}
          </p>
          <button
            type="button"
            className="map"
            style={{ minHeight: 180 }}
            aria-label={t('Chọn vị trí trên sơ đồ demo; dùng ô tọa độ để nhập bằng bàn phím')}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = event.detail === 0 ? 0.5 : (event.clientX - rect.left) / rect.width;
              const y = event.detail === 0 ? 0.5 : (event.clientY - rect.top) / rect.height;
              setValue('lng', Number((106.79 + x * 0.06).toFixed(6)), { shouldValidate: true });
              setValue('lat', Number((10.87 - y * 0.05).toFixed(6)), { shouldValidate: true });
            }}
          >
            <svg
              viewBox="0 0 300 180"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            >
              <circle
                cx="150"
                cy="85"
                r={Math.min(70, Math.max(8, Number(values.radius ?? 50) / 10))}
                fill="#1856ff25"
                stroke="#1856ff"
                strokeDasharray="5 3"
              />
              <circle cx="150" cy="85" r="5" fill="#1856ff" />
            </svg>
            <span className="map-caption">
              {t('Tâm: {p1}, {p3} · {p5} m', {
                p1: String(values.lat),
                p3: String(values.lng),
                p5: String(values.radius),
              })}
            </span>
          </button>
        </div>
      )}
      {failure && (
        <p className="notice error" role="alert">
          {failure}
        </p>
      )}
      <button type="submit" className="btn primary" disabled={isSubmitting}>
        {isSubmitting ? t('Đang xử lý…') : submit}
      </button>
    </form>
  );
}

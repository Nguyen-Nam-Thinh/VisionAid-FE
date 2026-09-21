import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Fields } from '../models/domain';

export interface FieldSpec {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'checkbox' | 'select' | 'textarea' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  hint?: string;
  step?: number;
}

export function Form({
  fields,
  initial = {},
  submit = 'Lưu thay đổi',
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
      let rule = z.number({ error: 'Cần nhập một số hợp lệ.' });
      if (field.min !== undefined)
        rule = rule.min(field.min, 'Giá trị tối thiểu ' + field.min + '.');
      if (field.max !== undefined) rule = rule.max(field.max, 'Giá trị tối đa ' + field.max + '.');
      shape[field.key] = rule;
    } else {
      let rule = z.string();
      if (field.required)
        rule = rule.min(
          field.type === 'password' ? 8 : field.key === 'name' ? 2 : 1,
          field.type === 'password' ? 'Mật khẩu cần ít nhất 8 ký tự.' : 'Vui lòng nhập thông tin.',
        );
      if (field.max) rule = rule.max(field.max);
      shape[field.key] = field.type === 'email' ? rule.email('Email không hợp lệ.') : rule;
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
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFailure('');
        try {
          await onSubmit(values);
        } catch (error) {
          const err = error as { message?: string; fields?: Record<string, string> };
          setFailure(err.message ?? 'Không thể lưu thay đổi.');
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
        return (
          <div className="field" key={field.key}>
            <label htmlFor={fieldId}>
              {field.label}
              {field.required ? ' *' : ''}
            </label>
            {field.type === 'select' ? (
              <select {...register(field.key)} {...props}>
                <option value="">Chọn…</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                  field.type === 'password'
                    ? 'current-password'
                    : field.type === 'email'
                      ? 'email'
                      : 'off'
                }
              />
            )}
            {errors[field.key] && (
              <span id={fieldId + '-error'} className="field-error" role="alert">
                {errors[field.key]?.message as string}
              </span>
            )}
            {field.hint && <small id={fieldId + '-hint'}>{field.hint}</small>}
          </div>
        );
      })}
      {hasCoordinates && (
        <div className="stack">
          <p className="notice">
            Chọn điểm trên sơ đồ demo hoặc nhập tọa độ chính xác ở trên. Không phải bản đồ địa lý.
          </p>
          <button
            type="button"
            className="map"
            style={{ minHeight: 180 }}
            aria-label="Chọn vị trí trên sơ đồ demo; dùng ô tọa độ để nhập bằng bàn phím"
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
              Tâm: {String(values.lat)}, {String(values.lng)} · {String(values.radius)} m
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
        {isSubmitting ? 'Đang xử lý…' : submit}
      </button>
    </form>
  );
}

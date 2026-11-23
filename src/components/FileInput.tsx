import { t } from '../i18n';
import { useState, type InputHTMLAttributes } from 'react';

/**
 * File picker with Vietnamese copy. The native control shows the browser's own language
 * ("Choose File / No file chosen"), so it is visually hidden and a styled button stands in.
 * Place it inside a <label className="field"> so clicking the label opens the picker.
 */
export function FileInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const { onChange, ...rest } = props;
  const [names, setNames] = useState('');
  return (
    <span className="file-input">
      <input
        {...rest}
        type="file"
        className="file-input-native"
        onChange={(event) => {
          setNames(
            Array.from(event.currentTarget.files ?? [])
              .map((file) => file.name)
              .join(', '),
          );
          onChange?.(event);
        }}
      />
      <span className="btn small" aria-hidden="true">
        {t('Chọn tệp')}
      </span>
      <span className="file-input-name">{names || t('Chưa chọn tệp nào')}</span>
    </span>
  );
}

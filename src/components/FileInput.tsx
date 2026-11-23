import { t } from '../i18n';
import { useState, type InputHTMLAttributes } from 'react';

/**
 * File picker with Vietnamese copy. The native control shows the browser's own language
 * ("Choose File / No file chosen"), so it is visually hidden and a styled button stands in.
 * Place it inside a <label className="field"> so clicking the label opens the picker.
 */
export function FileInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const { onChange, onInvalid, ...rest } = props;
  const [names, setNames] = useState('');
  // The browser's "Please select a file." bubble is English and points at the hidden input, so a
  // required file is reported here in Vietnamese instead.
  const [missing, setMissing] = useState(false);
  return (
    <span className="file-input">
      <input
        {...rest}
        type="file"
        className="file-input-native"
        onInvalid={(event) => {
          event.preventDefault();
          setMissing(true);
          onInvalid?.(event);
        }}
        onChange={(event) => {
          setMissing(false);
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
      {missing && (
        <span className="field-error" role="alert">
          {t('Hãy chọn ít nhất một tệp.')}
        </span>
      )}
    </span>
  );
}

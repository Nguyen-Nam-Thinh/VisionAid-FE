import { Moon, Sun } from 'lucide-react';
import { useI18n } from '../i18n';
import { setTheme, useTheme } from '../stores/theme';

/** One button: shows the theme you would switch to, says the current one to screen readers. */
export function ThemeSwitch({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const theme = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={'btn theme-switch ' + className}
      aria-pressed={dark}
      aria-label={t('Giao diện tối')}
      title={dark ? t('Chuyển sang giao diện sáng') : t('Chuyển sang giao diện tối')}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

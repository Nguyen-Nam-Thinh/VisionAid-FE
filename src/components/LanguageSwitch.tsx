import { Languages } from 'lucide-react';
import { locales, useI18n, type Locale } from '../i18n';
const names: Record<Locale, { short: string; full: string }> = {
  // i18n-ignore: each language is named in its own language.
  vi: { short: 'VI', full: 'Tiếng Việt' },
  en: { short: 'EN', full: 'English' },
};
/** VI/EN toggle. Language names stay in their own language so either reader can find them. */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={'lang-switch ' + className} role="group" aria-label={t('Ngôn ngữ giao diện')}>
      <Languages size={16} aria-hidden="true" />
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={locale === code}
          aria-label={names[code].full}
          title={names[code].full}
          onClick={() => void setLocale(code)}
        >
          {names[code].short}
        </button>
      ))}
    </div>
  );
}

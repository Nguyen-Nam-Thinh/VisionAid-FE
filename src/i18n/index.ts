import { useSyncExternalStore } from 'react';
// Type-only: the English dictionary is a separate chunk loaded when English is chosen.
import type { en, EnMessage } from './en';
/**
 * Lightweight typed i18n. Vietnamese source text is the message id (gettext style), so the
 * default locale needs no dictionary and every id must exist in `en` (checked by TypeScript).
 * Only UI copy goes through `t`; API data, enums sent to the BE and technical names stay as is.
 */
export type Locale = 'vi' | 'en';
export type MessageId = keyof typeof en;
// Template-literal semantics: values are stringified as `${value}` would be.
export type MessageParams = Record<string, string | number | boolean | null | undefined>;
export const locales: readonly Locale[] = ['vi', 'en'];
export const defaultLocale: Locale = 'vi';
const storageKey = 'visionaid.locale';
const intlTags: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };
type Dictionary = Partial<Record<string, EnMessage>>;
const dictionaries: Record<Locale, Dictionary | undefined> = { vi: {}, en: undefined };
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  vi: async () => ({}),
  en: () => import('./en').then((module) => module.en),
};
const loading = new Map<Locale, Promise<void>>();
const isLocale = (value: unknown): value is Locale => value === 'vi' || value === 'en';
function readStored(): Locale {
  try {
    const stored = globalThis.localStorage?.getItem(storageKey);
    return isLocale(stored) ? stored : defaultLocale;
  } catch {
    return defaultLocale;
  }
}
let current: Locale = readStored();
const listeners = new Set<() => void>();
let switchRequest = 0;
const notify = () => listeners.forEach((fn) => fn());
function applyDocumentLang(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.title = translate(locale, 'VisionAid · Đồng hành an tâm' satisfies MessageId);
}
export const getLocale = () => current;
export const intlLocale = (locale: Locale = current) => intlTags[locale];
/**
 * Loads a locale's dictionary once. Until it arrives, text falls back to Vietnamese; when the
 * current locale finishes loading, subscribers re-render with the translations.
 */
export function loadLocale(locale: Locale): Promise<void> {
  if (dictionaries[locale]) return Promise.resolve();
  let pending = loading.get(locale);
  if (!pending) {
    pending = loaders[locale]()
      .then((dictionary) => {
        dictionaries[locale] = dictionary;
        if (locale === current) {
          applyDocumentLang(locale);
          notify();
        }
      })
      .finally(() => loading.delete(locale));
    loading.set(locale, pending);
  }
  return pending;
}
/** Switches language after its dictionary is ready; a later choice wins over a slower load. */
export async function setLocale(next: Locale) {
  if (!isLocale(next)) return;
  const request = ++switchRequest;
  try {
    await loadLocale(next);
  } catch {
    return; // Chunk failed to load (offline): keep the current language.
  }
  if (request !== switchRequest || next === current) return;
  current = next;
  try {
    globalThis.localStorage?.setItem(storageKey, next);
  } catch {
    // Storage blocked (private mode, policy): the choice lasts for this page only.
  }
  applyDocumentLang(next);
  notify();
}
export function subscribeLocale(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function interpolate(text: string, params?: MessageParams) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
/**
 * Resolves a message for a locale. Missing translations fall back to the Vietnamese id, so an
 * untranslated string never renders as a blank or a raw key.
 */
export function translate(
  locale: Locale,
  id: string,
  params?: MessageParams,
  dictionary: Dictionary = dictionaries[locale] ?? {},
) {
  const entry = locale === 'vi' ? undefined : dictionary[id];
  if (entry === undefined) return interpolate(id, params);
  if (typeof entry === 'string') return interpolate(entry, params);
  const count = Number(params?.count);
  const form = new Intl.PluralRules(intlTags[locale]).select(Number.isFinite(count) ? count : 0);
  return interpolate(form === 'one' ? entry.one : entry.other, params);
}
applyDocumentLang(current);
/** Translates with the current locale. Call during render or when the text is produced. */
export const t = (id: MessageId, params?: MessageParams) => translate(current, id, params);
/** Translates text that is only known at runtime (stored labels); unknown text is returned as is. */
export const tText = (text: string, params?: MessageParams) => translate(current, text, params);
/** Marks module-level copy for translation later at render time (`t(label)`); returns the id. */
export const msg = <K extends MessageId>(id: K): K => id;
/**
 * Module-level label map (enum value → copy) whose properties translate on every read, so
 * `map[value]` follows the current locale without changing call sites.
 */
export function labelMap<T extends Record<string, MessageId | string>>(
  ids: T,
): { readonly [K in keyof T]: string } {
  const out = {};
  // Values that are not message ids (technical names such as 'SignalR') are returned unchanged.
  for (const key of Object.keys(ids))
    Object.defineProperty(out, key, { enumerable: true, get: () => tText(ids[key]) });
  return out as { readonly [K in keyof T]: string };
}
export function useI18n() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return { locale, setLocale, t };
}
const toDate = (value: string | number | Date) => (value instanceof Date ? value : new Date(value));
/** Date + time in the locale's default layout; replaces `toLocaleString('vi-VN', options)`. */
export const formatLocaleDateTime = (
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
) => toDate(value).toLocaleString(intlLocale(), options);
export const formatNumber = (value: number, options: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(intlLocale(), options).format(value);
/** Money keeps the API currency code (VND) after the amount, as the UI showed before. */
export const formatMoney = (amount: number, currency: string, maximumFractionDigits = 2) =>
  `${formatNumber(amount, { maximumFractionDigits })} ${currency}`;

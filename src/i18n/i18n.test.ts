import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
type I18n = typeof import('./index');
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  };
}
const fakeDocument = () => ({ documentElement: { lang: '' }, title: '' });
async function load(storage: unknown = memoryStorage()) {
  vi.resetModules();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('document', fakeDocument());
  return (await import('./index')) as I18n;
}
afterEach(() => vi.unstubAllGlobals());

describe('locale switching', () => {
  let i18n: I18n;
  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(async () => {
    storage = memoryStorage();
    i18n = await load(storage);
  });
  it('defaults to Vietnamese, the message id itself', () => {
    expect(i18n.getLocale()).toBe('vi');
    expect(i18n.t('Đăng nhập')).toBe('Đăng nhập');
    expect(document.documentElement.lang).toBe('vi');
    expect(document.title).toBe('VisionAid · Đồng hành an tâm');
  });
  it('switches to English, persists the choice, updates <html lang> and notifies', async () => {
    const listener = vi.fn();
    const unsubscribe = i18n.subscribeLocale(listener);
    await i18n.setLocale('en');
    expect(i18n.t('Đăng nhập')).toBe('Sign in');
    expect(i18n.intlLocale()).toBe('en-US');
    expect(storage.data.get('visionaid.locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('VisionAid · Care with peace of mind');
    expect(listener).toHaveBeenCalledTimes(1);
    await i18n.setLocale('en');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await i18n.setLocale('vi');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(i18n.t('Đăng nhập')).toBe('Đăng nhập');
  });
  it('ignores unsupported locales', async () => {
    await i18n.setLocale('fr' as never);
    expect(i18n.getLocale()).toBe('vi');
  });
  it('interpolates parameters in both languages', async () => {
    const params = { totalCount: 12, page: 2, p4: 3 };
    expect(i18n.t('{totalCount} kết quả · Trang {page}/{p4}', params)).toBe(
      '12 kết quả · Trang 2/3',
    );
    await i18n.setLocale('en');
    expect(i18n.t('{totalCount} kết quả · Trang {page}/{p4}', params)).toBe(
      '12 results · Page 2/3',
    );
  });
  it('translates label maps on every read', async () => {
    const map = i18n.labelMap({ Active: i18n.msg('Đang hoạt động'), Tech: 'SignalR' });
    expect(map.Active).toBe('Đang hoạt động');
    await i18n.setLocale('en');
    expect(map.Active).toBe('Active');
    expect(map.Tech).toBe('SignalR');
    expect(Object.entries(map)).toEqual([
      ['Active', 'Active'],
      ['Tech', 'SignalR'],
    ]);
  });
});

describe('stored preference', () => {
  it('restores a saved locale and translates once its dictionary has loaded', async () => {
    const i18n = await load(memoryStorage({ 'visionaid.locale': 'en' }));
    const listener = vi.fn();
    i18n.subscribeLocale(listener);
    expect(i18n.getLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    // The English chunk is not loaded yet: Vietnamese is shown instead of blanks.
    expect(i18n.t('Đăng nhập')).toBe('Đăng nhập');
    await i18n.loadLocale('en');
    expect(i18n.t('Đăng nhập')).toBe('Sign in');
    expect(document.title).toBe('VisionAid · Care with peace of mind');
    expect(listener).toHaveBeenCalledTimes(1);
  });
  it('lets the latest choice win when a slower load finishes later', async () => {
    const i18n = await load();
    const english = i18n.setLocale('en');
    await i18n.setLocale('vi');
    await english;
    expect(i18n.getLocale()).toBe('vi');
  });
  it('falls back to Vietnamese for unknown stored values', async () => {
    const i18n = await load(memoryStorage({ 'visionaid.locale': 'de' }));
    expect(i18n.getLocale()).toBe('vi');
  });
  it('keeps working when storage throws', async () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const i18n = await load(blocked);
    expect(i18n.getLocale()).toBe('vi');
    await expect(i18n.setLocale('en')).resolves.toBeUndefined();
    expect(i18n.t('Đăng xuất')).toBe('Sign out');
  });
});

describe('fallback', () => {
  it('returns the Vietnamese id when English has no entry', async () => {
    const { translate, tText, setLocale } = await load();
    expect(translate('en', 'Chuỗi chưa dịch {name}', { name: 'An' }, {})).toBe(
      'Chuỗi chưa dịch An',
    );
    await setLocale('en');
    expect(tText('Dữ liệu từ API')).toBe('Dữ liệu từ API');
    expect(tText('Đăng nhập')).toBe('Sign in');
  });
  it('leaves unknown placeholders and stringifies values like a template literal', async () => {
    const { translate } = await load();
    expect(translate('vi', 'A {x} {y}', { x: undefined })).toBe('A undefined {y}');
    expect(translate('vi', 'B {x}', { x: true })).toBe('B true');
  });
  it('selects plural forms with Intl.PluralRules', async () => {
    const { translate } = await load();
    const dictionary = { '{count} ảnh': { one: '{count} photo', other: '{count} photos' } };
    expect(translate('en', '{count} ảnh', { count: 1 }, dictionary)).toBe('1 photo');
    expect(translate('en', '{count} ảnh', { count: 4 }, dictionary)).toBe('4 photos');
  });
});

describe('formatters', () => {
  it('formats numbers and money for the current locale', async () => {
    const { formatNumber, formatMoney, setLocale } = await load();
    expect(formatNumber(1234567.5)).toBe('1.234.567,5');
    expect(formatMoney(99000, 'VND')).toBe('99.000 VND');
    await setLocale('en');
    expect(formatNumber(1234567.5)).toBe('1,234,567.5');
    expect(formatMoney(4500000, 'VND')).toBe('4,500,000 VND');
    expect(formatMoney(1.239, 'USD')).toBe('1.24 USD');
  });
  it('formats date-times in the locale layout', async () => {
    const { formatLocaleDateTime, setLocale } = await load();
    const at = '2026-10-20T03:04:05Z';
    const options = { timeZone: 'UTC', hour12: false } as const;
    expect(formatLocaleDateTime(at, options)).toBe(new Date(at).toLocaleString('vi-VN', options));
    await setLocale('en');
    expect(formatLocaleDateTime(at, options)).toBe('10/20/2026, 03:04:05');
  });
});

describe('HTTP error mapping', () => {
  it('localizes BE error codes and status messages at throw time', async () => {
    const { setLocale } = await load();
    const { request } = await import('../services/http/client');
    const problem = (status: number, body: object) => async () =>
      new Response(JSON.stringify(body), { status });
    const codeError = problem(409, { detail: 'raw', errorCode: 'MAX_SAVED_LOCATIONS_REACHED' });
    await expect(request('/x', {}, codeError)).rejects.toThrow('Đã đủ 20 địa điểm.');
    await setLocale('en');
    await expect(request('/x', {}, codeError)).rejects.toThrow('There are already 20 places.');
    await expect(request('/x', {}, problem(403, {}))).rejects.toThrow(
      'You are not allowed to perform this action.',
    );
    // Unknown codes keep the BE detail untouched (API data is not translated).
    await expect(
      request('/x', {}, problem(400, { detail: 'Lỗi từ máy chủ', errorCode: 'NEW_CODE' })),
    ).rejects.toThrow('Lỗi từ máy chủ');
  });
});

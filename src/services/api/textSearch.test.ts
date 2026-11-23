import { expect, it, vi } from 'vitest';
import {
  collectPages,
  containsText,
  normalizeText,
  pageOf,
  searchWithoutAccents,
} from './textSearch';
import { formatPhone, normalizePhone } from './phone';

const page = <T>(items: T[], current = 1, totalPages = 1) => ({
  items,
  page: current,
  pageSize: 10,
  totalCount: items.length,
  totalPages,
  hasNextPage: current < totalPages,
  hasPreviousPage: current > 1,
});

it('matches typed words anywhere, without accents or case', () => {
  expect(normalizeText('  Phúc  ĐĂNG ')).toBe('phuc dang');
  expect(containsText('phuc', 'Phúc Test Phụ')).toBe(true);
  expect(containsText('binh minh', 'Trung tâm Bảo trợ Bình Minh')).toBe(true);
  expect(containsText('hung', null, 'Nguyễn Văn Hùng')).toBe(true);
  expect(containsText('mai', 'Nguyễn Văn Hùng')).toBe(false);
  expect(containsText('tran mai', 'Trần Thị Mai')).toBe(true);
  expect(containsText('mai example', 'Trần Thị Mai', 'mai@example.com')).toBe(true);
  expect(containsText('tran hung', 'Trần Thị Mai')).toBe(false);
  // Accents typed by the user count; accent-free words still match any accents.
  expect(containsText('Chặn', 'Chặn nhận diện bằng ảnh chụp')).toBe(true);
  expect(containsText('Chặn', 'được đánh dấu là chưa chắc chắn')).toBe(false);
  expect(containsText('chan', 'Chặn nhận diện')).toBe(true);
  expect(containsText('Phúc', 'phúc test')).toBe(true);
  expect(containsText('', 'anything')).toBe(true);
});

it('reads every page and slices filtered rows like the server', async () => {
  const load = vi.fn(async (p: number) => page([p * 10, p * 10 + 1], p, 3));
  expect(await collectPages(load)).toEqual([10, 11, 20, 21, 30, 31]);
  const sliced = pageOf([1, 2, 3, 4, 5], 2, 2);
  expect(sliced).toMatchObject({ items: [3, 4], totalCount: 5, totalPages: 3, hasNextPage: true });
  expect(pageOf([], 4)).toMatchObject({ items: [], page: 1, totalPages: 1 });
});

it('scans every row word by word only when the server finds nothing', async () => {
  const rows = [{ name: 'Trung tâm Bình Minh' }, { name: 'Trung tâm Ánh Sáng' }];
  const load = vi.fn(async (search: string) =>
    page(search ? rows.filter((row) => row.name.includes(search)) : rows),
  );
  expect((await searchWithoutAccents('Bình', 1, load, (r) => [r.name])).items).toHaveLength(1);
  expect(load).toHaveBeenCalledTimes(1);
  load.mockClear();
  const found = await searchWithoutAccents('binh minh', 1, load, (r) => [r.name]);
  expect(found.items).toEqual([rows[0]]);
  expect(load.mock.calls.map((call) => call[0])).toEqual(['binh minh', '']);
  load.mockClear();
  expect((await searchWithoutAccents('Bình An', 1, load, (r) => [r.name])).items).toEqual([]);
  expect(load).toHaveBeenCalledTimes(2);
});

it('accepts phone numbers the way people type them', () => {
  expect(normalizePhone('028 3829 5555')).toBe('02838295555');
  expect(normalizePhone('090.123.4567')).toBe('0901234567');
  expect(normalizePhone('+84 90 123 4567')).toBe('0901234567');
  expect(normalizePhone('(028) 3829-5555')).toBe('02838295555');
  expect(formatPhone('0909123456')).toBe('0909 123 456');
  expect(formatPhone('02838295555')).toBe('028 3829 5555');
  expect(formatPhone('113')).toBe('113');
  expect(formatPhone(null)).toBe('');
});

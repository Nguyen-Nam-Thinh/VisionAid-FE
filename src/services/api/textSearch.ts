// Free-text "contains" filtering for list filters whose API only accepts one record id
// (caregiver, care recipient, actor...). Typing "phuc" finds every "Phúc" by name or email.

/** Lower case, no Vietnamese diacritics, so "phuc" matches "Phúc" and "PHÚC". */
export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lower case only, accents kept (NFC so "ặ" typed two ways compares equal). */
const lowerText = (value: string) =>
  value.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * True when the term is empty or every typed word appears somewhere in the fields, in any
 * order: "tran mai" finds "Trần Thị Mai", "mai gmail" finds her by name and email together.
 * A word typed without accents matches any accents ("phuc" → "Phúc"); a word typed with
 * accents must match them ("chặn" finds "Chặn" but not "chắc chắn").
 */
export function containsText(term: string, ...fields: (string | null | undefined)[]) {
  const words = lowerText(term).split(' ').filter(Boolean);
  if (!words.length) return true;
  const text = fields.filter(Boolean).join(' ');
  const plain = normalizeText(text);
  const exact = lowerText(text);
  return words.every((word) =>
    normalizeText(word) === word ? plain.includes(word) : exact.includes(word),
  );
}

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/** Upper bound of server pages read for one text search (10–20 rows each). */
const MAX_PAGES = 50;
/** Pages requested at the same time after the first one tells how many there are. */
const PARALLEL = 6;

/** Reads every page of a list, so a text filter can look through all rows the server allows. */
export async function collectPages<T>(
  load: (page: number) => Promise<Pick<PageResult<T>, 'items' | 'totalPages' | 'hasNextPage'>>,
) {
  const first = await load(1);
  const items: T[] = [...first.items];
  const last = Math.min(first.totalPages, MAX_PAGES);
  if (!first.hasNextPage) return items;
  for (let start = 2; start <= last; start += PARALLEL) {
    const pages = Array.from({ length: Math.min(PARALLEL, last - start + 1) }, (_, i) => start + i);
    for (const result of await Promise.all(pages.map(load))) items.push(...result.items);
  }
  return items;
}

/** Slices already filtered rows into the same page shape the server returns. */
export function pageOf<T>(items: T[], page: number, pageSize = 20): PageResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageSize,
    totalCount: items.length,
    totalPages,
    hasNextPage: current < totalPages,
    hasPreviousPage: current > 1,
  };
}

/**
 * Server search matches the exact phrase with accents, so "binh minh" misses "Bình Minh" and
 * "trần mai" misses "Trần Thị Mai". When the server finds nothing, every page is read once and
 * matched word by word without accents.
 */
export async function searchWithoutAccents<T>(
  term: string,
  page: number,
  /** `bulk` asks for large pages while scanning every row. */
  load: (search: string, page: number, bulk?: boolean) => Promise<PageResult<T>>,
  fields: (row: T) => (string | null | undefined)[],
) {
  const first = await load(term, page);
  // Also covers words typed out of order ("trần mai" for "Trần Thị Mai").
  if (!term.trim() || first.totalCount > 0) return first;
  const rows = await collectPages((p) => load('', p, true));
  return pageOf(
    rows.filter((row) => containsText(term, ...fields(row))),
    page,
    first.pageSize || 10,
  );
}

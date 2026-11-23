/**
 * Phone numbers as people type them: "028 3829 5555", "090.123.4567", "+84 90 123 4567".
 * Spaces, dots, dashes and brackets are dropped and +84 becomes 0, so validation and the
 * value sent to the server see "02838295555" / "0901234567".
 */
export function normalizePhone(value: string) {
  const digits = value.trim().replace(/[\s.\-()]/g, '');
  return digits.startsWith('+84') ? '0' + digits.slice(3) : digits;
}

/** For display: "0909123456" → "0909 123 456", "02838295555" → "028 3829 5555"; others unchanged. */
export function formatPhone(value: string | null | undefined) {
  if (!value) return '';
  const digits = normalizePhone(value);
  if (/^0[35789]\d{8}$/.test(digits))
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  if (/^02\d{9}$/.test(digits))
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  if (/^1[89]00\d{4}$/.test(digits)) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return value;
}

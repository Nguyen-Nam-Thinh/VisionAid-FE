import { expect, it } from 'vitest';
import { toCsv } from './csv';

it('quotes CSV cells, adds a BOM for Excel and neutralises formula injection', () => {
  const csv = toCsv([
    ['Thời gian', 'Văn bản'],
    ['10:00 11/10/2026', 'Xin chào, "bạn"\nDòng hai'],
    ['=HYPERLINK("http://x")', '+1'],
    ['-2', '@cmd'],
  ]);
  expect(csv.startsWith('﻿')).toBe(true);
  expect(csv.slice(1).split('\r\n')).toEqual([
    'Thời gian,Văn bản',
    '10:00 11/10/2026,"Xin chào, ""bạn""\nDòng hai"',
    `"'=HYPERLINK(""http://x"")",'+1`,
    "'-2,'@cmd",
  ]);
});

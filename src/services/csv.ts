// CSV for spreadsheet apps: RFC 4180 quoting, CRLF rows and a BOM so Excel reads UTF-8 Vietnamese.
// Cells starting with = + - @ (or tab / carriage return) are prefixed with ' so they never run as
// formulas; activity text such as OCR or QR content comes from the camera and is untrusted.
export function toCsv(rows: readonly (readonly string[])[]) {
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
    return /[",\r\n]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe;
  };
  return '﻿' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(fileName: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

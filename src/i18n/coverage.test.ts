import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { findUntranslated } from './scan';
import { en, type EnMessage } from './en';
// Mock seed/service data is demo content (names, sample records), not UI copy.
const skipped = /\.test\.|[\\/]e2e[\\/]|[\\/]i18n[\\/]|[\\/]services[\\/]mocks[\\/]/;
const walk = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
const sources = walk('src').filter((file) => /\.tsx?$/.test(file) && !skipped.test(file));
describe('i18n coverage', () => {
  it('has no Vietnamese UI copy outside t()/msg()/tText()', () => {
    const leftovers = sources.flatMap((file) =>
      findUntranslated(file, fs.readFileSync(file, 'utf8')).map(
        (item) => `${file.replace(/\\/g, '/')}:${item.line} ${JSON.stringify(item.text)}`,
      ),
    );
    expect(leftovers).toEqual([]);
  });
  it('keeps placeholders and edge spaces of each message', () => {
    const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const edges = (text: string) => [/^\s/.test(text), /\s$/.test(text)];
    const mismatched = Object.entries(en as Record<string, EnMessage>).flatMap(([id, value]) =>
      (typeof value === 'string' ? [value] : [value.one, value.other])
        // ' lần' (times) becomes a symbol glued to the number in English: "1×".
        .filter(
          (text) =>
            id !== ' lần' &&
            (JSON.stringify(names(text)) !== JSON.stringify(names(id)) ||
              JSON.stringify(edges(text)) !== JSON.stringify(edges(id))),
        )
        .map((text) => `${id} => ${text}`),
    );
    expect(mismatched).toEqual([]);
  });
  it('keeps every English message in use', () => {
    const code = [...sources, 'src/i18n/index.ts']
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');
    const quote = (text: string) =>
      "'" + text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
    const unused = Object.keys(en).filter((id) => !code.includes(quote(id)));
    expect(unused).toEqual([]);
  });
});

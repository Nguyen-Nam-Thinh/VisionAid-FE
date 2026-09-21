import { describe, it, expect } from 'vitest';
import { parseMode } from './runtime';
describe('service mode', () => {
  it('rejects typos instead of silently using mock', () => {
    expect(() => parseMode('production')).toThrow();
    expect(parseMode('api')).toBe('api');
    expect(parseMode()).toBe('mock');
  });
});

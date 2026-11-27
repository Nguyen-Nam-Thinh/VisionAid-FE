import { describe, it, expect } from 'vitest';
import { parseEmergencyNumber, parseMode } from './runtime';
describe('service mode', () => {
  it('rejects typos instead of silently using mock', () => {
    expect(() => parseMode('production')).toThrow();
    expect(parseMode('api')).toBe('api');
    expect(parseMode()).toBe('mock');
  });
  it('dials 115 unless a valid test number is configured', () => {
    expect(parseEmergencyNumber()).toBe('115');
    expect(parseEmergencyNumber('0393 003 069')).toBe('0393003069');
    expect(parseEmergencyNumber('+84393003069')).toBe('+84393003069');
    expect(parseEmergencyNumber('javascript:alert(1)')).toBe('115');
  });
});

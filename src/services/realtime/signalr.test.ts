import { afterEach, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
const fake = vi.hoisted(() => ({
  handlers: new Map<string, (v: unknown) => void>(),
  reconnecting: () => {},
  reconnected: () => {},
  closed: () => {},
  start: vi.fn<() => Promise<void>>(async () => {}),
  stop: vi.fn(async () => {}),
}));
vi.mock('@microsoft/signalr', () => ({
  LogLevel: { None: 6 },
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      return {
        start: fake.start,
        stop: fake.stop,
        on: (n: string, f: (v: unknown) => void) => fake.handlers.set(n, f),
        off: (n: string) => fake.handlers.delete(n),
        onreconnecting: (f: () => void) => {
          fake.reconnecting = f;
        },
        onreconnected: (f: () => void) => {
          fake.reconnected = f;
        },
        onclose: (f: () => void) => {
          fake.closed = f;
        },
      };
    }
  },
}));
import { createEventFilter, hubUrl, refreshRealtimeQueries, startSignalR } from './signalr';
const id = '01900000-0000-7000-8000-000000000001';
afterEach(() => {
  vi.useRealTimers();
  fake.handlers.clear();
  vi.clearAllMocks();
});
it('rejects malformed, duplicate and older events without synthesizing state', () => {
  const accept = createEventFilter();
  const payload = { viuId: id, recordedAt: '2026-10-01T12:00:00Z' };
  expect(accept('LocationUpdated', payload)).toBe(true);
  expect(accept('LocationUpdated', payload)).toBe(false);
  expect(accept('LocationUpdated', { ...payload, recordedAt: '2026-10-01T11:00:00Z' })).toBe(false);
  expect(accept('LocationUpdated', { ...payload, viuId: 'bad' })).toBe(false);
  expect(accept('EmergencyAlert', { viuId: id, eventId: id, sentAt: payload.recordedAt })).toBe(
    true,
  );
  expect(hubUrl('', 'https://api.visionaid.net', 'https:')).toBe(
    'https://api.visionaid.net/hubs/location',
  );
  expect(hubUrl('http://api.test/hubs/location', '', 'https:')).toBe('');
  expect(hubUrl('https://api.test/hubs/location?access_token=secret', '', 'https:')).toBe('');
});
it('refreshes only matching account and organization caches', async () => {
  const cache = new QueryClient();
  for (const user of [id, 'other']) cache.setQueryData(['api-alerts', user, 'org'], []);
  cache.setQueryData(['api-alerts', id, 'other-org'], []);
  await refreshRealtimeQueries(cache, { id, orgId: 'org' });
  expect(cache.getQueryState(['api-alerts', id, 'org'])?.isInvalidated).toBe(true);
  expect(cache.getQueryState(['api-alerts', 'other', 'org'])?.isInvalidated).toBe(false);
  expect(cache.getQueryState(['api-alerts', id, 'other-org'])?.isInvalidated).toBe(false);
  cache.clear();
});
it('coalesces bursts, resyncs on reconnect and drops callbacks after cleanup', async () => {
  vi.useFakeTimers();
  const data = vi.fn();
  const state = vi.fn();
  const stop = startSignalR('https://api.test/hubs/location', async () => 'token', data, state);
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(250);
  expect(data).toHaveBeenCalledTimes(1);
  const handler = fake.handlers.get('LocationUpdated')!;
  handler({ viuId: id, recordedAt: '2026-10-01T12:00:00Z' });
  handler({ viuId: id, recordedAt: '2026-10-01T12:00:01Z' });
  await vi.advanceTimersByTimeAsync(250);
  expect(data).toHaveBeenCalledTimes(2);
  fake.reconnecting();
  expect(state).toHaveBeenLastCalledWith('reconnecting');
  fake.reconnected();
  await vi.advanceTimersByTimeAsync(250);
  expect(data).toHaveBeenCalledTimes(3);
  stop();
  handler({ viuId: id, recordedAt: '2026-10-01T12:00:02Z' });
  fake.reconnected();
  await vi.advanceTimersByTimeAsync(500);
  expect(data).toHaveBeenCalledTimes(3);
  expect(fake.handlers.size).toBe(0);
  expect(fake.stop).toHaveBeenCalled();
});
it('reports initial connection failure without pretending to be connected', async () => {
  fake.start.mockRejectedValueOnce(Error('CORS'));
  const state = vi.fn();
  const stop = startSignalR('https://api.test/hubs/location', async () => 'token', vi.fn(), state);
  await Promise.resolve();
  await Promise.resolve();
  expect(state).toHaveBeenLastCalledWith('disconnected');
  stop();
});

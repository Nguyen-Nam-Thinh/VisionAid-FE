import { afterEach, expect, it, vi } from 'vitest';
import { createRealtimeClient } from './realtime/adapter';
import { createMockService } from './mocks/service';
import { requestBrowserPermission } from './notifications/adapter';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('refetches after reconnect and cancels timers after cleanup', async () => {
  vi.useFakeTimers();
  const execute = vi.fn(async () => {});
  const data = vi.fn();
  const state = vi.fn();
  const rt = createRealtimeClient({ mode: 'mock', execute });
  const cleanup = rt.start(data, state);
  expect(data).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(15000);
  expect(execute).toHaveBeenCalledTimes(1);
  rt.disconnect();
  await vi.advanceTimersByTimeAsync(30000);
  expect(execute).toHaveBeenCalledTimes(1);
  rt.reconnect();
  expect(state).toHaveBeenLastCalledWith('reconnecting');
  await vi.advanceTimersByTimeAsync(1500);
  expect(state).toHaveBeenLastCalledWith('connected');
  expect(data).toHaveBeenCalledTimes(3);
  cleanup();
  await vi.advanceTimersByTimeAsync(30000);
  expect(execute).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
it('API realtime never starts demo ticks', async () => {
  vi.useFakeTimers();
  const execute = vi.fn(async () => {});
  const state = vi.fn();
  const rt = createRealtimeClient({ mode: 'api', execute });
  const cleanup = rt.start(() => {}, state);
  rt.reconnect();
  await vi.advanceTimersByTimeAsync(30000);
  expect(state).toHaveBeenLastCalledWith('unconfigured');
  expect(execute).not.toHaveBeenCalled();
  cleanup();
});
it('handles notification denied and unsupported browsers', async () => {
  vi.stubGlobal('Notification', undefined);
  expect(await requestBrowserPermission()).toContain('không hỗ trợ');
  vi.stubGlobal('Notification', { requestPermission: async () => 'denied' });
  expect(await requestBrowserPermission()).toContain('từ chối');
});
it('rolls back profile changes when persistence fails', async () => {
  let full = false;
  const s = createMockService(
    {
      read: () => null,
      write: () => {
        if (full) throw Error('quota');
      },
    },
    0,
  );
  await s.login('caregiver@demo.vn', 'Demo@123');
  full = true;
  await expect(s.profile({ name: 'Không được lưu', phone: '' })).rejects.toMatchObject({
    status: 507,
  });
  expect((await s.session())?.name).toBe('Nguyễn Minh Anh');
});

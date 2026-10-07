import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { enablePush, disablePush, pushOwner, pushOwnerKey } from './push';
const firebase = vi.hoisted(() => ({
  getToken: vi.fn(async () => 'token'),
  deleteToken: vi.fn(async () => true),
}));
vi.mock('@firebase/app', () => ({ getApps: () => [{}], initializeApp: () => ({}) }));
vi.mock('@firebase/messaging', () => ({
  ...firebase,
  getMessaging: () => ({}),
  isSupported: async () => true,
}));
let stored: Map<string, string>;
let enabled: boolean;
let unsubscribe: ReturnType<typeof vi.fn>;
beforeEach(() => {
  stored = new Map();
  enabled = false;
  firebase.getToken.mockReset().mockResolvedValue('token');
  unsubscribe = vi.fn(async () => true);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => stored.get(k) || null,
    setItem: (k: string, v: string) => stored.set(k, v),
    removeItem: (k: string) => stored.delete(k),
  });
  vi.stubGlobal('Notification', {
    permission: 'granted',
    requestPermission: vi.fn(async () => 'granted'),
  });
  vi.stubGlobal('window', {
    isSecureContext: true,
    Notification: {},
    PushManager: {},
    caches: {},
    dispatchEvent: vi.fn(),
  });
  let queue = Promise.resolve<unknown>(undefined);
  vi.stubGlobal('navigator', {
    locks: {
      request: (_: string, run: () => Promise<unknown>) => {
        const result = queue.then(run);
        queue = result.catch(() => {});
        return result;
      },
    },
    serviceWorker: {
      getRegistration: async () => ({
        getNotifications: async () => [],
        pushManager: { getSubscription: async () => ({ unsubscribe }) },
      }),
    },
  });
  vi.stubGlobal('caches', {
    delete: async () => {
      enabled = false;
    },
    open: async () => ({
      put: async () => {
        enabled = true;
      },
    }),
  });
});
afterEach(() => vi.unstubAllGlobals());
it('registers only after permission, rotates browser owner, disables even when Firebase is offline', async () => {
  const register = vi.fn(async () => {});
  await enablePush('user:device', register);
  expect(register).toHaveBeenCalledWith('token');
  expect(pushOwner()).toBe('user:device');
  expect(enabled).toBe(true);
  await enablePush('other:tab', register, false);
  expect(register).toHaveBeenCalledTimes(1);
  await enablePush('other:tab', register);
  expect(pushOwner()).toBe('other:tab');
  expect(register).toHaveBeenCalledTimes(2);
  await enablePush('user:device', register, false);
  expect(register).toHaveBeenCalledTimes(2);
  firebase.deleteToken.mockRejectedValueOnce(new Error('offline'));
  await disablePush();
  expect(unsubscribe).toHaveBeenCalled();
  expect(pushOwner()).toBeNull();
  expect(enabled).toBe(false);
  vi.stubGlobal('Notification', { permission: 'denied', requestPermission: async () => 'denied' });
  await expect(enablePush('user:device', register)).rejects.toThrow('Chưa được cấp quyền');
  expect(register).toHaveBeenCalledTimes(2);
});
it('revokes a token after backend failure and cannot enable after logout during token retrieval', async () => {
  await expect(
    enablePush('user:device', async () => {
      throw new Error('BE failure');
    }),
  ).rejects.toThrow('BE failure');
  expect(enabled).toBe(false);
  expect(stored.has(pushOwnerKey)).toBe(false);
  let release!: (value: string) => void;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  firebase.getToken.mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const register = vi.fn(async () => {});
  const pending = enablePush('user:device', register);
  await ready;
  const stopping = disablePush();
  release('old-token');
  await expect(pending).rejects.toThrow('Phiên đã thay đổi');
  await stopping;
  expect(register).not.toHaveBeenCalled();
  expect(enabled).toBe(false);
});

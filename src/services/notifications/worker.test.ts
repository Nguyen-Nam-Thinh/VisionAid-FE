import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
it('worker hides payloads, does not duplicate foreground alerts, and ignores supplied click URLs', async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  let enabled = false;
  let visible = false;
  const postMessage = vi.fn();
  const navigate = vi.fn();
  const focus = vi.fn();
  const showNotification = vi.fn();
  const openWindow = vi.fn();
  runInNewContext(readFileSync('public/firebase-messaging-sw.js', 'utf8'), {
    URL,
    caches: { open: async () => ({ match: async () => enabled }) },
    self: {
      addEventListener: (name: string, handler: (event: unknown) => void) => {
        handlers[name] = handler;
      },
      location: { origin: 'https://visionaid.net' },
      registration: { showNotification },
      clients: {
        openWindow,
        matchAll: async () => [
          {
            url: 'https://visionaid.net/profile',
            visibilityState: visible ? 'visible' : 'hidden',
            postMessage,
            navigate,
            focus,
          },
        ],
      },
    },
  });
  let done: Promise<unknown> = Promise.resolve();
  const event = {
    waitUntil: (p: Promise<unknown>) => {
      done = p;
    },
    notification: { close: vi.fn(), data: { url: 'https://evil.test' } },
  };
  handlers.push(event);
  await done;
  expect(showNotification).not.toHaveBeenCalled();
  enabled = true;
  visible = true;
  handlers.push(event);
  await done;
  expect(postMessage).toHaveBeenCalledWith({ type: 'visionaid-push' });
  expect(showNotification).not.toHaveBeenCalled();
  visible = false;
  handlers.push(event);
  await done;
  expect(showNotification).toHaveBeenCalledWith(
    'VisionAid',
    expect.objectContaining({ tag: 'visionaid-update' }),
  );
  handlers.notificationclick(event);
  await done;
  expect(navigate).not.toHaveBeenCalled();
  expect(focus).toHaveBeenCalled();
  expect(openWindow).not.toHaveBeenCalled();
});

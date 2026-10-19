/* global self, caches, URL */
// Native Push API handles FCM delivery. No Firebase SW auto-display of private payloads.
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const state = await caches.open('visionaid-push-v1');
      if (!(await state.match('/push-enabled'))) return;
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      windows.forEach((client) => client.postMessage({ type: 'visionaid-push' }));
      if (windows.some((client) => client.visibilityState === 'visible')) return;
      // Never expose server titles, names, GPS or arbitrary URLs on the lock screen.
      await self.registration.showNotification('VisionAid', {
        body: 'Có cập nhật mới. Mở VisionAid và đăng nhập để xem.',
        tag: 'visionaid-update',
        renotify: false,
      });
    })(),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = windows.find(
        (client) => new URL(client.url).origin === self.location.origin,
      );
      if (existing) {
        existing.postMessage({ type: 'visionaid-push' });
        await existing.focus();
      } else await self.clients.openWindow('/dashboard');
    })(),
  );
});

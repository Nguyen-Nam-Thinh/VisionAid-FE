import { afterEach, expect, it } from 'vitest';
import { request } from './http/client';
import { getLicenseWarning, setLicenseWarning } from './licenseWarning';
import { sessionEnded } from './sessionLifecycle';

afterEach(() => setLicenseWarning(null));
const reply =
  (status: number, body: unknown, headers: Record<string, string> = {}) =>
  async () =>
    new Response(JSON.stringify(body), { status, headers });

it('reads grace days from X-License-Warning and ignores unknown formats', async () => {
  await request('/x', {}, reply(200, { success: true }, { 'X-License-Warning': 'expiring-in-2d' }));
  expect(getLicenseWarning()).toEqual({ kind: 'grace', daysLeft: 2 });
  await request('/x', {}, reply(200, { success: true }, { 'X-License-Warning': 'soon' }));
  expect(getLicenseWarning()).toEqual({ kind: 'grace', daysLeft: 2 });
});
it('marks the license expired only on 402 LICENSE_EXPIRED, and clears on sign-out', async () => {
  await expect(
    request('/x', {}, reply(402, { errorCode: 'VIU_LICENSE_EXPIRED' })),
  ).rejects.toMatchObject({ status: 402 });
  expect(getLicenseWarning()).toBeNull();
  await expect(
    request('/x', {}, reply(402, { errorCode: 'LICENSE_EXPIRED' })),
  ).rejects.toMatchObject({
    status: 402,
    code: 'LICENSE_EXPIRED',
  });
  expect(getLicenseWarning()).toEqual({ kind: 'expired' });
  sessionEnded(true);
  expect(getLicenseWarning()).toBeNull();
});
it('PAYMENT_DISABLED keeps its code and a localized message', async () => {
  await expect(
    request(
      '/api/payments/create-link',
      {},
      reply(422, { errorCode: 'PAYMENT_DISABLED', detail: 'x' }),
    ),
  ).rejects.toMatchObject({
    status: 422,
    code: 'PAYMENT_DISABLED',
    message: expect.stringContaining('tạm ngưng'),
  });
});

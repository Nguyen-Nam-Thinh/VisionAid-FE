import { it, expect, vi } from 'vitest';
import {
  createPaymentsApi,
  safeCheckoutUrl,
  paymentResumeTarget,
  orderCode,
  canCheckout,
  type Payment,
} from './payments';
import type { Person } from '../../models/domain';
import type { LicensePackage } from './packages';
import { ServiceError } from '../contracts';
const id = '01900000-0000-7000-8000-000000000001';
const actor = { id, orgId: '', role: 'Caregiver' } as Person;
const date = '2026-10-03T00:00:00Z';
const pkg: LicensePackage = {
  id,
  code: 'PERSONAL',
  name: 'Personal',
  packageType: 'Personal',
  priceMonthly: 99000,
  priceYearly: null,
  currency: 'VND',
  maxViuPerLicense: 1,
  includedLicenses: 1,
  durationDays: 30,
  trialDays: 7,
  isActive: true,
  featureFlags: {},
  createdAt: date,
  updatedAt: date,
};
const payment: Payment = {
  id,
  payosOrderId: '1791000000000',
  transactionType: 'SubscriptionRenew',
  status: 'Pending',
  amount: 99000,
  currency: 'VND',
  payosCheckoutUrl: 'https://pay.payos.vn/web/abc',
  failureReason: null,
  paidAt: null,
  createdAt: date,
};
const page = (items: unknown[], number = 1, next = false) => ({
  items,
  page: number,
  pageSize: 100,
  totalCount: items.length,
  totalPages: next ? 2 : number,
  hasNextPage: next,
  hasPreviousPage: number > 1,
});
const link = {
  transactionId: id,
  checkoutUrl: payment.payosCheckoutUrl,
  paymentLinkId: 'abc',
  orderCode: Number(payment.payosOrderId),
  amount: 99000,
  currency: 'VND',
};
it('Business checkout requires a CenterAdmin organization and matching package; history/cancel reuse server scope', async () => {
  const center = { ...actor, role: 'CenterAdmin' as const, orgId: id };
  const business = { ...pkg, packageType: 'Business' as const };
  const get = vi.fn().mockResolvedValue(page([business]));
  get
    .mockResolvedValueOnce(page([business]))
    .mockRejectedValueOnce(new ServiceError('Chưa có kho', 404));
  const write = vi.fn().mockResolvedValue(link);
  const api = createPaymentsApi(get, write);
  await expect(api.create(center, business, 'https://visionaid.net')).resolves.toEqual(link);
  await expect(api.create(center, pkg, 'https://visionaid.net')).rejects.toMatchObject({
    status: 422,
  });
  await expect(api.create(actor, business, 'https://visionaid.net')).rejects.toMatchObject({
    status: 422,
  });
  await expect(api.list({ ...center, orgId: '' }, 1)).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(1);
  get.mockResolvedValueOnce(page([business])).mockResolvedValueOnce({
    id,
    organizationId: id,
    package: {
      id: '01900000-0000-7000-8000-000000000002',
      name: 'Other',
      code: 'OTHER',
      packageType: 'Business',
    },
    totalLicenses: 50,
    usedLicenses: 0,
    availableLicenses: 50,
    status: 'Active',
    purchasedAt: date,
    expiresAt: null,
  });
  await expect(api.create(center, business, 'https://visionaid.net')).rejects.toMatchObject({
    status: 409,
  });
  expect(write).toHaveBeenCalledTimes(1);
  get.mockResolvedValueOnce(page([{ ...payment, transactionType: 'LicenseTopup' }]));
  await api.cancel(center, payment);
  expect(write).toHaveBeenLastCalledWith('/api/payments/' + id + '/cancel', { method: 'DELETE' });
});
it('checkout and resume URLs fail closed; URL status is never copied into the resume target', () => {
  expect(safeCheckoutUrl(link.checkoutUrl)).toBe(link.checkoutUrl);
  for (const url of [
    'http://pay.payos.vn/web/x',
    'https://pay.payos.vn.evil.test/x',
    'https://pay.payos.vn@evil.test/x',
    'javascript:alert(1)',
    'https://user:pass@pay.payos.vn/x',
    'https://pay.payos.vn/x?redirect=https://evil.test',
    'https://pay.payos.vn:444/x',
  ])
    expect(safeCheckoutUrl(url)).toBeNull();
  expect(paymentResumeTarget('/payments/return?orderCode=123&status=PAID&token=secret')).toBe(
    '/payments/return?orderCode=123',
  );
  expect(paymentResumeTarget('//evil.test/payments/return')).toBeNull();
  expect(paymentResumeTarget('/admin/accounts')).toBeNull();
  expect(orderCode('9007199254740992')).toBeNull();
  expect(canCheckout({ ...pkg, currency: 'USD' })).toBe(false);
  expect(canCheckout({ ...pkg, priceMonthly: 1.5 })).toBe(false);
});
it('revalidates package before write, sends only package and same-origin callbacks, and rejects unsafe returned checkout', async () => {
  const get = vi.fn().mockResolvedValue(page([pkg]));
  const write = vi.fn().mockResolvedValue(link);
  const api = createPaymentsApi(get, write);
  await expect(api.create(actor, pkg, 'https://visionaid.net')).resolves.toEqual(link);
  expect(JSON.parse(write.mock.calls[0][1].body)).toEqual({
    packageId: id,
    returnUrl: 'https://visionaid.net/payments/return',
    cancelUrl: 'https://visionaid.net/payments/cancel',
  });
  get.mockResolvedValueOnce(page([{ ...pkg, priceMonthly: 199000 }]));
  await expect(api.create(actor, pkg, 'https://visionaid.net')).rejects.toMatchObject({
    status: 409,
  });
  expect(write).toHaveBeenCalledTimes(1);
  await expect(
    api.create({ ...actor, orgId: id }, pkg, 'https://visionaid.net'),
  ).rejects.toMatchObject({ status: 403 });
  write.mockResolvedValueOnce({ ...link, checkoutUrl: 'https://evil.test' });
  await expect(api.create(actor, pkg, 'https://visionaid.net')).rejects.toMatchObject({
    status: 502,
  });
});
it('finds an owned order beyond first page, never cancels unknown/nonpending transactions, and validates status', async () => {
  const get = vi
    .fn()
    .mockResolvedValueOnce(page([], 1, true))
    .mockResolvedValueOnce(page([payment], 2));
  const write = vi.fn().mockResolvedValue(undefined);
  const api = createPaymentsApi(get, write);
  await expect(api.find(actor, payment.payosOrderId)).resolves.toEqual(payment);
  expect(get.mock.calls[1][0]).toContain('page=2');
  get.mockResolvedValueOnce(page([]));
  await expect(api.cancel(actor, payment)).rejects.toMatchObject({ status: 404 });
  get.mockResolvedValueOnce(page([{ ...payment, status: 'Success' }]));
  await expect(api.cancel(actor, payment)).rejects.toMatchObject({ status: 409 });
  expect(write).not.toHaveBeenCalled();
  get.mockResolvedValueOnce(page([payment]));
  await api.cancel(actor, payment);
  expect(write).toHaveBeenCalledWith('/api/payments/' + id + '/cancel', { method: 'DELETE' });
  get.mockResolvedValueOnce(page([{ ...payment, status: 'Expired' }]));
  await expect(api.list(actor, 1)).rejects.toMatchObject({ status: 502 });
});

import { expect, it, vi } from 'vitest';
import { createContactsApi } from './contacts';
import type { Person } from '../../models/domain';
const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const actor: Person = {
  id,
  role: 'Caregiver',
  orgId: id,
  name: 'Staff',
  email: 's@example.test',
  phone: '',
  active: true,
};
const contact = {
  id,
  visuallyImpairedUserId: viuId,
  contactName: 'Test',
  contactType: 'Both',
  phoneNumber: '0901234567',
  zaloDeepLink: 'https://zalo.me/0901234567',
  priorityOrder: 1,
  isActive: true,
  notes: '',
  createdAt: '2026-10-07T00:00:00Z',
  updatedAt: '2026-10-07T00:00:00Z',
};
const link = {
  id,
  caregiverId: id,
  visuallyImpairedUserId: viuId,
  viuFullName: 'VIU',
  isPrimary: false,
  linkType: 'Organization',
  canReceiveAlerts: false,
  canManageRegistry: false,
  canManageLocations: false,
  linkedAt: '',
  unlinkedAt: null,
};
const links = {
  items: [link],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};
it('requires fresh active linkage, rejects foreign contact data, and uses six exact contact contracts', async () => {
  const root = `/api/users/${viuId}/emergency-contacts`;
  const get = vi.fn<NonNullable<Parameters<typeof createContactsApi>[0]>>(async (path) =>
    path.startsWith('/api/caregiver-links?') ? links : path === root ? [contact] : contact,
  );
  const write = vi.fn<NonNullable<Parameters<typeof createContactsApi>[1]>>(async () => contact);
  const api = createContactsApi(get, write);
  expect(await api.list(actor, viuId)).toEqual([contact]);
  await api.save(actor, viuId, contact);
  await api.save(actor, viuId, { ...contact, contactType: 'Phone' }, id);
  const update = write.mock.calls[1];
  expect(update[0]).toBe(root + '/' + id);
  expect(update[1].method).toBe('PUT');
  expect(JSON.parse(String(update[1].body))).toMatchObject({
    zaloDeepLink: '',
    phoneNumber: contact.phoneNumber,
  });
  await api.status(actor, viuId, id, false);
  expect(write.mock.calls[2][0]).toBe(root + '/' + id + '/status');
  expect(JSON.parse(String(write.mock.calls[2][1].body))).toEqual({ isActive: false });
  write.mockResolvedValue(undefined);
  await api.remove(actor, viuId, id);
  expect(write).toHaveBeenLastCalledWith(root + '/' + id, { method: 'DELETE' });
  get.mockResolvedValue({ ...links, items: [] });
  await expect(api.remove(actor, viuId, id)).rejects.toMatchObject({ status: 403 });
  await expect(api.list({ ...actor, role: 'Admin' }, viuId)).rejects.toMatchObject({ status: 403 });
  expect(write).toHaveBeenCalledTimes(4);
  get.mockImplementation(async (path) =>
    path.startsWith('/api/caregiver-links?') ? links : { ...contact, visuallyImpairedUserId: id },
  );
  await expect(api.detail(actor, viuId, id)).rejects.toMatchObject({ status: 403 });
});
it('validates integer priority and required fields without imposing mobile-only numbers on hotlines', async () => {
  const get = vi.fn(async () => links);
  const write = vi.fn<NonNullable<Parameters<typeof createContactsApi>[1]>>(async () => ({
    ...contact,
    phoneNumber: '115',
  }));
  const api = createContactsApi(get, write);
  for (const values of [
    { ...contact, priorityOrder: 1.5 },
    { ...contact, phoneNumber: '' },
    { ...contact, zaloDeepLink: '' },
  ])
    await expect(api.save(actor, viuId, values)).rejects.toMatchObject({ status: 400 });
  expect(write).not.toHaveBeenCalled();
  await api.save(actor, viuId, { ...contact, phoneNumber: '115' });
  expect(JSON.parse(String(write.mock.calls[0][1].body)).phoneNumber).toBe('115');
});

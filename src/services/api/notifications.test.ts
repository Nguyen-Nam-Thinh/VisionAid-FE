import { expect, it, vi } from 'vitest';
import { createNotificationsApi } from './notifications';
const id = '01900000-0000-7000-8000-000000000001';
const other = '01900000-0000-7000-8000-000000000002';
const actor = { id, orgId: id, role: 'CenterAdmin' as const };
const rule = {
  id,
  organizationId: id,
  notificationType: 'FallDetected',
  channel: 'Email',
  targetRole: 'Caregiver',
  isMandatory: false,
  isActive: true,
  createdAt: '',
  updatedAt: '',
  updatedBy: null,
};
const paged = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 10,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
const filters = {
  notificationType: 'FallDetected',
  channel: '',
  targetRole: '',
  isActive: 'false',
};
it('blocks global/foreign rule mutations and foreign list data for CenterAdmin', async () => {
  const get = vi.fn(async () => paged([{ ...rule, organizationId: other }]));
  const write = vi.fn(async () => rule);
  const api = createNotificationsApi(get, write);
  const typed = {
    ...rule,
    notificationType: 'FallDetected' as const,
    channel: 'Email' as const,
    targetRole: 'Caregiver' as const,
  };
  await expect(api.rules(actor, 1, filters)).rejects.toMatchObject({ status: 403 });
  for (const organizationId of [null, other]) {
    await expect(api.updateRule(actor, { ...typed, organizationId }, rule)).rejects.toMatchObject({
      status: 403,
    });
    await expect(api.removeRule(actor, { ...typed, organizationId })).rejects.toMatchObject({
      status: 403,
    });
  }
  await expect(api.rules({ ...actor, orgId: '' }, 1, filters)).rejects.toMatchObject({
    status: 403,
  });
  await expect(api.createRule({ ...actor, role: 'Caregiver' }, rule)).rejects.toMatchObject({
    status: 403,
  });
  expect(write).not.toHaveBeenCalled();
  expect(get).toHaveBeenCalledTimes(1);
});
it('forces own org on create, validates enum, sends only mutable flags, and deletes with 204', async () => {
  const write = vi.fn<NonNullable<Parameters<typeof createNotificationsApi>[1]>>(async () => rule);
  const api = createNotificationsApi(async () => paged([rule]), write);
  await api.createRule(actor, { ...rule, organizationId: other });
  expect(JSON.parse(String(write.mock.calls[0][1].body)).organizationId).toBe(id);
  await expect(
    api.createRule(actor, { ...rule, targetRole: 'VisuallyImpaired' }),
  ).rejects.toMatchObject({ status: 400 });
  const item = (await api.rules(actor, 1, filters)).items[0];
  await api.updateRule(actor, item, { ...rule, id: other });
  expect(JSON.parse(String(write.mock.calls[1][1].body))).toEqual({
    isMandatory: false,
    isActive: true,
  });
  write.mockResolvedValue(undefined);
  await api.removeRule(actor, item);
  expect(write).toHaveBeenLastCalledWith('/api/notifications/rules/' + id, { method: 'DELETE' });
  write.mockRejectedValue(new Error('conflict'));
  await expect(api.createRule(actor, rule)).rejects.toThrow('conflict');
  expect(write).toHaveBeenCalledTimes(4);
});
it('keeps false preferences, validates account scope and sends one upsert without invented mandatory state', async () => {
  const pref = {
    id,
    userId: id,
    notificationType: 'SystemAlert',
    channel: 'Email',
    isEnabled: false,
    updatedAt: '',
  };
  const write = vi.fn(async () => [pref]);
  const api = createNotificationsApi(async () => [{ ...pref, userId: other }], write);
  await expect(api.preferences(actor)).rejects.toMatchObject({ status: 403 });
  expect((await api.savePreference(actor, { ...pref, userId: other }))[0].isEnabled).toBe(false);
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({
    preferences: [{ notificationType: 'SystemAlert', channel: 'Email', isEnabled: false }],
  });
  await expect(api.savePreference(actor, { ...pref, channel: 'SMS' })).rejects.toMatchObject({
    status: 400,
  });
  expect(write).toHaveBeenCalledTimes(1);
});

import { expect, it, vi } from 'vitest';
import { createInboxApi, parseDelivery } from './inbox';
import { createActivityApi, mapLink } from './activity';
import type { Person } from '../../models/domain';

const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const at = '2026-11-06T01:00:00Z';
const paged = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
const notice = {
  id,
  notificationType: 'FallDetected',
  sourceType: 'Emergency',
  emergencyEventId: id,
  locationBoundaryEventId: null,
  visuallyImpairedUserId: viuId,
  visuallyImpairedUserName: 'Nguyễn B',
  title: 'Phát hiện té ngã',
  body: null,
  deliveries: ['Fcm:Sent', 'Email:Failed'],
  createdAt: at,
  sentAt: at,
  readAt: null,
};

it('lists the inbox with Vietnam-day bounds and marks notices read', async () => {
  const get = vi.fn(async (path: string) => (path.includes('unread-count') ? 3 : paged([notice])));
  const write = vi.fn(async () => 2);
  const api = createInboxApi(get, write);
  const page = await api.list({
    viuId,
    type: 'FallDetected',
    from: '2026-11-06',
    unreadOnly: true,
  });
  expect(page.items[0].deliveries.map(parseDelivery)).toEqual([
    { channel: 'Fcm', status: 'Sent' },
    { channel: 'Email', status: 'Failed' },
  ]);
  const url = new URL(String(get.mock.calls[0][0]), 'https://x.test');
  expect(url.pathname).toBe('/api/notifications/inbox');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    viuId,
    type: 'FallDetected',
    unreadOnly: 'true',
    dateFrom: '2026-11-05T17:00:00.000Z',
  });
  expect(await api.unreadCount()).toBe(3);
  await api.markRead(notice);
  expect(write).toHaveBeenLastCalledWith('/api/notifications/' + id + '/read', { method: 'PATCH' });
  expect(await api.markAllRead(viuId)).toBe(2);
  expect(write).toHaveBeenLastCalledWith('/api/notifications/read-all?viuId=' + viuId, {
    method: 'PATCH',
  });
  await expect(api.list({ viuId: 'not-an-id' })).rejects.toMatchObject({ status: 400 });
  await expect(api.list({ from: '2026-11-07', to: '2026-11-06' })).rejects.toMatchObject({
    status: 400,
  });
});

it('limits notification lookup to Super Admin and Center Admin with an organization', async () => {
  const get = vi.fn(async () => paged([]));
  const api = createInboxApi(get, vi.fn());
  await expect(api.lookup({ role: 'Caregiver', orgId: '' }, {})).rejects.toMatchObject({
    status: 403,
  });
  await expect(api.lookup({ role: 'CenterAdmin', orgId: '' }, {})).rejects.toMatchObject({
    status: 403,
  });
  await api.lookup({ role: 'Admin', orgId: '' }, { recipientId: id, channel: 'Fcm' });
  expect(get).toHaveBeenCalledWith(
    '/api/notifications?page=1&pageSize=20&recipientId=' + id + '&channel=Fcm',
    undefined,
  );
});

it('reads the activity timeline and guidance logs of a linked care recipient only', async () => {
  const actor = { id, role: 'Caregiver', orgId: '' } as Person;
  const link = {
    id,
    caregiverId: id,
    visuallyImpairedUserId: viuId,
    viuFullName: 'VIU',
    isPrimary: true,
    linkType: 'Personal',
    canReceiveAlerts: true,
    canManageRegistry: false,
    canManageLocations: false,
    linkedAt: '',
    unlinkedAt: null,
  };
  const timeline = {
    occurredAt: at,
    activityType: 'ObstacleDetection',
    activityLabel: 'Obstacle',
    sourceId: id,
    detail: 'car · Near',
    result: 'Alerted',
    score: 0.9,
    spokenText: 'Có ô tô phía trước',
    latitude: 10.78,
    longitude: 106.7,
    actorId: null,
    actorName: null,
  };
  const guidance = {
    id,
    sessionId: id,
    userId: viuId,
    frameId: 13,
    decision: 'STOP',
    ttsText: '',
    engineUsed: 'OnDeviceRules',
    isOfflineFallback: true,
    latencyMs: null,
    createdAt: at,
    spokenText: 'Dừng lại',
    spokenAt: at,
    latitude: null,
    longitude: null,
  };
  const get = vi.fn(async (path: string) =>
    path.startsWith('/api/caregiver-links')
      ? paged([link])
      : path.startsWith('/api/activity-history/timeline')
        ? paged([timeline])
        : paged([guidance]),
  );
  const api = createActivityApi(get);
  const range = { dateFrom: '', dateTo: '' };
  const rows = await api.timeline(actor, viuId, 1, range, ['ObstacleDetection', 'Bogus']);
  expect(rows.items[0].spokenText).toBe('Có ô tô phía trước');
  const timelineCall = String(get.mock.calls.find(([p]) => p.includes('timeline'))![0]);
  expect(timelineCall).toContain('viuId=' + viuId);
  expect(timelineCall).toContain('types=ObstacleDetection');
  expect(timelineCall).not.toContain('Bogus');
  const logs = await api.guidance(actor, viuId, 1, range);
  expect(logs.items[0].engineUsed).toBe('OnDeviceRules');
  get.mockImplementation(async (path: string) =>
    path.startsWith('/api/caregiver-links') ? paged([link]) : paged([{ ...guidance, userId: id }]),
  );
  await expect(api.guidance(actor, viuId, 1, range)).rejects.toMatchObject({ status: 403 });
  await expect(
    api.timeline({ ...actor, role: 'Admin' }, viuId, 1, range, []),
  ).rejects.toMatchObject({ status: 403 });
  expect(mapLink(10.78, 106.7)).toContain('10.78,106.7');
  expect(mapLink(null, 106.7)).toBeNull();
});

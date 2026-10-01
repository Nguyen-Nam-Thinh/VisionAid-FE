import { expect, it, vi } from 'vitest';
import { createEmergenciesApi, alertActions } from './emergencies';
const id = '01900000-0000-7000-8000-000000000001';
const viu = '01900000-0000-7000-8000-000000000002';
const actor = { id, role: 'Caregiver' as const, orgId: '' };
const event = {
  id,
  visuallyImpairedUserId: viu,
  detectionMethod: 'Manual',
  currentStatus: 'Sent',
  latitude: null,
  longitude: null,
  notes: null,
  snapshotPath: null,
  detectedAt: '2026-10-01T00:00:00Z',
  gracePeriodEndsAt: null,
  sentAt: null,
  acknowledgedAt: null,
  acknowledgedBy: null,
  escalatedAt: null,
  resolvedAt: null,
  resolvedBy: null,
  dismissedAt: null,
  statusHistory: [],
};
it('checks fresh status and permission before writing and does not replay failures', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createEmergenciesApi>[0]>>(async () => event);
  const write = vi.fn<NonNullable<Parameters<typeof createEmergenciesApi>[1]>>(async () => {
    throw Error('lost response');
  });
  const links = vi.fn<NonNullable<Parameters<typeof createEmergenciesApi>[2]>>(async () => ({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  }));
  const api = createEmergenciesApi(get, write, links);
  await expect(api.act(actor, id, 'Sent', 'acknowledge', '')).rejects.toMatchObject({
    status: 403,
  });
  expect(write).not.toHaveBeenCalled();
  get.mockResolvedValue({ ...event, currentStatus: 'Resolved' });
  await expect(api.act(actor, id, 'Sent', 'resolve', '')).rejects.toMatchObject({ status: 409 });
  get.mockResolvedValue(event);
  await expect(
    api.act({ ...actor, role: 'CenterAdmin', orgId: viu }, id, 'Sent', 'resolve', 'done'),
  ).rejects.toThrow('lost response');
  expect(write).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({ notes: 'done' });
  expect(alertActions('Detected')).toEqual([]);
  expect(alertActions('Escalated')).toEqual(['resolve']);
});
it('rejects unsupported role, mismatched IDs and malformed data', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createEmergenciesApi>[0]>>(async () => ({
    ...event,
    id: viu,
  }));
  const api = createEmergenciesApi(get);
  await expect(api.detail({ ...actor, role: 'Admin' }, id)).rejects.toMatchObject({ status: 403 });
  expect(get).not.toHaveBeenCalled();
  await expect(api.detail(actor, id)).rejects.toMatchObject({ status: 403 });
  get.mockResolvedValue({ ...event, currentStatus: 'unknown' });
  await expect(api.detail(actor, id)).rejects.toMatchObject({ status: 502 });
});

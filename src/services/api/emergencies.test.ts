import { expect, it, vi } from 'vitest';
import { ServiceError } from '../contracts';
import { createEmergenciesApi, alertActions, overdueAlerts } from './emergencies';
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
  expect(alertActions('Sent')).toEqual(['acknowledge', 'escalate', 'called', 'resolve']);
  expect(alertActions('Acknowledged')).toEqual(['escalate', 'called', 'resolve']);
  expect(alertActions('Escalated')).toEqual(['called', 'resolve']);
  expect(alertActions('Called')).toEqual([]);
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
it('BR-29: only Sent alerts past 5 minutes are suggested, oldest first', () => {
  const now = Date.parse('2026-10-01T01:00:00Z');
  const at = (minutes: number) => new Date(now - minutes * 60000 - 30000).toISOString();
  const row = (eventId: string, currentStatus: string, sentAt: string | null) =>
    ({ ...event, id: eventId, currentStatus, sentAt }) as Parameters<typeof overdueAlerts>[0][0];
  const a = '01900000-0000-7000-8000-00000000000a';
  const b = '01900000-0000-7000-8000-00000000000b';
  const result = overdueAlerts(
    [
      row(a, 'Sent', at(5)),
      row(b, 'Sent', at(12)),
      row(id, 'Sent', at(4)),
      row(viu, 'Acknowledged', at(30)),
      row('01900000-0000-7000-8000-00000000000c', 'Sent', null),
    ],
    now,
  );
  expect(result.map((r) => [r.event.id, r.minutes])).toEqual([
    [b, 12],
    [a, 5],
  ]);
});
it('loads the scene snapshot only when the BE endpoint is enabled', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createEmergenciesApi>[0]>>();
  const write = vi.fn<NonNullable<Parameters<typeof createEmergenciesApi>[1]>>();
  const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])]);
  const blob = vi.fn<NonNullable<Parameters<typeof createEmergenciesApi>[3]>>(async () => jpeg);
  const off = createEmergenciesApi(get, write, undefined, blob, false);
  expect(off.snapshotReady).toBe(false);
  await expect(off.snapshot(actor, id)).rejects.toMatchObject({ status: 501 });
  expect(blob).not.toHaveBeenCalled();
  const on = createEmergenciesApi(get, write, undefined, blob, true);
  await expect(on.snapshot(actor, 'bad')).rejects.toMatchObject({ status: 400 });
  await expect(on.snapshot({ ...actor, role: 'Admin' as never }, id)).rejects.toMatchObject({
    status: 403,
  });
  const photo = await on.snapshot(actor, id);
  expect(blob).toHaveBeenCalledWith('/api/emergency-events/' + id + '/snapshot', undefined);
  expect(photo.type).toBe('image/jpeg');
  blob.mockResolvedValueOnce(new Blob(['<html>']));
  await expect(on.snapshot(actor, id)).rejects.toMatchObject({ status: 400 });
  blob.mockRejectedValueOnce(new ServiceError('missing', 404));
  await expect(on.snapshot(actor, id)).rejects.toMatchObject({
    status: 404,
    message: expect.stringContaining('không còn'),
  });
  blob.mockResolvedValueOnce({} as Blob);
  await expect(on.snapshot(actor, id)).rejects.toMatchObject({ status: 502 });
});

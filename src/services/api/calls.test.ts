import { expect, it, vi } from 'vitest';
import { createCallsApi } from './calls';
import type { Person } from '../../models/domain';
const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const actor: Person = {
  id,
  orgId: '',
  role: 'Caregiver',
  name: '',
  email: '',
  phone: '',
  active: true,
};
const page = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
const call = {
  sessionId: id,
  triggerType: 'CaregiverInitiated',
  status: 'Ringing',
  durationSeconds: null,
  startedAt: '2026-10-10T00:00:00Z',
  connectedAt: null,
  endedAt: null,
  endReason: null,
  initiatorId: id,
  receiverId: viuId,
  viuUserId: viuId,
};
it('validates history membership, filters, dates and role before presenting data', async () => {
  const get = vi.fn<NonNullable<Parameters<typeof createCallsApi>[0]>>(async () => page([call]));
  const api = createCallsApi(get);
  await api.history(actor, 1, {
    viuUserId: viuId,
    dateFrom: '2026-10-10T07:00:00+07:00',
    dateTo: '',
  });
  expect(get.mock.calls[0]?.[0]).toContain('dateFrom=2026-10-10T00%3A00%3A00.000Z');
  await expect(
    api.history({ ...actor, role: 'Admin' }, 1, { viuUserId: '', dateFrom: '', dateTo: '' }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    api.history(actor, 1, { viuUserId: '', dateFrom: 'bad', dateTo: '' }),
  ).rejects.toMatchObject({ status: 400 });
  get.mockResolvedValueOnce(page([{ ...call, initiatorId: viuId, receiverId: viuId }]));
  await expect(
    api.history(actor, 1, { viuUserId: '', dateFrom: '', dateTo: '' }),
  ).rejects.toMatchObject({ status: 403 });
});
it('uses exact write contracts with active linkage and rejects incompatible ICE responses', async () => {
  const link = {
    id,
    caregiverId: id,
    visuallyImpairedUserId: viuId,
    viuFullName: 'VIU',
    isPrimary: false,
    linkType: 'Personal',
    canReceiveAlerts: false,
    canManageRegistry: false,
    canManageLocations: false,
    linkedAt: '',
    unlinkedAt: null,
  };
  const get = vi.fn(async () => page([link]));
  const response = {
    sessionId: id,
    status: 'Ringing',
    myRole: 'video_viewer_audio_sender',
    iceServers: [{ urls: 'turn:turn.example.test', username: null, credential: null }],
  };
  const write = vi.fn<NonNullable<Parameters<typeof createCallsApi>[1]>>(async () => response);
  const api = createCallsApi(get, write);
  await api.initiate(actor, viuId);
  expect(JSON.parse(String(write.mock.calls[0][1].body))).toEqual({
    viuUserId: viuId,
    triggerType: 'CaregiverInitiated',
  });
  await api.accept(id);
  await api.reject(id);
  await api.end(id);
  expect(write.mock.calls.map((args) => args[0])).toEqual([
    '/api/webrtc/sessions',
    `/api/webrtc/sessions/${id}/accept`,
    `/api/webrtc/sessions/${id}/reject`,
    `/api/webrtc/sessions/${id}/end`,
  ]);
  expect(write.mock.calls.every((args) => args[1].method === 'POST')).toBe(true);
  get.mockResolvedValueOnce(page([]));
  await expect(api.initiate(actor, viuId)).rejects.toMatchObject({ status: 403 });
  write.mockResolvedValueOnce({ ...response, myRole: 'video_sender' });
  await expect(api.accept(id)).rejects.toMatchObject({ status: 502 });
  await expect(api.end('bad-id')).rejects.toMatchObject({ status: 400 });
});

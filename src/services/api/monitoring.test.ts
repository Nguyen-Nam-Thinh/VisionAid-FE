import { expect, it, vi } from 'vitest';
import { createMonitoringApi, type MonitoringKind } from './monitoring';
const actor = { role: 'Admin' as const };
const id = '01900000-0000-7000-8000-000000000001';
const at = '2026-10-11T00:00:00Z';
const page = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
const metric = {
  id,
  modelName: 'Tesseract',
  modelVersion: '1.0',
  metricDate: '2026-10-10',
  sourceTable: 'ocr_requests',
  totalRequests: 10,
  successfulRequests: 8,
  failedRequests: 2,
  avgConfidence: null,
  avgLatencyMs: 0,
  p95LatencyMs: null,
  p99LatencyMs: 50,
  errorCount: 2,
  aggregatedBy: 'AiMetricsAggregator',
  recordedAt: at,
};
it('denies every monitoring request for non-admin before HTTP', async () => {
  const get = vi.fn();
  const api = createMonitoringApi(get);
  for (const role of ['Caregiver', 'CenterAdmin', 'VisuallyImpaired'] as const) {
    for (const kind of ['metrics', 'audit', 'delivery', 'guidance'] as const)
      await expect(api.list({ role }, kind, 1, {})).rejects.toMatchObject({ status: 403 });
    await expect(api.status({ role })).rejects.toMatchObject({ status: 403 });
  }
  expect(get).not.toHaveBeenCalled();
});
it('preserves metric units, nulls and date-only UTC filters with pagination and cancellation', async () => {
  const get = vi.fn().mockResolvedValue(page([metric]));
  const signal = new AbortController().signal;
  const result = await createMonitoringApi(get).list(
    actor,
    'metrics',
    2,
    { modelName: ' Tesseract ', from: '2026-10-10', to: '2026-10-11', channel: 'Email' },
    signal,
  );
  const params = new URL('https://test' + get.mock.calls[0][0]).searchParams;
  expect(params.get('dateFrom')).toBe('2026-10-10');
  expect(params.get('dateTo')).toBe('2026-10-11');
  expect(params.get('modelName')).toBe('Tesseract');
  expect(params.get('page')).toBe('2');
  expect(params.has('channel')).toBe(false);
  expect(get.mock.calls[0][1]).toBe(signal);
  expect(result.items[0]).toEqual(metric);
});
it('validates dates, page, UUID and enum filters before HTTP', async () => {
  const get = vi.fn();
  const api = createMonitoringApi(get);
  for (const [kind, filters] of [
    ['metrics', { from: '2026-02-30' }],
    ['metrics', { from: '2026-10-12', to: '2026-10-11' }],
    ['audit', { actorId: 'oops' }],
    ['audit', { targetRecordId: 'oops' }],
    ['audit', { actionType: 'DeleteAll' }],
    ['delivery', { channel: 'SMS' }],
    ['guidance', { userId: 'oops' }],
    ['guidance', { sessionId: 'oops' }],
    ['guidance', { engineUsed: 'JEV' }],
    ['guidance', { isOfflineFallback: 'yes' }],
  ] as const)
    await expect(api.list(actor, kind, 1, filters)).rejects.toMatchObject({ status: 400 });
  await expect(api.list(actor, 'metrics', 0, {})).rejects.toMatchObject({ status: 400 });
  expect(get).not.toHaveBeenCalled();
});
it('keeps audit metadata only and uses complete Vietnam dates including sub-millisecond boundary', async () => {
  const get = vi.fn().mockResolvedValue(
    page([
      {
        id,
        actorId: null,
        actionType: 'ConfigChanged',
        targetTable: 'system_configurations',
        targetRecordId: id,
        performedAt: at,
        oldData: '{"secret":"old"}',
        newData: 'secret',
        notes: 'secret',
        ipAddress: 'secret',
        userAgent: 'secret',
      },
    ]),
  );
  const result = await createMonitoringApi(get).list(actor, 'audit', 1, {
    from: '2026-10-11',
    to: '2026-10-11',
    actorId: id,
    actionType: 'ConfigChanged',
    targetTable: 'system_configurations',
    targetRecordId: id,
  });
  const params = new URL('https://test' + get.mock.calls[0][0]).searchParams;
  expect(params.get('dateFrom')).toBe('2026-10-10T17:00:00.000Z');
  expect(params.get('dateTo')).toBe('2026-10-11T16:59:59.9999999Z');
  expect(params.get('actorId')).toBe(id);
  expect(JSON.stringify(result)).not.toContain('secret');
  expect(result.items[0].actorId).toBeNull();
});
it('reads notification status and failed records without mutation or retry', async () => {
  const period = {
    totalSent: 0,
    totalFailed: 2,
    totalPending: 3,
    byChannel: [{ channel: 'Fcm', sent: 0, failed: 2 }],
  };
  const failure = {
    id,
    sourceType: 'Emergency',
    emergencyEventId: id,
    locationBoundaryEventId: null,
    recipientId: id,
    notificationType: 'FallDetected',
    channel: 'Fcm',
    status: 'Failed',
    failureReason: null,
    createdAt: at,
  };
  const get = vi
    .fn()
    .mockResolvedValueOnce({ last24Hours: period, last7Days: period })
    .mockResolvedValueOnce(page([failure]))
    .mockRejectedValueOnce(new Error('Network'));
  const api = createMonitoringApi(get);
  expect((await api.status(actor)).last24Hours.totalSent).toBe(0);
  expect((await api.list(actor, 'delivery', 1, { channel: 'Fcm' })).items[0]).toEqual(failure);
  await expect(api.status(actor)).rejects.toThrow('Network');
  expect(get).toHaveBeenCalledTimes(3);
});
it('rejects malformed responses instead of presenting fake zero totals', async () => {
  for (const kind of ['metrics', 'audit', 'delivery', 'guidance'] as MonitoringKind[])
    await expect(
      createMonitoringApi(vi.fn().mockResolvedValue(page([{ id }]))).list(actor, kind, 1, {}),
    ).rejects.toMatchObject({ status: 502 });
  await expect(
    createMonitoringApi(vi.fn().mockResolvedValue({})).status(actor),
  ).rejects.toMatchObject({ status: 502 });
});
it('reads Hybrid metadata, preserves null timing and strips scene/TTS before caching', async () => {
  const record = {
    id,
    sessionId: id,
    userId: id,
    frameId: 0,
    decision: 'STOP',
    engineUsed: 'RuleBased',
    isOfflineFallback: true,
    latencyMs: null,
    createdAt: at,
  };
  const get = vi
    .fn()
    .mockResolvedValue(
      page([{ ...record, detectedObjectsJson: 'PRIVATE_SCENE', ttsText: 'PRIVATE_SPEECH' }]),
    );
  const signal = new AbortController().signal;
  const result = await createMonitoringApi(get).list(
    actor,
    'guidance',
    2,
    {
      userId: id,
      sessionId: id,
      engineUsed: 'RuleBased',
      isOfflineFallback: 'false',
      from: '2026-10-11',
      to: '2026-10-11',
    },
    signal,
  );
  expect(result.items).toEqual([record]);
  const url = new URL('https://test' + get.mock.calls[0][0]);
  expect(url.pathname).toBe('/api/navigation/guidance/logs');
  expect(Object.fromEntries(url.searchParams)).toEqual({
    page: '2',
    pageSize: '20',
    userId: id,
    sessionId: id,
    engineUsed: 'RuleBased',
    isOfflineFallback: 'false',
    dateFrom: '2026-10-10T17:00:00.000Z',
    dateTo: '2026-10-11T16:59:59.9999999Z',
  });
  expect(get.mock.calls[0][1]).toBe(signal);
  get.mockResolvedValue(page([{ ...record, latencyMs: 0, isOfflineFallback: false }]));
  expect((await createMonitoringApi(get).list(actor, 'guidance', 1, {})).items[0].latencyMs).toBe(
    0,
  );
  get.mockResolvedValue(page([{ ...record, isOfflineFallback: 'false' }]));
  await expect(createMonitoringApi(get).list(actor, 'guidance', 1, {})).rejects.toMatchObject({
    status: 502,
  });
});

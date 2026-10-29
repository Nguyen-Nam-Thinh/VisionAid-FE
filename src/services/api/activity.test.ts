import { expect, it, vi } from 'vitest';
import {
  activityDateRange,
  activityKinds,
  createActivityApi,
  exportColumns,
  maxExportRows,
  type ActivityKind,
} from './activity';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';
const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const actor: Person = {
  id,
  role: 'Caregiver',
  orgId: '',
  name: 'Test',
  email: '',
  phone: '',
  active: true,
};
const at = '2026-10-11T00:00:00Z';
const base = { id, userId: viuId, latitude: null, longitude: null };
const commonOcr = {
  ...base,
  requestedAt: at,
  triggerMethod: 'Manual',
  ocrEngine: 'VietOCR',
  processingTimeMs: null,
  resultStatus: 'Success',
  errorMessage: null,
  ttsAnnounced: false,
  imageStoragePath: 'private/secret.jpg',
};
const rows = {
  navigation: {
    ...base,
    startedAt: at,
    endedAt: null,
    detectionMode: 'Full',
    totalDetections: 0,
    totalAlertsIssued: 0,
    deviceModel: null,
    appVersion: null,
    isActive: true,
  },
  ocr: {
    ...commonOcr,
    requestType: 'Text',
    rawText: '<script>alert(1)</script>',
    processedText: null,
    confidenceScore: null,
    languageDetected: null,
  },
  qr: {
    ...commonOcr,
    ocrRequestId: id,
    qrContent: 'javascript:alert(1)',
    qrType: null,
    isUrl: true,
    urlDomain: null,
    scannedAt: at,
  },
  recognition: {
    id,
    visuallyImpairedUserId: viuId,
    matchedPersonId: null,
    matchedPersonName: null,
    similarityScore: null,
    recognitionResult: 'NotMatched',
    estimatedDistance: null,
    processingTimeMs: null,
    recognizedAt: at,
    errorMessage: null,
  },
  voice: {
    ...base,
    rawTranscript: null,
    matchedCommand: null,
    recognitionEngine: 'Whisper',
    confidenceScore: 0,
    executionStatus: 'Unrecognized',
    requiredConfirmation: false,
    confirmedAt: null,
    processingTimeMs: null,
    audioDurationMs: null,
    isOffline: true,
    executedAt: at,
  },
};
function paged(items: unknown[], page = 1) {
  return {
    items,
    page,
    pageSize: 20,
    totalCount: items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}
function fixture(kind: ActivityKind = 'navigation') {
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
    unlinkedAt: null as string | null,
  };
  const event = {
    ...base,
    sessionId: id,
    objectClass: 'chair',
    confidenceScore: 0,
    distanceRange: 'Near',
    alertIssued: false,
    inferenceTimeMs: null,
    detectedAt: at,
  };
  const row: Record<string, unknown> = { ...rows[kind] };
  const get = vi.fn<NonNullable<Parameters<typeof createActivityApi>[0]>>(async (path) => {
    if (path.startsWith('/api/caregiver-links?')) return paged([link]);
    if (path.includes('/events?')) return paged([event]);
    if (path.includes('?'))
      return paged([row], Number(new URL(path, 'https://example.test').searchParams.get('page')));
    return row;
  });
  return { api: createActivityApi(get), get, link, row, event };
}
for (const kind of Object.keys(activityKinds) as ActivityKind[]) {
  it(`${kind}: scoped list/detail, server pagination, UTC+7 range, nullable data and no storage path`, async () => {
    const f = fixture(kind);
    const range = activityDateRange('2026-10-11', '2026-10-11');
    const signal = new AbortController().signal;
    const data = await f.api.list(actor, viuId, kind, 2, range, signal);
    const path = new URL(f.get.mock.calls.at(-1)![0], 'https://example.test');
    expect(path.pathname).toBe(activityKinds[kind].path);
    expect(path.searchParams.get(kind === 'recognition' ? 'viuId' : 'userId')).toBe(viuId);
    expect(path.searchParams.get('dateFrom')).toBe('2026-10-10T17:00:00.000Z');
    expect(path.searchParams.get('dateTo')).toBe('2026-10-11T16:59:59.999Z');
    expect(data.page).toBe(2);
    expect(f.get.mock.calls.every(([, s]) => s === signal)).toBe(true);
    expect(data.items[0]).not.toHaveProperty('imageStoragePath');
    expect(await f.api.detail(actor, viuId, kind, id)).toEqual(data.items[0]);
    expect(f.get.mock.calls.at(-1)![0]).toBe(`${activityKinds[kind].path}/${id}`);
    f.row[kind === 'recognition' ? 'visuallyImpairedUserId' : 'userId'] = id;
    await expect(f.api.list(actor, viuId, kind, 1, range)).rejects.toMatchObject({ status: 403 });
    await expect(f.api.detail(actor, viuId, kind, id)).rejects.toMatchObject({ status: 403 });
  });
}
it('rechecks active link for detail/events, rejects other roles and invalid IDs before fetching', async () => {
  const f = fixture();
  await expect(
    f.api.detail({ ...actor, role: 'CenterAdmin' }, viuId, 'navigation', id),
  ).rejects.toMatchObject({ status: 403 });
  await expect(f.api.detail(actor, viuId, 'navigation', '../x')).rejects.toMatchObject({
    status: 400,
  });
  expect(f.get).not.toHaveBeenCalled();
  await f.api.detail(actor, viuId, 'navigation', id);
  f.link.unlinkedAt = at;
  f.get.mockClear();
  await expect(f.api.detail(actor, viuId, 'navigation', id)).rejects.toMatchObject({ status: 403 });
  await expect(f.api.events(actor, viuId, id, 1)).rejects.toMatchObject({ status: 403 });
  expect(f.get.mock.calls.every(([path]) => path.startsWith('/api/caregiver-links?'))).toBe(true);
});
it('navigation events validate session and user; wrong detail ID and malformed data are rejected', async () => {
  const f = fixture();
  expect((await f.api.events(actor, viuId, id, 1)).items[0].confidenceScore).toBe(0);
  f.event.sessionId = viuId;
  await expect(f.api.events(actor, viuId, id, 1)).rejects.toMatchObject({ status: 403 });
  f.event.sessionId = id;
  f.event.userId = id;
  await expect(f.api.events(actor, viuId, id, 1)).rejects.toMatchObject({ status: 403 });
  f.row.id = viuId;
  await expect(f.api.detail(actor, viuId, 'navigation', id)).rejects.toMatchObject({ status: 403 });
  f.row.startedAt = 'invalid';
  await expect(f.api.detail(actor, viuId, 'navigation', id)).rejects.toMatchObject({ status: 502 });
});
it('does not turn errors into an empty history or swallow aborts', async () => {
  const f = fixture();
  const original = f.get.getMockImplementation()!;
  for (const status of [402, 403, 404, 500]) {
    f.get.mockImplementation(async (path, signal) => {
      if (path.startsWith('/api/caregiver-links?')) return original(path, signal);
      throw new ServiceError('server error', status);
    });
    await expect(
      f.api.list(actor, viuId, 'navigation', 1, { dateFrom: '', dateTo: '' }),
    ).rejects.toMatchObject({ status });
  }
  f.get.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
  await expect(f.api.detail(actor, viuId, 'navigation', id)).rejects.toMatchObject({
    name: 'AbortError',
  });
});
it('rejects invalid/reversed dates and pages; empty date range remains unfiltered', async () => {
  expect(activityDateRange('', '')).toEqual({ dateFrom: '', dateTo: '' });
  for (const date of ['2026-02-30', 'bad', '2026-13-01'])
    expect(() => activityDateRange(date, '')).toThrow();
  expect(() => activityDateRange('2026-10-12', '2026-10-11')).toThrow();
  const f = fixture();
  await expect(
    f.api.list(actor, viuId, 'navigation', 0, { dateFrom: '', dateTo: '' }),
  ).rejects.toMatchObject({ status: 400 });
  expect(f.get).not.toHaveBeenCalled();
});

it('UC-74 export walks every page with pageSize 100, keeps scope checks and caps the row count', async () => {
  const f = fixture('ocr');
  const pageOf = (page: number, total: number) => ({
    items: Array.from({ length: Math.min(100, total - (page - 1) * 100) }, () => f.row),
    page,
    pageSize: 100,
    totalCount: total,
    totalPages: Math.ceil(total / 100),
    hasNextPage: page * 100 < total,
    hasPreviousPage: page > 1,
  });
  let total = 250;
  f.get.mockImplementation(async (path) => {
    if (path.startsWith('/api/caregiver-links?')) return paged([f.link]);
    return pageOf(Number(new URL(path, 'https://example.test').searchParams.get('page')), total);
  });
  const range = activityDateRange('2026-10-11', '');
  const result = await f.api.exportAll(actor, viuId, 'ocr', range);
  expect(result).toMatchObject({ totalCount: 250, truncated: false });
  expect(result.items).toHaveLength(250);
  const lists = f.get.mock.calls
    .map(([path]) => new URL(path, 'https://example.test'))
    .filter((url) => url.pathname === activityKinds.ocr.path);
  expect(lists.map((url) => url.searchParams.get('page'))).toEqual(['1', '2', '3']);
  expect(lists.every((url) => url.searchParams.get('pageSize') === '100')).toBe(true);
  expect(lists[0].searchParams.get('userId')).toBe(viuId);
  expect(lists[0].searchParams.get('dateFrom')).toBe('2026-10-10T17:00:00.000Z');

  total = maxExportRows + 300;
  const capped = await f.api.exportAll(actor, viuId, 'ocr', range);
  expect(capped.items).toHaveLength(maxExportRows);
  expect(capped).toMatchObject({ truncated: true, totalCount: maxExportRows + 300 });

  f.get.mockImplementation(async (path) => {
    if (path.startsWith('/api/caregiver-links?')) return paged([f.link]);
    return { ...pageOf(1, 1), items: [{ ...f.row, userId: id }] };
  });
  await expect(f.api.exportAll(actor, viuId, 'ocr', range)).rejects.toMatchObject({ status: 403 });
  await expect(
    f.api.exportAll({ ...actor, role: 'Admin' }, viuId, 'ocr', range),
  ).rejects.toMatchObject({ status: 403 });
});
it('UC-74 export columns leave out internal ids', () => {
  expect(exportColumns('qr')).not.toContain('id');
  expect(exportColumns('qr')).not.toContain('ocrRequestId');
  expect(exportColumns('recognition')).not.toContain('matchedPersonId');
  expect(exportColumns('recognition')).toContain('matchedPersonName');
});

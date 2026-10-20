import { t, msg } from '../../i18n';
import { z } from 'zod';
import { apiGet } from './adapter';
import { createCaregivingApi } from './caregiving';
import { ServiceError } from '../contracts';
import { historyRange, type HistoryRange } from './locations';
import type { Person } from '../../models/domain';

const uuid = z.string().uuid();
const time = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();
const score = z.number().min(0).max(1).nullable();
const owner = { id: uuid, userId: uuid };
const position = {
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
};
const navigation = z.object({
  ...owner,
  startedAt: time,
  endedAt: time.nullable(),
  detectionMode: z.string(),
  totalDetections: count,
  totalAlertsIssued: count,
  deviceModel: z.string().nullable(),
  appVersion: z.string().nullable(),
  isActive: z.boolean(),
});
const ocr = z.object({
  ...owner,
  requestType: z.string(),
  triggerMethod: z.string(),
  rawText: z.string().nullable(),
  processedText: z.string().nullable(),
  confidenceScore: score,
  ocrEngine: z.string(),
  languageDetected: z.string().nullable(),
  processingTimeMs: count.nullable(),
  resultStatus: z.string(),
  errorMessage: z.string().nullable(),
  ttsAnnounced: z.boolean(),
  requestedAt: time,
  ...position,
});
const qr = z.object({
  ...owner,
  ocrRequestId: uuid,
  qrContent: z.string(),
  qrType: z.string().nullable(),
  isUrl: z.boolean(),
  urlDomain: z.string().nullable(),
  scannedAt: time,
  requestedAt: time,
  triggerMethod: z.string(),
  ocrEngine: z.string(),
  processingTimeMs: count.nullable(),
  resultStatus: z.string(),
  errorMessage: z.string().nullable(),
  ttsAnnounced: z.boolean(),
  ...position,
});
const recognition = z.object({
  id: uuid,
  visuallyImpairedUserId: uuid,
  matchedPersonId: uuid.nullable(),
  matchedPersonName: z.string().nullable(),
  similarityScore: score,
  recognitionResult: z.string(),
  estimatedDistance: z.string().nullable(),
  processingTimeMs: count.nullable(),
  recognizedAt: time,
  errorMessage: z.string().nullable(),
});
const voice = z.object({
  ...owner,
  rawTranscript: z.string().nullable(),
  matchedCommand: z.string().nullable(),
  recognitionEngine: z.string(),
  confidenceScore: score,
  executionStatus: z.string(),
  requiredConfirmation: z.boolean(),
  confirmedAt: time.nullable(),
  processingTimeMs: count.nullable(),
  audioDurationMs: count.nullable(),
  isOffline: z.boolean(),
  executedAt: time,
  ...position,
});
const event = z.object({
  ...owner,
  sessionId: uuid,
  objectClass: z.string(),
  confidenceScore: z.number().min(0).max(1),
  distanceRange: z.string(),
  alertIssued: z.boolean(),
  inferenceTimeMs: count.nullable(),
  detectedAt: time,
  ...position,
});

export const activityKinds = {
  navigation: {
    label: msg('Di chuyển'),
    path: '/api/navigation/sessions',
    schema: navigation,
    at: 'startedAt',
    summary: 'detectionMode',
  },
  ocr: {
    label: msg('Đọc chữ'),
    path: '/api/ocr/requests',
    schema: ocr,
    at: 'requestedAt',
    summary: 'resultStatus',
  },
  qr: {
    label: msg('Quét QR'),
    path: '/api/ocr/qr-scans',
    schema: qr,
    at: 'scannedAt',
    summary: 'resultStatus',
  },
  recognition: {
    label: msg('Nhận diện'),
    path: '/api/face-registry/recognition-logs',
    schema: recognition,
    at: 'recognizedAt',
    summary: 'recognitionResult',
  },
  voice: {
    label: msg('Lệnh giọng nói'),
    path: '/api/voice-commands',
    schema: voice,
    at: 'executedAt',
    summary: 'executionStatus',
  },
} as const;
export type ActivityKind = keyof typeof activityKinds;
export type ActivityRecord = Record<string, string | number | boolean | null> & { id: string };
const pageSchema = z.object({
  items: z.array(z.unknown()),
  page: count.positive(),
  pageSize: count.positive(),
  totalCount: count,
  totalPages: count,
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type ActivityPage = Omit<z.infer<typeof pageSchema>, 'items'> & { items: ActivityRecord[] };
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ServiceError(t('Dữ liệu lịch sử từ máy chủ không hợp lệ.'), 502);
  return parsed.data;
}
function validId(id: string) {
  if (!uuid.safeParse(id).success)
    throw new ServiceError(t('Mã lịch sử hoặc người được chăm sóc không hợp lệ.'), 400);
}
function scoped(schema: z.ZodType, raw: unknown, viuId: string, id?: string): ActivityRecord {
  const data = parse(schema, raw) as ActivityRecord;
  if ((data.userId ?? data.visuallyImpairedUserId) !== viuId || (id && data.id !== id))
    throw new ServiceError(t('Lịch sử không thuộc người hoặc bản ghi được chọn.'), 403);
  return data;
}
function queryParams(page: number, range: HistoryRange) {
  if (!Number.isInteger(page) || page < 1) throw new ServiceError(t('Trang không hợp lệ.'), 400);
  const dates = historyRange(range.dateFrom, range.dateTo);
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (dates.dateFrom) query.set('dateFrom', dates.dateFrom);
  if (dates.dateTo) query.set('dateTo', dates.dateTo);
  return query;
}
export function activityDateRange(from: string, to: string): HistoryRange {
  for (const date of [from, to]) {
    const parsed = new Date(date + 'T00:00:00Z');
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date)
    )
      throw new ServiceError(t('Ngày lọc không hợp lệ.'), 400);
  }
  return historyRange(from ? from + 'T00:00:00+07:00' : '', to ? to + 'T23:59:59.999+07:00' : '');
}
export function createActivityApi(get = apiGet) {
  async function authorize(actor: Person, viuId: string, signal?: AbortSignal) {
    validId(viuId);
    if (actor.role !== 'Caregiver')
      throw new ServiceError(t('Lịch sử này dành cho người chăm sóc có liên kết.'), 403);
    const links = await createCaregivingApi(get).links(actor.id, viuId, 1, signal);
    if (!links.items.some((link) => !link.unlinkedAt))
      throw new ServiceError(t('Bạn không còn liên kết chăm sóc hoạt động với người này.'), 403);
  }
  async function detail(
    actor: Person,
    viuId: string,
    kind: ActivityKind,
    id: string,
    signal?: AbortSignal,
  ) {
    validId(id);
    await authorize(actor, viuId, signal);
    return scoped(
      activityKinds[kind].schema,
      await get(`${activityKinds[kind].path}/${id}`, signal),
      viuId,
      id,
    );
  }
  return {
    async list(
      actor: Person,
      viuId: string,
      kind: ActivityKind,
      page: number,
      range: HistoryRange,
      signal?: AbortSignal,
    ): Promise<ActivityPage> {
      const query = queryParams(page, range);
      await authorize(actor, viuId, signal);
      query.set(kind === 'recognition' ? 'viuId' : 'userId', viuId);
      const data = parse(pageSchema, await get(`${activityKinds[kind].path}?${query}`, signal));
      if (data.page !== page) throw new ServiceError(t('Máy chủ trả về sai trang lịch sử.'), 502);
      return {
        ...data,
        items: data.items.map((item) => scoped(activityKinds[kind].schema, item, viuId)),
      };
    },
    detail,
    async events(
      actor: Person,
      viuId: string,
      sessionId: string,
      page: number,
      signal?: AbortSignal,
    ): Promise<ActivityPage> {
      const query = queryParams(page, { dateFrom: '', dateTo: '' });
      await detail(actor, viuId, 'navigation', sessionId, signal);
      const data = parse(
        pageSchema,
        await get(`/api/navigation/sessions/${sessionId}/events?${query}`, signal),
      );
      if (data.page !== page) throw new ServiceError(t('Máy chủ trả về sai trang phát hiện.'), 502);
      const items = data.items.map((raw) => {
        const item = scoped(event, raw, viuId);
        if (item.sessionId !== sessionId)
          throw new ServiceError(t('Phát hiện không thuộc phiên được chọn.'), 403);
        return item;
      });
      return { ...data, items };
    },
  };
}
export const activityApi = createActivityApi();

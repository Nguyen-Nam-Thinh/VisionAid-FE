import { z } from 'zod';
import { apiGet } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const uuid = z.string().uuid();
const time = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();
const metric = z.object({
  id: uuid,
  modelName: z.string(),
  modelVersion: z.string(),
  metricDate: z.iso.date(),
  sourceTable: z.string(),
  totalRequests: count,
  successfulRequests: count,
  failedRequests: count,
  avgConfidence: z.number().min(0).max(1).nullable(),
  avgLatencyMs: count.nullable(),
  p95LatencyMs: count.nullable(),
  p99LatencyMs: count.nullable(),
  errorCount: count,
  aggregatedBy: z.string(),
  recordedAt: time,
});
// Raw audit payloads may contain credentials or personal data; do not retain them in query cache.
const audit = z.object({
  id: uuid,
  actorId: uuid.nullable(),
  actionType: z.string(),
  targetTable: z.string(),
  targetRecordId: uuid.nullable(),
  performedAt: time,
});
const failed = z.object({
  id: uuid,
  sourceType: z.string(),
  emergencyEventId: uuid.nullable(),
  locationBoundaryEventId: uuid.nullable(),
  recipientId: uuid,
  notificationType: z.string(),
  channel: z.string(),
  status: z.literal('Failed'),
  failureReason: z.string().nullable(),
  createdAt: time,
});
// Keep operational metadata only; scene JSON and spoken content stay out of cache/UI.
const guidance = z.object({
  id: uuid,
  sessionId: uuid,
  userId: uuid,
  frameId: z.number().int(),
  decision: z.string(),
  engineUsed: z.string(),
  isOfflineFallback: z.boolean(),
  latencyMs: count.nullable(),
  createdAt: time,
});
export const guidanceEngines = ['Jev', 'Groq', 'RuleBased'] as const;
const period = z.object({
  totalSent: count,
  totalFailed: count,
  totalPending: count,
  byChannel: z.array(z.object({ channel: z.string(), sent: count, failed: count })),
});
const status = z.object({ last24Hours: period, last7Days: period });
const pageSchema = z.object({
  items: z.array(z.unknown()),
  page: count.positive(),
  pageSize: count.positive(),
  totalCount: count,
  totalPages: count,
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export const auditActions = [
  'UserCreated',
  'UserDeactivated',
  'UserReactivated',
  'RoleChanged',
  'CaregiverLinked',
  'CaregiverUnlinked',
  'FaceRegistryDeleted',
  'GpsDataAccessed',
  'ConfigChanged',
  'AccountForceLogout',
  'EmergencyContactModified',
  'SystemGpsCleanup',
  'SystemOcrCleanup',
  'SystemAlertCleanup',
  'SystemFaceImageCleanup',
  'SystemTokenCleanup',
  'OrganizationCreated',
  'OrganizationUpdated',
  'UserAssignedToOrg',
  'UserRemovedFromOrg',
] as const;
const kinds = {
  metrics: { path: '/api/ai-metrics', schema: metric },
  audit: { path: '/api/audit-logs', schema: audit },
  delivery: { path: '/api/notifications/failed', schema: failed },
  guidance: { path: '/api/navigation/guidance/logs', schema: guidance },
};
export type MonitoringKind = keyof typeof kinds;
export type MonitoringRecord = Record<string, string | number | boolean | null> & { id: string };
export type MonitoringFilters = {
  from?: string;
  to?: string;
  modelName?: string;
  actorId?: string;
  actionType?: string;
  targetTable?: string;
  targetRecordId?: string;
  channel?: string;
  userId?: string;
  sessionId?: string;
  engineUsed?: string;
  isOfflineFallback?: string;
};
function authorize(actor: Pick<Person, 'role'>) {
  if (actor.role !== 'Admin')
    throw new ServiceError('Chỉ quản trị viên hệ thống được xem dữ liệu này.', 403);
}
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new ServiceError('Dữ liệu giám sát từ máy chủ không hợp lệ.', 502);
  return result.data;
}
export function createMonitoringApi(get = apiGet) {
  return {
    async list(
      actor: Pick<Person, 'role'>,
      kind: MonitoringKind,
      page: number,
      filters: MonitoringFilters,
      signal?: AbortSignal,
    ) {
      authorize(actor);
      if (!Number.isInteger(page) || page < 1) throw new ServiceError('Trang không hợp lệ.', 400);
      const { from = '', to = '' } = filters;
      if (
        [from, to].some((d) => d && !z.iso.date().safeParse(d).success) ||
        (from && to && from > to)
      )
        throw new ServiceError('Khoảng ngày không hợp lệ. Kiểm tra ngày bắt đầu và kết thúc.', 400);
      const query = new URLSearchParams({ page: String(page), pageSize: '20' });
      // Vietnam day bounds sent as UTC: the deployed BE returns 500 for a non-zero offset.
      const utc = (date: string, time: string) => new Date(`${date}T${time}+07:00`).toISOString();
      if (from) query.set('dateFrom', kind === 'metrics' ? from : utc(from, '00:00:00'));
      if (to)
        query.set(
          'dateTo',
          kind === 'metrics' ? to : utc(to, '23:59:59').replace('.000Z', '.9999999Z'),
        );
      const allowed =
        kind === 'metrics'
          ? (['modelName'] as const)
          : kind === 'audit'
            ? (['actorId', 'actionType', 'targetTable', 'targetRecordId'] as const)
            : kind === 'guidance'
              ? (['userId', 'sessionId', 'engineUsed', 'isOfflineFallback'] as const)
              : (['channel'] as const);
      for (const key of allowed) {
        const value = filters[key]?.trim();
        if (!value) continue;
        if (
          ['actorId', 'targetRecordId', 'userId', 'sessionId'].includes(key) &&
          !uuid.safeParse(value).success
        )
          throw new ServiceError('Mã định danh phải là UUID hợp lệ.', 400);
        if (
          (key === 'targetTable' && value.length > 100) ||
          (key === 'actionType' && !auditActions.some((action) => action === value)) ||
          (key === 'channel' && !['Fcm', 'SignalR', 'Email'].includes(value)) ||
          (key === 'engineUsed' && !guidanceEngines.some((engine) => engine === value)) ||
          (key === 'isOfflineFallback' && !['true', 'false'].includes(value))
        )
          throw new ServiceError('Bộ lọc không hợp lệ.', 400);
        query.set(key, value);
      }
      const data = parse(pageSchema, await get(kinds[kind].path + '?' + query, signal));
      return {
        ...data,
        items: data.items.map((item) =>
          parse(kinds[kind].schema as z.ZodType<MonitoringRecord>, item),
        ),
      };
    },
    async status(actor: Pick<Person, 'role'>, signal?: AbortSignal) {
      authorize(actor);
      return parse(status, await get('/api/notifications/status', signal));
    },
  };
}
export const monitoringApi = createMonitoringApi();

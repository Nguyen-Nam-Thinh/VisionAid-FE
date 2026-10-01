import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { caregivingApi } from './caregiving';
import { historyRange } from './locations';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';
const status = z.enum([
  'Detected',
  'Dismissed',
  'Sent',
  'Acknowledged',
  'Escalated',
  'Resolved',
  'Called',
]);
export const alertLabels: Record<z.infer<typeof status>, string> = {
  Detected: 'Mới phát hiện',
  Dismissed: 'Đã hủy',
  Sent: 'Đã gửi',
  Acknowledged: 'Đã tiếp nhận',
  Escalated: 'Đã chuyển cấp',
  Resolved: 'Đã giải quyết',
  Called: 'Đã gọi',
};
const date = z.string().datetime({ offset: true });
const eventSchema = z.object({
  id: z.string().uuid(),
  visuallyImpairedUserId: z.string().uuid(),
  detectionMethod: z.string(),
  currentStatus: status,
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  notes: z.string().nullable(),
  snapshotPath: z.string().nullable(),
  detectedAt: date,
  gracePeriodEndsAt: date.nullable(),
  sentAt: date.nullable(),
  acknowledgedAt: date.nullable(),
  acknowledgedBy: z.string().uuid().nullable(),
  escalatedAt: date.nullable(),
  resolvedAt: date.nullable(),
  resolvedBy: z.string().uuid().nullable(),
  dismissedAt: date.nullable(),
});
const detailSchema = eventSchema.extend({
  statusHistory: z.array(
    z.object({
      id: z.string().uuid(),
      fromStatus: status,
      toStatus: status,
      changedBy: z.string().uuid().nullable(),
      changedAt: date,
      reason: z.string().nullable(),
    }),
  ),
});
const pageSchema = z.object({
  items: z.array(eventSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
const escalationSchema = z.object({
  eventId: z.string().uuid(),
  currentStatus: z.literal('Escalated'),
  escalatedAt: date,
  emergencyContacts: z.array(
    z.object({
      id: z.string().uuid(),
      contactName: z.string(),
      contactType: z.string(),
      phoneNumber: z.string().nullable(),
      zaloDeepLink: z.string().nullable(),
      priorityOrder: z.number().int(),
    }),
  ),
});
export type Emergency = z.infer<typeof eventSchema>;
export type Escalation = z.infer<typeof escalationSchema>;
export type AlertAction = 'acknowledge' | 'escalate' | 'resolve';
export const actionLabels: Record<AlertAction, string> = {
  acknowledge: 'Tiếp nhận cảnh báo',
  escalate: 'Chuyển cấp hỗ trợ',
  resolve: 'Đánh dấu đã giải quyết',
};
export function alertActions(s: Emergency['currentStatus']): AlertAction[] {
  return s === 'Sent'
    ? ['acknowledge', 'escalate', 'resolve']
    : s === 'Acknowledged'
      ? ['escalate', 'resolve']
      : s === 'Escalated'
        ? ['resolve']
        : [];
}
type Actor = Pick<Person, 'id' | 'role' | 'orgId'>;
export type AlertFilters = {
  viuId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  page: number;
};
function parse<T>(schema: z.ZodType<T>, value: unknown) {
  const r = schema.safeParse(value);
  if (!r.success) throw new ServiceError('Dữ liệu cảnh báo từ máy chủ không hợp lệ.', 502);
  return r.data;
}
function authorize(actor: Actor) {
  if (
    !['Caregiver', 'CenterAdmin'].includes(actor.role) ||
    (actor.role === 'CenterAdmin' && !actor.orgId)
  )
    throw new ServiceError('Không có quyền truy cập cảnh báo.', 403);
}
function uuid(id: string) {
  if (!z.string().uuid().safeParse(id).success)
    throw new ServiceError('Mã định danh không hợp lệ.', 400);
}
export function createEmergenciesApi(get = apiGet, write = apiWrite, links = caregivingApi.links) {
  async function detail(actor: Actor, id: string, signal?: AbortSignal) {
    authorize(actor);
    uuid(id);
    const result = parse(detailSchema, await get('/api/emergency-events/' + id, signal));
    if (result.id !== id) throw new ServiceError('Cảnh báo không khớp yêu cầu.', 403);
    return result;
  }
  async function canAct(actor: Actor, viuId: string, signal?: AbortSignal) {
    authorize(actor);
    uuid(viuId);
    if (actor.role === 'CenterAdmin') return true; // BE checks organization on detail and every write.
    const result = await links(actor.id, viuId, 1, signal);
    return result.items.some(
      (l) =>
        l.caregiverId === actor.id &&
        l.visuallyImpairedUserId === viuId &&
        !l.unlinkedAt &&
        l.canReceiveAlerts,
    );
  }
  return {
    detail,
    canAct,
    async list(actor: Actor, filters: AlertFilters, signal?: AbortSignal) {
      authorize(actor);
      if (filters.viuId) uuid(filters.viuId);
      if (filters.status && !status.safeParse(filters.status).success)
        throw new ServiceError('Trạng thái không hợp lệ.', 400);
      if (!Number.isInteger(filters.page) || filters.page < 1)
        throw new ServiceError('Trang không hợp lệ.', 400);
      const range = historyRange(filters.dateFrom, filters.dateTo);
      const q = new URLSearchParams({ page: String(filters.page), pageSize: '20' });
      for (const [key, value] of Object.entries({
        viuId: filters.viuId,
        status: filters.status,
        ...range,
      }))
        if (value) q.set(key, value);
      const result = parse(pageSchema, await get('/api/emergency-events?' + q, signal));
      if (filters.viuId && result.items.some((e) => e.visuallyImpairedUserId !== filters.viuId))
        throw new ServiceError('Cảnh báo không thuộc VIU được chọn.', 403);
      return result;
    },
    async act(
      actor: Actor,
      id: string,
      expectedStatus: Emergency['currentStatus'],
      action: AlertAction,
      notes: string,
    ) {
      const current = await detail(actor, id);
      if (
        current.currentStatus !== expectedStatus ||
        !alertActions(current.currentStatus).includes(action)
      )
        throw new ServiceError('Trạng thái đã thay đổi. Hãy xem dữ liệu mới trước khi xử lý.', 409);
      if (!(await canAct(actor, current.visuallyImpairedUserId)))
        throw new ServiceError('Bạn không có quyền xử lý cảnh báo này.', 403);
      const response = await write('/api/emergency-events/' + id + '/' + action, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() || null }),
      });
      if (action !== 'escalate') return null;
      const result = parse(escalationSchema, response);
      if (result.eventId !== id)
        throw new ServiceError('Phản hồi chuyển cấp không khớp cảnh báo.', 502);
      return result;
    },
  };
}
export const emergenciesApi = createEmergenciesApi();

import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

export const notificationTypes = {
  FallDetected: 'Phát hiện té ngã',
  EmergencyManual: 'Khẩn cấp chủ động',
  GeofenceBreach: 'Vượt vùng an toàn',
  ArrivalNotification: 'Thông báo đến nơi',
  SystemAlert: 'Thông báo hệ thống',
};
export const channels = { Fcm: 'Push (FCM)', SignalR: 'Realtime (SignalR)', Email: 'Email' };
const type = z.enum([
  'FallDetected',
  'EmergencyManual',
  'GeofenceBreach',
  'ArrivalNotification',
  'SystemAlert',
]);
const channel = z.enum(['Fcm', 'SignalR', 'Email']);
const targetRole = z.enum(['Admin', 'CenterAdmin', 'Caregiver']);
const pair = z.object({ notificationType: type, channel });
const preference = pair.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isEnabled: z.boolean(),
  updatedAt: z.string(),
});
const flags = z.object({ isMandatory: z.boolean(), isActive: z.boolean() });
const rule = pair.extend({
  id: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  targetRole,
  ...flags.shape,
  createdAt: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string().uuid().nullable(),
});
const create = pair.extend({
  organizationId: z.string().uuid().nullable(),
  targetRole,
  ...flags.shape,
});
const pageSchema = z.object({
  items: z.array(rule),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});
export type NotificationRule = z.infer<typeof rule>;
export type NotificationPreference = z.infer<typeof preference>;
export type RuleInput = z.infer<typeof create>;
type Scope = Pick<Person, 'id' | 'role' | 'orgId'>;
export type RuleFilters = {
  notificationType: string;
  channel: string;
  targetRole: string;
  isActive: string;
};
function parse<T>(schema: z.ZodType<T>, data: unknown, status = 502): T {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new ServiceError(
      'Dữ liệu thông báo không hợp lệ. Kiểm tra các trường và tải lại.',
      status,
    );
  return result.data;
}
function checkScope(actor: Scope) {
  if (actor.role !== 'Admin' && (actor.role !== 'CenterAdmin' || !actor.orgId))
    throw new ServiceError('Không có quyền quản lý quy tắc.', 403);
}
export function canEditRule(actor: Scope, item: NotificationRule) {
  return (
    actor.role === 'Admin' ||
    (actor.role === 'CenterAdmin' && !!actor.orgId && item.organizationId === actor.orgId)
  );
}
export function createNotificationsApi(get = apiGet, write = apiWrite) {
  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const preferences = (actor: Scope, data: unknown) => {
    const items = parse(z.array(preference), data);
    if (items.some((item) => item.userId !== actor.id))
      throw new ServiceError('Tùy chọn không thuộc tài khoản hiện tại.', 403);
    return items;
  };
  const checkedRule = (actor: Scope, data: unknown) => {
    const item = parse(rule, data);
    if (
      actor.role === 'CenterAdmin' &&
      item.organizationId !== null &&
      item.organizationId !== actor.orgId
    )
      throw new ServiceError('Quy tắc không thuộc trung tâm hiện tại.', 403);
    return item;
  };
  return {
    async preferences(actor: Scope, signal?: AbortSignal) {
      return preferences(actor, await get('/api/notifications/preferences', signal));
    },
    async savePreference(actor: Scope, values: unknown) {
      const item = parse(pair.extend({ isEnabled: z.boolean() }), values, 400);
      return preferences(
        actor,
        await write('/api/notifications/preferences', json('PUT', { preferences: [item] })),
      );
    },
    async rules(actor: Scope, page: number, filters: RuleFilters, signal?: AbortSignal) {
      checkScope(actor);
      const query = new URLSearchParams({ page: String(page), pageSize: '10' });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      const result = parse(pageSchema, await get('/api/notifications/rules?' + query, signal));
      result.items.forEach((item) => checkedRule(actor, item));
      return result;
    },
    async createRule(actor: Scope, values: unknown) {
      checkScope(actor);
      const input = parse(create, values, 400);
      if (actor.role === 'CenterAdmin') input.organizationId = actor.orgId;
      const item = checkedRule(actor, await write('/api/notifications/rules', json('POST', input)));
      if (item.organizationId !== input.organizationId)
        throw new ServiceError('Phạm vi quy tắc trả về không khớp.', 502);
      return item;
    },
    async updateRule(actor: Scope, item: NotificationRule, values: unknown) {
      checkScope(actor);
      if (!canEditRule(actor, item))
        throw new ServiceError('Chỉ được sửa quy tắc của trung tâm mình.', 403);
      const id = parse(z.string().uuid(), item.id, 400);
      const result = checkedRule(
        actor,
        await write('/api/notifications/rules/' + id, json('PUT', parse(flags, values, 400))),
      );
      if (result.id !== id || result.organizationId !== item.organizationId)
        throw new ServiceError('Quy tắc trả về không khớp.', 502);
      return result;
    },
    async removeRule(actor: Scope, item: NotificationRule) {
      checkScope(actor);
      if (!canEditRule(actor, item))
        throw new ServiceError('Chỉ được xóa quy tắc của trung tâm mình.', 403);
      await write('/api/notifications/rules/' + parse(z.string().uuid(), item.id, 400), {
        method: 'DELETE',
      });
    },
  };
}
export const notificationsApi = createNotificationsApi();

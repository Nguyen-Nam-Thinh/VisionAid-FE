import { t } from '../../i18n';
import { z } from 'zod';
import { apiGet } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const timestamp = z.string().datetime({ offset: true });
const point = { latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) };
const liveSchema = z.object({
  userId: z.string().uuid(),
  ...point,
  formattedAddress: z.string(),
  street: z.string().nullable(),
  district: z.string().nullable(),
  city: z.string().nullable(),
  geocodeProvider: z.string().nullable(),
  cachedAt: timestamp,
  updatedAt: timestamp,
});
const historyItem = z.object({
  id: z.string().uuid(),
  ...point,
  accuracyMeters: z.number().nonnegative().nullable(),
  altitude: z.number().nullable(),
  speedMps: z.number().nonnegative().nullable(),
  heading: z.number().min(0).max(360).nullable(),
  batteryLevel: z.number().int().min(0).max(100).nullable(),
  networkStatus: z.string().nullable(),
  recordedAt: timestamp,
  sessionId: z.string().uuid().nullable(),
});
const historySchema = z.object({
  items: z.array(historyItem),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});
export const boundaryEventTypes = ['Entered', 'Exited', 'Arrived'] as const;
export type BoundaryEventType = (typeof boundaryEventTypes)[number];
const boundaryItem = z.object({
  id: z.string().uuid(),
  visuallyImpairedUserId: z.string().uuid(),
  eventType: z.enum(boundaryEventTypes),
  geofenceId: z.string().uuid().nullable(),
  geofenceName: z.string().nullable(),
  savedLocationId: z.string().uuid().nullable(),
  savedLocationName: z.string().nullable(),
  ...point,
  alertSent: z.boolean(),
  occurredAt: timestamp,
});
const boundarySchema = historySchema.extend({ items: z.array(boundaryItem) });
export type BoundaryEvent = z.infer<typeof boundaryItem>;
export type BoundaryFilters = HistoryRange & { eventType: BoundaryEventType | ''; page: number };
export type LiveLocation = z.infer<typeof liveSchema>;
export type HistoryRange = { dateFrom: string; dateTo: string };
type Actor = Pick<Person, 'role' | 'orgId'>;
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ServiceError(t('Dữ liệu GPS từ máy chủ không hợp lệ.'), 502);
  return result.data;
}
function authorize(actor: Actor, viuId: string) {
  if (
    !['Caregiver', 'CenterAdmin'].includes(actor.role) ||
    (actor.role === 'CenterAdmin' && !actor.orgId)
  )
    throw new ServiceError(t('Không có quyền xem vị trí.'), 403);
  if (!z.string().uuid().safeParse(viuId).success)
    throw new ServiceError(t('Mã VIU không hợp lệ.'), 400);
}
export function historyRange(from: string, to: string): HistoryRange {
  const convert = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new ServiceError(t('Thời gian không hợp lệ.'), 400);
    return date.toISOString();
  };
  const dateFrom = convert(from),
    dateTo = convert(to);
  if (dateFrom && dateTo && dateFrom > dateTo)
    throw new ServiceError(t('Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.'), 400);
  return { dateFrom, dateTo };
}
export function locationAge(cachedAt: string, now: number) {
  const age = now - Date.parse(cachedAt);
  if (!Number.isFinite(age) || age < -60000) return t('Cần kiểm tra thời gian thiết bị');
  return age > 120000 ? t('Dữ liệu cũ hơn 2 phút') : t('Ghi nhận trong 2 phút gần đây');
}
export function createLocationsApi(get = apiGet) {
  return {
    async live(actor: Actor, viuId: string, signal?: AbortSignal) {
      authorize(actor, viuId);
      const data = parse(
        liveSchema,
        await get('/api/locations/live?' + new URLSearchParams({ viuId }), signal),
      );
      if (data.userId !== viuId)
        throw new ServiceError(t('Vị trí không thuộc VIU được chọn.'), 403);
      return data;
    },
    async history(
      actor: Actor,
      viuId: string,
      page: number,
      range: HistoryRange,
      signal?: AbortSignal,
    ) {
      authorize(actor, viuId);
      if (!Number.isInteger(page) || page < 1)
        throw new ServiceError(t('Trang không hợp lệ.'), 400);
      const dates = historyRange(range.dateFrom, range.dateTo);
      const query = new URLSearchParams({ viuId, page: String(page), pageSize: '10' });
      if (dates.dateFrom) query.set('dateFrom', dates.dateFrom);
      if (dates.dateTo) query.set('dateTo', dates.dateTo);
      return parse(historySchema, await get('/api/locations/history?' + query, signal));
    },
    /** FE-18: geofence entries/exits and saved-place arrivals of one VIU, newest first. */
    async boundaryEvents(
      actor: Actor,
      viuId: string,
      filters: BoundaryFilters,
      signal?: AbortSignal,
    ) {
      authorize(actor, viuId);
      if (!Number.isInteger(filters.page) || filters.page < 1)
        throw new ServiceError(t('Trang không hợp lệ.'), 400);
      if (filters.eventType && !boundaryEventTypes.includes(filters.eventType))
        throw new ServiceError(t('Loại sự kiện không hợp lệ.'), 400);
      const dates = historyRange(filters.dateFrom, filters.dateTo);
      const query = new URLSearchParams({ viuId, page: String(filters.page), pageSize: '10' });
      if (filters.eventType) query.set('eventType', filters.eventType);
      if (dates.dateFrom) query.set('dateFrom', dates.dateFrom);
      if (dates.dateTo) query.set('dateTo', dates.dateTo);
      const data = parse(
        boundarySchema,
        await get('/api/locations/boundary-events?' + query, signal),
      );
      if (data.items.some((item) => item.visuallyImpairedUserId !== viuId))
        throw new ServiceError(t('Sự kiện không thuộc VIU được chọn.'), 403);
      return data;
    },
  };
}
export const locationsApi = createLocationsApi();

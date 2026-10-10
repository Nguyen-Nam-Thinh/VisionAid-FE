import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { createCaregivingApi } from './caregiving';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

export type PlaceKind = 'saved-locations' | 'geofences';
const coordinates = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
};
const commonInput = { name: z.string().trim().min(1).max(200), ...coordinates };
const savedInput = z.object({
  ...commonInput,
  description: z.string().trim().nullable(),
  arrivalRadiusMeters: z.number().int().min(10).max(5000),
  ttsAnnouncement: z.string().trim().max(500).nullable(),
});
const zoneInput = z.object({
  ...commonInput,
  radiusMeters: z.number().int().min(50).max(50000),
  alertOnExit: z.boolean(),
  alertOnEnter: z.boolean(),
});
const commonResponse = {
  id: z.string().uuid(),
  visuallyImpairedUserId: z.string().uuid(),
  name: z.string(),
  ...coordinates,
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
};
const savedSchema = z.object({
  ...commonResponse,
  description: z.string().nullable(),
  arrivalRadiusMeters: z.number().int().positive(),
  ttsAnnouncement: z.string().nullable(),
});
const zoneSchema = z.object({
  ...commonResponse,
  radiusMeters: z.number().int().positive(),
  alertOnExit: z.boolean(),
  alertOnEnter: z.boolean(),
});
export type Place = z.infer<typeof savedSchema> | z.infer<typeof zoneSchema>;
export function createPlacesApi(get = apiGet, write = apiWrite) {
  const validId = (value: string) => {
    if (!z.string().uuid().safeParse(value).success)
      throw new ServiceError('Mã địa điểm hoặc người được chăm sóc không hợp lệ.', 400);
    return value;
  };
  const authorize = async (actor: Person, viuId: string, manage = false, signal?: AbortSignal) => {
    validId(viuId);
    if (actor.role !== 'Caregiver')
      throw new ServiceError('Bạn không có quyền mở màn hình này.', 403);
    const links = await createCaregivingApi(get, write).links(actor.id, viuId, 1, signal);
    const active = links.items.filter((link) => !link.unlinkedAt);
    const canManage = active.some((link) => link.canManageLocations);
    if (!active.length || (manage && !canManage))
      throw new ServiceError(
        'Bạn không còn liên kết hoặc quyền quản lý vị trí cho người này.',
        403,
      );
    return canManage;
  };
  const schema = (kind: PlaceKind) => (kind === 'geofences' ? zoneSchema : savedSchema);
  const checked = (kind: PlaceKind, raw: unknown, viuId: string, id?: string): Place => {
    const parsed = schema(kind).safeParse(raw);
    if (!parsed.success) throw new ServiceError('Dữ liệu địa điểm từ máy chủ không hợp lệ.', 502);
    if (parsed.data.visuallyImpairedUserId !== viuId || (id && parsed.data.id !== id))
      throw new ServiceError('Địa điểm không thuộc người được chọn.', 403);
    return parsed.data;
  };
  const read = async (kind: PlaceKind, viuId: string, id: string, signal?: AbortSignal) =>
    checked(kind, await get(`/api/${kind}/${validId(id)}`, signal), viuId, id);
  return {
    async list(
      actor: Person,
      viuId: string,
      kind: PlaceKind,
      page: number,
      active: string,
      signal?: AbortSignal,
    ) {
      if (!Number.isInteger(page) || page < 1 || !['', 'true', 'false'].includes(active))
        throw new ServiceError('Bộ lọc địa điểm không hợp lệ.', 400);
      const canManage = await authorize(actor, viuId, false, signal);
      const query = new URLSearchParams({ viuId, page: String(page), pageSize: '20' });
      if (active) query.set('isActive', active);
      const result = z
        .object({
          items: z.array(schema(kind)),
          page: z.number().int().positive(),
          pageSize: z.number().int().positive(),
          totalCount: z.number().int().nonnegative(),
          totalPages: z.number().int().nonnegative(),
          hasNextPage: z.boolean(),
          hasPreviousPage: z.boolean(),
        })
        .safeParse(await get(`/api/${kind}?${query}`, signal));
      if (!result.success) throw new ServiceError('Danh sách địa điểm không hợp lệ.', 502);
      return {
        ...result.data,
        items: result.data.items.map((item) => checked(kind, item, viuId)),
        canManage,
      };
    },
    async detail(actor: Person, viuId: string, kind: PlaceKind, id: string, signal?: AbortSignal) {
      await authorize(actor, viuId, false, signal);
      return read(kind, viuId, id, signal);
    },
    async save(actor: Person, viuId: string, kind: PlaceKind, values: unknown, id?: string) {
      const input = kind === 'geofences' ? zoneInput : savedInput;
      const parsed = (id ? input.extend({ isActive: z.boolean() }) : input).safeParse(values);
      if (!parsed.success)
        throw new ServiceError(
          'Kiểm tra tên, tọa độ và bán kính. Bán kính phải là số nguyên trong khoảng cho phép.',
          400,
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
      await authorize(actor, viuId, true);
      if (id) await read(kind, viuId, id);
      return checked(
        kind,
        await write(`/api/${kind}` + (id ? `/${id}` : ''), {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            id ? parsed.data : { ...parsed.data, visuallyImpairedUserId: viuId },
          ),
        }),
        viuId,
        id,
      );
    },
    async remove(actor: Person, viuId: string, kind: PlaceKind, id: string) {
      await authorize(actor, viuId, true);
      await read(kind, viuId, id);
      await write(`/api/${kind}/${id}`, { method: 'DELETE' });
    },
  };
}
export const placesApi = createPlacesApi();

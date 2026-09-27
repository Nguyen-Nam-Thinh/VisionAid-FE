import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { linkSchema } from './caregiving';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const schema = linkSchema.extend({
  caregiverFullName: z.string(),
  caregiverEmail: z.string(),
  viuEmail: z.string(),
});
const pageSchema = z.object({
  items: z.array(schema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});
const personSchema = z.object({
  id: z.string().uuid(),
  role: z.string(),
  organizationId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  deletedAt: z.string().nullable(),
});
type Actor = Pick<Person, 'id' | 'role' | 'orgId'>;
export type CareLink = z.infer<typeof schema>;
export type LinkPermissions = Pick<
  CareLink,
  'canReceiveAlerts' | 'canManageRegistry' | 'canManageLocations'
>;
export type LinkFilters = {
  page: number;
  caregiverId: string;
  viuId: string;
  linkType: string;
  active: string;
};
function parse<T>(rule: z.ZodType<T>, value: unknown, status = 502): T {
  const parsed = rule.safeParse(value);
  if (!parsed.success)
    throw new ServiceError(
      status === 400 ? 'Mã hoặc dữ liệu liên kết không hợp lệ.' : 'Phản hồi liên kết không hợp lệ.',
      status,
    );
  return parsed.data;
}
function authorize(actor: Actor) {
  if (
    !['Admin', 'CenterAdmin', 'Caregiver'].includes(actor.role) ||
    (actor.role === 'CenterAdmin' && !actor.orgId)
  )
    throw new ServiceError('Không có quyền quản lý liên kết.', 403);
}
const uuid = (id: string) => parse(z.string().uuid(), id, 400);
function own(actor: Actor, link: CareLink) {
  if (actor.role === 'Caregiver' && link.caregiverId !== actor.id)
    throw new ServiceError('Chỉ được xem liên kết của chính bạn.', 403);
  if (actor.role === 'CenterAdmin' && link.linkType !== 'Organization')
    throw new ServiceError('Màn phân công trung tâm chỉ quản lý liên kết tổ chức.', 403);
  return link;
}
export const canManageLink = (actor: Actor, link: CareLink) =>
  !link.unlinkedAt &&
  (actor.role === 'Admin' ||
    (actor.role === 'CenterAdmin' && !!actor.orgId && link.linkType === 'Organization') ||
    (actor.role === 'Caregiver' && link.caregiverId === actor.id && link.linkType === 'Personal'));
export function createLinksApi(get = apiGet, write = apiWrite) {
  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const checkPeople = async (
    actor: Actor,
    cgId: string,
    viuId: string,
    type: string,
    requireActive: boolean,
    signal?: AbortSignal,
  ) => {
    const people = await Promise.all(
      [cgId, viuId].map((id) => get('/api/users/' + uuid(id), signal)),
    );
    const [cg, viu] = people.map((p) => parse(personSchema, p));
    if (
      cg.id !== cgId ||
      viu.id !== viuId ||
      cg.role !== 'Caregiver' ||
      viu.role !== 'VisuallyImpaired'
    )
      throw new ServiceError('Sai tài khoản Caregiver hoặc VIU.', 403);
    if (
      actor.role === 'CenterAdmin' &&
      (cg.organizationId !== actor.orgId || viu.organizationId !== actor.orgId)
    )
      throw new ServiceError('Hai tài khoản phải thuộc tổ chức của bạn.', 403);
    if (type === 'Organization' && (!cg.organizationId || cg.organizationId !== viu.organizationId))
      throw new ServiceError('Liên kết tổ chức yêu cầu hai tài khoản cùng tổ chức.', 422);
    if (requireActive && (!cg.isActive || !viu.isActive || cg.deletedAt || viu.deletedAt))
      throw new ServiceError('Hai tài khoản phải hoạt động và chưa bị xóa.', 422);
  };
  const checked = (actor: Actor, raw: unknown, id?: string) => {
    const link = own(actor, parse(schema, raw));
    if (id && link.id !== id) throw new ServiceError('Liên kết trả về không khớp lựa chọn.', 403);
    return link;
  };
  const detail = async (actor: Actor, id: string, signal?: AbortSignal) => {
    authorize(actor);
    const link = checked(actor, await get('/api/caregiver-links/' + uuid(id), signal), id);
    if (actor.role === 'CenterAdmin')
      await checkPeople(
        actor,
        link.caregiverId,
        link.visuallyImpairedUserId,
        link.linkType,
        false,
        signal,
      );
    return link;
  };
  const writable = async (actor: Actor, id: string) => {
    const link = await detail(actor, id);
    if (!canManageLink(actor, link))
      throw new ServiceError('Không thể sửa liên kết đã gỡ hoặc ngoài quyền của bạn.', 403);
    return link;
  };
  const permissions = (value: LinkPermissions) =>
    parse(
      z.object({
        canReceiveAlerts: z.boolean(),
        canManageRegistry: z.boolean(),
        canManageLocations: z.boolean(),
      }),
      value,
      400,
    );
  return {
    detail,
    async list(actor: Actor, filters: LinkFilters, signal?: AbortSignal) {
      authorize(actor);
      const query = new URLSearchParams({ page: String(filters.page), pageSize: '10' });
      if (filters.viuId) query.set('viuId', uuid(filters.viuId));
      if (actor.role === 'Caregiver') query.set('caregiverId', actor.id);
      else if (filters.caregiverId) query.set('caregiverId', uuid(filters.caregiverId));
      const type = actor.role === 'CenterAdmin' ? 'Organization' : filters.linkType;
      if (type) query.set('linkType', parse(z.enum(['Personal', 'Organization']), type, 400));
      if (filters.active) query.set('isActive', filters.active);
      const result = parse(pageSchema, await get('/api/caregiver-links?' + query, signal));
      result.items.forEach((link) => own(actor, link));
      return result;
    },
    async create(
      actor: Actor,
      values: { caregiverId: string; viuId: string; linkType: string } & LinkPermissions,
    ) {
      authorize(actor);
      const caregiverId = actor.role === 'Caregiver' ? actor.id : uuid(values.caregiverId.trim());
      const viuId = uuid(values.viuId.trim());
      const linkType =
        actor.role === 'CenterAdmin'
          ? 'Organization'
          : actor.role === 'Caregiver'
            ? 'Personal'
            : parse(z.enum(['Personal', 'Organization']), values.linkType, 400);
      if (caregiverId === viuId) throw new ServiceError('Không thể liên kết với chính mình.', 400);
      if (actor.role !== 'Caregiver') await checkPeople(actor, caregiverId, viuId, linkType, true);
      const link = checked(
        actor,
        await write(
          '/api/caregiver-links',
          json('POST', {
            caregiverId,
            visuallyImpairedUserId: viuId,
            linkType,
            isPrimary: false,
            ...permissions(values),
          }),
        ),
      );
      if (
        link.caregiverId !== caregiverId ||
        link.visuallyImpairedUserId !== viuId ||
        link.linkType !== linkType
      )
        throw new ServiceError('Kết quả không khớp phân công; hãy tải lại để xác minh.', 502);
      return link;
    },
    async permissions(actor: Actor, id: string, values: LinkPermissions) {
      const data = permissions(values);
      await writable(actor, id);
      return checked(
        actor,
        await write('/api/caregiver-links/' + id + '/permissions', json('PUT', data)),
        id,
      );
    },
    async promote(actor: Actor, id: string) {
      if (!['Admin', 'CenterAdmin'].includes(actor.role))
        throw new ServiceError('Chỉ quản trị viên được chuyển người chăm sóc chính.', 403);
      const link = await writable(actor, id);
      if (link.isPrimary)
        throw new ServiceError('Liên kết đã là chăm sóc chính; hãy tải lại.', 422);
      return checked(
        actor,
        await write('/api/caregiver-links/' + id + '/promote-primary', { method: 'PATCH' }),
        id,
      );
    },
    async remove(actor: Actor, id: string) {
      await writable(actor, id);
      await write('/api/caregiver-links/' + id, { method: 'DELETE' });
    },
  };
}
export const linksApi = createLinksApi();

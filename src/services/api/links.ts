import { t } from '../../i18n';
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
      status === 400
        ? t('Mã hoặc dữ liệu liên kết không hợp lệ.')
        : t('Phản hồi liên kết không hợp lệ.'),
      status,
    );
  return parsed.data;
}
function authorize(actor: Actor) {
  if (
    !['Admin', 'CenterAdmin', 'Caregiver'].includes(actor.role) ||
    (actor.role === 'CenterAdmin' && !actor.orgId)
  )
    throw new ServiceError(t('Không có quyền quản lý liên kết.'), 403);
}
const uuid = (id: string) => parse(z.string().uuid(), id, 400);
// primaryVius: VIUs the caregiver is primary for; only then may they see other caregivers' links.
function own(actor: Actor, link: CareLink, primaryVius: ReadonlySet<string> = new Set()) {
  if (
    actor.role === 'Caregiver' &&
    link.caregiverId !== actor.id &&
    !primaryVius.has(link.visuallyImpairedUserId)
  )
    throw new ServiceError(
      t('Chỉ được xem liên kết của bạn hoặc của người bạn chăm sóc chính.'),
      403,
    );
  if (actor.role === 'CenterAdmin' && link.linkType !== 'Organization')
    throw new ServiceError(t('Màn phân công trung tâm chỉ quản lý liên kết tổ chức.'), 403);
  return link;
}
export type LinkAccess = { edit: boolean; remove: boolean; promote: boolean };
/**
 * UC-32–34 / BR-04: the primary caregiver edits and removes secondaries' Personal links; a
 * secondary may only remove their own link. A primary link always keeps full permissions.
 */
export function linkAccess(
  actor: Actor,
  link: CareLink,
  primaryVius: ReadonlySet<string>,
): LinkAccess {
  const none = { edit: false, remove: false, promote: false };
  if (link.unlinkedAt) return none;
  if (actor.role === 'Admin') return { edit: true, remove: true, promote: true };
  if (actor.role === 'CenterAdmin')
    return actor.orgId && link.linkType === 'Organization'
      ? { edit: true, remove: true, promote: true }
      : none;
  if (actor.role !== 'Caregiver' || link.linkType !== 'Personal') return none;
  if (link.caregiverId === actor.id) return { ...none, remove: true };
  return primaryVius.has(link.visuallyImpairedUserId) && !link.isPrimary
    ? { ...none, edit: true, remove: true }
    : none;
}
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
      throw new ServiceError(t('Sai tài khoản Caregiver hoặc VIU.'), 403);
    if (
      actor.role === 'CenterAdmin' &&
      (cg.organizationId !== actor.orgId || viu.organizationId !== actor.orgId)
    )
      throw new ServiceError(t('Hai tài khoản phải thuộc tổ chức của bạn.'), 403);
    if (type === 'Organization' && (!cg.organizationId || cg.organizationId !== viu.organizationId))
      throw new ServiceError(t('Liên kết tổ chức yêu cầu hai tài khoản cùng tổ chức.'), 422);
    if (requireActive && (!cg.isActive || !viu.isActive || cg.deletedAt || viu.deletedAt))
      throw new ServiceError(t('Hai tài khoản phải hoạt động và chưa bị xóa.'), 422);
  };
  // Caregiver only: VIUs where the actor holds the active primary link.
  const primaryVius = async (actor: Actor, signal?: AbortSignal) => {
    if (actor.role !== 'Caregiver') return new Set<string>();
    const query = new URLSearchParams({ page: '1', pageSize: '50', isActive: 'true' });
    const result = parse(pageSchema, await get('/api/caregiver-links?' + query, signal));
    return new Set(
      result.items
        .filter((l) => l.caregiverId === actor.id && l.isPrimary && !l.unlinkedAt)
        .map((l) => l.visuallyImpairedUserId),
    );
  };
  const checked = (
    actor: Actor,
    raw: unknown,
    id?: string,
    primary: ReadonlySet<string> = new Set(),
  ) => {
    const link = own(actor, parse(schema, raw), primary);
    if (id && link.id !== id)
      throw new ServiceError(t('Liên kết trả về không khớp lựa chọn.'), 403);
    return link;
  };
  const detail = async (actor: Actor, id: string, signal?: AbortSignal) => {
    authorize(actor);
    const raw = await get('/api/caregiver-links/' + uuid(id), signal);
    const link = checked(actor, raw, id, await primaryVius(actor, signal));
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
  const writable = async (actor: Actor, id: string, need: keyof LinkAccess) => {
    const link = await detail(actor, id);
    if (!linkAccess(actor, link, await primaryVius(actor))[need])
      throw new ServiceError(t('Không thể sửa liên kết đã gỡ hoặc ngoài quyền của bạn.'), 403);
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
  /**
   * BR-04/BR-33 (BE be6a872): a caregiver may only add another caregiver, by exact email, to a VIU
   * they are the active primary of. Linking oneself happens when creating the VIU account (WF-03).
   */
  const addSecondary = async (
    actor: Actor,
    values: { caregiverEmail?: string; viuId: string } & LinkPermissions,
  ) => {
    const email = parse(
      z.string().trim().toLowerCase().email().max(255),
      values.caregiverEmail ?? '',
      400,
    );
    const viuId = uuid(values.viuId.trim());
    if (!(await primaryVius(actor)).has(viuId))
      throw new ServiceError(t('Chỉ người chăm sóc chính mới thêm được người chăm sóc khác.'), 403);
    const link = checked(
      actor,
      await write(
        '/api/caregiver-links',
        json('POST', {
          caregiverEmail: email,
          visuallyImpairedUserId: viuId,
          linkType: 'Personal',
          isPrimary: false,
          ...permissions(values),
        }),
      ),
      undefined,
      new Set([viuId]),
    );
    if (
      link.caregiverId === actor.id ||
      link.caregiverEmail.toLowerCase() !== email ||
      link.visuallyImpairedUserId !== viuId ||
      link.linkType !== 'Personal' ||
      link.isPrimary
    )
      throw new ServiceError(t('Kết quả không khớp phân công; hãy tải lại để xác minh.'), 502);
    return link;
  };
  return {
    detail,
    primaryVius,
    async list(actor: Actor, filters: LinkFilters, signal?: AbortSignal) {
      authorize(actor);
      const query = new URLSearchParams({ page: String(filters.page), pageSize: '10' });
      if (filters.viuId) query.set('viuId', uuid(filters.viuId));
      // BE scopes a caregiver to their own links plus links of VIUs they are primary for.
      if (actor.role !== 'Caregiver' && filters.caregiverId)
        query.set('caregiverId', uuid(filters.caregiverId));
      const type = actor.role === 'CenterAdmin' ? 'Organization' : filters.linkType;
      if (type) query.set('linkType', parse(z.enum(['Personal', 'Organization']), type, 400));
      if (filters.active) query.set('isActive', filters.active);
      const result = parse(pageSchema, await get('/api/caregiver-links?' + query, signal));
      const primary = result.items.some((l) => l.caregiverId !== actor.id)
        ? await primaryVius(actor, signal)
        : new Set<string>();
      result.items.forEach((link) => own(actor, link, primary));
      return result;
    },
    async create(
      actor: Actor,
      values: {
        caregiverId: string;
        caregiverEmail?: string;
        viuId: string;
        linkType: string;
      } & LinkPermissions,
    ) {
      authorize(actor);
      if (actor.role === 'Caregiver') return addSecondary(actor, values);
      const caregiverId = uuid(values.caregiverId.trim());
      const viuId = uuid(values.viuId.trim());
      const linkType =
        actor.role === 'CenterAdmin'
          ? 'Organization'
          : parse(z.enum(['Personal', 'Organization']), values.linkType, 400);
      if (caregiverId === viuId)
        throw new ServiceError(t('Không thể liên kết với chính mình.'), 400);
      await checkPeople(actor, caregiverId, viuId, linkType, true);
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
        throw new ServiceError(t('Kết quả không khớp phân công; hãy tải lại để xác minh.'), 502);
      return link;
    },
    async permissions(actor: Actor, id: string, values: LinkPermissions) {
      const data = permissions(values);
      const link = await writable(actor, id, 'edit');
      return checked(
        actor,
        await write('/api/caregiver-links/' + id + '/permissions', json('PUT', data)),
        id,
        new Set([link.visuallyImpairedUserId]),
      );
    },
    async promote(actor: Actor, id: string) {
      if (!['Admin', 'CenterAdmin'].includes(actor.role))
        throw new ServiceError(t('Chỉ quản trị viên được chuyển người chăm sóc chính.'), 403);
      const link = await writable(actor, id, 'promote');
      if (link.isPrimary)
        throw new ServiceError(t('Liên kết đã là chăm sóc chính; hãy tải lại.'), 422);
      return checked(
        actor,
        await write('/api/caregiver-links/' + id + '/promote-primary', { method: 'PATCH' }),
        id,
      );
    },
    async remove(actor: Actor, id: string) {
      await writable(actor, id, 'remove');
      await write('/api/caregiver-links/' + id, { method: 'DELETE' });
    },
  };
}
export const linksApi = createLinksApi();

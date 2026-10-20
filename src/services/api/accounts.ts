import { t } from '../../i18n';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const roleSchema = z.enum(['Admin', 'CenterAdmin', 'Caregiver', 'VisuallyImpaired']);
const accountSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  role: roleSchema,
  organizationId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  licenseStatus: z.string().nullable().optional(),
  licenseExpiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
  avatarUrl: z.string().nullable(),
  deletedAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const pageSchema = z.object({
  items: z.array(accountSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});
const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .regex(/[^a-zA-Z0-9]/);
const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => !v || /^0[35789][0-9]{8}$/.test(v)),
  avatarUrl: z.string().trim().max(500),
});
type Scope = Pick<Person, 'id' | 'role' | 'orgId'>;
export type Account = z.infer<typeof accountSchema>;
export type AccountInput = z.infer<typeof profileSchema> & {
  email: string;
  password: string;
  role: Account['role'];
  organizationId: string;
};
export type AccountFilters = {
  page: number;
  search: string;
  role: string;
  active: string;
  deleted: string;
  organizationId: string;
};
function parse<T>(
  schema: z.ZodType<T>,
  value: unknown,
  message = t('Dữ liệu tài khoản từ máy chủ không hợp lệ.'),
  status = 502,
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ServiceError(message, status);
  return result.data;
}
function authorize(actor: Scope, target?: Account) {
  if (
    actor.role !== 'Admin' &&
    (actor.role !== 'CenterAdmin' ||
      !actor.orgId ||
      (target && target.organizationId !== actor.orgId))
  )
    throw new ServiceError(t('Không có quyền quản lý tài khoản này.'), 403);
}
const validId = (id: string) => parse(z.string().uuid(), id, t('Mã phải là UUID hợp lệ.'), 400);
const profile = (values: unknown) =>
  parse(
    profileSchema,
    values,
    t('Kiểm tra họ tên tối đa 200 ký tự, điện thoại Việt Nam và URL ảnh tối đa 500 ký tự.'),
    400,
  );
export function createAccountsApi(get = apiGet, write = apiWrite) {
  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const checked = (actor: Scope, raw: unknown, id?: string) => {
    const target = parse(accountSchema, raw);
    authorize(actor, target);
    if (id && target.id !== id)
      throw new ServiceError(t('Tài khoản trả về không khớp lựa chọn.'), 403);
    return target;
  };
  const detail = async (actor: Scope, id: string, signal?: AbortSignal) => {
    authorize(actor);
    validId(id);
    return checked(actor, await get('/api/users/' + id, signal), id);
  };
  const writable = async (actor: Scope, id: string) => {
    const target = await detail(actor, id);
    if (target.deletedAt)
      throw new ServiceError(t('Tài khoản đã xóa; API hiện không hỗ trợ khôi phục.'), 422);
    return target;
  };
  return {
    detail,
    async list(actor: Scope, filters: AccountFilters, signal?: AbortSignal) {
      authorize(actor);
      const query = new URLSearchParams({
        page: String(filters.page),
        pageSize: '10',
        search: filters.search,
      });
      if (filters.role)
        query.set('role', parse(roleSchema, filters.role, t('Vai trò không hợp lệ.'), 400));
      if (filters.active) query.set('isActive', filters.active);
      if (filters.deleted) query.set('isDeleted', filters.deleted);
      const orgId = actor.role === 'CenterAdmin' ? actor.orgId : filters.organizationId;
      if (orgId) query.set('organizationId', validId(orgId));
      const result = parse(pageSchema, await get('/api/users?' + query, signal));
      result.items.forEach((target) => {
        authorize(actor, target);
        if (filters.role && target.role !== filters.role)
          throw new ServiceError(t('Danh sách trả về không khớp vai trò đã chọn.'), 502);
      });
      return result;
    },
    // Active accounts of one role in the CenterAdmin's organization, for pickers instead of typed UUIDs.
    // complete=false means the org has more than the pages read; callers fall back to manual entry.
    async options(actor: Scope, role: 'Caregiver' | 'VisuallyImpaired', signal?: AbortSignal) {
      if (actor.role !== 'CenterAdmin' || !actor.orgId)
        throw new ServiceError(t('Chỉ quản trị trung tâm chọn từ danh sách tổ chức.'), 403);
      const items: Account[] = [];
      for (let page = 1; page <= 5; page++) {
        const query = new URLSearchParams({
          page: String(page),
          pageSize: '100',
          role,
          isActive: 'true',
          isDeleted: 'false',
          organizationId: validId(actor.orgId),
        });
        const result = parse(pageSchema, await get('/api/users?' + query, signal));
        result.items.forEach((target) => {
          authorize(actor, target);
          if (target.role !== role)
            throw new ServiceError(t('Danh sách trả về không khớp vai trò đã chọn.'), 502);
        });
        items.push(...result.items.filter((target) => target.isActive && !target.deletedAt));
        if (!result.hasNextPage) return { items, complete: true };
      }
      return { items, complete: false };
    },
    async create(actor: Scope, values: AccountInput) {
      authorize(actor);
      const basic = profile(values);
      const role = parse(roleSchema, values.role, t('Vai trò không hợp lệ.'), 400);
      if (actor.role === 'CenterAdmin' && !['Caregiver', 'VisuallyImpaired'].includes(role))
        throw new ServiceError(t('Trung tâm chỉ tạo Caregiver hoặc VIU.'), 403);
      const organizationId =
        actor.role === 'CenterAdmin' ? actor.orgId : values.organizationId.trim();
      if (role !== 'Admin' && !organizationId)
        throw new ServiceError(t('Cần chọn tổ chức cho tài khoản không phải Admin.'), 400);
      const email = parse(
        z.string().trim().email().max(255),
        values.email,
        t('Email không hợp lệ.'),
        400,
      );
      const password = parse(
        passwordSchema,
        values.password,
        t('Mật khẩu cần ít nhất 8 ký tự, chữ hoa/thường, số và ký tự đặc biệt.'),
        400,
      );
      if (organizationId) {
        validId(organizationId);
        const org = parse(
          z.object({
            id: z.string().uuid(),
            isActive: z.boolean(),
            deletedAt: z.string().nullable(),
          }),
          await get('/api/organizations/' + (actor.role === 'CenterAdmin' ? 'me' : organizationId)),
        );
        if (org.id !== organizationId || !org.isActive || org.deletedAt)
          throw new ServiceError(t('Tổ chức không hợp lệ hoặc không hoạt động.'), 403);
      }
      return checked(
        actor,
        await write(
          '/api/users',
          json('POST', { ...basic, email, password, role, organizationId: organizationId || null }),
        ),
      );
    },
    async update(actor: Scope, id: string, values: z.infer<typeof profileSchema>) {
      const data = profile(values);
      await writable(actor, id);
      return checked(actor, await write('/api/users/' + id, json('PUT', data)), id);
    },
    async status(actor: Scope, id: string, isActive: boolean) {
      authorize(actor);
      if (id === actor.id && !isActive) throw new ServiceError(t('Không thể tự vô hiệu hóa.'), 422);
      await writable(actor, id);
      return checked(
        actor,
        await write('/api/users/' + id + '/status', json('PATCH', { isActive })),
        id,
      );
    },
    async resetPassword(actor: Scope, id: string, newPassword: string) {
      const password = parse(
        passwordSchema,
        newPassword,
        t('Mật khẩu cần ít nhất 8 ký tự, chữ hoa/thường, số và ký tự đặc biệt.'),
        400,
      );
      await writable(actor, id);
      await write('/api/users/' + id + '/reset-password', json('PATCH', { newPassword: password }));
    },
    async remove(actor: Scope, id: string) {
      if (actor.role !== 'Admin') throw new ServiceError(t('Chỉ Admin được xóa tài khoản.'), 403);
      if (id === actor.id) throw new ServiceError(t('Không thể tự xóa tài khoản.'), 422);
      await writable(actor, id);
      await write('/api/users/' + id, { method: 'DELETE' });
    },
  };
}
export const accountsApi = createAccountsApi();

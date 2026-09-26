import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';

const userSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  role: z.literal('VisuallyImpaired'),
  organizationId: z.string().uuid().nullable(),
  isActive: z.boolean(),
});
export const linkSchema = z.object({
  id: z.string().uuid(),
  caregiverId: z.string().uuid(),
  visuallyImpairedUserId: z.string().uuid(),
  viuFullName: z.string(),
  isPrimary: z.boolean(),
  linkType: z.enum(['Personal', 'Organization']),
  canReceiveAlerts: z.boolean(),
  canManageRegistry: z.boolean(),
  canManageLocations: z.boolean(),
  linkedAt: z.string(),
  unlinkedAt: z.string().nullable(),
});
const paged = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  });
export type LinkedUser = z.infer<typeof userSchema>;
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ServiceError('Dữ liệu người dùng hoặc liên kết không đúng định dạng.', 502);
  return result.data;
}
export function createCaregivingApi(get: typeof apiGet, write: typeof apiWrite = apiWrite) {
  const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const checkLink = (link: z.infer<typeof linkSchema>, caregiverId: string, viuId: string) => {
    if (link.caregiverId !== caregiverId || link.visuallyImpairedUserId !== viuId)
      throw new ServiceError('Liên kết không thuộc tài khoản hoặc người được chọn.', 403);
    return link;
  };
  return {
    async createUser(
      values: { fullName: string; email: string; password: string; phoneNumber: string },
      caregiverId: string,
    ) {
      const input = z
        .object({
          fullName: z.string().trim().min(1).max(200),
          email: z.string().trim().email().max(255),
          password: z
            .string()
            .min(8)
            .regex(/[A-Z]/)
            .regex(/[a-z]/)
            .regex(/[0-9]/)
            .regex(/[^a-zA-Z0-9]/),
          phoneNumber: z
            .string()
            .trim()
            .refine((v) => !v || /^0[35789][0-9]{8}$/.test(v)),
        })
        .safeParse(values);
      if (!input.success)
        throw new ServiceError(
          'Kiểm tra họ tên, email, số điện thoại và mật khẩu (ít nhất 8 ký tự, có chữ hoa/thường, số, ký tự đặc biệt).',
          400,
        );
      const active = parse(
        paged(linkSchema),
        await get('/api/caregiver-links?page=1&pageSize=1&isActive=true'),
      );
      if (active.items.some((l) => l.caregiverId !== caregiverId))
        throw new ServiceError('Liên kết không thuộc tài khoản hiện tại.', 403);
      if (active.totalCount >= 3)
        throw new ServiceError(
          'Bạn đã có tối đa 3 liên kết hoạt động. Chưa tạo tài khoản mới.',
          422,
        );
      return parse(
        userSchema,
        await write(
          '/api/users',
          json({ ...input.data, role: 'VisuallyImpaired', organizationId: null }),
        ),
      );
    },
    async createLink(
      viuId: string,
      caregiverId: string,
      permissions: {
        canReceiveAlerts: boolean;
        canManageRegistry: boolean;
        canManageLocations: boolean;
      },
    ) {
      if (!z.string().uuid().safeParse(viuId).success)
        throw new ServiceError('Mã VIU phải là UUID hợp lệ.', 400);
      try {
        return checkLink(
          parse(
            linkSchema,
            await write(
              '/api/caregiver-links',
              json({
                visuallyImpairedUserId: viuId,
                linkType: 'Personal',
                isPrimary: false,
                ...permissions,
              }),
            ),
          ),
          caregiverId,
          viuId,
        );
      } catch (error) {
        if (!(error instanceof ServiceError) || error.status !== 409) throw error;
        // A previous request may have committed before its response was lost. Confirm by reading; never replay creation.
        const result = parse(
          paged(linkSchema),
          await get(
            '/api/caregiver-links?' +
              new URLSearchParams({ viuId, isActive: 'true', page: '1', pageSize: '10' }),
          ),
        );
        const existing = result.items.find(
          (l) =>
            l.caregiverId === caregiverId && l.visuallyImpairedUserId === viuId && !l.unlinkedAt,
        );
        if (!existing) throw error;
        return existing;
      }
    },
    async unlink(id: string, caregiverId: string, viuId: string) {
      if (!z.string().uuid().safeParse(id).success)
        throw new ServiceError('Mã liên kết không hợp lệ.', 400);
      const link = checkLink(
        parse(linkSchema, await get('/api/caregiver-links/' + encodeURIComponent(id))),
        caregiverId,
        viuId,
      );
      if (link.linkType !== 'Personal' || link.unlinkedAt)
        throw new ServiceError('Chỉ có thể gỡ liên kết cá nhân đang hoạt động của bạn.', 403);
      await write('/api/caregiver-links/' + encodeURIComponent(id), { method: 'DELETE' });
    },
    async users(page: number, search: string, signal?: AbortSignal) {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: '10',
        role: 'VisuallyImpaired',
        isDeleted: 'false',
        search,
      });
      return parse(paged(userSchema), await get('/api/users?' + query, signal));
    },
    async links(caregiverId: string, viuId: string, page: number, signal?: AbortSignal) {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: '10',
        viuId,
        isActive: 'true',
      });
      const result = parse(paged(linkSchema), await get('/api/caregiver-links?' + query, signal));
      result.items.forEach((link) => checkLink(link, caregiverId, viuId));
      return result;
    },
    async detail(id: string, caregiverId: string, viuId: string, signal?: AbortSignal) {
      if (!z.string().uuid().safeParse(id).success)
        throw new ServiceError('Mã liên kết không hợp lệ.', 400);
      return checkLink(
        parse(linkSchema, await get('/api/caregiver-links/' + encodeURIComponent(id), signal)),
        caregiverId,
        viuId,
      );
    },
  };
}
export const caregivingApi = createCaregivingApi(apiGet);

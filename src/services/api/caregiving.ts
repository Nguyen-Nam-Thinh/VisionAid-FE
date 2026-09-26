import { z } from 'zod';
import { apiGet } from './adapter';
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
const linkSchema = z.object({
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
export function createCaregivingApi(get: typeof apiGet) {
  const checkLink = (link: z.infer<typeof linkSchema>, caregiverId: string, viuId: string) => {
    if (link.caregiverId !== caregiverId || link.visuallyImpairedUserId !== viuId)
      throw new ServiceError('Liên kết không thuộc tài khoản hoặc người được chọn.', 403);
    return link;
  };
  return {
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

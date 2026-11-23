import { t } from '../../i18n';
import { issuesError } from './validation';
import { normalizePhone } from './phone';
import { searchWithoutAccents } from './textSearch';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import { fetchLimits } from './limits';

const userSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  role: z.literal('VisuallyImpaired'),
  organizationId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  licenseStatus: z.string().nullable().optional(),
  licenseExpiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
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
    throw new ServiceError(t('Dữ liệu người dùng hoặc liên kết không đúng định dạng.'), 502);
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
      throw new ServiceError(t('Liên kết không thuộc tài khoản hoặc người được chọn.'), 403);
    return link;
  };
  return {
    async createUser(
      values: { fullName: string; email: string; password: string; phoneNumber: string },
      caregiverId: string,
    ) {
      const input = z
        .object({
          fullName: z.string().trim().min(2).max(200),
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
            .transform(normalizePhone)
            .refine((v) => !v || /^0[35789][0-9]{8}$/.test(v)),
        })
        .safeParse(values);
      if (!input.success)
        throw issuesError(input.error.issues, {
          fullName: t('Họ và tên cần từ 2 đến 200 ký tự.'),
          email: t('Email chưa đúng, ví dụ ten@gmail.com.'),
          password: t(
            'Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.',
          ),
          phoneNumber: t('Nhập số di động Việt Nam 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.'),
        });
      const active = parse(
        paged(linkSchema),
        await get('/api/caregiver-links?page=1&pageSize=1&isActive=true'),
      );
      if (active.items.some((l) => l.caregiverId !== caregiverId))
        throw new ServiceError(t('Liên kết không thuộc tài khoản hiện tại.'), 403);
      const max = (await fetchLimits(get))['caregiving.max_vius_per_caregiver'];
      if (active.totalCount >= max)
        throw new ServiceError(
          t('Bạn đã có tối đa {max} liên kết hoạt động. Chưa tạo tài khoản mới.', { max }),
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
        throw new ServiceError(t('Mã người khiếm thị không hợp lệ.'), 400);
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
        throw new ServiceError(t('Mã liên kết không hợp lệ.'), 400);
      const link = checkLink(
        parse(linkSchema, await get('/api/caregiver-links/' + encodeURIComponent(id))),
        caregiverId,
        viuId,
      );
      if (link.linkType !== 'Personal' || link.unlinkedAt)
        throw new ServiceError(t('Chỉ có thể gỡ liên kết cá nhân đang hoạt động của bạn.'), 403);
      await write('/api/caregiver-links/' + encodeURIComponent(id), { method: 'DELETE' });
    },
    async users(page: number, search: string, signal?: AbortSignal) {
      return searchWithoutAccents(
        search,
        page,
        async (term, p, bulk) => {
          const query = new URLSearchParams({
            page: String(p),
            pageSize: bulk ? '100' : '10',
            role: 'VisuallyImpaired',
            isDeleted: 'false',
            search: term,
          });
          return parse(paged(userSchema), await get('/api/users?' + query, signal));
        },
        (person) => [person.fullName, person.email, person.phoneNumber],
      );
    },
    async links(caregiverId: string, viuId: string, page: number, signal?: AbortSignal) {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: '10',
        viuId,
        isActive: 'true',
      });
      const result = parse(paged(linkSchema), await get('/api/caregiver-links?' + query, signal));
      // A primary caregiver also receives the secondaries' links for this VIU (UC-32–34);
      // callers ask for their own link, so keep only that one.
      if (result.items.some((link) => link.visuallyImpairedUserId !== viuId))
        throw new ServiceError(t('Liên kết không thuộc tài khoản hoặc người được chọn.'), 403);
      const items = result.items.filter((link) => link.caregiverId === caregiverId);
      return {
        ...result,
        items,
        totalCount: items.length,
        totalPages: items.length ? 1 : 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    },
    async detail(id: string, caregiverId: string, viuId: string, signal?: AbortSignal) {
      if (!z.string().uuid().safeParse(id).success)
        throw new ServiceError(t('Mã liên kết không hợp lệ.'), 400);
      return checkLink(
        parse(linkSchema, await get('/api/caregiver-links/' + encodeURIComponent(id), signal)),
        caregiverId,
        viuId,
      );
    },
  };
}
export const caregivingApi = createCaregivingApi(apiGet);

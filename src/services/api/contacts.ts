import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { createCaregivingApi } from './caregiving';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const contactSchema = z.object({
  id: z.string().uuid(),
  visuallyImpairedUserId: z.string().uuid(),
  contactName: z.string(),
  contactType: z.enum(['Phone', 'Zalo', 'Both']),
  phoneNumber: z.string().nullable(),
  zaloDeepLink: z.string().nullable(),
  priorityOrder: z.number().int().positive(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
const inputSchema = z
  .object({
    contactName: z.string().trim().min(1).max(200),
    contactType: z.enum(['Phone', 'Zalo', 'Both']),
    phoneNumber: z.string().trim().max(20),
    zaloDeepLink: z.string().trim().max(500),
    priorityOrder: z.number().int().min(1).max(32767),
    notes: z.string().trim().max(500),
  })
  .superRefine((value, ctx) => {
    if (value.contactType !== 'Zalo' && !/^\+?[0-9][0-9 ()-]*$/.test(value.phoneNumber))
      ctx.addIssue({
        code: 'custom',
        path: ['phoneNumber'],
        message: 'Nhập số điện thoại hợp lệ.',
      });
    if (value.contactType !== 'Phone' && !value.zaloDeepLink)
      ctx.addIssue({ code: 'custom', path: ['zaloDeepLink'], message: 'Nhập liên kết Zalo.' });
  });
export type EmergencyContact = z.infer<typeof contactSchema>;
export const contactTypes = { Phone: 'Điện thoại', Zalo: 'Zalo', Both: 'Điện thoại và Zalo' };
export function createContactsApi(get = apiGet, write = apiWrite) {
  const validId = (id: string) => {
    if (!z.string().uuid().safeParse(id).success) throw new ServiceError('Mã không hợp lệ.', 400);
    return id;
  };
  const base = (viuId: string) => `/api/users/${validId(viuId)}/emergency-contacts`;
  const authorize = async (actor: Person, viuId: string, signal?: AbortSignal) => {
    validId(viuId);
    if (actor.role !== 'Caregiver')
      throw new ServiceError('Màn hình này dành cho người chăm sóc có liên kết.', 403);
    const links = await createCaregivingApi(get, write).links(actor.id, viuId, 1, signal);
    if (!links.items.some((link) => !link.unlinkedAt))
      throw new ServiceError('Bạn không còn liên kết chăm sóc hoạt động với người này.', 403);
  };
  const checked = (raw: unknown, viuId: string, id?: string) => {
    const result = contactSchema.safeParse(raw);
    if (!result.success) throw new ServiceError('Dữ liệu liên hệ từ máy chủ không hợp lệ.', 502);
    if (result.data.visuallyImpairedUserId !== viuId || (id && result.data.id !== id))
      throw new ServiceError('Liên hệ không thuộc người được chọn.', 403);
    return result.data;
  };
  const detail = async (actor: Person, viuId: string, id: string, signal?: AbortSignal) => {
    validId(id);
    await authorize(actor, viuId, signal);
    return checked(await get(`${base(viuId)}/${id}`, signal), viuId, id);
  };
  const json = (method: string, body: unknown) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    async list(actor: Person, viuId: string, signal?: AbortSignal) {
      await authorize(actor, viuId, signal);
      const result = z.array(contactSchema).safeParse(await get(base(viuId), signal));
      if (!result.success) throw new ServiceError('Danh sách liên hệ không hợp lệ.', 502);
      return result.data
        .map((item) => checked(item, viuId))
        .sort((a, b) => a.priorityOrder - b.priorityOrder);
    },
    detail,
    async save(actor: Person, viuId: string, values: unknown, id?: string) {
      const parsed = inputSchema.safeParse(values);
      if (!parsed.success)
        throw new ServiceError(
          'Kiểm tra tên, loại liên hệ, số điện thoại, Zalo và thứ tự ưu tiên.',
          400,
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
      if (id) await detail(actor, viuId, id);
      else await authorize(actor, viuId);
      const data = parsed.data;
      // Empty strings clear fields on BE partial PUT; null means keep the previous value.
      const body = {
        ...data,
        phoneNumber: data.contactType === 'Zalo' ? '' : data.phoneNumber,
        zaloDeepLink: data.contactType === 'Phone' ? '' : data.zaloDeepLink,
      };
      return checked(
        await write(base(viuId) + (id ? `/${id}` : ''), json(id ? 'PUT' : 'POST', body)),
        viuId,
        id,
      );
    },
    async status(actor: Person, viuId: string, id: string, isActive: boolean) {
      await detail(actor, viuId, id);
      return checked(
        await write(`${base(viuId)}/${id}/status`, json('PATCH', { isActive })),
        viuId,
        id,
      );
    },
    async remove(actor: Person, viuId: string, id: string) {
      await detail(actor, viuId, id);
      await write(`${base(viuId)}/${id}`, { method: 'DELETE' });
    },
  };
}
export const contactsApi = createContactsApi();

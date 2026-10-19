import { z } from 'zod';
import { apiBlob, apiGet, apiWrite } from './adapter';
import { createCaregivingApi } from './caregiving';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const input = z.object({
  displayName: z.string().trim().min(1).max(200),
  relationship: z.string().trim().max(100).nullable(),
  notes: z.string().trim().max(1000).nullable(),
});
const imageSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  isPrimaryImage: z.boolean(),
  uploadedAt: z.iso.datetime({ offset: true }),
});
const personSchema = input.extend({
  id: z.string().uuid(),
  visuallyImpairedUserId: z.string().uuid(),
  imageCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  images: z.array(imageSchema),
});
export type RegistryPerson = z.infer<typeof personSchema>;
export type RegistryImage = z.infer<typeof imageSchema>;

// The current BE labels all decrypted photos JPEG; use only recognized raster signatures.
export async function registryPhoto(blob: Blob): Promise<Blob> {
  if (!blob.size || blob.size > 10 * 1024 * 1024)
    throw new ServiceError('Ảnh phải có dữ liệu và không vượt quá 10 MB.', 400);
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const starts = (signature: number[]) => signature.every((v, i) => bytes[i] === v);
  const type = starts([0xff, 0xd8, 0xff])
    ? 'image/jpeg'
    : starts([137, 80, 78, 71, 13, 10, 26, 10])
      ? 'image/png'
      : starts([82, 73, 70, 70]) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
        ? 'image/webp'
        : '';
  if (!type) throw new ServiceError('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP hợp lệ.', 400);
  return blob.slice(0, blob.size, type);
}

export function createRegistryApi(get = apiGet, write = apiWrite, blob = apiBlob) {
  const root = '/api/face-registry/persons';
  const validId = (id: string) => {
    if (!z.string().uuid().safeParse(id).success)
      throw new ServiceError('Mã người hoặc ảnh không hợp lệ.', 400);
    return id;
  };
  const authorize = async (actor: Person, viuId: string, manage: boolean, signal?: AbortSignal) => {
    validId(viuId);
    if (actor.role !== 'Caregiver')
      throw new ServiceError('Bạn không có quyền mở danh bạ này.', 403);
    const links = await createCaregivingApi(get, write).links(actor.id, viuId, 1, signal);
    const active = links.items.filter((link) => !link.unlinkedAt);
    const canManage = active.some((link) => link.canManageRegistry);
    if (!active.length || (manage && !canManage))
      throw new ServiceError(
        'Bạn không còn liên kết hoặc quyền quản lý gương mặt cho người này.',
        403,
      );
    return canManage;
  };
  const checked = (raw: unknown, viuId: string, id?: string) => {
    const result = personSchema.safeParse(raw);
    if (!result.success) throw new ServiceError('Dữ liệu danh bạ từ máy chủ không hợp lệ.', 502);
    const person = result.data;
    if (
      person.visuallyImpairedUserId !== viuId ||
      (id && person.id !== id) ||
      person.images.some((photo) => photo.personId !== person.id)
    )
      throw new ServiceError('Người hoặc ảnh không thuộc danh bạ được chọn.', 403);
    return person;
  };
  const read = async (viuId: string, id: string, signal?: AbortSignal) =>
    checked(await get(`${root}/${validId(id)}`, signal), viuId, id);
  const photoPath = async (
    actor: Person,
    viuId: string,
    id: string,
    photoId: string,
    manage: boolean,
    signal?: AbortSignal,
  ) => {
    validId(photoId);
    await authorize(actor, viuId, manage, signal);
    const person = await read(viuId, id, signal);
    if (!person.images.some((photo) => photo.id === photoId))
      throw new ServiceError('Ảnh không còn thuộc người được chọn. Hãy tải lại.', 404);
    return `${root}/${id}/photos/${photoId}`;
  };
  return {
    async list(actor: Person, viuId: string, signal?: AbortSignal) {
      const canManage = await authorize(actor, viuId, false, signal);
      const raw = await get(`${root}?${new URLSearchParams({ viuId })}`, signal);
      if (!Array.isArray(raw)) throw new ServiceError('Danh sách gương mặt không hợp lệ.', 502);
      return { items: raw.map((item) => checked(item, viuId)), canManage };
    },
    async detail(actor: Person, viuId: string, id: string, signal?: AbortSignal) {
      const canManage = await authorize(actor, viuId, false, signal);
      return { person: await read(viuId, id, signal), canManage };
    },
    async save(actor: Person, viuId: string, values: unknown, id?: string) {
      const parsed = input.safeParse(values);
      if (!parsed.success)
        throw new ServiceError(
          'Kiểm tra tên, mối quan hệ và ghi chú.',
          400,
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
      await authorize(actor, viuId, true);
      if (id) await read(viuId, id);
      return checked(
        await write(root + (id ? `/${id}` : ''), {
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
    async remove(actor: Person, viuId: string, id: string) {
      await authorize(actor, viuId, true);
      await read(viuId, id);
      await write(`${root}/${id}`, { method: 'DELETE' });
    },
    async photo(actor: Person, viuId: string, id: string, photoId: string, signal?: AbortSignal) {
      const path = await photoPath(actor, viuId, id, photoId, false, signal);
      const result = await blob(path, signal);
      if (!(result instanceof Blob)) throw new ServiceError('Không nhận được ảnh từ máy chủ.', 502);
      return registryPhoto(result);
    },
    async upload(actor: Person, viuId: string, id: string, file: File, primary: boolean) {
      const photo = await registryPhoto(file);
      await authorize(actor, viuId, true);
      await read(viuId, id);
      const body = new FormData();
      body.set('photo', photo, file.name);
      body.set('setAsPrimary', String(primary));
      let raw: unknown;
      try {
        raw = await write(`${root}/${id}/photos`, {
          method: 'POST',
          body,
          signal: AbortSignal.timeout(90000),
        });
      } catch (error) {
        // BE rejects photos where FaceNet finds no face (422 FACE_NOT_DETECTED); nothing was saved.
        if (
          error instanceof ServiceError &&
          (error.code === 'FACE_NOT_DETECTED' ||
            (error.status === 422 && /no face/i.test(error.message)))
        )
          throw new ServiceError(
            'Không tìm thấy khuôn mặt trong ảnh. Chọn ảnh rõ mặt, đủ sáng và chỉ có một người.',
            422,
          );
        throw error;
      }
      const result = imageSchema.safeParse(raw);
      if (!result.success || result.data.personId !== id)
        throw new ServiceError('Kết quả tải ảnh không hợp lệ. Tải lại trước khi gửi lại.', 502);
      return result.data;
    },
    async removePhoto(actor: Person, viuId: string, id: string, photoId: string) {
      const path = await photoPath(actor, viuId, id, photoId, true);
      await write(path, { method: 'DELETE' });
    },
    async primary(actor: Person, viuId: string, id: string, photoId: string) {
      const path = await photoPath(actor, viuId, id, photoId, true);
      const result = imageSchema.safeParse(await write(path + '/primary', { method: 'PATCH' }));
      if (
        !result.success ||
        result.data.personId !== id ||
        result.data.id !== photoId ||
        !result.data.isPrimaryImage
      )
        throw new ServiceError('Kết quả đổi ảnh chính không hợp lệ. Hãy tải lại.', 502);
    },
  };
}
export const registryApi = createRegistryApi();

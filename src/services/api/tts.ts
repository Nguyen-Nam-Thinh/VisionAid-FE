import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { createCaregivingApi } from './caregiving';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const settings = z.object({
  voiceGender: z.enum(['Male', 'Female']),
  speedRate: z.number().min(0.5).max(2),
  volumeLevel: z.number().min(0).max(1),
  detectionMode: z.enum(['Minimal', 'Full']),
  primaryLanguage: z.string().trim().min(1).max(10),
  secondaryLanguage: z.string().trim().max(10).nullable(),
});
const response = settings.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  updatedAt: z.iso.datetime({ offset: true }),
});
const input = settings
  .omit({ volumeLevel: true })
  .extend({ volumePercent: z.number().min(0).max(100) });
export type TtsPreference = z.infer<typeof response>;
export const ttsDefaults = {
  voiceGender: 'Female',
  speedRate: 1,
  volumePercent: 80,
  detectionMode: 'Full',
  primaryLanguage: 'vi-VN',
  secondaryLanguage: '',
};
export function createTtsApi(get = apiGet, write = apiWrite) {
  const authorize = async (actor: Person, viuId: string, signal?: AbortSignal) => {
    if (!z.string().uuid().safeParse(viuId).success)
      throw new ServiceError('Mã người được chăm sóc không hợp lệ.', 400);
    if (actor.role !== 'Caregiver')
      throw new ServiceError('Màn hình này dành cho người chăm sóc có liên kết.', 403);
    const links = await createCaregivingApi(get, write).links(actor.id, viuId, 1, signal);
    if (!links.items.some((link) => !link.unlinkedAt))
      throw new ServiceError('Bạn không còn liên kết chăm sóc hoạt động với người này.', 403);
  };
  const checked = (raw: unknown, viuId: string) => {
    const parsed = response.safeParse(raw);
    if (!parsed.success) throw new ServiceError('Cấu hình giọng đọc từ máy chủ không hợp lệ.', 502);
    if (parsed.data.userId !== viuId)
      throw new ServiceError('Cấu hình không thuộc người được chọn.', 403);
    return parsed.data;
  };
  const path = (viuId: string) => `/api/users/${viuId}/tts-preferences`;
  return {
    async read(actor: Person, viuId: string, signal?: AbortSignal): Promise<TtsPreference | null> {
      await authorize(actor, viuId, signal);
      try {
        return checked(await get(path(viuId), signal), viuId);
      } catch (error) {
        if (!(error instanceof ServiceError) || error.status !== 404) throw error;
        // A 404 may mean a deleted user; Caregivers can read the scoped list, not user detail.
        const caregiving = createCaregivingApi(get, write);
        for (let page = 1; ; page++) {
          const users = await caregiving.users(page, '', signal);
          if (users.items.some((user) => user.id === viuId && user.isActive)) return null;
          if (!users.hasNextPage) break;
        }
        throw new ServiceError('Không xác minh được người được chăm sóc đang hoạt động.', 403);
      }
    },
    async save(actor: Person, viuId: string, values: unknown) {
      const parsed = input.safeParse(values);
      if (!parsed.success)
        throw new ServiceError(
          'Kiểm tra giọng đọc, tốc độ, âm lượng và ngôn ngữ.',
          400,
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
      await authorize(actor, viuId);
      const { volumePercent, ...rest } = parsed.data;
      return checked(
        await write(path(viuId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rest, volumeLevel: volumePercent / 100 }),
        }),
        viuId,
      );
    },
  };
}
export const ttsApi = createTtsApi();

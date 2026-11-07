import { t } from '../../i18n';
import { z } from 'zod';
import { apiBlob, apiWrite } from './adapter';
import { registryPhoto } from './registry';
import { ServiceError } from '../contracts';

/** BE accepts JPEG, PNG or WebP up to 10 MB and stores a 256×256 WebP without metadata. */
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';
const reply = z.object({ id: z.string().uuid(), avatarUrl: z.string().nullable() });
/** Only the BE's own avatar route is fetched with the session token. */
export const isProtectedAvatar = (url?: string | null): boolean =>
  !!url && /^\/api\/users\/[0-9a-f-]{36}\/avatar(\?v=\d+)?$/i.test(url);

export function createAvatarApi(write = apiWrite, blob = apiBlob) {
  return {
    async upload(file: File) {
      if (file.size > AVATAR_MAX_BYTES)
        throw new ServiceError(t('Ảnh đại diện tối đa 10 MB.'), 413);
      // Checks the real file signature, not only the extension the browser reports.
      const image = await registryPhoto(file);
      const body = new FormData();
      body.set('avatar', image, file.name);
      const parsed = reply.safeParse(await write('/api/users/me/avatar', { method: 'POST', body }));
      if (!parsed.success)
        throw new ServiceError(
          t('Đã gửi ảnh nhưng chưa nhận được kết quả từ máy chủ. Hãy tải lại trang.'),
          502,
        );
      return parsed.data;
    },
    async remove() {
      await write('/api/users/me/avatar', { method: 'DELETE' });
    },
    async image(url: string, signal?: AbortSignal) {
      if (!isProtectedAvatar(url)) throw new ServiceError(t('Địa chỉ ảnh không hợp lệ.'), 400);
      const result = await blob(url, signal);
      if (!(result instanceof Blob))
        throw new ServiceError(t('Không nhận được ảnh từ máy chủ.'), 502);
      return registryPhoto(result);
    },
  };
}
export const avatarApi = createAvatarApi();

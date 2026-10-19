import { expect, it, vi } from 'vitest';
import { createRegistryApi, registryPhoto } from './registry';
import type { Person } from '../../models/domain';
import { ServiceError } from '../contracts';

const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const photoId = '01900000-0000-7000-8000-000000000003';
const actor: Person = {
  id,
  role: 'Caregiver',
  orgId: '',
  name: 'Test',
  email: '',
  phone: '',
  active: true,
};
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
function fixture() {
  const link = {
    id,
    caregiverId: id,
    visuallyImpairedUserId: viuId,
    viuFullName: 'VIU',
    isPrimary: true,
    linkType: 'Personal',
    canReceiveAlerts: false,
    canManageRegistry: true,
    canManageLocations: false,
    linkedAt: '',
    unlinkedAt: null as string | null,
  };
  const photo = {
    id: photoId,
    personId: id,
    isPrimaryImage: true,
    uploadedAt: '2026-10-10T00:00:00Z',
    storagePath: 'private.enc',
    embeddingVector: [1, 2],
  };
  const person = {
    id,
    visuallyImpairedUserId: viuId,
    displayName: 'An',
    relationship: null,
    notes: null,
    imageCount: 1,
    isActive: false,
    images: [photo],
  };
  const get = vi.fn<NonNullable<Parameters<typeof createRegistryApi>[0]>>(async (path) =>
    path.startsWith('/api/caregiver-links?')
      ? {
          items: [link],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      : path.includes('?')
        ? [person]
        : person,
  );
  const write = vi.fn<NonNullable<Parameters<typeof createRegistryApi>[1]>>(async (path) =>
    path.includes('/photos') ? photo : person,
  );
  const blob = vi.fn<NonNullable<Parameters<typeof createRegistryApi>[2]>>(
    async () => new Blob([png], { type: 'image/jpeg' }),
  );
  return { api: createRegistryApi(get, write, blob), get, write, blob, link, person, photo };
}
it('registry validates owner and strips storage paths/vectors; exact CRUD bodies and multipart upload', async () => {
  const f = fixture();
  const list = await f.api.list(actor, viuId);
  expect(list.items[0].images[0]).not.toHaveProperty('embeddingVector');
  expect(list.items[0].images[0]).not.toHaveProperty('storagePath');
  await f.api.save(actor, viuId, f.person);
  expect(JSON.parse(String(f.write.mock.calls[0][1].body))).toEqual({
    displayName: 'An',
    relationship: null,
    notes: null,
    visuallyImpairedUserId: viuId,
  });
  await f.api.save(actor, viuId, f.person, id);
  expect(f.write.mock.calls[1][1].method).toBe('PUT');
  expect(JSON.parse(String(f.write.mock.calls[1][1].body))).not.toHaveProperty(
    'visuallyImpairedUserId',
  );
  await f.api.upload(actor, viuId, id, new File([png], 'photo.png', { type: 'image/png' }), false);
  const upload = f.write.mock.calls.at(-1)!;
  expect(upload[0]).toBe(`/api/face-registry/persons/${id}/photos`);
  const form = upload[1].body as FormData;
  expect(form.get('setAsPrimary')).toBe('false');
  expect((form.get('photo') as File).type).toBe('image/png');
  expect(form.has('embeddingVector')).toBe(false);
  expect(upload[1].headers).toBeUndefined();
  expect((await f.api.photo(actor, viuId, id, photoId)).type).toBe('image/png');
  await f.api.primary(actor, viuId, id, photoId);
  expect(f.write).toHaveBeenLastCalledWith(
    `/api/face-registry/persons/${id}/photos/${photoId}/primary`,
    { method: 'PATCH' },
  );
  await f.api.removePhoto(actor, viuId, id, photoId);
  expect(f.write).toHaveBeenLastCalledWith(`/api/face-registry/persons/${id}/photos/${photoId}`, {
    method: 'DELETE',
  });
  await f.api.remove(actor, viuId, id);
  expect(f.write).toHaveBeenLastCalledWith(`/api/face-registry/persons/${id}`, {
    method: 'DELETE',
  });
});
it('registry read-only, revoked links and foreign photo/person fail closed before writing or downloading', async () => {
  const f = fixture();
  f.link.canManageRegistry = false;
  expect((await f.api.detail(actor, viuId, id)).canManage).toBe(false);
  for (const action of [
    () => f.api.save(actor, viuId, f.person),
    () => f.api.remove(actor, viuId, id),
    () => f.api.primary(actor, viuId, id, photoId),
    () => f.api.removePhoto(actor, viuId, id, photoId),
    () => f.api.upload(actor, viuId, id, new File([png], 'p.png'), false),
  ])
    await expect(action()).rejects.toMatchObject({ status: 403 });
  expect(f.write).not.toHaveBeenCalled();
  f.link.unlinkedAt = '2026-10-10T00:00:00Z';
  await expect(f.api.photo(actor, viuId, id, photoId)).rejects.toMatchObject({ status: 403 });
  f.link.unlinkedAt = null;
  f.person.visuallyImpairedUserId = id;
  await expect(f.api.list(actor, viuId)).rejects.toMatchObject({ status: 403 });
  f.person.visuallyImpairedUserId = viuId;
  f.photo.personId = viuId;
  await expect(f.api.photo(actor, viuId, id, photoId)).rejects.toMatchObject({ status: 403 });
  f.photo.personId = id;
  await expect(f.api.photo(actor, viuId, id, viuId)).rejects.toMatchObject({ status: 404 });
  await expect(f.api.list({ ...actor, role: 'Admin' }, viuId)).rejects.toMatchObject({
    status: 403,
  });
  expect(f.blob).not.toHaveBeenCalled();
});
it('registry rejects malformed input, no retry on upload or delete failure, no fabricated active state', async () => {
  const f = fixture();
  await expect(f.api.save(actor, viuId, { ...f.person, displayName: ' ' })).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    f.api.upload(actor, viuId, id, new File(['<svg/>'], 'fake.png', { type: 'image/png' }), true),
  ).rejects.toMatchObject({ status: 400 });
  expect(f.write).not.toHaveBeenCalled();
  f.write.mockRejectedValue(new ServiceError('unavailable', 503));
  await expect(
    f.api.upload(actor, viuId, id, new File([png], 'p.png'), false),
  ).rejects.toMatchObject({ status: 503 });
  expect(f.write).toHaveBeenCalledTimes(1);
  f.write.mockRejectedValue(
    new ServiceError('No face detected in the uploaded photo. Please upload a clear photo.', 422),
  );
  await expect(
    f.api.upload(actor, viuId, id, new File([png], 'p.png'), false),
  ).rejects.toMatchObject({
    status: 422,
    message: 'Không tìm thấy khuôn mặt trong ảnh. Chọn ảnh rõ mặt, đủ sáng và chỉ có một người.',
  });
  f.write.mockRejectedValue(new ServiceError('license', 402));
  await expect(f.api.removePhoto(actor, viuId, id, photoId)).rejects.toMatchObject({ status: 402 });
  expect(f.person.images).toHaveLength(1);
  expect(f.person.isActive).toBe(false);
});
it('photo signatures correct wrong MIME and reject empty, oversized and non-image responses', async () => {
  expect((await registryPhoto(new Blob([new Uint8Array([255, 216, 255])]))).type).toBe(
    'image/jpeg',
  );
  expect((await registryPhoto(new Blob(['RIFF1234WEBP']))).type).toBe('image/webp');
  for (const b of [
    new Blob([]),
    new Blob(['<html>error</html>'], { type: 'image/jpeg' }),
    new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]),
  ])
    await expect(registryPhoto(b)).rejects.toMatchObject({ status: 400 });
});

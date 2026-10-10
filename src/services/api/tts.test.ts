import { expect, it, vi } from 'vitest';
import { createTtsApi, ttsDefaults } from './tts';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';
const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const actor: Person = {
  id,
  role: 'Caregiver',
  orgId: '',
  name: 'Test',
  email: '',
  phone: '',
  active: true,
};
function fixture() {
  const link = {
    id,
    caregiverId: id,
    visuallyImpairedUserId: viuId,
    viuFullName: 'VIU',
    isPrimary: false,
    linkType: 'Personal',
    canReceiveAlerts: false,
    canManageRegistry: false,
    canManageLocations: false,
    linkedAt: '',
    unlinkedAt: null as string | null,
  };
  const preference = {
    id,
    userId: viuId,
    voiceGender: 'Female',
    speedRate: 1,
    volumeLevel: 0.8,
    detectionMode: 'Full',
    primaryLanguage: 'vi-VN',
    secondaryLanguage: 'en-US',
    updatedAt: '2026-10-11T00:00:00Z',
  };
  const get = vi.fn<NonNullable<Parameters<typeof createTtsApi>[0]>>(async (path) =>
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
      : path.endsWith('/tts-preferences')
        ? preference
        : { id: viuId, role: 'VisuallyImpaired' },
  );
  const write = vi.fn<NonNullable<Parameters<typeof createTtsApi>[1]>>(async () => preference);
  return { api: createTtsApi(get, write), get, write, link, preference };
}
it('TTS uses userId route; secondary link can edit; percent mapping preserves zero and empty clears language', async () => {
  const f = fixture();
  expect((await f.api.read(actor, viuId))?.volumeLevel).toBe(0.8);
  for (const volumePercent of [0, 80, 100]) {
    await f.api.save(actor, viuId, { ...ttsDefaults, volumePercent });
    const [path, init] = f.write.mock.calls.at(-1)!;
    expect(path).toBe(`/api/users/${viuId}/tts-preferences`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toEqual({
      voiceGender: 'Female',
      speedRate: 1,
      volumeLevel: volumePercent / 100,
      detectionMode: 'Full',
      primaryLanguage: 'vi-VN',
      secondaryLanguage: '',
    });
  }
});
it('TTS missing preference requires a valid VIU; 403/402/500 never become defaults', async () => {
  const f = fixture();
  const original = f.get.getMockImplementation()!;
  f.get.mockImplementation(async (path, signal) => {
    if (path.endsWith('/tts-preferences')) throw new ServiceError('not found', 404);
    return original(path, signal);
  });
  expect(await f.api.read(actor, viuId)).toBeNull();
  expect(f.write).not.toHaveBeenCalled();
  f.get.mockImplementation(async (path, signal) => {
    if (path.includes('/api/users/')) throw new ServiceError('deleted', 404);
    return original(path, signal);
  });
  await expect(f.api.read(actor, viuId)).rejects.toMatchObject({ status: 404 });
  for (const status of [403, 402, 500]) {
    f.get.mockImplementation(async (path, signal) => {
      if (path.endsWith('/tts-preferences')) throw new ServiceError('error', status);
      return original(path, signal);
    });
    await expect(f.api.read(actor, viuId)).rejects.toMatchObject({ status });
  }
});
it('TTS rejects cross-user data and revoked links before write; never retries failures', async () => {
  const f = fixture();
  f.preference.userId = id;
  await expect(f.api.read(actor, viuId)).rejects.toMatchObject({ status: 403 });
  f.link.unlinkedAt = '2026-10-11T00:00:00Z';
  await expect(f.api.save(actor, viuId, ttsDefaults)).rejects.toMatchObject({ status: 403 });
  await expect(f.api.read({ ...actor, role: 'Admin' }, viuId)).rejects.toMatchObject({
    status: 403,
  });
  expect(f.write).not.toHaveBeenCalled();
  f.link.unlinkedAt = null;
  f.write.mockRejectedValue(new ServiceError('unavailable', 503));
  await expect(f.api.save(actor, viuId, ttsDefaults)).rejects.toMatchObject({ status: 503 });
  expect(f.write).toHaveBeenCalledTimes(1);
});
it('TTS validates bounds/enums/language before requests and rejects malformed server settings', async () => {
  const f = fixture();
  for (const change of [
    { speedRate: 0.49 },
    { speedRate: 2.01 },
    { volumePercent: -1 },
    { volumePercent: 101 },
    { voiceGender: 'unknown' },
    { detectionMode: 'unknown' },
    { primaryLanguage: ' ' },
    { secondaryLanguage: '12345678901' },
  ])
    await expect(f.api.save(actor, viuId, { ...ttsDefaults, ...change })).rejects.toMatchObject({
      status: 400,
    });
  expect(f.get).not.toHaveBeenCalled();
  expect(f.write).not.toHaveBeenCalled();
  f.preference.volumeLevel = 80;
  await expect(f.api.read(actor, viuId)).rejects.toMatchObject({ status: 502 });
});

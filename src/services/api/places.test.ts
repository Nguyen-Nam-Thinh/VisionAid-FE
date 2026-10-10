import { expect, it, vi } from 'vitest';
import { createPlacesApi, type PlaceKind } from './places';
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
const paged = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});
function fixture(kind: PlaceKind) {
  const link = {
    id,
    caregiverId: id,
    visuallyImpairedUserId: viuId,
    viuFullName: 'VIU',
    isPrimary: false,
    linkType: 'Personal',
    canReceiveAlerts: false,
    canManageRegistry: false,
    canManageLocations: true,
    linkedAt: '',
    unlinkedAt: null as string | null,
  };
  const item = {
    id,
    visuallyImpairedUserId: viuId,
    name: 'Nhà',
    latitude: 0,
    longitude: 106.81,
    isActive: true,
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
    ...(kind === 'geofences'
      ? { radiusMeters: 300, alertOnExit: true, alertOnEnter: false }
      : { arrivalRadiusMeters: 50, description: '', ttsAnnouncement: '' }),
  };
  const get = vi.fn<NonNullable<Parameters<typeof createPlacesApi>[0]>>(async (path) =>
    path.startsWith('/api/caregiver-links?')
      ? paged([link])
      : path.includes('?')
        ? paged([item])
        : item,
  );
  const write = vi.fn<NonNullable<Parameters<typeof createPlacesApi>[1]>>(async () => item);
  return { api: createPlacesApi(get, write), get, write, link, item };
}
for (const kind of ['saved-locations', 'geofences'] as const) {
  it(`${kind}: exact CRUD contracts preserve zero coordinates and server scope`, async () => {
    const f = fixture(kind);
    const list = await f.api.list(actor, viuId, kind, 2, 'false');
    expect(list.canManage).toBe(true);
    expect(f.get).toHaveBeenLastCalledWith(
      `/api/${kind}?viuId=${viuId}&page=2&pageSize=20&isActive=false`,
      undefined,
    );
    await f.api.save(actor, viuId, kind, f.item);
    const body = JSON.parse(String(f.write.mock.calls[0][1].body));
    expect(body).toMatchObject({ visuallyImpairedUserId: viuId, latitude: 0, longitude: 106.81 });
    expect(body).not.toHaveProperty('isActive');
    expect(body).not.toHaveProperty('id');
    await f.api.detail(actor, viuId, kind, id);
    await f.api.save(actor, viuId, kind, { ...f.item, isActive: false }, id);
    expect(f.write.mock.calls[1][1].method).toBe('PUT');
    expect(JSON.parse(String(f.write.mock.calls[1][1].body))).toMatchObject({ isActive: false });
    f.write.mockResolvedValue(undefined);
    await f.api.remove(actor, viuId, kind, id);
    expect(f.write).toHaveBeenLastCalledWith(`/api/${kind}/${id}`, { method: 'DELETE' });
  });
  it(`${kind}: read-only links can read but cannot mutate, even if primary`, async () => {
    const f = fixture(kind);
    f.link.canManageLocations = false;
    f.link.isPrimary = true;
    expect((await f.api.list(actor, viuId, kind, 1, '')).canManage).toBe(false);
    await expect(f.api.save(actor, viuId, kind, f.item)).rejects.toMatchObject({ status: 403 });
    await expect(f.api.remove(actor, viuId, kind, id)).rejects.toMatchObject({ status: 403 });
    f.link.unlinkedAt = '2026-10-10T00:00:00Z';
    await expect(f.api.list(actor, viuId, kind, 1, '')).rejects.toMatchObject({ status: 403 });
    await expect(f.api.list({ ...actor, role: 'Admin' }, viuId, kind, 1, '')).rejects.toMatchObject(
      { status: 403 },
    );
    expect(f.write).not.toHaveBeenCalled();
  });
  it(`${kind}: foreign detail/list and wrong IDs cannot be exposed or edited`, async () => {
    const f = fixture(kind);
    f.item.visuallyImpairedUserId = id;
    await expect(f.api.list(actor, viuId, kind, 1, '')).rejects.toMatchObject({ status: 403 });
    await expect(f.api.save(actor, viuId, kind, f.item, id)).rejects.toMatchObject({ status: 403 });
    f.item.visuallyImpairedUserId = viuId;
    f.item.id = viuId;
    await expect(f.api.remove(actor, viuId, kind, id)).rejects.toMatchObject({ status: 403 });
    expect(f.write).not.toHaveBeenCalled();
  });
  it(`${kind}: validates ranges and integer radius before any write; never retries 402/500`, async () => {
    const f = fixture(kind);
    const radius = kind === 'geofences' ? 'radiusMeters' : 'arrivalRadiusMeters';
    for (const patch of [
      { latitude: 91 },
      { longitude: -181 },
      { latitude: '' },
      { [radius]: 1 },
      { [radius]: 50.5 },
      { [radius]: 50001 },
      { name: ' ' },
    ])
      await expect(f.api.save(actor, viuId, kind, { ...f.item, ...patch })).rejects.toMatchObject({
        status: 400,
      });
    expect(f.write).not.toHaveBeenCalled();
    f.get.mockRejectedValueOnce(new ServiceError('License expired', 402));
    await expect(f.api.save(actor, viuId, kind, f.item)).rejects.toMatchObject({ status: 402 });
    expect(f.write).not.toHaveBeenCalled();
    f.write.mockRejectedValueOnce(new ServiceError('Unavailable', 500));
    await expect(f.api.save(actor, viuId, kind, f.item)).rejects.toMatchObject({ status: 500 });
    expect(f.write).toHaveBeenCalledTimes(1);
  });
}

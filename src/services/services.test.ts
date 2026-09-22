import { describe, it, expect } from 'vitest';
import { createMockService } from './mocks/service';
import { apiService } from './api/adapter';
import { request } from './http/client';
import { normalizeRole } from '../constants/labels';
import { seed } from './mocks/seed';
import { canSeeViu, canWrite } from './policy';
const login = async (email = 'caregiver@demo.vn') => {
  const s = createMockService(undefined, 0);
  await s.login(email, 'Demo@123');
  return s;
};
describe('resource policy', () => {
  it('rejects unknown roles and maps DB/JWT casing centrally', () => {
    expect(normalizeRole('ADMIN')).toBe('Admin');
    expect(normalizeRole('root')).toBeNull();
  });
  it('protects cross-tenant, unassigned and biometric resources', () => {
    const db = seed();
    const staff = db.people.find((p) => p.id === 'staff1')!;
    const admin = db.people.find((p) => p.id === 'admin')!;
    const center = db.people.find((p) => p.id === 'center')!;
    expect(canSeeViu(db, staff, 'viu4')).toBe(false);
    expect(canSeeViu(db, center, 'other')).toBe(false);
    expect(canSeeViu(db, admin, 'viu1')).toBe(false);
    expect(canWrite(db, center, 'faces', db.entities.faces[2])).toBe(false);
  });
  it('returns no coordinates or face media to super admin', async () => {
    const s = await login('admin@demo.vn');
    const db = await s.snapshot();
    expect(db.locations).toEqual([]);
    expect(db.photos).toEqual([]);
    expect(db.entities.faces).toEqual([]);
  });
  it('enforces secondary permission flags on direct mutations', async () => {
    const s = await login('secondary@demo.vn');
    const face = seed().entities.faces[0];
    await expect(s.execute({ type: 'save', kind: 'faces', entity: face })).rejects.toMatchObject({
      status: 403,
    });
  });
});
describe('mutations', () => {
  it('creates a VIU with primary linkage and enforces the limit', async () => {
    const s = await login();
    const p = {
      id: 'new',
      name: 'Người mới',
      email: 'new@demo.vn',
      phone: '',
      role: 'VisuallyImpaired' as const,
      orgId: '',
      active: true,
    };
    await s.execute({ type: 'person', person: p });
    expect((await s.snapshot()).links.some((l) => l.viuId === 'new' && l.primary)).toBe(true);
    await expect(
      s.execute({ type: 'person', person: { ...p, id: 'fourth', email: 'fourth@demo.vn' } }),
    ).rejects.toThrow('giới hạn');
  });
  it('requires compatible contact fields and unique priority', async () => {
    const s = await login();
    const e = (await s.snapshot()).entities.contacts[0];
    await expect(
      s.execute({
        type: 'save',
        kind: 'contacts',
        entity: { ...e, fields: { ...e.fields, type: 'ZALO', zalo: 'abc' } },
      }),
    ).rejects.toThrow('ZALO');
    await expect(
      s.execute({ type: 'save', kind: 'contacts', entity: { ...e, id: 'other' } }),
    ).rejects.toThrow('ưu tiên');
  });
  it('checks emergency transitions and stale version without overwriting', async () => {
    const s = await login();
    const a = (await s.snapshot()).alerts[0];
    await expect(
      s.execute({ type: 'transition', id: a.id, status: 'RESOLVED', version: a.version }),
    ).rejects.toThrow();
    await s.execute({ type: 'transition', id: a.id, status: 'ACKNOWLEDGED', version: a.version });
    await expect(
      s.execute({ type: 'transition', id: a.id, status: 'ESCALATED', version: a.version }),
    ).rejects.toMatchObject({ status: 409 });
    const after = (await s.snapshot()).alerts[0];
    expect(after.history.at(-1)?.to).toBe('ACKNOWLEDGED');
  });
  it('activates registry only after three images, deactivates after removal', async () => {
    const s = await login();
    const f = (await s.snapshot()).entities.faces[0];
    for (let i = 0; i < 3; i++)
      await s.execute({
        type: 'photo',
        faceId: f.id,
        photo: { id: 'p' + i, faceId: f.id, url: 'data:image/png;base64,AA==', primary: i === 0 },
      });
    expect((await s.snapshot()).entities.faces[0].active).toBe(true);
    await s.execute({
      type: 'photo',
      faceId: f.id,
      photo: (await s.snapshot()).photos[0],
      remove: true,
    });
    expect((await s.snapshot()).entities.faces[0].active).toBe(false);
  });
  it('rolls back failed persistence atomically, keeping deleted records', async () => {
    let blocked = false;
    const s = createMockService(
      {
        read: () => null,
        write: () => {
          if (blocked) throw Error('full');
        },
      },
      0,
    );
    await s.login('caregiver@demo.vn', 'Demo@123');
    const e = (await s.snapshot()).entities.faces[0];
    blocked = true;
    await expect(
      s.execute({ type: 'delete', kind: 'faces', id: e.id, version: e.version }),
    ).rejects.toMatchObject({ status: 507 });
    expect((await s.snapshot()).entities.faces.some((f) => f.id === e.id)).toBe(true);
  });
  it('mandatory notifications cannot be disabled', async () => {
    const s = await login();
    await expect(
      s.execute({
        type: 'save',
        kind: 'preferences',
        entity: {
          id: 'pref',
          name: 'SOS',
          ownerId: 'cg1',
          viuId: '',
          orgId: '',
          active: true,
          version: 0,
          fields: { event: 'SOS', push: false, email: false },
        },
      }),
    ).rejects.toThrow('bắt buộc');
  });
});
describe('integration boundary', () => {
  it('API mode fails closed instead of returning mock data', async () => {
    await expect(apiService.snapshot()).rejects.toMatchObject({ status: 501 });
    await expect(apiService.register('test', 'a', 'b')).rejects.toMatchObject({ status: 501 });
  });
  it('accepts 204 without JSON and normalizes ProblemDetails', async () => {
    expect(
      await request('/confirmed', {}, async () => new Response(null, { status: 204 })),
    ).toBeUndefined();
    await expect(
      request(
        '/confirmed',
        {},
        async () =>
          new Response(JSON.stringify({ detail: 'Conflict', errors: { name: ['Invalid'] } }), {
            status: 409,
          }),
      ),
    ).rejects.toMatchObject({ status: 409, fields: { name: 'Invalid' } });
  });
  it('clears session on logout', async () => {
    const s = await login();
    await s.logout();
    expect(await s.session()).toBeNull();
    await expect(s.snapshot()).rejects.toMatchObject({ status: 401 });
  });
});

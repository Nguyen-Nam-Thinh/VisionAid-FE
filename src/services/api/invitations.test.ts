import { expect, it, vi } from 'vitest';
import { cleanToken, createInvitationsApi } from './invitations';
import type { Person } from '../../models/domain';

const id = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const caregiver = { id, role: 'Caregiver', orgId: '' } as Person;
const at = '2026-11-07T08:00:00Z';
const permissions = { canReceiveAlerts: true, canManageRegistry: false, canManageLocations: true };

it('creates, previews and accepts a single-use invitation as a caregiver', async () => {
  const write = vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>(async (path) =>
    path.endsWith('/preview')
      ? { viuFullName: 'B', inviterFullName: 'A', ...permissions, expiresAt: at }
      : path.endsWith('/accept')
        ? { id }
        : {
            token: 'tok_ABCDEFGH123',
            expiresAt: at,
            visuallyImpairedUserId: viuId,
            viuFullName: 'B',
            ...permissions,
          },
  );
  const api = createInvitationsApi(vi.fn(), write);
  expect((await api.create(caregiver, viuId, permissions)).token).toBe('tok_ABCDEFGH123');
  expect(JSON.parse(String(write.mock.calls[0][1]?.body))).toEqual({
    visuallyImpairedUserId: viuId,
    ...permissions,
  });
  expect((await api.preview(caregiver, '  tok_ABCDEFGH123\n')).inviterFullName).toBe('A');
  expect(JSON.parse(String(write.mock.calls[1][1]?.body))).toEqual({ token: 'tok_ABCDEFGH123' });
  await api.accept(caregiver, 'tok_ABCDEFGH123');
  expect(write).toHaveBeenLastCalledWith(
    '/api/caregiver-links/invitations/accept',
    expect.anything(),
  );
  await expect(
    api.create({ ...caregiver, role: 'CenterAdmin' }, viuId, permissions),
  ).rejects.toMatchObject({ status: 403 });
  await expect(api.create(caregiver, 'nope', permissions)).rejects.toMatchObject({ status: 400 });
});

it('rejects malformed tokens and reads invitation history', async () => {
  expect(() => cleanToken('short')).toThrow();
  expect(() => cleanToken('has space inside')).toThrow();
  const get = vi.fn(async () => [
    {
      id,
      state: 'Accepted',
      invitedBy: id,
      invitedByName: 'A',
      ...permissions,
      createdAt: at,
      expiresAt: at,
      acceptedBy: id,
      acceptedByName: 'C',
      acceptedAt: at,
      resultingLinkId: id,
      revokedAt: null,
    },
  ]);
  const api = createInvitationsApi(get, vi.fn());
  expect((await api.history(caregiver, viuId))[0].acceptedByName).toBe('C');
  expect(get).toHaveBeenCalledWith('/api/caregiver-links/invitations?viuId=' + viuId, undefined);
});

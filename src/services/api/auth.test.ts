import { expect, it, vi } from 'vitest';
import { authSessionKey, createApiAuth, type AuthStorage } from './auth';
const jwt = (seconds = 600) =>
  'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })) + '.signature';
const pair = (seconds = 600) => ({
  accessToken: jwt(seconds),
  refreshToken: 'refresh-test',
  expiresAt: '2099-01-01T00:00:00Z',
});
const user = {
  id: '01900000-0000-7000-8000-000000000001',
  email: 'test@example.test',
  fullName: 'API Test',
  role: 'Caregiver',
  organizationId: null,
  isActive: true,
};
const ok = (data: unknown) => Response.json({ success: true, data });
function memory() {
  const data = new Map<string, string>();
  const storage: AuthStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
  return storage;
}
it('maps BE profile, restores on reload and uses the same device for logout', async () => {
  const storage = memory();
  const bodies: Record<string, unknown>[] = [];
  const fetcher = vi.fn<typeof fetch>(async (url, init) => {
    if (init?.body) bodies.push(JSON.parse(String(init.body)));
    return String(url).endsWith('/me')
      ? ok(user)
      : String(url).endsWith('/logout')
        ? ok(null)
        : ok(pair());
  });
  const auth = createApiAuth('http://example.test', storage, fetcher);
  expect(await auth.session()).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
  expect(await auth.login(' test@example.test ', 'Password@1')).toMatchObject({
    name: 'API Test',
    orgId: '',
    role: 'Caregiver',
  });
  const restored = createApiAuth('http://example.test', storage, fetcher);
  expect((await restored.session())?.id).toBe(user.id);
  await restored.logout();
  expect(bodies[0]).toMatchObject({ email: user.email, device: { deviceType: 'Web' } });
  expect(bodies.at(-1)?.clientDeviceId).toBe(
    (bodies[0].device as Record<string, unknown>).clientDeviceId,
  );
  expect(storage.getItem(authSessionKey)).toBeNull();
  expect(await restored.session()).toBeNull();
});
it('uses JWT exp, rotates expired access once for concurrent session checks', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair(-5)));
  let refreshes = 0;
  const auth = createApiAuth('http://example.test', storage, async (url) => {
    if (String(url).endsWith('/refresh')) {
      refreshes++;
      return ok({ ...pair(), refreshToken: 'rotated' });
    }
    return ok(user);
  });
  await Promise.all([auth.session(), auth.session(), auth.session()]);
  expect(refreshes).toBe(1);
  expect(JSON.parse(storage.getItem(authSessionKey)!).refreshToken).toBe('rotated');
});
it('refreshes once after 401 then stops and clears a rejected session', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  let refreshes = 0;
  const auth = createApiAuth('http://example.test', storage, async (url) => {
    if (String(url).endsWith('/refresh')) {
      refreshes++;
      return ok(pair());
    }
    return Response.json({ detail: 'Expired' }, { status: 401 });
  });
  await expect(auth.session()).rejects.toMatchObject({ status: 401 });
  expect(refreshes).toBe(1);
  expect(await auth.session()).toBeNull();
});
it('never refreshes on profile 403 and rejects mobile/unknown roles', async () => {
  for (const role of ['VisuallyImpaired', 'UnexpectedRole']) {
    const auth = createApiAuth('http://example.test', memory(), async (url) =>
      String(url).endsWith('/login') ? ok(pair()) : ok({ ...user, role }),
    );
    await expect(auth.login(user.email, 'Password@1')).rejects.toBeInstanceOf(Error);
    expect(await auth.session()).toBeNull();
  }
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({ detail: 'Disabled' }, { status: 403 }),
  );
  await expect(
    createApiAuth('http://example.test', storage, fetcher).session(),
  ).rejects.toMatchObject({ status: 403 });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('clears local session when logout is unreachable', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair()));
  const auth = createApiAuth('http://example.test', storage, async () => {
    throw new TypeError('offline');
  });
  await expect(auth.logout()).rejects.toMatchObject({ status: 503 });
  expect(await auth.session()).toBeNull();
  expect(storage.getItem(authSessionKey)).toBeNull();
});
it('does not replay refresh after a lost rotation response', async () => {
  const storage = memory();
  storage.setItem(authSessionKey, JSON.stringify(pair(-5)));
  const fetcher = vi.fn<typeof fetch>(async () => {
    throw new TypeError('lost response');
  });
  const auth = createApiAuth('http://example.test', storage, fetcher);
  await expect(auth.session()).rejects.toMatchObject({ status: 503 });
  expect(await auth.session()).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('rejects malformed success payloads and never retries wrong credentials or rate limits', async () => {
  for (const status of [401, 429]) {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ detail: 'Rejected' }, { status }),
    );
    await expect(
      createApiAuth('http://example.test', memory(), fetcher).login('a', 'b'),
    ).rejects.toMatchObject({ status });
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
  await expect(
    createApiAuth('http://example.test', memory(), async () => ok({})).login('a', 'b'),
  ).rejects.toMatchObject({ status: 502 });
  await expect(createApiAuth('', memory()).login('a', 'b')).rejects.toMatchObject({ status: 501 });
});

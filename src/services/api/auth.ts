import { z } from 'zod';
import { ServiceError } from '../contracts';
import { request } from '../http/client';
import type { Person } from '../../models/domain';

const tokensSchema = z.object({ accessToken: z.string().min(1), refreshToken: z.string().min(1) });
const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string(),
  phoneNumber: z.string().nullable().optional(),
  role: z.enum(['Caregiver', 'CenterAdmin', 'Admin', 'VisuallyImpaired']),
  organizationId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  avatarUrl: z.string().nullable().optional(),
});
type Tokens = z.infer<typeof tokensSchema>;
export interface AuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const authSessionKey = 'visionaid.api.session.v1';
const deviceKey = 'visionaid.api.device.v1';

// This is a per-tab test-session policy, not a persistent login or HttpOnly cookie.
export function createApiAuth(
  baseUrl: string,
  storage?: AuthStorage,
  transport: typeof fetch = fetch,
) {
  let tokens: Tokens | null = null;
  let deviceId = '';
  let generation = 0;
  let refreshFlight: Promise<void> | null = null;
  let sessionFlight: Promise<Person | null> | null = null;
  try {
    deviceId = storage?.getItem(deviceKey) || crypto.randomUUID();
    const raw = storage?.getItem(authSessionKey);
    if (raw) tokens = tokensSchema.parse(JSON.parse(raw));
  } catch {
    tokens = null;
  }
  if (!deviceId) deviceId = crypto.randomUUID();

  function clear() {
    generation++;
    tokens = null;
    try {
      storage?.removeItem(authSessionKey);
    } catch {
      /* Memory session is still cleared. */
    }
  }
  function save(value: unknown) {
    const parsed = tokensSchema.safeParse(value);
    if (!parsed.success) throw new ServiceError('Phản hồi phiên đăng nhập không hợp lệ.', 502);
    try {
      storage?.setItem(deviceKey, deviceId);
      storage?.setItem(authSessionKey, JSON.stringify(parsed.data));
    } catch {
      clear();
      throw new ServiceError(
        'Không thể lưu phiên. Cho phép bộ nhớ trình duyệt rồi đăng nhập lại.',
        507,
      );
    }
    tokens = parsed.data;
  }
  async function call(path: string, init: RequestInit = {}) {
    if (!baseUrl) throw new ServiceError('Chưa cấu hình VITE_API_BASE_URL.', 501);
    let response: unknown;
    try {
      response = await request<unknown>(
        baseUrl.replace(/\/$/, '') + path,
        {
          ...init,
          signal: init.signal ?? AbortSignal.timeout(15000),
        },
        transport,
      );
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        'Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ Web (localhost:5173).',
        503,
      );
    }
    if (response === undefined) return undefined;
    const envelope = z
      .object({
        success: z.boolean(),
        data: z.unknown().optional(),
        message: z.string().optional(),
        errors: z.array(z.string()).optional(),
      })
      .safeParse(response);
    if (!envelope.success) throw new ServiceError('Phản hồi máy chủ không đúng định dạng.', 502);
    if (!envelope.data.success)
      throw new ServiceError(
        envelope.data.errors?.join(' ') || envelope.data.message || 'Yêu cầu không thành công.',
        422,
      );
    return envelope.data.data;
  }
  const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  function expiresSoon() {
    try {
      const payload = JSON.parse(
        atob(tokens!.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
      ) as { exp?: number };
      // BE expiresAt describes the refresh token, so inspect JWT exp instead.
      return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + 30000;
    } catch {
      return true;
    }
  }
  async function refresh() {
    if (refreshFlight) return refreshFlight;
    if (!tokens) throw new ServiceError('Phiên đã kết thúc. Vui lòng đăng nhập lại.', 401);
    const epoch = generation;
    const token = tokens.refreshToken;
    refreshFlight = (async () => {
      try {
        const result = await call(
          '/api/auth/refresh',
          json({ refreshToken: token, clientDeviceId: deviceId }),
        );
        if (generation !== epoch) throw new ServiceError('Phiên đã kết thúc.', 401);
        save(result);
      } catch (error) {
        // A lost refresh response may already have rotated the token. Never replay it.
        if (generation === epoch) clear();
        throw error;
      } finally {
        refreshFlight = null;
      }
    })();
    return refreshFlight;
  }
  async function authorized(path: string, init: RequestInit = {}) {
    if (!tokens) throw new ServiceError('Vui lòng đăng nhập.', 401);
    const epoch = generation;
    if (expiresSoon()) await refresh();
    const usedToken = tokens?.accessToken;
    const send = () =>
      call(path, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init.headers).entries()),
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });
    try {
      return await send();
    } catch (error) {
      if (!(error instanceof ServiceError) || error.status !== 401 || generation !== epoch)
        throw error;
      if (tokens?.accessToken === usedToken) await refresh();
      try {
        return await send();
      } catch (retryError) {
        if (retryError instanceof ServiceError && [401, 403].includes(retryError.status)) clear();
        throw retryError;
      }
    }
  }
  async function profile(): Promise<Person> {
    const parsed = profileSchema.safeParse(await authorized('/api/users/me'));
    if (!parsed.success)
      throw new ServiceError('Hồ sơ từ máy chủ không hợp lệ hoặc vai trò chưa được hỗ trợ.', 502);
    const p = parsed.data;
    if (!p.isActive || p.role === 'VisuallyImpaired')
      throw new ServiceError('Tài khoản này không được truy cập Web Dashboard.', 403);
    return {
      id: p.id,
      name: p.fullName,
      email: p.email,
      phone: p.phoneNumber ?? '',
      role: p.role,
      orgId: p.organizationId ?? '',
      active: p.isActive,
      avatar: p.avatarUrl ?? undefined,
    };
  }
  return {
    async login(email: string, password: string) {
      clear();
      const epoch = generation;
      const result = await call(
        '/api/auth/login',
        json({
          email: email.trim(),
          password,
          device: {
            clientDeviceId: deviceId,
            deviceType: 'Web',
            deviceModel: 'VisionAid Web',
            appVersion: '0.1.0',
          },
        }),
      );
      if (generation !== epoch) throw new ServiceError('Yêu cầu đăng nhập đã bị hủy.', 401);
      try {
        save(result);
        return await profile();
      } catch (error) {
        if (generation === epoch) clear();
        throw error;
      }
    },
    async session(): Promise<Person | null> {
      if (!tokens) return null;
      if (sessionFlight) return sessionFlight;
      const epoch = generation;
      sessionFlight = (async () => {
        try {
          const person = await profile();
          if (epoch !== generation) return null;
          return person;
        } catch (error) {
          if (
            epoch === generation &&
            error instanceof ServiceError &&
            [401, 403].includes(error.status)
          )
            clear();
          throw error;
        } finally {
          sessionFlight = null;
        }
      })();
      return sessionFlight;
    },
    async logout() {
      try {
        if (tokens) await authorized('/api/auth/logout', json({ clientDeviceId: deviceId }));
      } finally {
        clear();
      }
    },
  };
}

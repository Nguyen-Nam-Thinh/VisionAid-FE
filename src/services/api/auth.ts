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
  function mapProfile(value: unknown): Person {
    const parsed = profileSchema.safeParse(value);
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
  async function profile(): Promise<Person> {
    return mapProfile(await authorized('/api/users/me'));
  }
  async function authenticate(path: string, credentials: Record<string, string>) {
    clear();
    const epoch = generation;
    const result = await call(
      path,
      json({
        ...credentials,
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
  }
  return {
    get: (path: string, signal?: AbortSignal) => authorized(path, { signal }),
    async recover(email: string) {
      email = email.trim();
      if (!z.string().email().max(255).safeParse(email).success)
        throw new ServiceError('Email không hợp lệ hoặc quá dài.', 400);
      await call('/api/auth/forgot-password', json({ email }));
      return 'Nếu email này đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu. Kiểm tra hộp thư và thư rác; liên kết có hiệu lực 15 phút.';
    },
    async resetPassword(email: string, code: string, newPassword: string) {
      email = email.trim();
      let token = code.trim();
      if (!z.string().email().safeParse(email).success)
        throw new ServiceError('Email không hợp lệ.', 400);
      if (token.includes('://')) {
        let link: URL;
        try {
          link = new URL(token);
        } catch {
          throw new ServiceError('Liên kết khôi phục không hợp lệ.', 400);
        }
        if (
          link.protocol !== 'visionaid:' ||
          link.hostname !== 'reset-password' ||
          link.searchParams.get('email') !== email ||
          !link.searchParams.get('token')
        )
          throw new ServiceError('Liên kết không hợp lệ hoặc email không khớp với liên kết.', 400);
        token = link.searchParams.get('token')!;
      }
      if (!token) throw new ServiceError('Vui lòng nhập mã hoặc liên kết trong email.', 400);
      if (
        newPassword.length < 8 ||
        newPassword.length > 100 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword) ||
        !/[^a-zA-Z0-9]/.test(newPassword)
      )
        throw new ServiceError(
          'Mật khẩu cần 8–100 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
          400,
        );
      try {
        await call('/api/auth/reset-password', json({ email, token, newPassword }));
      } catch (error) {
        if (error instanceof ServiceError && error.status === 403)
          throw new ServiceError(
            'Mã không hợp lệ, đã dùng hoặc hết hạn. Hãy yêu cầu email khôi phục mới.',
            403,
          );
        throw error;
      }
      clear();
    },
    async profile(values: Pick<Person, 'name' | 'phone' | 'avatar'>) {
      const fullName = values.name.trim();
      const phoneNumber = values.phone.trim();
      if (!fullName || fullName.length > 200)
        throw new ServiceError('Họ tên phải có từ 1 đến 200 ký tự.', 400);
      if (phoneNumber && !/^0[35789][0-9]{8}$/.test(phoneNumber))
        throw new ServiceError('Số điện thoại Việt Nam phải có 10 số, ví dụ 0901234567.', 400);
      return mapProfile(
        await authorized('/api/users/me', {
          ...json({ fullName, phoneNumber }),
          method: 'PUT',
        }),
      );
    },
    async changePassword(currentPassword: string, newPassword: string) {
      if (
        newPassword.length < 8 ||
        newPassword.length > 100 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword) ||
        !/[^a-zA-Z0-9]/.test(newPassword) ||
        currentPassword === newPassword
      )
        throw new ServiceError(
          'Mật khẩu mới cần 8–100 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt và khác mật khẩu cũ.',
          400,
        );
      await authorized('/api/auth/change-password', json({ currentPassword, newPassword }));
      clear();
    },
    login(email: string, password: string) {
      return authenticate('/api/auth/login', { email: email.trim(), password });
    },
    async register(name: string, email: string, password: string) {
      if (!name.trim() || name.trim().length > 200)
        throw new ServiceError('Họ tên phải có từ 1 đến 200 ký tự.', 400);
      if (!z.string().email().max(255).safeParse(email.trim()).success)
        throw new ServiceError('Email không hợp lệ hoặc quá dài.', 400);
      if (
        password.length < 8 ||
        password.length > 100 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[^a-zA-Z0-9]/.test(password)
      )
        throw new ServiceError(
          'Mật khẩu cần 8–100 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
          400,
        );
      try {
        return await authenticate('/api/auth/register', {
          fullName: name.trim(),
          email: email.trim(),
          password,
        });
      } catch (error) {
        if (error instanceof ServiceError && error.status === 409) throw error;
        throw new ServiceError(
          (error instanceof Error ? error.message : 'Không thể hoàn tất đăng ký.') +
            ' Nếu tài khoản đã được tạo, hãy thử đăng nhập; không gửi lại đăng ký liên tục.',
          error instanceof ServiceError ? error.status : 503,
        );
      }
    },
    async logoutAll() {
      try {
        await authorized('/api/auth/logout-all', { method: 'POST' });
      } finally {
        clear();
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

import { ServiceError, type VisionService } from '../contracts';
import { runtime } from '../../configs/runtime';
import { createApiAuth } from './auth';
const auth = createApiAuth(
  runtime.apiBaseUrl,
  typeof sessionStorage === 'undefined' ? undefined : sessionStorage,
);
export const apiGet = auth.get;
export const apiWrite = auth.write;
const unavailable = async (): Promise<never> => {
  throw new ServiceError(
    'Chức năng này chưa tích hợp API. Hiện hỗ trợ đăng ký, đăng nhập, hồ sơ, đổi mật khẩu và đăng xuất.',
    501,
  );
};
/** Stages 1–3b implement auth, registration and profile. All later-stage operations fail closed. */
export const apiService: VisionService = {
  mode: 'api',
  session: auth.session,
  login: auth.login,
  register: auth.register,
  logout: auth.logout,
  logoutAll: auth.logoutAll,
  recover: auth.recover,
  resetPassword: auth.resetPassword,
  changePassword: auth.changePassword,
  profile: auth.profile,
  snapshot: unavailable,
  execute: unavailable,
  resetDemo: unavailable,
  demoAccounts: async () => [],
  addSecondary: unavailable,
  generateLink: unavailable,
  acceptLink: unavailable,
  resetAccountPassword: unavailable,
};

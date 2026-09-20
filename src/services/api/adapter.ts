import { ServiceError, type VisionService } from '../contracts';
const unavailable = async (): Promise<never> => {
  throw new ServiceError(
    'Chưa cấu hình contract backend. Xem docs/BACKEND_INTEGRATION.md; không sử dụng dữ liệu mock trong chế độ API.',
    501,
  );
};
/** Intentionally fails closed until verified OpenAPI/auth contracts are supplied. */
export const apiService: VisionService = {
  mode: 'api',
  session: unavailable,
  login: unavailable,
  register: unavailable,
  logout: unavailable,
  recover: unavailable,
  resetPassword: unavailable,
  changePassword: unavailable,
  profile: unavailable,
  snapshot: unavailable,
  execute: unavailable,
  resetDemo: unavailable,
  demoAccounts: async () => [],
  addSecondary: unavailable,
  generateLink: unavailable,
  acceptLink: unavailable,
  resetAccountPassword: unavailable,
};

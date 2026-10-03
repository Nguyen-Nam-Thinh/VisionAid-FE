import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Fields, Person } from '../../models/domain';

const integer = z.number().int().min(1).max(2147483647);
// BE stores numeric(12,2); reject silent rounding and database overflow before writing.
const money = z
  .number()
  .finite()
  .min(0)
  .max(9999999999.99)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.0002,
    'Giá có tối đa 2 chữ số thập phân.',
  );
const fields = z.object({
  name: z.string().trim().min(1).max(200),
  priceMonthly: money,
  priceYearly: money.refine((value) => value > 0, 'Giá năm phải lớn hơn 0.').nullable(),
  currency: z.string().trim().min(1).max(10),
  maxViuPerLicense: integer,
  includedLicenses: integer,
  trialDays: z.number().int().min(0).max(2147483647),
  durationDays: integer,
  featureFlags: z.record(z.string(), z.boolean()),
});
const identity = {
  code: z.string().regex(/^[A-Z0-9_]{1,50}$/),
  packageType: z.enum(['Personal', 'Business']),
};
const packageSchema = fields.extend({
  ...identity,
  id: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
const pageSchema = z.object({
  items: z.array(packageSchema),
  page: integer,
  pageSize: integer,
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type LicensePackage = z.infer<typeof packageSchema>;
type Actor = Pick<Person, 'role' | 'orgId'>;
export const canBrowsePackages = (actor: Actor) =>
  actor.role === 'Admin' ||
  actor.role === 'CenterAdmin' ||
  (actor.role === 'Caregiver' && !actor.orgId);
export const packageForActor = (actor: Actor, item: LicensePackage) =>
  actor.role === 'Admin' ||
  (item.isActive && item.packageType === (actor.role === 'CenterAdmin' ? 'Business' : 'Personal'));
function check(actor: Actor, admin = false, id?: string) {
  if (!canBrowsePackages(actor) || (admin && actor.role !== 'Admin'))
    throw new ServiceError('Bạn không có quyền quản lý gói này.', 403);
  if (id && !z.string().uuid().safeParse(id).success)
    throw new ServiceError('Mã gói không hợp lệ.', 400);
}
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ServiceError('Dữ liệu gói không hợp lệ. Hãy tải lại.', 502);
  return result.data;
}
export function packageInput(values: Fields, current?: LicensePackage) {
  let featureFlags: unknown;
  try {
    featureFlags = JSON.parse(String(values.featureFlags || '{}'));
  } catch {
    throw new ServiceError('Feature flags cần là JSON với giá trị true/false.', 400, {
      featureFlags: 'JSON không hợp lệ.',
    });
  }
  const annual = String(values.priceYearly ?? '').trim();
  if (current?.priceYearly != null && !annual)
    throw new ServiceError(
      'BE chưa hỗ trợ xóa giá năm đã lưu. Giữ giá hiện tại hoặc nhập giá mới.',
      400,
      { priceYearly: 'Không thể xóa giá năm đã lưu.' },
    );
  const schema = current ? fields.extend({ isActive: z.boolean() }) : fields.extend(identity);
  const result = schema.safeParse({
    ...values,
    featureFlags,
    priceYearly: annual ? Number(annual) : null,
  });
  if (!result.success)
    throw new ServiceError(
      'Kiểm tra thông tin gói: giá hợp lệ, số lượng/ngày là số nguyên và flags chỉ chứa true/false.',
      400,
      Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message])),
    );
  return result.data;
}
export function createPackagesApi(get = apiGet, write = apiWrite) {
  return {
    async list(actor: Actor, page: number, active: string, signal?: AbortSignal) {
      check(actor);
      const query = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (actor.role === 'Admin' && ['true', 'false'].includes(active))
        query.set('isActive', active);
      return parse(pageSchema, await get('/api/licenses/packages?' + query, signal));
    },
    async detail(actor: Actor, id: string, signal?: AbortSignal) {
      check(actor, true, id);
      const item = parse(packageSchema, await get('/api/licenses/packages/' + id, signal));
      if (item.id !== id) throw new ServiceError('Máy chủ trả về sai gói.', 502);
      return item;
    },
    async save(actor: Actor, values: Fields, current?: LicensePackage) {
      check(actor, true, current?.id);
      const body = packageInput(values, current);
      const item = parse(
        packageSchema,
        await write('/api/licenses/packages' + (current ? '/' + current.id : ''), {
          method: current ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );
      if (current && item.id !== current.id)
        throw new ServiceError('Máy chủ trả về sai gói. Tải lại trước khi thao tác tiếp.', 502);
      return item;
    },
  };
}
export const packagesApi = createPackagesApi();
export const packagePrice = (amount: number, currency: string) =>
  `${amount.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${currency}`;

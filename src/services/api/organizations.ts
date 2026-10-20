import { t } from '../../i18n';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

const organization = z.object({
  id: z.string().uuid(),
  name: z.string(),
  taxCode: z.string().nullable(),
  address: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  contactEmail: z.string().nullable(),
  isActive: z.boolean(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  staffCount: z.number().int().nonnegative(),
  viuCount: z.number().int().nonnegative(),
  centerAdminName: z.string().nullable(),
});
const member = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  role: z.enum(['Admin', 'CenterAdmin', 'Caregiver', 'VisuallyImpaired']),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});
const summaryDates = z.object({
  dateFrom: z.iso.date().nullable(),
  dateTo: z.iso.date().nullable(),
});
const summary = summaryDates.extend({
  organizationId: z.string().uuid(),
  emergencyEventCount: z.number().int().nonnegative(),
  geofenceBreachCount: z.number().int().nonnegative(),
  ocrRequestCount: z.number().int().nonnegative(),
  faceRecognitionCount: z.number().int().nonnegative(),
});
const paged = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  });
export type Organization = z.infer<typeof organization>;
type Scope = Pick<Person, 'role' | 'orgId'>;
export type OrganizationInput = {
  name: string;
  taxCode?: string;
  address: string;
  phoneNumber: string;
  contactEmail: string;
};
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ServiceError(t('Dữ liệu tổ chức không đúng định dạng.'), 502);
  return result.data;
}
function scopeCheck(scope: Scope, id?: string, adminOnly = false) {
  if (
    scope.role !== 'Admin' &&
    (adminOnly || scope.role !== 'CenterAdmin' || !scope.orgId || (id && id !== scope.orgId))
  )
    throw new ServiceError(t('Bạn không có quyền thao tác tổ chức này.'), 403);
  if (id && !z.string().uuid().safeParse(id).success)
    throw new ServiceError(t('Mã tổ chức không hợp lệ.'), 400);
}
function input(values: OrganizationInput, create: boolean) {
  const result = z
    .object({
      name: z.string().trim().min(1).max(200),
      address: z.string().trim().max(500),
      phoneNumber: z
        .string()
        .trim()
        // Mirrors BE f6df5b3: mobile, landline 02x (10–11 digits) or 1800/1900 hotline.
        .refine((v) => !v || /^(0[35789]\d{8}|02\d{8,9}|1[89]00\d{4,6})$/.test(v)),
      contactEmail: z
        .string()
        .trim()
        .refine((v) => !v || z.string().email().safeParse(v).success),
      taxCode: z.string().trim().max(50).optional(),
    })
    .safeParse(values);
  if (!result.success) {
    // Point at the offending fields; the phone rule mirrors the BE validator (mobile numbers only).
    const messages: Record<string, string> = {
      name: t('Tên tổ chức từ 1 đến 200 ký tự.'),
      address: t('Địa chỉ tối đa 500 ký tự.'),
      phoneNumber: t('Nhập số di động (03, 05, 07, 08, 09), số bàn 02x hoặc tổng đài 1800/1900.'),
      contactEmail: t('Email không hợp lệ.'),
      taxCode: t('Mã số thuế tối đa 50 ký tự.'),
    };
    const fields = Object.fromEntries(
      result.error.issues.map((issue) => [String(issue.path[0]), messages[String(issue.path[0])]]),
    );
    throw new ServiceError(Object.values(fields).join(' '), 400, fields);
  }
  const { taxCode, ...rest } = result.data;
  return create ? { ...rest, taxCode: taxCode || null } : rest;
}
export function createOrganizationsApi(get = apiGet, write = apiWrite) {
  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    async summary(
      scope: Scope,
      id: string,
      dateFrom: string,
      dateTo: string,
      signal?: AbortSignal,
    ) {
      scopeCheck(scope, id);
      const dates = summaryDates.safeParse({ dateFrom: dateFrom || null, dateTo: dateTo || null });
      if (!dates.success || (dateFrom && dateTo && dateFrom > dateTo))
        throw new ServiceError(
          t('Kiểm tra ngày lọc; ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'),
          400,
        );
      const query = new URLSearchParams();
      if (dateFrom) query.set('dateFrom', dateFrom);
      if (dateTo) query.set('dateTo', dateTo);
      const result = parse(
        summary,
        await get(`/api/organizations/${id}/activity-summary?${query}`, signal),
      );
      if (result.organizationId !== id)
        throw new ServiceError(t('Báo cáo không thuộc tổ chức hiện tại.'), 403);
      if (result.dateFrom !== dates.data.dateFrom || result.dateTo !== dates.data.dateTo)
        throw new ServiceError(t('Khoảng ngày báo cáo không khớp bộ lọc.'), 502);
      return result;
    },
    async list(
      scope: Scope,
      page: number,
      search: string,
      isActive: string,
      isDeleted: string,
      signal?: AbortSignal,
    ) {
      scopeCheck(scope, undefined, true);
      const query = new URLSearchParams({ page: String(page), pageSize: '10', search });
      if (isActive) query.set('isActive', isActive);
      if (isDeleted) query.set('isDeleted', isDeleted);
      return parse(paged(organization), await get('/api/organizations?' + query, signal));
    },
    async detail(scope: Scope, id: string, signal?: AbortSignal) {
      scopeCheck(scope, id);
      const result = parse(organization, await get('/api/organizations/' + id, signal));
      if (result.id !== id) throw new ServiceError(t('Tổ chức trả về không khớp lựa chọn.'), 403);
      return result;
    },
    async me(scope: Scope, signal?: AbortSignal) {
      scopeCheck(scope, scope.orgId);
      if (scope.role !== 'CenterAdmin')
        throw new ServiceError(t('Chỉ dành cho quản trị trung tâm.'), 403);
      const result = parse(organization, await get('/api/organizations/me', signal));
      if (result.id !== scope.orgId)
        throw new ServiceError(t('Tổ chức không thuộc phiên hiện tại.'), 403);
      return result;
    },
    async members(
      scope: Scope,
      id: string,
      page: number,
      search: string,
      role: string,
      isActive: string,
      signal?: AbortSignal,
    ) {
      scopeCheck(scope, id);
      const query = new URLSearchParams({ page: String(page), pageSize: '10', search });
      if (role) query.set('role', role);
      if (isActive) query.set('isActive', isActive);
      return parse(
        paged(member),
        await get('/api/organizations/' + id + '/members?' + query, signal),
      );
    },
    async create(scope: Scope, values: OrganizationInput) {
      scopeCheck(scope, undefined, true);
      return parse(
        organization,
        await write('/api/organizations', json('POST', input(values, true))),
      );
    },
    async update(scope: Scope, id: string, values: OrganizationInput) {
      scopeCheck(scope, id);
      const result = parse(
        organization,
        await write('/api/organizations/' + id, json('PUT', input(values, false))),
      );
      if (result.id !== id) throw new ServiceError(t('Tổ chức trả về không khớp lựa chọn.'), 403);
      return result;
    },
    async status(scope: Scope, id: string, isActive: boolean) {
      scopeCheck(scope, id, true);
      await write('/api/organizations/' + id + '/status', json('PATCH', { isActive }));
    },
    async remove(scope: Scope, id: string) {
      scopeCheck(scope, id, true);
      await write('/api/organizations/' + id, { method: 'DELETE' });
    },
  };
}
export const organizationsApi = createOrganizationsApi();

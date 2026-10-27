import { t } from '../../i18n';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

// Only keys reviewed against BE DbSeeder may expose values, including their history.
const reviewedKeys = new Set([
  'ai.yolo.confidence_threshold',
  'ai.yolo.max_detections_per_frame',
  'ai.facenet.similarity_threshold',
  'caregiving.max_caregivers_per_viu',
  'caregiving.max_vius_per_caregiver',
  'face_registry.min_photos_to_activate',
  'face_registry.max_persons_per_registry',
  'location.max_saved_locations_per_user',
  'emergency.max_contacts_per_user',
  'location.geofence.default_radius_meters',
  'location.geofence.default_arrival_radius_meters',
  'location.retention_days',
  'retention.ocr_image_days',
  'retention.alert_snapshot_months',
  'retention.fcm_token_inactive_days',
  'retention.face_log_days',
  'tts.cooldown_seconds',
  'trial_days_default',
  'license_validation_cache_ttl_seconds',
  'license_grace_period_days',
  'hybrid_navigation_enabled',
  'hybrid_navigation_engine',
  'navigation_near_threshold_ms',
  'webrtc_enabled',
  'webrtc_stun_fallback_url',
  'webrtc_max_duration_minutes',
  'webrtc_ring_timeout_seconds',
  'payos_enabled',
  'payos_environment',
  'ocr_confidence_threshold',
]);
const uuid = z.string().uuid();
const configSchema = z
  .object({
    id: uuid,
    configKey: z.string(),
    configValue: z.string(),
    valueType: z.enum(['Integer', 'Decimal', 'Boolean', 'String', 'Json']),
    category: z.string(),
    description: z.string().nullable(),
    minValue: z.string().nullable(),
    maxValue: z.string().nullable(),
    isPublic: z.boolean(),
    updatedAt: z.iso.datetime({ offset: true }),
    updatedBy: uuid.nullable(),
  })
  .transform((item) => ({
    ...item,
    reviewed: reviewedKeys.has(item.configKey),
    ...(reviewedKeys.has(item.configKey)
      ? {}
      : { configValue: '', description: null, minValue: null, maxValue: null }),
  }));
const historySchema = z.object({
  id: uuid,
  configId: uuid,
  configKey: z.string(),
  oldValue: z.string().nullable(),
  newValue: z.string(),
  changedBy: uuid.nullable(),
  // Added by BE f6df5b3; optional so older deploys still parse.
  changedByName: z.string().nullable().optional(),
  changedByEmail: z.string().nullable().optional(),
  changedAt: z.iso.datetime({ offset: true }),
  reason: z.string().nullable(),
});
const paged = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  });
export type SystemConfig = z.infer<typeof configSchema>;
export type ConfigHistory = z.infer<typeof historySchema>;
type Actor = Pick<Person, 'role'>;
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const p = schema.safeParse(raw);
  if (!p.success) throw new ServiceError(t('Dữ liệu cấu hình không hợp lệ.'), 502);
  return p.data;
}
function authorize(actor: Actor, id?: string) {
  if (actor.role !== 'Admin')
    throw new ServiceError(t('Chỉ quản trị hệ thống được quản lý cấu hình.'), 403);
  if (id !== undefined && !uuid.safeParse(id).success)
    throw new ServiceError(t('Mã cấu hình không hợp lệ.'), 400);
}
function review(config: SystemConfig) {
  if (!config.reviewed || !reviewedKeys.has(config.configKey))
    throw new ServiceError(t('Khóa này chưa được duyệt để hiển thị hoặc sửa trên Web.'), 403);
}
function pageQuery(page: number) {
  if (!Number.isInteger(page) || page < 1) throw new ServiceError(t('Trang không hợp lệ.'), 400);
  return new URLSearchParams({ page: String(page), pageSize: '10' });
}
export function validateConfigValue(config: SystemConfig, value: string) {
  if (!value.trim()) throw new ServiceError(t('Giá trị không được để trống.'), 400);
  if (config.valueType === 'Integer' || config.valueType === 'Decimal') {
    const valid =
      config.valueType === 'Integer'
        ? /^[+-]?\d+$/.test(value)
        : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value);
    const n = Number(value);
    if (
      !valid ||
      !Number.isFinite(n) ||
      (config.valueType === 'Integer' &&
        (!Number.isInteger(n) || n < -2147483648 || n > 2147483647))
    )
      throw new ServiceError(t('Nhập số hợp lệ, dùng dấu chấm cho phần thập phân.'), 400);
    for (const [bound, lower] of [
      [config.minValue, true],
      [config.maxValue, false],
    ] as const) {
      if (
        bound !== null &&
        (!Number.isFinite(Number(bound)) || (lower ? n < Number(bound) : n > Number(bound)))
      )
        throw new ServiceError(t('Giá trị nằm ngoài giới hạn cấu hình.'), 400);
    }
  }
  if (config.valueType === 'Boolean' && !['true', 'false'].includes(value))
    throw new ServiceError(t('Giá trị phải là true hoặc false.'), 400);
  if (config.valueType === 'Json') {
    try {
      JSON.parse(value);
    } catch {
      throw new ServiceError(t('JSON không hợp lệ.'), 400);
    }
  }
  const choices: Record<string, string[]> = {
    payos_environment: ['sandbox', 'production'],
    hybrid_navigation_engine: ['JEV', 'GROQ', 'RULE_BASED'],
  };
  if (choices[config.configKey] && !choices[config.configKey].includes(value))
    throw new ServiceError(t('Giá trị không nằm trong lựa chọn được hỗ trợ.'), 400);
  if (config.configKey === 'webrtc_stun_fallback_url' && !/^stuns?:[^\s@]+$/.test(value))
    throw new ServiceError(t('Nhập URL STUN hợp lệ, không chứa thông tin đăng nhập.'), 400);
}
export function createConfigurationsApi(get = apiGet, write = apiWrite) {
  async function detail(actor: Actor, id: string, signal?: AbortSignal) {
    authorize(actor, id);
    const data = parse(configSchema, await get(`/api/system-configs/${id}`, signal));
    if (data.id !== id) throw new ServiceError(t('Cấu hình không khớp lựa chọn.'), 403);
    review(data);
    return data;
  }
  async function current(actor: Actor, config: SystemConfig) {
    const latest = await detail(actor, config.id);
    if (
      ['configKey', 'configValue', 'updatedAt', 'valueType', 'minValue', 'maxValue'].some(
        (key) => latest[key as keyof SystemConfig] !== config[key as keyof SystemConfig],
      )
    )
      throw new ServiceError(t('Cấu hình đã thay đổi. Đóng popup và tải lại trước khi sửa.'), 409);
    return latest;
  }
  async function mutate(
    actor: Actor,
    config: SystemConfig,
    value: string,
    reason: string,
    history?: ConfigHistory,
  ) {
    const latest = await current(actor, config);
    validateConfigValue(latest, value);
    if (reason.length > 500) throw new ServiceError(t('Lý do tối đa 500 ký tự.'), 400);
    const result = parse(
      configSchema,
      await write(`/api/system-configs/${config.id}${history ? '/rollback' : ''}`, {
        method: history ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          history
            ? { historyId: history.id, reason: reason.trim() || null }
            : { configValue: value, reason: reason.trim() || null },
        ),
      }),
    );
    if (
      result.id !== config.id ||
      result.configKey !== config.configKey ||
      result.configValue !== value
    )
      throw new ServiceError(
        t('Chưa xác nhận được kết quả lưu. Tải lại cấu hình trước khi gửi lại.'),
        502,
      );
    return result;
  }
  return {
    async list(actor: Actor, page: number, search: string, category: string, signal?: AbortSignal) {
      authorize(actor);
      const query = pageQuery(page);
      if (search) query.set('search', search);
      if (category) query.set('category', category);
      return parse(paged(configSchema), await get(`/api/system-configs?${query}`, signal));
    },
    detail,
    async history(actor: Actor, config: SystemConfig, page: number, signal?: AbortSignal) {
      authorize(actor, config.id);
      review(config);
      const query = pageQuery(page);
      const data = parse(
        paged(historySchema),
        await get(`/api/system-configs/${config.id}/history?${query}`, signal),
      );
      if (
        data.items.some(
          (item) => item.configId !== config.id || item.configKey !== config.configKey,
        )
      )
        throw new ServiceError(t('Lịch sử không thuộc cấu hình được chọn.'), 403);
      return data;
    },
    save: (actor: Actor, config: SystemConfig, value: string, reason: string) =>
      mutate(actor, config, value, reason),
    async rollback(
      actor: Actor,
      config: SystemConfig,
      history: ConfigHistory,
      page: number,
      reason: string,
    ) {
      const entries = await this.history(actor, config, page);
      const entry = entries.items.find((item) => item.id === history.id);
      if (!entry || entry.oldValue === null || entry.oldValue !== history.oldValue)
        throw new ServiceError(t('Không xác minh được giá trị khôi phục. Tải lại lịch sử.'), 409);
      return mutate(actor, config, entry.oldValue, reason, entry);
    },
  };
}
export const configurationsApi = createConfigurationsApi();

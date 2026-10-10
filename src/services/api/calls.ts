import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { createCaregivingApi } from './caregiving';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';
const timestamp = z.iso.datetime({ offset: true });
export const callStatuses = {
  Initiated: 'Đã khởi tạo',
  Ringing: 'Đang đổ chuông',
  Connected: 'Đã chấp nhận',
  Ended: 'Đã kết thúc',
  Missed: 'Nhỡ',
  Rejected: 'Đã từ chối',
};
export const callTriggers = {
  CaregiverInitiated: 'Người chăm sóc gọi',
  ViuVoiceCommand: 'Lệnh giọng nói',
  SosAuto: 'SOS',
};
const item = z.object({
  sessionId: z.string().uuid(),
  triggerType: z.enum(['CaregiverInitiated', 'ViuVoiceCommand', 'SosAuto']),
  status: z.enum(['Initiated', 'Ringing', 'Connected', 'Ended', 'Missed', 'Rejected']),
  durationSeconds: z.number().int().nonnegative().nullable(),
  startedAt: timestamp,
  connectedAt: timestamp.nullable(),
  endedAt: timestamp.nullable(),
  endReason: z.string().nullable(),
  initiatorId: z.string().uuid().nullable(),
  receiverId: z.string().uuid().nullable(),
  viuUserId: z.string().uuid().nullable(),
});
const pageSchema = z.object({
  items: z.array(item),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});
export type CallHistoryItem = z.infer<typeof item>;
export type CallFilters = { viuUserId: string; dateFrom: string; dateTo: string };
const sessionSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(['Initiated', 'Ringing', 'Connected']),
  myRole: z.literal('video_viewer_audio_sender'),
  iceServers: z.array(
    z.object({
      urls: z.string().regex(/^(stun|stuns|turn|turns):[^\s]+$/),
      username: z.string().nullable(),
      credential: z.string().nullable(),
    }),
  ),
});
export type CallSession = z.infer<typeof sessionSchema>;
export function createCallsApi(get = apiGet, write = apiWrite) {
  const validId = (id: string) => {
    if (!z.string().uuid().safeParse(id).success)
      throw new ServiceError('Mã cuộc gọi không hợp lệ.', 400);
    return id;
  };
  const post = (path: string, body?: unknown) =>
    write(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const parseSession = (raw: unknown, id?: string) => {
    const parsed = sessionSchema.safeParse(raw);
    if (!parsed.success || (id && parsed.data.sessionId !== id))
      throw new ServiceError(
        'Thông tin kết nối cuộc gọi không hợp lệ. Kiểm tra lịch sử trước khi gọi lại.',
        502,
      );
    return parsed.data;
  };
  return {
    async authorize(actor: Person, viuId: string) {
      validId(viuId);
      if (actor.role !== 'Caregiver')
        throw new ServiceError('Chỉ người chăm sóc được thực hiện cuộc gọi.', 403);
      const links = await createCaregivingApi(get, write).links(actor.id, viuId, 1);
      if (!links.items.some((link) => !link.unlinkedAt))
        throw new ServiceError('Bạn không còn liên kết chăm sóc hoạt động.', 403);
    },
    async initiate(actor: Person, viuId: string) {
      await this.authorize(actor, viuId);
      return parseSession(
        await post('/api/webrtc/sessions', { viuUserId: viuId, triggerType: 'CaregiverInitiated' }),
      );
    },
    async accept(id: string) {
      return parseSession(await post(`/api/webrtc/sessions/${validId(id)}/accept`), id);
    },
    async reject(id: string) {
      await post(`/api/webrtc/sessions/${validId(id)}/reject`);
    },
    async end(id: string, reason = 'user_hangup') {
      await post(`/api/webrtc/sessions/${validId(id)}/end`, { reason });
    },
    async history(actor: Person, page: number, filters: CallFilters, signal?: AbortSignal) {
      if (actor.role !== 'Caregiver')
        throw new ServiceError('Màn hình này dành cho người chăm sóc.', 403);
      if (!Number.isInteger(page) || page < 1) throw new ServiceError('Trang không hợp lệ.', 400);
      const query = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filters.viuUserId) {
        if (!z.string().uuid().safeParse(filters.viuUserId).success)
          throw new ServiceError('Mã người được chăm sóc phải là UUID.', 400);
        query.set('viuUserId', filters.viuUserId);
      }
      for (const key of ['dateFrom', 'dateTo'] as const)
        if (filters[key]) {
          const date = new Date(filters[key]);
          if (!Number.isFinite(date.getTime()))
            throw new ServiceError('Thời gian không hợp lệ.', 400);
          query.set(key, date.toISOString());
        }
      if (
        filters.dateFrom &&
        filters.dateTo &&
        new Date(filters.dateFrom) > new Date(filters.dateTo)
      )
        throw new ServiceError('Thời gian bắt đầu phải trước thời gian kết thúc.', 400);
      const result = pageSchema.safeParse(await get('/api/webrtc/sessions?' + query, signal));
      if (!result.success) throw new ServiceError('Lịch sử cuộc gọi từ máy chủ không hợp lệ.', 502);
      if (
        result.data.items.some(
          (call) =>
            (call.initiatorId !== actor.id && call.receiverId !== actor.id) ||
            (filters.viuUserId && call.viuUserId !== filters.viuUserId),
        )
      )
        throw new ServiceError('Máy chủ trả cuộc gọi ngoài phạm vi yêu cầu.', 403);
      return result.data;
    },
  };
}
export const callsApi = createCallsApi();

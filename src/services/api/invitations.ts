import { t, msg, labelMap } from '../../i18n';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

// FE-28: a primary caregiver shows a single-use QR token; another caregiver previews and accepts it
// and becomes a secondary (Personal) caregiver with the permissions offered.
const uuid = z.string().uuid();
const time = z.iso.datetime({ offset: true });
const permissions = {
  canReceiveAlerts: z.boolean(),
  canManageRegistry: z.boolean(),
  canManageLocations: z.boolean(),
};
const created = z.object({
  token: z.string().min(8).max(512),
  expiresAt: time,
  visuallyImpairedUserId: uuid,
  viuFullName: z.string(),
  ...permissions,
});
const preview = z.object({
  viuFullName: z.string(),
  inviterFullName: z.string(),
  ...permissions,
  expiresAt: time,
});
const historyItem = z.object({
  id: uuid,
  state: z.string(),
  invitedBy: uuid.nullable(),
  invitedByName: z.string().nullable(),
  ...permissions,
  createdAt: time,
  expiresAt: time,
  acceptedBy: uuid.nullable(),
  acceptedByName: z.string().nullable(),
  acceptedAt: time.nullable(),
  resultingLinkId: uuid.nullable(),
  revokedAt: time.nullable(),
});
export type Invitation = z.infer<typeof created>;
export type InvitationPreview = z.infer<typeof preview>;
export type InvitationHistoryItem = z.infer<typeof historyItem>;
export type InvitationPermissions = {
  canReceiveAlerts: boolean;
  canManageRegistry: boolean;
  canManageLocations: boolean;
};
export const invitationStateLabels: Record<string, string> = labelMap({
  Pending: msg('Đang chờ'),
  Expired: msg('Đã hết hạn'),
  Accepted: msg('Đã chấp nhận'),
  Revoked: msg('Đã thu hồi'),
});
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new ServiceError(t('Dữ liệu lời mời không hợp lệ. Hãy tải lại.'), 502);
  return result.data;
}
function caregiver(actor: Pick<Person, 'role'>) {
  if (actor.role !== 'Caregiver')
    throw new ServiceError(t('Chỉ tài khoản người chăm sóc mới dùng được lời mời.'), 403);
}
/** Page that accepts an invitation; the QR opens it straight from a phone camera. */
export const INVITE_PATH = '/caregiver/caregivers';
export const inviteLink = (token: string) =>
  `${window.location.origin}${INVITE_PATH}?invite=${encodeURIComponent(token)}`;
/** The token from a scanned or pasted invitation link, or the raw code itself. */
export function inviteToken(value: string) {
  const text = value.trim();
  try {
    const url = new URL(text);
    return url.searchParams.get('invite')?.trim() || text;
  } catch {
    return text;
  }
}
/** After sign-in, return to an invitation link only (an internal path, never another site). */
export function inviteResumeTarget(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith(INVITE_PATH + '?')) return null;
  const token = new URLSearchParams(value.slice(INVITE_PATH.length + 1)).get('invite') ?? '';
  return token.length >= 8 && token.length <= 512 && !/\s/.test(token)
    ? `${INVITE_PATH}?invite=${encodeURIComponent(token)}`
    : null;
}
/** Accepts the raw code or a whole invitation link; trims what a scanner or a paste adds. */
export function cleanToken(value: string) {
  const token = inviteToken(value);
  if (token.length < 8 || token.length > 512 || /\s/.test(token))
    throw new ServiceError(t('Mã lời mời không hợp lệ. Kiểm tra lại mã hoặc quét lại QR.'), 400);
  return token;
}
export function createInvitationsApi(get = apiGet, write = apiWrite) {
  const post = (path: string, body: object) =>
    write(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  return {
    /** Primary caregiver: one single-use invitation for this care recipient. */
    async create(actor: Person, viuId: string, granted: InvitationPermissions) {
      caregiver(actor);
      if (!uuid.safeParse(viuId).success)
        throw new ServiceError(t('Chọn người được chăm sóc trước khi tạo lời mời.'), 400);
      const result = parse(
        created,
        await post('/api/caregiver-links/invitations', {
          visuallyImpairedUserId: viuId,
          ...granted,
        }),
      );
      if (result.visuallyImpairedUserId !== viuId)
        throw new ServiceError(t('Lời mời máy chủ trả về không khớp với người đã chọn.'), 502);
      return result;
    },
    /** Who invites me to whom; does not use the token up. */
    async preview(actor: Person, token: string) {
      caregiver(actor);
      return parse(
        preview,
        await post('/api/caregiver-links/invitations/preview', { token: cleanToken(token) }),
      );
    },
    /** Accept: creates a secondary Personal link with the offered permissions. */
    async accept(actor: Person, token: string) {
      caregiver(actor);
      await post('/api/caregiver-links/invitations/accept', { token: cleanToken(token) });
    },
    async history(actor: Person, viuId: string, signal?: AbortSignal) {
      if (!uuid.safeParse(viuId).success)
        throw new ServiceError(t('Chọn người được chăm sóc trước khi xem lời mời.'), 400);
      if (actor.role !== 'Caregiver' && actor.role !== 'CenterAdmin')
        throw new ServiceError(t('Bạn không có quyền xem lời mời của người này.'), 403);
      return parse(
        z.array(historyItem),
        await get('/api/caregiver-links/invitations?' + new URLSearchParams({ viuId }), signal),
      );
    },
  };
}
export const invitationsApi = createInvitationsApi();

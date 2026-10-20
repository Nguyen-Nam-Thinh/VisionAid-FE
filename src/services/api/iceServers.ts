import { t } from '../../i18n';
import { z } from 'zod';
import { apiGet, apiWrite } from './adapter';
import { ServiceError } from '../contracts';
import type { Person } from '../../models/domain';

// Existing TURN credentials must never enter the admin form or query cache.
const serverSchema = z.object({
  id: z.string().uuid(),
  serverType: z.enum(['Stun', 'Turn']),
  url: z.string(),
  username: z.string().nullable(),
  priority: z.number().int().min(1).max(1000),
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
const pageSchema = z.object({
  items: z.array(serverSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type IceServer = z.infer<typeof serverSchema>;
export type IceInput = {
  serverType: string;
  url: string;
  username: string;
  credential: string;
  priority: number;
  isActive: boolean;
};
export type IcePage = { page: number; active: string };
const path = '/api/webrtc/ice-servers';
function authorize(actor: Pick<Person, 'role'>) {
  if (actor.role !== 'Admin')
    throw new ServiceError(t('Chỉ quản trị viên hệ thống được quản lý máy chủ kết nối.'), 403);
}
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const data = schema.safeParse(raw);
  if (!data.success) throw new ServiceError(t('Phản hồi máy chủ kết nối không hợp lệ.'), 502);
  return data.data;
}
export function validateIceInput(input: IceInput) {
  const { serverType, priority, isActive } = input;
  const url = input.url.trim();
  const username = input.username.trim();
  const match =
    /^(stun|turn|turns):(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(?::([0-9]{1,5}))?(?:\?transport=(udp|tcp))?$/i.exec(
      url,
    );
  let hostValid = false;
  if (match) {
    try {
      hostValid = !!new URL('http://' + match[2]).hostname && !match[2].includes('..');
    } catch {
      /* Invalid IPv6 or host. */
    }
  }
  if (
    !['Stun', 'Turn'].includes(serverType) ||
    url.length > 300 ||
    !match ||
    !hostValid ||
    (match[3] && (Number(match[3]) < 1 || Number(match[3]) > 65535)) ||
    (serverType === 'Stun'
      ? match[1].toLowerCase() !== 'stun' || !!match[4]
      : match[1].toLowerCase() === 'stun')
  )
    throw new ServiceError(
      t(
        'Địa chỉ phải đúng loại STUN hoặc TURN, có host và cổng hợp lệ. TURN có thể thêm ?transport=udp hoặc ?transport=tcp.',
      ),
      400,
    );
  if (!Number.isInteger(priority) || priority < 1 || priority > 1000)
    throw new ServiceError(t('Độ ưu tiên phải là số nguyên từ 1 đến 1000.'), 400);
  if (typeof isActive !== 'boolean') throw new ServiceError(t('Trạng thái không hợp lệ.'), 400);
  if (
    serverType === 'Turn' &&
    (!username ||
      !input.credential.trim() ||
      username.length > 200 ||
      input.credential.length > 200)
  )
    throw new ServiceError(
      t('TURN cần tên đăng nhập và credential, mỗi giá trị tối đa 200 ký tự.'),
      400,
    );
  return {
    serverType,
    url,
    username: serverType === 'Turn' ? username : null,
    credential: serverType === 'Turn' ? input.credential : null,
    priority,
    isActive,
  };
}
export function createIceServersApi(get = apiGet, write = apiWrite) {
  async function list(actor: Pick<Person, 'role'>, filter: IcePage, signal?: AbortSignal) {
    authorize(actor);
    if (
      !Number.isInteger(filter.page) ||
      filter.page < 1 ||
      !['', 'true', 'false'].includes(filter.active)
    )
      throw new ServiceError(t('Bộ lọc máy chủ không hợp lệ.'), 400);
    const query = new URLSearchParams({ page: String(filter.page), pageSize: '20' });
    if (filter.active) query.set('isActive', filter.active);
    return parse(pageSchema, await get(path + '?' + query, signal));
  }
  async function current(actor: Pick<Person, 'role'>, server: IceServer, filter: IcePage) {
    if (!z.string().uuid().safeParse(server.id).success)
      throw new ServiceError(t('Mã máy chủ không hợp lệ.'), 400);
    // shortcut: pre-read is not atomic; use server version preconditions when BE supports them.
    const found = (await list(actor, filter)).items.find((row) => row.id === server.id);
    if (!found || JSON.stringify(found) !== JSON.stringify(server))
      throw new ServiceError(
        t('Danh sách hoặc cấu hình đã thay đổi. Đóng popup và tải lại trước khi tiếp tục.'),
        409,
      );
  }
  async function mutate(method: 'POST' | 'PUT' | 'DELETE', target: string, body?: unknown) {
    try {
      return await write(target, {
        method,
        ...(body === undefined
          ? {}
          : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
    } catch (error) {
      const code = (error as { status?: number }).status;
      // Do not echo backend validation text that might include submitted credentials.
      throw new ServiceError(
        t(
          'Không thể xác nhận thao tác máy chủ kết nối. Kiểm tra quyền, dữ liệu và tải lại danh sách.',
        ),
        code ?? 0,
      );
    }
  }
  return {
    list,
    async save(
      actor: Pick<Person, 'role'>,
      input: IceInput,
      server?: IceServer,
      filter: IcePage = { page: 1, active: '' },
    ) {
      authorize(actor);
      const body = validateIceInput(input);
      if (server) await current(actor, server, filter);
      const { isActive, ...createBody } = body;
      const saved = parse(
        serverSchema,
        await mutate(
          server ? 'PUT' : 'POST',
          server ? path + '/' + server.id : path,
          server ? body : createBody,
        ),
      );
      if (
        (server && saved.id !== server.id) ||
        saved.url !== body.url ||
        saved.serverType !== body.serverType ||
        saved.priority !== body.priority ||
        saved.isActive !== (server ? isActive : true)
      )
        throw new ServiceError(
          t('Phản hồi không khớp thay đổi. Tải lại danh sách để kiểm tra kết quả.'),
          502,
        );
      return saved;
    },
    async remove(actor: Pick<Person, 'role'>, server: IceServer, filter: IcePage) {
      authorize(actor);
      await current(actor, server, filter);
      await mutate('DELETE', path + '/' + server.id);
    },
  };
}
export const iceServersApi = createIceServersApi();

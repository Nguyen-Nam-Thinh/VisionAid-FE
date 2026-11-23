import { RefreshCw } from 'lucide-react';
import { t } from '../../i18n';
import { Toast, CardActions } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PageHead, State, Dialog, Badge } from '../../components/UI';
import { Form } from '../../components/Form';
import { iceServersApi, type IceServer, type IcePage } from '../../services/api/iceServers';
import type { Person } from '../../models/domain';

export function ApiIceServers() {
  const { data: actor } = useSession();
  if (actor?.role !== 'Admin')
    return (
      <p className="notice error" role="alert">
        {t('Chỉ quản trị viên hệ thống được quản lý máy chủ kết nối.')}
      </p>
    );
  return <Servers key={actor.id} actor={actor} />;
}
function Servers({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const [filter, setFilter] = useState<IcePage>({ page: 1, active: '' });
  const [change, setChange] = useState<{ server?: IceServer; remove?: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['api-ice-servers', actor.id, filter],
    queryFn: ({ signal }) => iceServersApi.list(actor, filter, signal),
    retry: false,
    gcTime: 0,
  });
  return (
    <>
      <PageHead
        title={t('Máy chủ hỗ trợ cuộc gọi')}
        description={t(
          'Máy chủ trung gian giúp cuộc gọi video giữa điện thoại và trang web vẫn kết nối được khi mạng hai bên khác nhau hoặc bị chặn.',
        )}
      />
      <section className="glass card stack">
        <CardActions>
          <button
            className="btn primary"
            onClick={() => {
              setNotice('');
              setChange({});
            }}
          >
            {t('Thêm máy chủ')}
          </button>
        </CardActions>
        <div className="notice stack">
          <p>{t('Khi gọi, hai thiết bị cần một máy chủ giúp nối với nhau. Có hai loại:')}</p>
          <ul>
            <li>
              <strong>{t('Tìm đường kết nối')}</strong>
              {' — '}
              {t('giúp hai thiết bị tự nối thẳng với nhau khi mạng cho phép.')}
            </li>
            <li>
              <strong>{t('Chuyển tiếp cuộc gọi')}</strong>
              {' — '}
              {t(
                'khi mạng chặn kết nối thẳng (mạng công ty, 4G), cuộc gọi đi vòng qua máy chủ này để vẫn nghe và thấy được.',
              )}
            </li>
          </ul>
          <p>{t('Sau khi đổi, hãy thử một cuộc gọi.')}</p>
          {query.data && <IceReadiness servers={query.data.items} />}
        </div>
        <div className="row">
          <label className="field">
            {t('Trạng thái máy chủ')}
            <select
              value={filter.active}
              onChange={(e) => setFilter({ page: 1, active: e.target.value })}
            >
              <option value="">{t('Tất cả')}</option>
              <option value="true">{t('Đang bật')}</option>
              <option value="false">{t('Đang tắt')}</option>
            </select>
          </label>
          <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t('Tải lại')}
          </button>
        </div>
        {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
        <State loading={query.isPending} error={query.error} retry={() => void query.refetch()}>
          {query.data && (
            <>
              <div
                className="table-scroll"
                role="region"
                aria-label={t('Máy chủ kết nối cuộc gọi')}
                tabIndex={0}
              >
                <table style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th>{t('Loại')}</th>
                      <th>{t('Máy chủ')}</th>
                      <th>{t('Thứ tự dùng')}</th>
                      <th>{t('Trạng thái')}</th>
                      <th>{t('Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((server) => (
                      <tr key={server.id}>
                        <td>{serverKind(server.serverType)}</td>
                        <td style={{ overflowWrap: 'anywhere' }}>
                          <strong>{iceAddress(server.url)}</strong>
                          <small className="muted" style={{ display: 'block' }}>
                            {server.url}
                          </small>
                          {server.serverType === 'Turn' && server.hasCredential !== undefined && (
                            <small className="muted" style={{ display: 'block' }}>
                              {server.hasCredential
                                ? t('Dùng mật khẩu cố định')
                                : t('Mật khẩu tạm do máy chủ cấp mỗi cuộc gọi')}
                            </small>
                          )}
                        </td>
                        <td>{t('Thứ {priority}', { priority: server.priority })}</td>
                        <td>
                          <Badge tone={server.isActive ? 'green' : 'amber'}>
                            {server.isActive ? t('Đang bật') : t('Đang tắt')}
                          </Badge>
                        </td>
                        <td>
                          <div className="row">
                            <button
                              className="btn small"
                              onClick={() => {
                                setNotice('');
                                setChange({ server });
                              }}
                            >
                              {t('Chỉnh sửa')}
                            </button>
                            <button
                              className="btn small danger"
                              onClick={() => {
                                setNotice('');
                                setChange({ server, remove: true });
                              }}
                            >
                              {t('Xóa')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!query.data.items.length && (
                  <p className="empty">{t('Không có máy chủ phù hợp.')}</p>
                )}
              </div>
              <div className="row pagination">
                <span>
                  {t('{totalCount} máy chủ · Trang {page}/{p4}', {
                    totalCount: query.data.totalCount,
                    page: query.data.page,
                    p4: Math.max(1, query.data.totalPages),
                  })}
                </span>
                <div className="row">
                  {(query.data.hasPreviousPage || query.data.hasNextPage) && (
                    <button
                      className="btn"
                      disabled={!query.data.hasPreviousPage || query.isFetching}
                      onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                    >
                      {t('Trang trước')}
                    </button>
                  )}
                  {(query.data.hasPreviousPage || query.data.hasNextPage) && (
                    <button
                      className="btn"
                      disabled={!query.data.hasNextPage || query.isFetching}
                      onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                    >
                      {t('Trang sau')}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </State>
      </section>
      {change && (
        <Change
          actor={actor}
          filter={filter}
          {...change}
          close={() => setChange(null)}
          saved={async () => {
            setChange(null);
            setNotice(t('Đã lưu máy chủ. Hãy thử một cuộc gọi để chắc chắn kết nối tốt.'));
            await cache.invalidateQueries({ queryKey: ['api-ice-servers', actor.id] });
          }}
        />
      )}
    </>
  );
}
function Change({
  actor,
  server,
  filter,
  remove,
  close,
  saved,
}: {
  actor: Person;
  server?: IceServer;
  filter: IcePage;
  remove?: boolean;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const [uncertain, setUncertain] = useState(false);
  return (
    <Dialog
      title={
        remove
          ? t('Xóa máy chủ kết nối')
          : server
            ? t('Chỉnh sửa máy chủ kết nối')
            : t('Thêm máy chủ kết nối')
      }
      onClose={close}
    >
      <div className="stack">
        {server && (
          <p style={{ overflowWrap: 'anywhere' }}>{t('Máy chủ: {url}', { url: server.url })}</p>
        )}
        {remove && (
          <p>
            {t(
              'Xóa cấu hình có thể làm cuộc gọi mới không kết nối được. Chỉ xóa khi đã có máy chủ thay thế phù hợp.',
            )}
          </p>
        )}
        {uncertain ? (
          <p className="notice error" role="alert">
            {t(
              'Chưa xác nhận kết quả ghi. Đóng hộp thoại và tải lại danh sách trước khi gửi lại để tránh tạo hoặc ghi trùng.',
            )}
          </p>
        ) : (
          <Form
            initial={{
              serverType: server?.serverType ?? 'Stun',
              url: server?.url ?? '',
              username: server?.username ?? '',
              credential: '',
              priority: server?.priority ?? 100,
              isActive: server?.isActive ?? true,
            }}
            fields={[
              ...(!remove
                ? [
                    {
                      key: 'serverType',
                      label: t('Loại máy chủ'),
                      type: 'select' as const,
                      required: true,
                      options: [
                        { value: 'Stun', label: serverKind('Stun') },
                        { value: 'Turn', label: serverKind('Turn') },
                      ],
                    },
                    {
                      key: 'url',
                      label: t('Địa chỉ máy chủ'),
                      required: true,
                      max: 300,
                      hint: t(
                        'Do bên cung cấp máy chủ đưa, ví dụ stun:stun.l.google.com:19302 hoặc turn:ten-may-chu:3478.',
                      ),
                    },
                    {
                      key: 'priority',
                      label: t('Thứ tự dùng'),
                      hint: t('Số nhỏ được thử trước.'),
                      type: 'number' as const,
                      min: 1,
                      max: 1000,
                      step: 1,
                    },
                    {
                      key: 'username',
                      label: t('Tên đăng nhập (chỉ cho máy chủ chuyển tiếp)'),
                      max: 200,
                      autoComplete: 'off',
                    },
                    {
                      key: 'credential',
                      label: t('Mật khẩu (chỉ cho máy chủ chuyển tiếp)'),
                      type: 'password' as const,
                      max: 200,
                      autoComplete: 'new-password',
                      hint: t(
                        'Để trống cả tên đăng nhập và mật khẩu (nên dùng): hệ thống tự cấp mật khẩu tạm cho mỗi cuộc gọi. Máy chủ tìm đường không cần hai ô này.',
                      ),
                    },
                    ...(server
                      ? [{ key: 'isActive', label: t('Bật máy chủ'), type: 'checkbox' as const }]
                      : []),
                  ]
                : []),
            ]}
            submit={remove ? t('Xác nhận xóa') : t('Lưu máy chủ')}
            onSubmit={async (values) => {
              try {
                if (remove && server) await iceServersApi.remove(actor, server, filter);
                else
                  await iceServersApi.save(
                    actor,
                    {
                      serverType: String(values.serverType),
                      url: String(values.url),
                      username: String(values.username || ''),
                      credential: String(values.credential || ''),
                      priority: Number(values.priority),
                      isActive: Boolean(values.isActive ?? true),
                    },
                    server,
                    filter,
                  );
              } catch (error) {
                const status = (error as { status?: number }).status;
                if (status === undefined || status === 0 || status >= 500) setUncertain(true);
                throw error;
              }
              await saved();
            }}
          />
        )}
      </div>
    </Dialog>
  );
}

/** "Stun" → "Tìm đường kết nối (STUN)"; the technical name stays for support conversations. */
function serverKind(type: string) {
  return type.toLowerCase() === 'turn'
    ? t('Chuyển tiếp cuộc gọi (TURN)')
    : t('Tìm đường kết nối (STUN)');
}
/** "turn:51.2.3.4:3478?transport=udp" → "51.2.3.4 · cổng 3478 · UDP". */
function iceAddress(url: string) {
  const match = /^(?:stuns?|turns?):([^?]+?)(?::(\d+))?(?:\?transport=(\w+))?$/i.exec(url.trim());
  if (!match) return url;
  const [, host, port, transport] = match;
  return [host, port && t('cổng {port}', { port }), transport?.toUpperCase()]
    .filter(Boolean)
    .join(' · ');
}
/** One line telling whether calls have both kinds of server switched on. */
function IceReadiness({ servers }: { servers: IceServer[] }) {
  const active = servers.filter((server) => server.isActive);
  const stun = active.filter((server) => server.serverType.toLowerCase() === 'stun').length;
  const turn = active.filter((server) => server.serverType.toLowerCase() === 'turn').length;
  return (
    <p className={stun && turn ? undefined : 'notice error'} role="status">
      {stun && turn
        ? t('Đang bật {stun} máy chủ tìm đường và {turn} máy chủ chuyển tiếp: đủ để gọi.', {
            stun,
            turn,
          })
        : !turn
          ? t(
              'Chưa có máy chủ chuyển tiếp nào đang bật: cuộc gọi qua mạng 4G hoặc mạng công ty có thể không nối được.',
            )
          : t(
              'Chưa có máy chủ tìm đường nào đang bật: cuộc gọi có thể nối chậm hoặc không nối được.',
            )}
    </p>
  );
}

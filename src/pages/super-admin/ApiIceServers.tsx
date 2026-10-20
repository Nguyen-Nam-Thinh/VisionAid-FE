import { t } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PageHead, State, Dialog, Badge } from '../../components/UI';
import { Form } from '../../components/Form';
import { iceServersApi, type IceServer, type IcePage } from '../../services/api/iceServers';
import { ServiceError } from '../../services/contracts';
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
        title={t('Máy chủ kết nối cuộc gọi')}
        description={t('Quản lý địa chỉ STUN và TURN dùng để thiết lập kết nối WebRTC.')}
        actions={
          <button
            className="btn primary"
            onClick={() => {
              setNotice('');
              setChange({});
            }}
          >
            {t('Thêm máy chủ')}
          </button>
        }
      />
      <section className="glass card stack">
        <p>
          {t(
            'Số ưu tiên nhỏ được xếp trước. Thay đổi cấu hình không xác nhận máy chủ đang hoạt động; cần kiểm tra bằng cuộc gọi thực tế.',
          )}
        </p>
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
            {t('Tải lại')}
          </button>
        </div>
        {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
        <State loading={query.isPending} error={query.error} retry={() => void query.refetch()}>
          {query.data && (
            <>
              {!query.data.items.length ? (
                <p>{t('Không có máy chủ phù hợp.')}</p>
              ) : (
                <div
                  className="table-scroll"
                  role="region"
                  aria-label={t('Máy chủ ICE')}
                  tabIndex={0}
                >
                  <table style={{ minWidth: 720 }}>
                    <thead>
                      <tr>
                        <th>{t('Loại')}</th>
                        <th>{t('Địa chỉ')}</th>
                        <th>{t('Ưu tiên')}</th>
                        <th>{t('Trạng thái')}</th>
                        <th>{t('Thao tác')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {query.data.items.map((server) => (
                        <tr key={server.id}>
                          <td>{server.serverType.toUpperCase()}</td>
                          <td style={{ overflowWrap: 'anywhere' }}>{server.url}</td>
                          <td>{server.priority}</td>
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
                </div>
              )}
              <div className="row pagination">
                <span>
                  {t('{totalCount} máy chủ · Trang {page}/{p4}', {
                    totalCount: query.data.totalCount,
                    page: query.data.page,
                    p4: Math.max(1, query.data.totalPages),
                  })}
                </span>
                <div className="row">
                  <button
                    className="btn"
                    disabled={!query.data.hasPreviousPage || query.isFetching}
                    onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                  >
                    {t('Trang trước')}
                  </button>
                  <button
                    className="btn"
                    disabled={!query.data.hasNextPage || query.isFetching}
                    onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                  >
                    {t('Trang sau')}
                  </button>
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
            setNotice(
              t(
                'Đã lưu thay đổi trên máy chủ. Cần kiểm tra kết nối cuộc gọi sau khi đổi cấu hình.',
              ),
            );
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
        <p>
          {remove
            ? t(
                'Xóa cấu hình có thể làm cuộc gọi mới không kết nối được. Chỉ xóa khi đã có máy chủ thay thế phù hợp.',
              )
            : t(
                'Máy chủ mới được bật ngay sau khi tạo. Thay đổi áp dụng cho cấu hình kết nối mới, không tự cài đặt hoặc đổi mật khẩu trên máy chủ TURN.',
              )}
        </p>
        {!remove && (
          <p>
            {t(
              'TURN cần nhập tên đăng nhập và credential mỗi lần lưu. Ô credential luôn trống khi mở, không dùng lại giá trị cũ. STUN bỏ qua hai ô này.',
            )}
          </p>
        )}
        {uncertain ? (
          <p className="notice error" role="alert">
            {t(
              'Chưa xác nhận kết quả ghi. Đóng popup và tải lại danh sách trước khi gửi lại để tránh tạo hoặc ghi trùng.',
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
              confirm: false,
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
                        { value: 'Stun', label: 'STUN' },
                        { value: 'Turn', label: 'TURN' },
                      ],
                    },
                    {
                      key: 'url',
                      label: t('Địa chỉ máy chủ'),
                      required: true,
                      max: 300,
                      hint: t('Ví dụ: stun:host:3478 hoặc turns:host:5349?transport=tcp'),
                    },
                    {
                      key: 'priority',
                      label: t('Độ ưu tiên'),
                      type: 'number' as const,
                      min: 1,
                      max: 1000,
                      step: 1,
                    },
                    {
                      key: 'username',
                      label: t('Tên đăng nhập TURN'),
                      max: 200,
                      autoComplete: 'off',
                    },
                    {
                      key: 'credential',
                      label: t('Credential TURN muốn áp dụng'),
                      type: 'password' as const,
                      max: 200,
                      autoComplete: 'new-password',
                    },
                    ...(server
                      ? [{ key: 'isActive', label: t('Bật máy chủ'), type: 'checkbox' as const }]
                      : []),
                  ]
                : []),
              {
                key: 'confirm',
                label: t('Tôi xác nhận thay đổi cấu hình kết nối cuộc gọi'),
                type: 'checkbox',
              },
            ]}
            submit={remove ? t('Xác nhận xóa') : t('Lưu máy chủ')}
            onSubmit={async (values) => {
              if (!values.confirm)
                throw new ServiceError(t('Vui lòng xác nhận thay đổi trước khi tiếp tục.'), 400);
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

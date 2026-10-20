import { t, formatLocaleDateTime } from '../../i18n';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi, type LinkedUser } from '../../services/api/caregiving';
import { PageHead, State, Badge, Confirm, Dialog } from '../../components/UI';

import { ApiCreateLinkedUser } from './ApiCreateLinkedUser';
import { viuLicenseLabel } from '../../services/api/licenses';
import { CallButton, CallAvailability } from '../../components/CallPanel';

export function ApiLinkedUsers() {
  const { data: user } = useSession();
  const cache = useQueryClient();
  const refresh = () => {
    setSelected('');
    void cache.invalidateQueries({
      predicate: (q) =>
        ['api-users', 'api-links', 'api-link-detail'].includes(String(q.queryKey[0])) &&
        q.queryKey[1] === user?.id,
    });
  };
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const query = useQuery({
    queryKey: ['api-users', user?.id, user?.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    enabled: user?.role === 'Caregiver',
    retry: false,
    refetchInterval: 30000,
  });
  const selectedUser = !query.isError
    ? query.data?.items.find((p) => p.id === selected)
    : undefined;
  return (
    <>
      <PageHead
        title={t('Người được chăm sóc')}
        description={t('Danh sách người dùng được liên kết với tài khoản của bạn.')}
        actions={
          user?.role === 'Caregiver' &&
          !user.orgId && (
            <ApiCreateLinkedUser
              key={user.id}
              caregiverId={user.id}
              onLinked={() => {
                setPage(1);
                setInput('');
                setSearch('');
                refresh();
              }}
            />
          )
        }
      />
      <CallAvailability />
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(input.trim());
            setSelected('');
          }}
        >
          <label className="field">
            {t('Tìm người được chăm sóc')}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('Tên, email hoặc số điện thoại')}
            />
          </label>
          <button className="btn primary" type="submit">
            {t('Tìm kiếm')}
          </button>
          <button
            className="btn"
            type="button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('Tải lại')}
          </button>
        </form>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {query.data && (
            <>
              <p>
                {t('{totalCount} kết quả · Trang {page}/{p4}', {
                  totalCount: query.data.totalCount,
                  page: query.data.page,
                  p4: Math.max(1, query.data.totalPages),
                })}
              </p>
              {query.data.items.length === 0 ? (
                <p role="status">
                  {t('Không có người dùng phù hợp trong danh sách được phép xem.')}
                </p>
              ) : (
                <>
                  <label className="field">
                    {t('Người được chăm sóc trên trang này')}
                    <select
                      value={selectedUser?.id ?? ''}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      <option value="">{t('Chọn người dùng')}</option>
                      {query.data.items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div
                    className="table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label={t('Danh sách người được chăm sóc')}
                  >
                    <table className="care-people-table">
                      <thead>
                        <tr>
                          <th>{t('Họ và tên')}</th>
                          <th>Email</th>
                          <th>{t('Điện thoại')}</th>
                          <th>{t('Tài khoản')}</th>
                          <th>License</th>
                          <th>{t('Thao tác')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {query.data.items.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.fullName}</strong>
                            </td>
                            <td>{p.email}</td>
                            <td>{p.phoneNumber || t('Chưa có')}</td>
                            <td>
                              <Badge tone={p.isActive ? 'green' : 'amber'}>
                                {p.isActive ? t('Đang hoạt động') : t('Đã vô hiệu hóa')}
                              </Badge>
                            </td>
                            <td>
                              {viuLicenseLabel(p.licenseStatus)}
                              {p.licenseExpiresAt && (
                                <p>
                                  {t('Hết hạn: {p1}', {
                                    p1: formatLocaleDateTime(p.licenseExpiresAt),
                                  })}
                                </p>
                              )}
                            </td>
                            <td>
                              <div className="care-row-actions">
                                <CallButton viuId={p.id} name={p.fullName} disabled={!p.isActive} />
                                <button
                                  className="btn"
                                  onClick={() => setSelected(p.id)}
                                  aria-label={t('Xem liên kết của ') + p.fullName}
                                >
                                  {t('Xem liên kết')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div className="row pagination">
                <button
                  className="btn"
                  disabled={!query.data.hasPreviousPage || query.isFetching}
                  onClick={() => {
                    setPage(page - 1);
                    setSelected('');
                  }}
                >
                  {t('Trang trước')}
                </button>
                <button
                  className="btn"
                  disabled={!query.data.hasNextPage || query.isFetching}
                  onClick={() => {
                    setPage(page + 1);
                    setSelected('');
                  }}
                >
                  {t('Trang sau')}
                </button>
              </div>
            </>
          )}
        </State>
      </section>

      {selectedUser && user && (
        <Dialog title={t('Chi tiết người được chăm sóc')} onClose={() => setSelected('')}>
          <UserLinks
            key={user.id + selectedUser.id}
            person={selectedUser}
            caregiverId={user.id}
            orgId={user.orgId}
            onUnlinked={refresh}
          />
        </Dialog>
      )}
    </>
  );
}

function UserLinks({
  person,
  caregiverId,
  orgId,
  onUnlinked,
}: {
  person: LinkedUser;
  caregiverId: string;
  orgId: string;
  onUnlinked: () => void;
}) {
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState('');
  const [unlinkId, setUnlinkId] = useState('');
  const links = useQuery({
    queryKey: ['api-links', caregiverId, orgId, person.id, page],
    queryFn: ({ signal }) => caregivingApi.links(caregiverId, person.id, page, signal),
    retry: false,
    refetchInterval: 30000,
  });
  const currentId =
    !links.isError && links.data?.items.some((l) => l.id === detailId && !l.unlinkedAt)
      ? detailId
      : '';
  const detail = useQuery({
    queryKey: ['api-link-detail', caregiverId, orgId, person.id, currentId],
    queryFn: ({ signal }) => caregivingApi.detail(currentId, caregiverId, person.id, signal),
    enabled: !!currentId,
    retry: false,
    refetchInterval: 30000,
  });
  return (
    <section className="stack">
      <h2>{t('Liên kết với {fullName}', { fullName: person.fullName })}</h2>
      {unlinkId && (
        <Confirm
          title={t('Gỡ liên kết chăm sóc')}
          description={
            t('Gỡ liên kết với ') +
            person.fullName +
            t('? Bạn sẽ mất quyền truy cập qua liên kết này. Tài khoản người dùng không bị xóa.')
          }
          onClose={() => setUnlinkId('')}
          onConfirm={async () => {
            await caregivingApi.unlink(unlinkId, caregiverId, person.id);
            onUnlinked();
          }}
        />
      )}
      <State loading={links.isPending} error={links.error} retry={() => links.refetch()}>
        {links.data?.items.length === 0 && (
          <p role="status">{t('Không còn liên kết hoạt động với người dùng này.')}</p>
        )}
        {links.data?.items.map((link) => (
          <div className="row between" key={link.id}>
            <span>
              {link.isPrimary ? t('Chăm sóc chính') : t('Chăm sóc phụ')} ·{' '}
              {link.linkType === 'Personal' ? t('Gia đình') : t('Tổ chức')}
            </span>
            {link.linkType === 'Personal' && !link.unlinkedAt && (
              <button className="btn danger" onClick={() => setUnlinkId(link.id)}>
                {t('Gỡ liên kết')}
              </button>
            )}
            <button className="btn" onClick={() => setDetailId(link.id)}>
              {t('Xem quyền liên kết')}
            </button>
          </div>
        ))}
        {links.data && links.data.totalPages > 1 && (
          <div className="row">
            <button
              className="btn"
              disabled={!links.data.hasPreviousPage}
              onClick={() => {
                setPage(page - 1);
                setDetailId('');
              }}
            >
              {t('Liên kết trước')}
            </button>
            <span>{t('Trang {page}/{total}', { page, total: links.data.totalPages })}</span>
            <button
              className="btn"
              disabled={!links.data.hasNextPage}
              onClick={() => {
                setPage(page + 1);
                setDetailId('');
              }}
            >
              {t('Liên kết sau')}
            </button>
          </div>
        )}
      </State>
      {currentId && (
        <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
          {detail.data &&
            (detail.data.unlinkedAt ? (
              <p role="status">{t('Liên kết đã được gỡ. Hãy tải lại danh sách.')}</p>
            ) : (
              <>
                <h3>{t('Quyền liên kết')}</h3>
                <dl className="record-details">
                  <div>
                    <dt>{t('Nhận cảnh báo')}</dt>
                    <dd>{detail.data.canReceiveAlerts ? t('Có') : t('Không')}</dd>
                  </div>
                  <div>
                    <dt>{t('Quản lý gương mặt')}</dt>
                    <dd>{detail.data.canManageRegistry ? t('Có') : t('Không')}</dd>
                  </div>
                  <div>
                    <dt>{t('Quản lý địa điểm')}</dt>
                    <dd>{detail.data.canManageLocations ? t('Có') : t('Không')}</dd>
                  </div>
                </dl>
              </>
            ))}
        </State>
      )}
    </section>
  );
}

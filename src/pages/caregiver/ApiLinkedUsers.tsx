import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi, type LinkedUser } from '../../services/api/caregiving';
import { PageHead, State, Badge } from '../../components/UI';

export function ApiLinkedUsers() {
  const { data: user } = useSession();
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
        title="Người được chăm sóc"
        description="Danh sách người dùng được liên kết với tài khoản của bạn."
      />
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
            Tìm người được chăm sóc
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tên, email hoặc số điện thoại"
            />
          </label>
          <button className="btn primary" type="submit">
            Tìm kiếm
          </button>
          <button
            className="btn"
            type="button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Tải lại
          </button>
        </form>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          {query.data && (
            <>
              <p>
                {query.data.totalCount} kết quả · Trang {query.data.page}/
                {Math.max(1, query.data.totalPages)}
              </p>
              {query.data.items.length === 0 ? (
                <p role="status">Không có người dùng phù hợp trong danh sách được phép xem.</p>
              ) : (
                <>
                  <label className="field">
                    Người được chăm sóc trên trang này
                    <select
                      value={selectedUser?.id ?? ''}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      <option value="">Chọn người dùng</option>
                      {query.data.items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Họ và tên</th>
                          <th>Email</th>
                          <th>Điện thoại</th>
                          <th>Tài khoản</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {query.data.items.map((p) => (
                          <tr key={p.id}>
                            <td>{p.fullName}</td>
                            <td>{p.email}</td>
                            <td>{p.phoneNumber || 'Chưa có'}</td>
                            <td>
                              <Badge tone={p.isActive ? 'green' : 'amber'}>
                                {p.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                              </Badge>
                            </td>
                            <td>
                              <button
                                className="btn"
                                onClick={() => setSelected(p.id)}
                                aria-label={'Xem liên kết của ' + p.fullName}
                              >
                                Xem liên kết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div className="row">
                <button
                  className="btn"
                  disabled={!query.data.hasPreviousPage || query.isFetching}
                  onClick={() => {
                    setPage(page - 1);
                    setSelected('');
                  }}
                >
                  Trang trước
                </button>
                <button
                  className="btn"
                  disabled={!query.data.hasNextPage || query.isFetching}
                  onClick={() => {
                    setPage(page + 1);
                    setSelected('');
                  }}
                >
                  Trang sau
                </button>
              </div>
            </>
          )}
        </State>
      </section>
      {selectedUser && user && (
        <UserLinks
          key={user.id + selectedUser.id}
          person={selectedUser}
          caregiverId={user.id}
          orgId={user.orgId}
        />
      )}
    </>
  );
}

function UserLinks({
  person,
  caregiverId,
  orgId,
}: {
  person: LinkedUser;
  caregiverId: string;
  orgId: string;
}) {
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState('');
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
    <section className="glass card stack">
      <h2>Liên kết với {person.fullName}</h2>
      <State loading={links.isPending} error={links.error} retry={() => links.refetch()}>
        {links.data?.items.length === 0 && (
          <p role="status">Không còn liên kết hoạt động với người dùng này.</p>
        )}
        {links.data?.items.map((link) => (
          <div className="row between" key={link.id}>
            <span>
              {link.isPrimary ? 'Chăm sóc chính' : 'Chăm sóc phụ'} ·{' '}
              {link.linkType === 'Personal' ? 'Gia đình' : 'Tổ chức'}
            </span>
            <button className="btn" onClick={() => setDetailId(link.id)}>
              Xem quyền liên kết
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
              Liên kết trước
            </button>
            <span>
              Trang {page}/{links.data.totalPages}
            </span>
            <button
              className="btn"
              disabled={!links.data.hasNextPage}
              onClick={() => {
                setPage(page + 1);
                setDetailId('');
              }}
            >
              Liên kết sau
            </button>
          </div>
        )}
      </State>
      {currentId && (
        <State loading={detail.isPending} error={detail.error} retry={() => detail.refetch()}>
          {detail.data &&
            (detail.data.unlinkedAt ? (
              <p role="status">Liên kết đã được gỡ. Hãy tải lại danh sách.</p>
            ) : (
              <>
                <h3>Quyền liên kết</h3>
                <dl className="stack">
                  <div>
                    <dt>Nhận cảnh báo</dt>
                    <dd>{detail.data.canReceiveAlerts ? 'Có' : 'Không'}</dd>
                  </div>
                  <div>
                    <dt>Quản lý gương mặt</dt>
                    <dd>{detail.data.canManageRegistry ? 'Có' : 'Không'}</dd>
                  </div>
                  <div>
                    <dt>Quản lý địa điểm</dt>
                    <dd>{detail.data.canManageLocations ? 'Có' : 'Không'}</dd>
                  </div>
                </dl>
              </>
            ))}
        </State>
      )}
    </section>
  );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { Form, type FieldSpec } from '../../components/Form';
import { Dialog, PageHead, State } from '../../components/UI';
import {
  packagesApi,
  canBrowsePackages,
  packageForActor,
  packagePrice,
  type LicensePackage,
} from '../../services/api/packages';
import type { Person } from '../../models/domain';

const editorFields: FieldSpec[] = [
  { key: 'name', label: 'Tên gói', required: true, max: 200 },
  { key: 'priceMonthly', label: 'Giá tháng', type: 'number', min: 0, required: true },
  {
    key: 'priceYearly',
    label: 'Giá năm',
    hint: 'Có thể để trống khi tạo. Giá năm chưa dùng để thanh toán trên Web; không thể xóa giá đã lưu.',
  },
  { key: 'currency', label: 'Đơn vị tiền tệ', required: true, max: 10 },
  {
    key: 'maxViuPerLicense',
    label: 'VIU trên license (cấu hình gói)',
    type: 'number',
    min: 1,
    step: 1,
    required: true,
    hint: 'B2C vẫn tối đa 3 VIU theo MaxViusPerCaregiver; trường này không thay đổi giới hạn đó.',
  },
  {
    key: 'includedLicenses',
    label: 'Số license bao gồm',
    type: 'number',
    min: 1,
    step: 1,
    required: true,
  },
  { key: 'trialDays', label: 'Số ngày dùng thử', type: 'number', min: 0, step: 1, required: true },
  {
    key: 'durationDays',
    label: 'Thời hạn gói (ngày)',
    type: 'number',
    min: 1,
    step: 1,
    required: true,
  },
  {
    key: 'featureFlags',
    label: 'Feature flags (JSON)',
    type: 'textarea',
    hint: 'Ví dụ {"ocr": true}. Chỉ lưu cờ true/false, không nhập khóa bí mật. Cờ không tự triển khai tính năng mới.',
  },
];
export function ApiPackages({ admin = false }: { admin?: boolean }) {
  const { data: actor } = useSession();
  return actor ? (
    <Packages key={actor.id + actor.role + actor.orgId + admin} actor={actor} admin={admin} />
  ) : null;
}
function Packages({ actor, admin }: { actor: Person; admin: boolean }) {
  const allowed = canBrowsePackages(actor) && (!admin || actor.role === 'Admin');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: ['license-packages', actor.id, actor.role, actor.orgId, page, active],
    queryFn: ({ signal }) => packagesApi.list(actor, page, active, signal),
    enabled: allowed,
    refetchInterval: selected ? false : 60000,
  });
  if (!allowed)
    return (
      <p className="notice">
        Tài khoản này không cần chọn gói cá nhân. License do tổ chức quản lý.
      </p>
    );
  const items = query.data?.items.filter((p) => admin || packageForActor(actor, p)) ?? [];
  return (
    <>
      <PageHead
        title={admin ? 'Quản lý gói license' : 'Danh mục gói'}
        description={
          admin
            ? 'Tạo và cập nhật cấu hình gói trên máy chủ.'
            : 'Thông tin gói hiện hành từ máy chủ. Thanh toán sẽ được mở ở đợt tiếp theo.'
        }
        actions={
          admin && (
            <button
              className="btn primary"
              onClick={() => {
                setNotice('');
                setSelected('new');
              }}
            >
              Thêm gói
            </button>
          )
        }
      />
      {!admin && (
        <p className="notice">
          {actor.role === 'CenterAdmin'
            ? 'Gói Business dành cho tổ chức.'
            : 'Gói Personal dành cho gia đình; tối đa 3 người được chăm sóc theo chính sách hiện hành.'}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section className="glass card stack">
        <div className="row">
          {admin && (
            <label className="field">
              Trạng thái gói
              <select
                value={active}
                onChange={(e) => {
                  setActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="true">Đang mở</option>
                <option value="false">Ngừng mở</option>
              </select>
            </label>
          )}
          <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Tải lại danh mục
          </button>
        </div>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Danh sách gói license</caption>
              <thead>
                <tr>
                  <th>Gói</th>
                  <th>Giá tháng</th>
                  <th>Thời hạn</th>
                  <th>License</th>
                  {admin && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <p>
                        {p.code} · {p.packageType}
                      </p>
                      <p>{p.isActive ? 'Đang mở' : 'Ngừng mở'}</p>
                    </td>
                    <td>
                      {packagePrice(p.priceMonthly, p.currency)}
                      {p.priceYearly !== null && (
                        <p>Giá năm tham khảo: {packagePrice(p.priceYearly, p.currency)}</p>
                      )}
                    </td>
                    <td>
                      {p.durationDays} ngày<p>Dùng thử: {p.trialDays} ngày</p>
                    </td>
                    <td>
                      {p.packageType === 'Personal'
                        ? 'Tối đa 3 VIU theo chính sách B2C'
                        : `${p.includedLicenses} license bao gồm`}
                    </td>
                    {admin && (
                      <td>
                        <button
                          className="btn"
                          onClick={() => {
                            setNotice('');
                            setSelected(p.id);
                          }}
                          aria-label={'Chi tiết ' + p.name}
                        >
                          Chi tiết / Sửa
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!items.length && (
            <p>
              Chưa có gói phù hợp trên trang này.
              {query.data?.hasNextPage ? ' Hãy xem trang tiếp theo.' : ''}
            </p>
          )}
          {query.data && (
            <footer className="pagination">
              <span>
                Trang {page}/{Math.max(1, query.data.totalPages)} ·{' '}
                {admin
                  ? query.data.totalCount + ' gói'
                  : 'Phân trang theo danh mục máy chủ; chỉ hiển thị loại gói phù hợp tài khoản.'}
              </span>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </button>
            </footer>
          )}
        </State>
      </section>
      {selected && admin && (
        <PackageEditor
          key={selected}
          actor={actor}
          id={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            setNotice('Đã lưu gói trên máy chủ.');
          }}
        />
      )}
    </>
  );
}
function PackageEditor({
  actor,
  id,
  onClose,
  onSaved,
}: {
  actor: Person;
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cache = useQueryClient();
  const creating = id === 'new';
  const [pending, setPending] = useState(false);
  const detail = useQuery({
    queryKey: ['license-package', actor.id, id],
    queryFn: ({ signal }) => packagesApi.detail(actor, id, signal),
    enabled: !creating,
  });
  const current: LicensePackage | undefined = detail.data;
  const fields: FieldSpec[] = [
    ...(!creating
      ? []
      : [
          {
            key: 'code',
            label: 'Mã gói',
            required: true,
            max: 50,
            hint: 'Chữ in hoa, số, dấu gạch dưới. Không thể đổi sau khi tạo.',
          },
          {
            key: 'packageType',
            label: 'Loại gói',
            type: 'select' as const,
            required: true,
            options: [
              { value: 'Personal', label: 'Personal' },
              { value: 'Business', label: 'Business' },
            ],
          },
        ]),
    ...editorFields,
    ...(!creating ? [{ key: 'isActive', label: 'Đang mở bán', type: 'checkbox' as const }] : []),
  ];
  return (
    <Dialog
      title={creating ? 'Thêm gói license' : 'Chi tiết / Sửa gói'}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <State
        loading={!creating && detail.isPending}
        error={detail.error}
        retry={() => detail.refetch()}
      >
        {(creating || current) && (
          <>
            {current && (
              <p>
                Mã: {current.code} · Loại: {current.packageType} (không thể thay đổi)
              </p>
            )}
            <Form
              fields={fields}
              initial={
                current
                  ? {
                      ...current,
                      priceYearly: current.priceYearly ?? '',
                      featureFlags: JSON.stringify(current.featureFlags, null, 2),
                    }
                  : { featureFlags: '{}' }
              }
              submit={creating ? 'Tạo gói' : 'Lưu gói'}
              onSubmit={async (values) => {
                setPending(true);
                try {
                  await packagesApi.save(actor, values, current);
                  await cache.invalidateQueries({ queryKey: ['license-packages'] });
                  await cache.invalidateQueries({ queryKey: ['license-subscription'] });
                  cache.removeQueries({ queryKey: ['license-package', actor.id, id] });
                  onSaved();
                } finally {
                  setPending(false);
                }
              }}
            />
          </>
        )}
      </State>
    </Dialog>
  );
}

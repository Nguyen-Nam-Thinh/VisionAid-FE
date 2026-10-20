import { t, msg } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { PackageCheckout } from './ApiPayments';
import { isPersonalCaregiver } from '../../services/api/licenses';
import { canCheckout, canPay } from '../../services/api/payments';
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
  { key: 'name', label: msg('Tên gói'), required: true, max: 200 },
  { key: 'priceMonthly', label: msg('Giá tháng'), type: 'number', min: 0, required: true },
  {
    key: 'priceYearly',
    label: msg('Giá năm'),
    hint: msg(
      'Có thể để trống khi tạo. Giá năm chưa dùng để thanh toán trên Web; không thể xóa giá đã lưu.',
    ),
  },
  { key: 'currency', label: msg('Đơn vị tiền tệ'), required: true, max: 10 },
  {
    key: 'maxViuPerLicense',
    label: msg('VIU trên license (cấu hình gói)'),
    type: 'number',
    min: 1,
    step: 1,
    required: true,
    hint: msg(
      'B2C vẫn tối đa 3 VIU theo MaxViusPerCaregiver; trường này không thay đổi giới hạn đó.',
    ),
  },
  {
    key: 'includedLicenses',
    label: msg('Số license bao gồm'),
    type: 'number',
    min: 1,
    step: 1,
    required: true,
  },
  {
    key: 'trialDays',
    label: msg('Số ngày dùng thử'),
    type: 'number',
    min: 0,
    step: 1,
    required: true,
  },
  {
    key: 'durationDays',
    label: msg('Thời hạn gói (ngày)'),
    type: 'number',
    min: 1,
    step: 1,
    required: true,
  },
  {
    key: 'featureFlags',
    label: 'Feature flags (JSON)',
    type: 'textarea',
    hint: msg(
      'Ví dụ {"ocr": true}. Chỉ lưu cờ true/false, không nhập khóa bí mật. Cờ không tự triển khai tính năng mới.',
    ),
  },
];
export function ApiPackages({ admin = false }: { admin?: boolean }) {
  const { data: actor } = useSession();
  return actor ? (
    <Packages key={actor.id + actor.role + actor.orgId + admin} actor={actor} admin={admin} />
  ) : null;
}
function Packages({ actor, admin }: { actor: Person; admin: boolean }) {
  const personal = isPersonalCaregiver(actor);
  const buyer = canPay(actor);
  const [checkout, setCheckout] = useState<LicensePackage | null>(null);
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
        {t('Tài khoản này không cần chọn gói cá nhân. License do tổ chức quản lý.')}
      </p>
    );
  const items = query.data?.items.filter((p) => admin || packageForActor(actor, p)) ?? [];
  return (
    <>
      <PageHead
        title={admin ? t('Quản lý gói license') : t('Danh mục gói')}
        description={
          admin
            ? t('Tạo và cập nhật cấu hình gói trên máy chủ.')
            : personal
              ? t('Chọn gói Personal và tạo đơn thanh toán qua PayOS.')
              : t('Chọn gói Business và tạo đơn thanh toán qua PayOS.')
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
              {t('Thêm gói')}
            </button>
          )
        }
      />
      {!admin && (
        <p className="notice">
          {actor.role === 'CenterAdmin'
            ? t('Gói Business dành cho tổ chức.')
            : t(
                'Gói Personal dành cho gia đình; tối đa 3 người được chăm sóc theo chính sách hiện hành.',
              )}
        </p>
      )}
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <section className="glass card stack">
        <div className="row">
          {admin && (
            <label className="field">
              {t('Trạng thái gói')}
              <select
                value={active}
                onChange={(e) => {
                  setActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('Tất cả')}</option>
                <option value="true">{t('Đang mở')}</option>
                <option value="false">{t('Ngừng mở')}</option>
              </select>
            </label>
          )}
          <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
            {t('Tải lại danh mục')}
          </button>
        </div>
        <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
          <div className="table-scroll">
            <table className="package-table">
              <caption className="sr-only">{t('Danh sách gói license')}</caption>
              <thead>
                <tr>
                  <th>{t('Gói')}</th>
                  <th>{t('Giá tháng')}</th>
                  <th>{t('Thời hạn')}</th>
                  <th>License</th>
                  {(admin || buyer) && <th>{t('Thao tác')}</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <p className="package-meta">
                        {p.code} · {p.packageType}
                      </p>
                      <p className="package-meta">{p.isActive ? t('Đang mở') : t('Ngừng mở')}</p>
                    </td>
                    <td>
                      <strong className="package-price">
                        {packagePrice(p.priceMonthly, p.currency)}
                      </strong>
                      {p.priceYearly !== null && (
                        <p className="package-meta">
                          {t('Giá năm tham khảo: {p1}', {
                            p1: packagePrice(p.priceYearly, p.currency),
                          })}
                        </p>
                      )}
                    </td>
                    <td>
                      {t('{durationDays} ngày', { durationDays: p.durationDays })}
                      <p className="package-meta">
                        {t('Dùng thử: {trialDays} ngày', { trialDays: p.trialDays })}
                      </p>
                    </td>
                    <td>
                      {p.packageType === 'Personal'
                        ? t('Tối đa 3 VIU theo chính sách B2C')
                        : t('{includedLicenses} license bao gồm', {
                            includedLicenses: p.includedLicenses,
                          })}
                    </td>
                    {buyer && (
                      <td>
                        {canCheckout(p, actor) ? (
                          <button className="btn primary" onClick={() => setCheckout(p)}>
                            {t('Chọn gói {name}', { name: p.name })}
                          </button>
                        ) : (
                          <span>{t('Gói chưa hỗ trợ thanh toán online.')}</span>
                        )}
                      </td>
                    )}
                    {admin && (
                      <td>
                        <button
                          className="btn"
                          onClick={() => {
                            setNotice('');
                            setSelected(p.id);
                          }}
                          aria-label={t('Chi tiết ') + p.name}
                        >
                          {t('Chi tiết / Sửa')}
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
              {t('Chưa có gói phù hợp trên trang này.')}
              {query.data?.hasNextPage ? t(' Hãy xem trang tiếp theo.') : ''}
            </p>
          )}
          {query.data && (
            <footer className="pagination">
              <span>
                {t('Trang {page}/{total}', { page, total: Math.max(1, query.data.totalPages) })} ·{' '}
                {admin
                  ? query.data.totalCount + t(' gói')
                  : t('Phân trang theo danh mục máy chủ; chỉ hiển thị loại gói phù hợp tài khoản.')}
              </span>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('Trang trước')}
              </button>
              <button
                className="btn"
                disabled={query.isFetching || !query.data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('Trang sau')}
              </button>
            </footer>
          )}
        </State>
      </section>
      {checkout && buyer && (
        <PackageCheckout actor={actor} item={checkout} onClose={() => setCheckout(null)} />
      )}
      {selected && admin && (
        <PackageEditor
          key={selected}
          actor={actor}
          id={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            setNotice(t('Đã lưu gói trên máy chủ.'));
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
            label: t('Mã gói'),
            required: true,
            max: 50,
            hint: t('Chữ in hoa, số, dấu gạch dưới. Không thể đổi sau khi tạo.'),
          },
          {
            key: 'packageType',
            label: t('Loại gói'),
            type: 'select' as const,
            required: true,
            options: [
              { value: 'Personal', label: 'Personal' },
              { value: 'Business', label: 'Business' },
            ],
          },
        ]),
    ...editorFields,
    ...(!creating ? [{ key: 'isActive', label: t('Đang mở bán'), type: 'checkbox' as const }] : []),
  ];
  return (
    <Dialog
      title={creating ? t('Thêm gói license') : t('Chi tiết / Sửa gói')}
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
                {t('Mã: {code} · Loại: {packageType} · không thể thay đổi', {
                  code: current.code,
                  packageType: current.packageType,
                })}
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
              submit={creating ? t('Tạo gói') : t('Lưu gói')}
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

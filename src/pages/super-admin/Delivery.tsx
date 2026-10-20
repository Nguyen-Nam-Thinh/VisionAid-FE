import { t } from '../../i18n';
import { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { PageHead, State, DataTable, Badge, Dialog } from '../../components/UI';
import { formatTime } from '../../constants/labels';
export function Delivery() {
  const { query, db } = useWorkspace();
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [selected, setSelected] = useState('');
  const delivery = db?.deliveries.find((d) => d.id === selected);
  const labels = {
    SENT: t('Đã gửi · mô phỏng'),
    FAILED: t('Thất bại · mô phỏng'),
    PENDING: t('Đang chờ · mô phỏng'),
  };
  return (
    <>
      <PageHead
        title={t('Theo dõi thông báo')}
        description={t(
          'Giám sát trạng thái delivery theo kênh. Toàn bộ bản ghi dưới đây là dữ liệu minh họa, không phải xác nhận gửi thật.',
        )}
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <DataTable
          title={t('Nhật ký delivery')}
          rows={
            db?.deliveries.filter(
              (d) =>
                (status === 'all' || d.status === status) &&
                (channel === 'all' || d.channel === channel),
            ) ?? []
          }
          searchText={(d) => d.id + ' ' + d.event}
          filter={
            <>
              <label className="field">
                <span className="sr-only">{t('Trạng thái delivery')}</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">{t('Mọi trạng thái')}</option>
                  {Object.entries(labels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="sr-only">{t('Kênh delivery')}</span>
                <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="all">{t('Mọi kênh')}</option>
                  <option value="PUSH">Push</option>
                  <option value="EMAIL">Email</option>
                </select>
              </label>
            </>
          }
          columns={[
            { label: t('Sự kiện'), render: (d) => d.event },
            { label: t('Kênh'), render: (d) => d.channel },
            {
              label: t('Phạm vi'),
              render: (d) =>
                db?.entities.organizations.find((o) => o.id === d.orgId)?.name ?? t('Cá nhân'),
            },
            {
              label: t('Trạng thái'),
              render: (d) => (
                <Badge
                  tone={d.status === 'FAILED' ? 'red' : d.status === 'SENT' ? 'green' : 'amber'}
                >
                  {labels[d.status]}
                </Badge>
              ),
            },
            { label: t('Thời gian'), render: (d) => formatTime(d.at) },
            {
              label: t('Thao tác'),
              render: (d) => (
                <button className="btn small" onClick={() => setSelected(d.id)}>
                  {t('Chi tiết')}
                </button>
              ),
            },
          ]}
        />
      </State>
      {delivery && (
        <Dialog title={t('Chi tiết delivery mô phỏng')} onClose={() => setSelected('')}>
          <div className="stack">
            <p className="mono">{delivery.id}</p>
            <Badge>{labels[delivery.status]}</Badge>
            <p>
              {delivery.status === 'FAILED'
                ? t(
                    'Kịch bản demo: nhà cung cấp tạm thời không khả dụng. Chưa có API retry được xác nhận.',
                  )
                : t('Bản ghi trạng thái minh họa từ dịch vụ mock.')}
            </p>
            <small>{formatTime(delivery.at)} · UTC+7</small>
          </div>
        </Dialog>
      )}
    </>
  );
}

import { t } from '../../i18n';
import { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { PageHead, State, DataTable, Badge } from '../../components/UI';
import { formatTime, statuses } from '../../constants/labels';
export function Reports() {
  const { query, db } = useWorkspace();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('all');
  const alerts =
    db?.alerts.filter(
      (a) =>
        (type === 'all' || a.type === type) &&
        (!from || new Date(a.at) >= new Date(from + 'T00:00:00+07:00')) &&
        (!to || new Date(a.at) <= new Date(to + 'T23:59:59+07:00')),
    ) ?? [];
  const responses = alerts
    .map((a) => {
      const ack = a.history.find((h) => h.to === 'ACKNOWLEDGED');
      return ack ? (new Date(ack.at).getTime() - new Date(a.at).getTime()) / 60000 : null;
    })
    .filter((x): x is number => x !== null);
  return (
    <>
      <PageHead
        title={t('Báo cáo hoạt động')}
        description={t(
          'Cảnh báo và thời gian phản hồi của nhân viên trong trung tâm. Không bao gồm audit toàn hệ thống.',
        )}
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="stack">
          <div className="glass card row">
            <label className="field">
              {t('Từ ngày')}
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="field">
              {t('Đến ngày')}
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </label>
            <label className="field">
              {t('Loại sự kiện')}
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">{t('Tất cả')}</option>
                <option value="SOS">SOS</option>
                <option value="FALL">{t('Té ngã')}</option>
                <option value="GEOFENCE">{t('Vùng an toàn')}</option>
              </select>
            </label>
          </div>
          <div className="grid">
            {[
              [t('Số sự kiện'), alerts.length],
              [t('Đã giải quyết'), alerts.filter((a) => a.status === 'RESOLVED').length],
              [
                t('Phản hồi trung bình'),
                responses.length
                  ? (responses.reduce((a, b) => a + b, 0) / responses.length).toFixed(1) +
                    t(' phút')
                  : t('Chưa có dữ liệu'),
              ],
            ].map(([label, value]) => (
              <section className="glass card" key={label}>
                <p className="muted">{label}</p>
                <strong className="stat">{value}</strong>
              </section>
            ))}
          </div>
          <DataTable
            title={t('Nhật ký hỗ trợ của trung tâm')}
            rows={alerts}
            searchText={(a) => db?.people.find((p) => p.id === a.viuId)?.name ?? ''}
            columns={[
              {
                label: t('Người dùng'),
                render: (a) => db?.people.find((p) => p.id === a.viuId)?.name,
              },
              { label: t('Sự kiện'), render: (a) => a.type },
              { label: t('Thời gian · UTC+7'), render: (a) => formatTime(a.at) },
              { label: t('Trạng thái'), render: (a) => <Badge>{statuses[a.status]}</Badge> },
              {
                label: t('Nhân viên / phản hồi'),
                render: (a) => {
                  const ack = a.history.find((h) => h.to === 'ACKNOWLEDGED');
                  return ack ? (
                    <>
                      {db?.people.find((p) => p.id === ack.actor)?.name ?? t('Nhân viên')}
                      <p>
                        <small>
                          {t('{p0} phút', {
                            p0: (
                              (new Date(ack.at).getTime() - new Date(a.at).getTime()) /
                              60000
                            ).toFixed(1),
                          })}
                        </small>
                      </p>
                    </>
                  ) : (
                    t('Chưa phản hồi')
                  );
                },
              },
            ]}
          />
        </div>
      </State>
    </>
  );
}

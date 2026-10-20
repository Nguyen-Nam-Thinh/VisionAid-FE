import { t } from '../i18n';
import { useNow } from '../hooks/useNow';
import { useState } from 'react';
import { Wifi, WifiOff, MapPin } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useCommand } from '../hooks/useService';
import { useRealtime } from '../hooks/useRealtime';
import { isStale } from '../services/maps/adapter';
import { PageHead, State, Badge, DataTable } from './UI';
import { MapPanel } from './MapPanel';
import { formatTime } from '../constants/labels';
export function TrackingMap({ fleet = false }: { fleet?: boolean }) {
  const { query, db, setSelected, selected } = useWorkspace();
  const now = useNow();
  const rt = useRealtime();
  const cmd = useCommand();
  const [filter, setFilter] = useState('all');
  const points =
    db?.locations.filter(
      (l) =>
        filter === 'all' ||
        (filter === 'alerts'
          ? !!db?.alerts.some(
              (a) =>
                a.viuId === l.viuId && ['SENT', 'ACKNOWLEDGED', 'ESCALATED'].includes(a.status),
            )
          : filter === 'stale'
            ? isStale(l, now)
            : !isStale(l, now)),
    ) ?? [];
  const current = points.find((l) => l.viuId === selected?.id);
  return (
    <>
      <PageHead
        title={fleet ? t('Bản đồ toàn trung tâm') : t('Bản đồ theo dõi')}
        description={t('Vị trí gần nhất và tình trạng kết nối của người được chăm sóc.')}
        actions={
          <Badge tone={rt.state === 'connected' ? 'green' : 'amber'}>
            {rt.state === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {
              {
                connected: t('Realtime mô phỏng'),
                disconnected: t('Đã ngắt kết nối'),
                reconnecting: t('Đang kết nối lại…'),
                unconfigured: t('Chưa cấu hình SignalR'),
              }[rt.state]
            }
          </Badge>
        }
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="stack">
          <div className="row between">
            <label className="field">
              {t('Trạng thái vị trí')}
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">{t('Tất cả')}</option>
                <option value="live">{t('Cập nhật gần đây')}</option>
                <option value="stale">{t('Dữ liệu cũ')}</option>
                <option value="alerts">{t('Có cảnh báo đang mở')}</option>
              </select>
            </label>
            <div className="row">
              <button className="btn" onClick={rt.disconnect}>
                {t('Mô phỏng ngắt kết nối')}
              </button>
              <button className="btn" onClick={rt.reconnect} disabled={rt.state === 'reconnecting'}>
                {t('Kết nối lại')}
              </button>
              <button
                className="btn"
                disabled={cmd.isPending}
                onClick={() => {
                  rt.disconnect();
                  cmd.mutate({ type: 'simulate', event: 'stale' });
                }}
              >
                {t('Mô phỏng vị trí cũ')}
              </button>
            </div>
          </div>
          {cmd.error && <p className="notice error">{cmd.error.message}</p>}
          <section className="glass card">
            <MapPanel locations={points} people={db?.people ?? []} onSelect={setSelected} />
          </section>
          {current && (
            <section className="glass card row between">
              <div className="row">
                <span className="icon-tile">
                  <MapPin size={22} />
                </span>
                <div>
                  <h2>{selected?.name}</h2>
                  <p className="muted">
                    {t('Lần ghi nhận: {p1} · UTC+7', { p1: formatTime(current.at) })}
                  </p>
                </div>
              </div>
              <Badge tone={isStale(current, now) ? 'amber' : 'green'}>
                {isStale(current, now)
                  ? t('Vị trí cũ — không phải trực tiếp')
                  : t('Cập nhật gần đây · dữ liệu mô phỏng')}
              </Badge>
            </section>
          )}
          <DataTable
            title={t('Danh sách vị trí')}
            rows={points.map((l) => ({ ...l, id: l.viuId }))}
            searchText={(l) => db?.people.find((p) => p.id === l.viuId)?.name ?? ''}
            columns={[
              {
                label: t('Người dùng'),
                render: (l) => (
                  <button className="btn small" onClick={() => setSelected(l.viuId)}>
                    {db?.people.find((p) => p.id === l.viuId)?.name}
                  </button>
                ),
              },
              {
                label: t('Tọa độ (vĩ độ, kinh độ)'),
                render: (l) => (
                  <span className="mono">
                    {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
                  </span>
                ),
              },
              {
                label: t('Pin / mạng'),
                render: (l) =>
                  `${l.battery === null ? '—' : l.battery + '%'} · ${l.network ?? '—'}`,
              },
              {
                label: t('Độ chính xác'),
                render: (l) => (l.accuracy === null ? '—' : `±${l.accuracy} m`),
              },
              {
                label: t('Ghi nhận'),
                render: (l) => (
                  <>
                    <small>{formatTime(l.at)}</small>
                    <br />
                    <Badge tone={isStale(l, now) ? 'amber' : 'green'}>
                      {isStale(l, now) ? t('Dữ liệu cũ') : t('Gần đây')}
                    </Badge>
                  </>
                ),
              },
            ]}
          />
        </div>
      </State>
    </>
  );
}

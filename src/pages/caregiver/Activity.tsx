import { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { PageHead, State, DataTable, Badge } from '../../components/UI';
import { ViuSelect } from '../../components/ViuSelect';
import { activityLabels, formatTime, statuses } from '../../constants/labels';
export function Activity() {
  const { query, db, selected } = useWorkspace();
  const [type, setType] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const entries = [
    ...(db?.activities ?? []).map((a) => ({ ...a, label: activityLabels[a.type] })),
    ...(db?.alerts ?? []).map((a) => ({
      id: a.id,
      viuId: a.viuId,
      type: 'EMERGENCY',
      label: 'Khẩn cấp',
      at: a.at,
      text: `${a.type} · ${statuses[a.status]}`,
      online: true,
      lat: a.lat,
      lng: a.lng,
    })),
  ]
    .filter(
      (a) =>
        a.viuId === selected?.id &&
        (type === 'all' || a.type === type) &&
        (!from || new Date(a.at) >= new Date(from + 'T00:00:00+07:00')) &&
        (!to || new Date(a.at) <= new Date(to + 'T23:59:59+07:00')),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  const movement = entries.filter(
    (a) => a.type === 'MOVEMENT' && a.lat !== undefined && a.lng !== undefined,
  );
  const minLat = Math.min(...movement.map((a) => a.lat!)),
    maxLat = Math.max(...movement.map((a) => a.lat!));
  const minLng = Math.min(...movement.map((a) => a.lng!)),
    maxLng = Math.max(...movement.map((a) => a.lng!));
  const points = movement
    .map(
      (a) =>
        `${30 + ((a.lng! - minLng) / (maxLng - minLng || 1)) * 540},${170 - ((a.lat! - minLat) / (maxLat - minLat || 1)) * 140}`,
    )
    .join(' ');
  return (
    <>
      <PageHead
        title="Nhật ký hoạt động"
        description="Lịch sử di chuyển, đọc văn bản, QR, nhận diện, lệnh thoại và khẩn cấp. Thời gian UTC+7."
        actions={<ViuSelect />}
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="stack">
          <div className="glass card row">
            <label className="field">
              Loại hoạt động
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">Tất cả</option>
                {Object.entries({ ...activityLabels, EMERGENCY: 'Khẩn cấp' }).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Từ ngày
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="field">
              Đến ngày
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          {movement.length > 1 && (
            <section className="glass card">
              <h2>Tuyến di chuyển đã ghi nhận</h2>
              <svg
                role="img"
                aria-label="Đường nối các vị trí lịch sử, sơ đồ mô phỏng không phải bản đồ đường đi"
                viewBox="0 0 600 210"
                style={{ width: '100%', maxHeight: 240, background: '#edf3f9', borderRadius: 14 }}
              >
                <polyline
                  points={points}
                  fill="none"
                  stroke="#1856ff"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                {movement.map((a, i) => {
                  const [cx, cy] = points.split(' ')[i].split(',');
                  return <circle key={a.id} cx={cx} cy={cy} r="5" fill="#fff" stroke="#1856ff" />;
                })}
              </svg>
              <small>Sơ đồ lịch sử demo; xem tọa độ và giờ ghi nhận trong bảng bên dưới.</small>
            </section>
          )}
          <DataTable
            title="Hoạt động đã ghi nhận"
            rows={entries}
            searchText={(a) => a.text + ' ' + a.label}
            columns={[
              { label: 'Thời gian', render: (a) => formatTime(a.at) },
              { label: 'Hoạt động', render: (a) => <Badge>{a.label}</Badge> },
              {
                label: 'Nội dung',
                render: (a) => (
                  <>
                    {a.text}
                    {a.lat !== undefined && (
                      <p className="mono">
                        {a.lat.toFixed(5)}, {a.lng?.toFixed(5)}
                      </p>
                    )}
                  </>
                ),
              },
              {
                label: 'Kết nối',
                render: (a) => (
                  <Badge tone={a.online ? 'green' : 'amber'}>
                    {a.online ? 'Online' : 'Offline'}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      </State>
    </>
  );
}

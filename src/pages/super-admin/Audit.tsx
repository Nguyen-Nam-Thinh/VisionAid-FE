import { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { PageHead, State, DataTable, Dialog } from '../../components/UI';
import { formatTime } from '../../constants/labels';
export function Audit() {
  const { query, db } = useWorkspace();
  const [actor, setActor] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState('');
  const entry = db?.audit.find((a) => a.id === selected);
  const rows =
    db?.audit.filter(
      (a) =>
        (actor === 'all' || a.actor === actor) &&
        (!from || new Date(a.at) >= new Date(from + 'T00:00:00+07:00')) &&
        (!to || new Date(a.at) <= new Date(to + 'T23:59:59+07:00')),
    ) ?? [];
  return (
    <>
      <PageHead
        title="Nhật ký kiểm toán"
        description="Theo dõi thao tác quản trị. Chỉ đọc; không xóa hoặc sửa bản ghi audit trên giao diện."
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="stack">
          <div className="glass card row">
            <label className="field">
              Người thực hiện
              <select value={actor} onChange={(e) => setActor(e.target.value)}>
                <option value="all">Tất cả</option>
                {db?.people
                  .filter((p) => db.audit.some((a) => a.actor === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
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
          <DataTable
            title="Lịch sử hệ thống"
            rows={rows}
            searchText={(a) => a.action + ' ' + a.target}
            columns={[
              { label: 'Thời gian · UTC+7', render: (a) => formatTime(a.at) },
              {
                label: 'Người thực hiện',
                render: (a) => db?.people.find((p) => p.id === a.actor)?.name ?? 'Hệ thống',
              },
              { label: 'Hành động', render: (a) => a.action },
              { label: 'Đối tượng', render: (a) => a.target },
              {
                label: 'Thao tác',
                render: (a) => (
                  <button className="btn small" onClick={() => setSelected(a.id)}>
                    Chi tiết
                  </button>
                ),
              },
            ]}
          />
        </div>
      </State>
      {entry && (
        <Dialog title="Chi tiết bản ghi audit" onClose={() => setSelected('')}>
          <dl>
            <dt>Mã bản ghi</dt>
            <dd className="mono">{entry.id}</dd>
            <dt>Hành động</dt>
            <dd>{entry.action}</dd>
            <dt>Đối tượng</dt>
            <dd>{entry.target}</dd>
            <dt>Thời gian</dt>
            <dd>{formatTime(entry.at)} · UTC+7</dd>
            <dt>Phạm vi</dt>
            <dd>
              {db?.entities.organizations.find((o) => o.id === entry.orgId)?.name ??
                'Nền tảng / cá nhân'}
            </dd>
          </dl>
        </Dialog>
      )}
    </>
  );
}

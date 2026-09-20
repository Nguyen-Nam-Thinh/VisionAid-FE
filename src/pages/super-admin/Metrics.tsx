import { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { PageHead, State, DataTable } from '../../components/UI';
export function Metrics() {
  const { query, db } = useWorkspace();
  const [model, setModel] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rows =
    db?.metrics.filter(
      (m) =>
        (model === 'all' || m.model === model) && (!from || m.day >= from) && (!to || m.day <= to),
    ) ?? [];
  const count = rows.reduce((a, m) => a + m.total, 0);
  const successes = rows.reduce((a, m) => a + m.successes, 0);
  const latency = count ? rows.reduce((a, m) => a + m.latency * m.total, 0) / count : 0;
  const confidence = count ? rows.reduce((a, m) => a + m.confidence * m.total, 0) / count : 0;
  return (
    <>
      <PageHead
        title="Hiệu năng AI"
        description="Số liệu tổng hợp mô phỏng theo model và ngày. Confidence và tỷ lệ xử lý thành công không phải độ chính xác có ground truth."
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="stack">
          <div className="glass card row">
            <label className="field">
              Mô hình
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="all">Tất cả mô hình</option>
                {['YOLOv8n', 'VietOCR', 'FaceNet'].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Từ ngày
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="field">
              Đến ngày
              <input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          <div className="grid">
            {[
              ['Lượt xử lý', count],
              ['Latency trung bình', count ? latency.toFixed(0) + ' ms' : '—'],
              ['Xử lý thành công', count ? ((successes / count) * 100).toFixed(1) + '%' : '—'],
              ['Confidence trung bình', count ? (confidence * 100).toFixed(1) + '%' : '—'],
            ].map(([label, value]) => (
              <section className="glass card" key={label}>
                <p className="muted">{label}</p>
                <strong className="stat">{value}</strong>
              </section>
            ))}
          </div>
          <section className="glass card stack">
            <h2>Latency theo mô hình</h2>
            <div className="bars">
              {['YOLOv8n', 'VietOCR', 'FaceNet'].map((m) => {
                const group = rows.filter((r) => r.model === m);
                const avg = group.length
                  ? group.reduce((a, b) => a + b.latency, 0) / group.length
                  : 0;
                return (
                  <div key={m}>
                    <div className="row between">
                      <span>{m}</span>
                      <strong>{group.length ? avg.toFixed(0) + ' ms' : 'Chưa có dữ liệu'}</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: Math.min(100, avg / 10) + '%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <small>Thang hiển thị 0–1.000 ms · dữ liệu demo</small>
          </section>
          <DataTable
            title="Chi tiết theo ngày"
            rows={rows.map((m) => ({ ...m, id: m.day + m.model }))}
            searchText={(m) => m.model + ' ' + m.day}
            columns={[
              { label: 'Ngày', render: (m) => m.day },
              { label: 'Mô hình', render: (m) => m.model },
              { label: 'Latency', render: (m) => m.latency + ' ms' },
              { label: 'Thành công / tổng', render: (m) => `${m.successes} / ${m.total}` },
              { label: 'Confidence', render: (m) => (m.confidence * 100).toFixed(1) + '%' },
            ]}
          />
        </div>
      </State>
    </>
  );
}

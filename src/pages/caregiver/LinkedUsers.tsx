import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, Users } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useCommand, useLinkActions } from '../../hooks/useService';
import { PageHead, DataTable, State, Dialog, Badge } from '../../components/UI';
import { Form } from '../../components/Form';
export function LinkedUsers() {
  const { query, db, user, setSelected } = useWorkspace();
  const cmd = useCommand();
  const links = useLinkActions();
  const [modal, setModal] = useState<'new' | 'accept' | null>(null);
  const [code, setCode] = useState('');
  const [scanned, setScanned] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <PageHead
        title="Người được chăm sóc"
        description="Mỗi kết nối là một sự an tâm. Quản lý tối đa 3 liên kết đang hoạt động."
        actions={
          !user.orgId && (
            <>
              <button className="btn" onClick={() => setModal('accept')}>
                Nhập mã liên kết
              </button>
              <button className="btn primary" onClick={() => setModal('new')}>
                <Plus size={16} />
                Thêm người thân
              </button>
            </>
          )
        }
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="grid" style={{ marginBottom: 24 }}>
          {db?.people
            .filter((p) => p.role === 'VisuallyImpaired')
            .map((p) => (
              <section className="glass card stack" key={p.id}>
                <div className="row between">
                  <span className="icon-tile">
                    <Users size={22} />
                  </span>
                  <Badge tone={p.active ? 'green' : 'amber'}>
                    {p.active ? 'Đang liên kết' : 'Đã ngừng hoạt động'}
                  </Badge>
                </div>
                <h2>{p.name}</h2>
                <p className="muted">{p.phone || 'Chưa có số điện thoại'}</p>
                <div className="row">
                  <Link className="btn" to="/caregiver/map" onClick={() => setSelected(p.id)}>
                    Theo dõi <ArrowUpRight size={16} />
                  </Link>
                  {!user.orgId &&
                    db.links.some(
                      (l) => l.viuId === p.id && l.caregiverId === user.id && l.primary,
                    ) && (
                      <button
                        className="btn"
                        onClick={async () => {
                          try {
                            setCode(await links.generate(p.id));
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        Tạo mã QR demo
                      </button>
                    )}
                </div>
              </section>
            ))}
        </div>
        <DataTable
          title="Danh sách liên kết"
          rows={db?.people.filter((p) => p.role === 'VisuallyImpaired') ?? []}
          searchText={(p) => p.name + ' ' + p.email}
          columns={[
            { label: 'Họ và tên', render: (p) => p.name },
            { label: 'Email', render: (p) => p.email },
            { label: 'Phạm vi', render: (p) => (p.orgId ? 'Trung tâm' : 'Gia đình') },
            {
              label: 'Vai trò của bạn',
              render: (p) =>
                db?.links.find((l) => l.caregiverId === user.id && l.viuId === p.id)?.primary
                  ? 'Chăm sóc chính'
                  : 'Chăm sóc phụ',
            },
          ]}
        />
      </State>
      {modal && (
        <Dialog
          title={modal === 'new' ? 'Thêm người thân' : 'Nhập mã liên kết demo'}
          onClose={() => setModal(null)}
        >
          {modal === 'new' ? (
            <Form
              fields={[
                { key: 'name', label: 'Họ và tên', required: true, max: 200 },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'phone', label: 'Số điện thoại' },
              ]}
              onSubmit={async (v) => {
                await cmd.mutateAsync({
                  type: 'person',
                  person: {
                    id: crypto.randomUUID(),
                    name: String(v.name),
                    email: String(v.email),
                    phone: String(v.phone),
                    role: 'VisuallyImpaired',
                    orgId: '',
                    active: true,
                  },
                });
                setModal(null);
              }}
            />
          ) : (
            <div className="stack">
              <label className="field">
                Đọc mã từ ảnh QR (JPG/PNG dưới 5 MB)
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={scanning}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setScanning(true);
                    setScanError('');
                    try {
                      setScanned(await links.scan(file));
                    } catch (error) {
                      setScanError((error as Error).message);
                    } finally {
                      setScanning(false);
                    }
                  }}
                />
              </label>
              {scanning && <p role="status">Đang đọc mã…</p>}
              {scanError && (
                <p className="notice error" role="alert">
                  {scanError}
                </p>
              )}
              <Form
                key={scanned}
                initial={{ code: scanned }}
                fields={[
                  { key: 'code', label: 'Mã VA-DEMO từ người chăm sóc chính', required: true },
                ]}
                onSubmit={async (v) => {
                  await links.accept(String(v.code));
                  setModal(null);
                }}
              />
            </div>
          )}
        </Dialog>
      )}
      {code && (
        <Dialog title="Mời người chăm sóc phụ" onClose={() => setCode('')}>
          <div className="stack">
            <QRCodeSVG value={code} size={190} title="Mã liên kết demo" />
            <strong className="mono">{code}</strong>
            <p>
              Mã dùng một lần, hết hạn sau 10 phút. Đăng nhập tài khoản Caregiver khác trên trình
              duyệt này rồi nhập mã. Đây là luồng demo, không phải QR production.
            </p>
          </div>
        </Dialog>
      )}
    </>
  );
}

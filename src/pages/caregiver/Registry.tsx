import { useState } from 'react';
import { ResourcePage } from '../../components/ResourcePage';
import { Dialog, Confirm, Badge } from '../../components/UI';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useCommand } from '../../hooks/useService';
import type { Photo } from '../../models/domain';
export function Registry() {
  const { db, canWrite } = useWorkspace();
  const cmd = useCommand();
  const [faceId, setFaceId] = useState('');
  const [remove, setRemove] = useState<Photo | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const face = db?.entities.faces.find((f) => f.id === faceId);
  const photos = db?.photos.filter((p) => p.faceId === faceId) ?? [];
  return (
    <>
      <ResourcePage
        kind="faces"
        title="Gương mặt thân quen"
        description="Danh bạ nhận diện người thân. Cần ít nhất 3 ảnh để kích hoạt mỗi người."
        fields={[{ key: 'relationship', label: 'Mối quan hệ', required: true }]}
        details={(e) => (
          <>
            {String(e.fields.relationship)} ·{' '}
            {db?.photos.filter((p) => p.faceId === e.id).length ?? 0} ảnh
          </>
        )}
        extraAction={(e) => (
          <button className="btn small" onClick={() => setFaceId(e.id)}>
            Quản lý ảnh
          </button>
        )}
      />
      {face && (
        <Dialog
          title={'Ảnh của ' + face.name}
          onClose={() => {
            if (!uploading) setFaceId('');
          }}
        >
          <div className="stack">
            <Badge tone={face.active ? 'green' : 'amber'}>
              {face.active ? 'Đủ ảnh để nhận diện' : 'Cần ít nhất 3 ảnh'}
            </Badge>
            <p className="notice">
              Chỉ dùng ảnh thử nghiệm. Demo lưu ảnh cục bộ; mã hóa AES-256 và xóa MinIO thuộc
              backend, chưa được thực hiện ở đây. Giới hạn demo 2 MB/ảnh.
            </p>
            {canWrite('faces', face) && (
              <label className="field">
                Thêm nhiều ảnh JPG/PNG
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  disabled={uploading || cmd.isPending}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    setError('');
                    setUploading(true);
                    try {
                      for (const file of files) {
                        if (
                          !['image/jpeg', 'image/png'].includes(file.type) ||
                          file.size > 2 * 1024 * 1024
                        )
                          throw Error('Chỉ nhận JPG/PNG dưới 2 MB.');
                        const url = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(String(reader.result));
                          reader.onerror = () => reject(Error('Không đọc được ảnh.'));
                          reader.readAsDataURL(file);
                        });
                        await cmd.mutateAsync({
                          type: 'photo',
                          faceId: face.id,
                          photo: { id: crypto.randomUUID(), faceId: face.id, url, primary: false },
                        });
                      }
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            )}
            {uploading && <p role="status">Đang lưu ảnh…</p>}
            {(error || cmd.error) && (
              <p role="alert" className="notice error">
                {error || cmd.error?.message}
              </p>
            )}
            <div className="photo-grid">
              {photos.map((p) => (
                <div key={p.id} className="stack">
                  <img src={p.url} alt={'Ảnh đã đăng ký của ' + face.name} />
                  <Badge>{p.primary ? 'Ảnh chính' : 'Ảnh bổ sung'}</Badge>
                  {canWrite('faces', face) && (
                    <>
                      <button
                        className="btn small"
                        disabled={p.primary || cmd.isPending}
                        onClick={() =>
                          cmd.mutate({
                            type: 'photo',
                            faceId: face.id,
                            photo: { ...p, primary: true },
                          })
                        }
                      >
                        Đặt ảnh chính
                      </button>
                      <button className="btn small danger" onClick={() => setRemove(p)}>
                        Xóa ảnh
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            {!photos.length && (
              <p className="empty">Chưa có ảnh. Thêm ảnh từ thiết bị để thử luồng đăng ký.</p>
            )}
          </div>
        </Dialog>
      )}
      {remove && (
        <Confirm
          title="Xóa ảnh đã chọn?"
          description="Xóa ảnh có thể khiến người này không còn đủ 3 ảnh để nhận diện."
          onClose={() => setRemove(null)}
          onConfirm={() =>
            cmd.mutateAsync({ type: 'photo', faceId: remove.faceId, photo: remove, remove: true })
          }
        />
      )}
    </>
  );
}

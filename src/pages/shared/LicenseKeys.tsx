import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Confirm, Dialog } from '../../components/UI';
import { Form } from '../../components/Form';
import {
  licenseKeysApi,
  keyOutcomeUnknown,
  type DistributedKey,
} from '../../services/api/licenseKeys';
import { isOrganizationBuyer, isPersonalCaregiver } from '../../services/api/licenses';
import type { Person } from '../../models/domain';

export function LicenseKeys({ actor, mode }: { actor: Person; mode: 'distribute' | 'activate' }) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<DistributedKey | null>(null);
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [copied, setCopied] = useState('');
  const [another, setAnother] = useState(false);
  const distributing = mode === 'distribute';
  if (distributing ? !isOrganizationBuyer(actor) : !isPersonalCaregiver(actor)) return null;
  const refresh = () =>
    cache.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'session' ||
        ([
          'license-pool',
          'license-subscription',
          'api-users',
          'api-accounts',
          'api-account',
        ].includes(String(q.queryKey[0])) &&
          q.queryKey[1] === actor.id),
    });
  return (
    <section
      className="glass card stack license-card"
      aria-label={distributing ? 'Phân phối key' : 'Kích hoạt key'}
    >
      <h2>{distributing ? 'Key cho gia đình' : 'Kích hoạt bằng key'}</h2>
      <p>
        {distributing
          ? 'Mỗi key sử dụng một suất ngay khi tạo, hết hạn theo kho của trung tâm. Bạn tự chuyển key cho gia đình.'
          : 'Nhập key do trung tâm cấp. Thời hạn theo key, không tự cộng thêm thời gian trial hoặc gói đang có. Kích hoạt không thay đổi tổ chức hay liên kết chăm sóc.'}
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {uncertain && (
        <p className="notice error" role="alert">
          Kết quả chưa rõ. Không gửi lại thao tác; hãy tải lại thông tin license và nhờ quản trị
          viên kiểm tra.
        </p>
      )}
      <button className="btn primary" disabled={uncertain} onClick={() => setOpen(true)}>
        {result ? 'Xem key vừa tạo' : distributing ? 'Tạo key cho gia đình' : 'Nhập key kích hoạt'}
      </button>
      {result && (
        <button className="btn" onClick={() => setAnother(true)}>
          Tạo key khác
        </button>
      )}
      {another && (
        <Confirm
          title="Bắt đầu key mới"
          description="Hãy bảo đảm đã lưu key vừa tạo. Tiếp tục sẽ xóa key khỏi màn hình, không thu hồi key và không hoàn lại suất đã sử dụng."
          onClose={() => setAnother(false)}
          onConfirm={async () => {
            setResult(null);
            setVisible(false);
            setCopied('');
            setOpen(true);
          }}
        />
      )}
      {distributing && (
        <p>
          Chưa có API xem lại hoặc thu hồi key đã phát. Key chỉ giữ trong màn hình này; sao chép và
          lưu ở nơi an toàn trước khi rời trang.
        </p>
      )}
      {open && (
        <Dialog
          title={distributing ? 'Tạo key cho gia đình' : 'Kích hoạt license'}
          onClose={() => {
            setOpen(false);
            setVisible(false);
            setCopied('');
          }}
        >
          {result ? (
            <div className="stack">
              <p role="status">Đã tạo key và sử dụng một suất license.</p>
              <label className="field">
                Key vừa tạo
                <input
                  readOnly
                  value={visible ? result.licenseKey : '••••-••••-••••-••••'}
                  autoComplete="off"
                />
              </label>
              <p>
                Hạn dùng:{' '}
                {result.expiresAt
                  ? new Date(result.expiresAt).toLocaleString('vi-VN')
                  : 'Máy chủ không cung cấp thời hạn'}
              </p>
              <div className="row">
                <button className="btn" onClick={() => setVisible(!visible)}>
                  {visible ? 'Ẩn key' : 'Hiện key'}
                </button>
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result.licenseKey);
                      setCopied('Đã sao chép key.');
                    } catch {
                      setCopied('Không sao chép được. Nhấn Hiện key để sao chép thủ công.');
                    }
                  }}
                >
                  Sao chép key
                </button>
              </div>
              {copied && <p role="status">{copied}</p>}
              <p>
                Chỉ đóng popup vẫn có thể xem lại key tại màn hình này. Rời trang hoặc tải lại sẽ
                mất key đang hiển thị.
              </p>
            </div>
          ) : (
            <>
              <p>
                {distributing
                  ? 'Xác nhận tạo một key và sử dụng một suất trong kho. Ghi chú không phải địa chỉ gửi thư.'
                  : 'Xác nhận sử dụng key một lần cho tài khoản của bạn. Hãy kiểm tra thời hạn với trung tâm trước khi kích hoạt.'}
              </p>
              <Form
                fields={
                  distributing
                    ? [{ key: 'note', label: 'Ghi chú', type: 'textarea', max: 500 }]
                    : [{ key: 'licenseKey', label: 'Key license', required: true, max: 100 }]
                }
                submit={distributing ? 'Xác nhận tạo key' : 'Xác nhận kích hoạt'}
                onSubmit={async (values) => {
                  try {
                    if (distributing)
                      setResult(await licenseKeysApi.distribute(actor, String(values.note || '')));
                    else {
                      await licenseKeysApi.activate(actor, String(values.licenseKey));
                      setNotice(
                        'Máy chủ đã xác nhận kích hoạt. Kiểm tra trạng thái và thời hạn vừa tải lại ở trên.',
                      );
                      setOpen(false);
                    }
                  } catch (error) {
                    if (keyOutcomeUnknown(error)) {
                      setUncertain(true);
                      setOpen(false);
                    } else throw error;
                  } finally {
                    await refresh();
                  }
                }}
              />
            </>
          )}
        </Dialog>
      )}
    </section>
  );
}

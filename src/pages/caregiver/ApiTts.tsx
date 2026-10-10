import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi } from '../../services/api/caregiving';
import { ttsApi, ttsDefaults } from '../../services/api/tts';
import { PageHead, State, Dialog } from '../../components/UI';
import { Form, type FieldSpec } from '../../components/Form';
import type { Person, Fields } from '../../models/domain';

const fields: FieldSpec[] = [
  {
    key: 'voiceGender',
    label: 'Giọng đọc',
    type: 'select',
    required: true,
    options: [
      { value: 'Female', label: 'Nữ' },
      { value: 'Male', label: 'Nam' },
    ],
  },
  {
    key: 'speedRate',
    label: 'Tốc độ đọc',
    type: 'number',
    required: true,
    min: 0.5,
    max: 2,
    step: 0.1,
    hint: 'Từ 0,5 đến 2 lần.',
  },
  {
    key: 'volumePercent',
    label: 'Âm lượng',
    type: 'number',
    required: true,
    min: 0,
    max: 100,
    step: 1,
    hint: 'Từ 0 đến 100%. Mức 0 sẽ tắt âm thanh giọng đọc.',
  },
  {
    key: 'detectionMode',
    label: 'Chế độ phát hiện',
    type: 'select',
    required: true,
    options: [
      { value: 'Minimal', label: 'Tối giản' },
      { value: 'Full', label: 'Đầy đủ' },
    ],
  },
  {
    key: 'primaryLanguage',
    label: 'Ngôn ngữ chính',
    required: true,
    max: 10,
    hint: 'Mã ngôn ngữ, ví dụ vi-VN hoặc en-US. Giọng đọc khả dụng phụ thuộc thiết bị.',
  },
  {
    key: 'secondaryLanguage',
    label: 'Ngôn ngữ phụ',
    max: 10,
    hint: 'Để trống nếu không dùng ngôn ngữ phụ.',
  },
];

function TtsSettings({ actor, viuId, name }: { actor: Person; viuId: string; name: string }) {
  const cache = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const key = ['api-tts', actor.id, actor.orgId, viuId];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => ttsApi.read(actor, viuId, signal),
    retry: false,
    gcTime: 0,
    refetchInterval: editing ? false : 30000,
  });
  const data = query.data;
  const initial: Fields = data
    ? {
        voiceGender: data.voiceGender,
        speedRate: data.speedRate,
        volumePercent: Number((data.volumeLevel * 100).toFixed(2)),
        detectionMode: data.detectionMode,
        primaryLanguage: data.primaryLanguage,
        secondaryLanguage: data.secondaryLanguage || '',
      }
    : ttsDefaults;
  return (
    <section className="glass card stack">
      <h2>Giọng đọc của {name}</h2>
      <p>
        Mobile cần tải lại cấu hình để áp dụng. Lưu thành công không xác nhận thiết bị đã đổi giọng
        đọc.
      </p>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {data ? (
          <dl className="stack">
            {fields.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>
                  {field.options?.find((o) => o.value === initial[field.key])?.label ||
                    String(initial[field.key] === '' ? 'Không dùng' : initial[field.key])}
                  {field.key === 'volumePercent' ? '%' : field.key === 'speedRate' ? ' lần' : ''}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>Chưa có cấu hình giọng đọc. Bạn có thể tạo cấu hình cho người được chọn.</p>
        )}
        <div className="row">
          <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Tải lại cấu hình
          </button>
          <button
            className="btn primary"
            disabled={query.isFetching}
            onClick={() => setEditing(true)}
          >
            {data ? 'Chỉnh sửa giọng đọc' : 'Tạo cấu hình giọng đọc'}
          </button>
        </div>
        {editing && (
          <Dialog
            title={data ? 'Chỉnh sửa giọng đọc' : 'Tạo cấu hình giọng đọc'}
            onClose={() => setEditing(false)}
          >
            {!data && (
              <p>
                Giá trị đề xuất: giọng nữ, tốc độ 1 lần, âm lượng 80%, chế độ đầy đủ và tiếng Việt.
                Chỉ được lưu khi bạn xác nhận.
              </p>
            )}
            <Form
              fields={fields}
              initial={initial}
              onSubmit={async (values) => {
                try {
                  await ttsApi.save(actor, viuId, values);
                  setNotice('Đã lưu cấu hình trên máy chủ. Kiểm tra lại trên Mobile.');
                  setEditing(false);
                  await cache.invalidateQueries({ queryKey: key });
                } catch (error) {
                  if ((error as { status?: number }).status! >= 500)
                    throw new Error(
                      'Chưa xác nhận được kết quả lưu. Đóng popup và tải lại cấu hình trước khi gửi lại.',
                      { cause: error },
                    );
                  throw error;
                }
              }}
            />
          </Dialog>
        )}
      </State>
    </section>
  );
}

export function ApiTts() {
  const { data: actor } = useSession();
  return actor?.role === 'Caregiver' ? <Tts key={actor.id + actor.orgId} actor={actor} /> : null;
}
function Tts({ actor }: { actor: Person }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const users = useQuery({
    queryKey: ['api-tts-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  const person = users.data?.items.find((item) => item.id === selected);
  return (
    <>
      <PageHead
        title="Giọng đọc hỗ trợ"
        description="Cấu hình giọng đọc được lưu trên máy chủ để ứng dụng Mobile sử dụng."
      />
      <section className="glass card stack">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(String(new FormData(e.currentTarget).get('search') || '').trim());
            setPage(1);
            setSelected('');
          }}
        >
          <label className="field">
            Tìm người được chăm sóc
            <input name="search" />
          </label>
          <button className="btn">Tìm kiếm</button>
          <button
            type="button"
            className="btn"
            disabled={users.isFetching}
            onClick={() => void users.refetch()}
          >
            Tải lại người dùng
          </button>
        </form>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          <label className="field">
            Người được chăm sóc
            <select value={person?.id || ''} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Chọn người được chăm sóc</option>
              {users.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} · {item.email}
                </option>
              ))}
            </select>
          </label>
          {users.data && (
            <div className="row">
              <span>
                {users.data.totalCount} người · Trang {page}/{Math.max(1, users.data.totalPages)}
              </span>
              <button
                className="btn"
                disabled={!users.data.hasPreviousPage || users.isFetching}
                onClick={() => {
                  setPage(page - 1);
                  setSelected('');
                }}
              >
                Trang trước
              </button>
              <button
                className="btn"
                disabled={!users.data.hasNextPage || users.isFetching}
                onClick={() => {
                  setPage(page + 1);
                  setSelected('');
                }}
              >
                Trang sau
              </button>
            </div>
          )}
          {!users.data?.items.length && <p>Chưa có người được chăm sóc phù hợp.</p>}
        </State>
      </section>
      {!users.error && person && (
        <TtsSettings
          key={actor.id + person.id}
          actor={actor}
          viuId={person.id}
          name={person.fullName}
        />
      )}
    </>
  );
}

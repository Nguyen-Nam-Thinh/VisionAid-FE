import { t, msg, tText } from '../../i18n';
import { Toast } from '../../components/UI';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useService';
import { caregivingApi } from '../../services/api/caregiving';
import { ttsApi, ttsDefaults } from '../../services/api/tts';
import { FilterPanel } from '../../components/FilterPanel';
import { PageHead, State, Dialog } from '../../components/UI';
import { Form, type FieldSpec } from '../../components/Form';
import type { Person, Fields } from '../../models/domain';
import { uiStore, useUI } from '../../stores/ui';

const fields: FieldSpec[] = [
  {
    key: 'voiceGender',
    label: msg('Giọng đọc'),
    type: 'select',
    required: true,
    options: [
      { value: 'Female', label: msg('Nữ') },
      { value: 'Male', label: msg('Nam') },
    ],
  },
  {
    key: 'speedRate',
    label: msg('Tốc độ đọc'),
    type: 'number',
    required: true,
    min: 0.5,
    max: 2,
    step: 0.1,
    hint: msg('Từ 0,5 đến 2 lần.'),
  },
  {
    key: 'volumePercent',
    label: msg('Âm lượng'),
    type: 'number',
    required: true,
    min: 0,
    max: 100,
    step: 1,
    hint: msg('Từ 0 đến 100%. Mức 0 sẽ tắt âm thanh giọng đọc.'),
  },
  {
    key: 'detectionMode',
    label: msg('Chế độ phát hiện'),
    type: 'select',
    required: true,
    options: [
      { value: 'Minimal', label: msg('Tối giản') },
      { value: 'Full', label: msg('Đầy đủ') },
    ],
  },
  {
    key: 'primaryLanguage',
    label: msg('Ngôn ngữ chính'),
    required: true,
    max: 10,
    hint: msg('Mã ngôn ngữ, ví dụ vi-VN hoặc en-US. Giọng đọc khả dụng phụ thuộc thiết bị.'),
  },
  {
    key: 'secondaryLanguage',
    label: msg('Ngôn ngữ phụ'),
    max: 10,
    hint: msg('Để trống nếu không dùng ngôn ngữ phụ.'),
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
      <h2>{t('Giọng đọc của {name}', { name })}</h2>
      <p className="notice">
        {t(
          'Mobile cần tải lại cấu hình để áp dụng. Lưu thành công không xác nhận thiết bị đã đổi giọng đọc.',
        )}
      </p>
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {data ? (
          <dl className="settings-details">
            {fields.map((field) => (
              <div key={field.key}>
                <dt>{tText(field.label)}</dt>
                <dd>
                  {field.options?.find((o) => o.value === initial[field.key])?.label ||
                    String(initial[field.key] === '' ? t('Không dùng') : initial[field.key])}
                  {field.key === 'volumePercent' ? '%' : field.key === 'speedRate' ? t(' lần') : ''}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{t('Chưa có cấu hình giọng đọc. Bạn có thể tạo cấu hình cho người được chọn.')}</p>
        )}
        <div className="row">
          <button className="btn" disabled={query.isFetching} onClick={() => void query.refetch()}>
            {t('Tải lại cấu hình')}
          </button>
          <button
            className="btn primary"
            disabled={query.isFetching}
            onClick={() => setEditing(true)}
          >
            {data ? t('Chỉnh sửa giọng đọc') : t('Tạo cấu hình giọng đọc')}
          </button>
        </div>
        {editing && (
          <Dialog
            title={data ? t('Chỉnh sửa giọng đọc') : t('Tạo cấu hình giọng đọc')}
            onClose={() => setEditing(false)}
          >
            {!data && (
              <p>
                {t(
                  'Giá trị đề xuất: giọng nữ, tốc độ 1 lần, âm lượng 80%, chế độ đầy đủ và tiếng Việt. Chỉ được lưu khi bạn xác nhận.',
                )}
              </p>
            )}
            <Form
              fields={fields}
              initial={initial}
              onSubmit={async (values) => {
                try {
                  await ttsApi.save(actor, viuId, values);
                  setNotice(t('Đã lưu cấu hình trên máy chủ. Kiểm tra lại trên Mobile.'));
                  setEditing(false);
                  await cache.invalidateQueries({ queryKey: key });
                } catch (error) {
                  if ((error as { status?: number }).status! >= 500)
                    throw new Error(
                      t(
                        'Chưa xác nhận được kết quả lưu. Đóng popup và tải lại cấu hình trước khi gửi lại.',
                      ),
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
  // Shared with the other care-recipient pages; cleared on logout via uiStore.clear().
  const { selectedViu: selected } = useUI();
  const setSelected = (id: string) => uiStore.set({ selectedViu: id });
  const users = useQuery({
    queryKey: ['api-tts-users', actor.id, actor.orgId, page, search],
    queryFn: ({ signal }) => caregivingApi.users(page, search, signal),
    refetchInterval: 30000,
  });
  const person =
    users.data?.items.find((item) => item.id === selected) ??
    // Only one care recipient in scope: select them instead of asking.
    (!selected && users.data?.totalCount === 1 ? users.data.items[0] : undefined);
  return (
    <>
      <PageHead
        title={t('Giọng đọc hỗ trợ')}
        description={t(
          'Chọn giọng, tốc độ và âm lượng đọc trên điện thoại của người được chăm sóc.',
        )}
      />
      <section className="glass card stack">
        <FilterPanel
          active={search ? 1 : 0}
          onApply={(form) => {
            setSearch(String(new FormData(form).get('search') || '').trim());
            setPage(1);
            setSelected('');
          }}
          onReset={() => {
            setSearch('');
            setPage(1);
            setSelected('');
          }}
          tools={
            <button
              type="button"
              className="btn"
              disabled={users.isFetching}
              onClick={() => void users.refetch()}
            >
              {t('Tải lại người dùng')}
            </button>
          }
        >
          <label className="field wide">
            {t('Tìm người được chăm sóc')}
            <input name="search" placeholder={t('Tên, email hoặc số điện thoại')} />
          </label>
        </FilterPanel>
        <State loading={users.isPending} error={users.error} retry={() => users.refetch()}>
          <label className="field">
            {t('Người được chăm sóc')}
            <select value={person?.id || ''} onChange={(e) => setSelected(e.target.value)}>
              <option value="">{t('Chọn người được chăm sóc')}</option>
              {users.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} · {item.email}
                </option>
              ))}
            </select>
          </label>
          {users.data && (
            <div className="row pagination">
              <span>
                {t('{totalCount} người · Trang {page}/{p4}', {
                  totalCount: users.data.totalCount,
                  page,
                  p4: Math.max(1, users.data.totalPages),
                })}
              </span>
              <button
                className="btn"
                disabled={!users.data.hasPreviousPage || users.isFetching}
                onClick={() => {
                  setPage(page - 1);
                  setSelected('');
                }}
              >
                {t('Trang trước')}
              </button>
              <button
                className="btn"
                disabled={!users.data.hasNextPage || users.isFetching}
                onClick={() => {
                  setPage(page + 1);
                  setSelected('');
                }}
              >
                {t('Trang sau')}
              </button>
            </div>
          )}
          {!users.data?.items.length && <p>{t('Chưa có người được chăm sóc phù hợp.')}</p>}
        </State>
      </section>
      {!users.isPending && !users.error && !person && !!users.data?.items.length && (
        <p className="notice">
          {t('Chọn người được chăm sóc ở trên để xem và chỉnh cấu hình giọng đọc.')}
        </p>
      )}
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

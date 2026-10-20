import { t } from '../../i18n';
import { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useCommand } from '../../hooks/useService';
import { PageHead, State, DataTable, Dialog, Confirm } from '../../components/UI';
import { Form } from '../../components/Form';
import { formatTime } from '../../constants/labels';
import type { Entity, ConfigRevision } from '../../models/domain';
export function Configurations() {
  const { query, db } = useWorkspace();
  const cmd = useCommand();
  const [edit, setEdit] = useState<Entity | null>(null);
  const [revision, setRevision] = useState<ConfigRevision | null>(null);
  return (
    <>
      <PageHead
        title={t('Cấu hình hệ thống')}
        description={t(
          'Thay đổi có kiểm soát, truy vết và khôi phục. Đây là thông số demo, chưa tác động thiết bị thật.',
        )}
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        <div className="stack">
          <DataTable
            title={t('Thông số đang áp dụng')}
            rows={db?.entities.configs ?? []}
            searchText={(c) => c.name + ' ' + c.fields.key}
            columns={[
              {
                label: t('Thông số'),
                render: (c) => (
                  <>
                    {c.name}
                    <p className="mono">{String(c.fields.key)}</p>
                  </>
                ),
              },
              {
                label: t('Giá trị'),
                render: (c) => (
                  <strong>
                    {String(c.fields.value)} {String(c.fields.unit)}
                  </strong>
                ),
              },
              { label: t('Giới hạn'), render: (c) => `${c.fields.min} – ${c.fields.max}` },
              {
                label: t('Thao tác'),
                render: (c) => (
                  <button className="btn small" onClick={() => setEdit(c)}>
                    {t('Điều chỉnh')}
                  </button>
                ),
              },
            ]}
          />
          <DataTable
            title={t('Lịch sử thay đổi')}
            rows={db?.revisions ?? []}
            searchText={(r) => r.name}
            columns={[
              { label: t('Thời gian · UTC+7'), render: (r) => formatTime(r.at) },
              { label: t('Thông số'), render: (r) => r.name },
              { label: t('Trước → Sau'), render: (r) => `${r.before} → ${r.after}` },
              {
                label: t('Người thay đổi'),
                render: (r) => db?.people.find((p) => p.id === r.actor)?.name ?? t('Hệ thống'),
              },
              {
                label: t('Thao tác'),
                render: (r) => (
                  <button className="btn small" onClick={() => setRevision(r)}>
                    {t('Khôi phục giá trị trước')}
                  </button>
                ),
              },
            ]}
          />
        </div>
      </State>
      {edit && (
        <Dialog title={t('Điều chỉnh ') + edit.name} onClose={() => setEdit(null)}>
          <Form
            fields={[
              {
                key: 'value',
                label: t('Giá trị ({unit})', { unit: edit.fields.unit }),
                type: 'number',
                min: Number(edit.fields.min),
                max: Number(edit.fields.max),
              },
            ]}
            initial={{ value: edit.fields.value }}
            onSubmit={async (v) => {
              await cmd.mutateAsync({
                type: 'save',
                kind: 'configs',
                entity: { ...edit, fields: { ...edit.fields, value: v.value } },
              });
              setEdit(null);
            }}
          />
        </Dialog>
      )}
      {revision && (
        <Confirm
          title={t('Khôi phục cấu hình?')}
          description={t(
            'Đặt {name} về {before}. Thao tác tạo thêm một bản ghi lịch sử, không xóa lịch sử hiện có.',
            { name: revision.name, before: revision.before },
          )}
          onClose={() => setRevision(null)}
          onConfirm={() => cmd.mutateAsync({ type: 'rollback', revisionId: revision.id })}
        />
      )}
    </>
  );
}

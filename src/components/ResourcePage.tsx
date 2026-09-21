import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useCommand } from '../hooks/useService';
import type { Entity, Fields, Kind } from '../models/domain';
import { Form, type FieldSpec } from './Form';
import { ViuSelect } from './ViuSelect';
import { Badge, Confirm, DataTable, Dialog, PageHead, State } from './UI';
export interface ResourceProps {
  kind: Kind;
  title: string;
  description: string;
  fields: FieldSpec[];
  defaults?: Fields;
  scope?: 'viu' | 'org' | 'global' | 'self';
  allowCreate?: boolean;
  allowDelete?: boolean;
  details?: (e: Entity) => ReactNode;
  extraAction?: (e: Entity) => ReactNode;
  fixedName?: boolean;
  filter?: (e: Entity) => boolean;
  beforeSave?: (e: Entity) => Entity;
}
export function ResourcePage({
  kind,
  title,
  description,
  fields,
  defaults = {},
  scope = 'viu',
  allowCreate = true,
  allowDelete = true,
  details,
  extraAction,
  fixedName = false,
  filter,
  beforeSave,
}: ResourceProps) {
  const { query, db, user, selected, canWrite } = useWorkspace();
  const cmd = useCommand();
  const [edit, setEdit] = useState<Entity | null>(null);
  const [pendingSave, setPendingSave] = useState<Entity | null>(null);
  const [remove, setRemove] = useState<Entity | null>(null);
  const [active, setActive] = useState('all');
  const blank: Entity = {
    id: '',
    name: '',
    viuId: scope === 'viu' ? (selected?.id ?? '') : '',
    orgId: scope === 'org' ? user.orgId : '',
    ownerId: scope === 'self' ? user.id : '',
    active: true,
    fields: defaults,
    version: 0,
  };
  const rows = (db?.entities[kind] ?? []).filter(
    (e) =>
      (scope !== 'viu' || e.viuId === selected?.id) &&
      (scope !== 'org' ||
        (kind === 'organizations' ? e.id === user.orgId : e.orgId === user.orgId)) &&
      (scope !== 'global' || !e.orgId) &&
      (active === 'all' || e.active === (active === 'active')) &&
      (!filter || filter(e)),
  );
  const editable = canWrite(kind, blank) || rows.some((e) => canWrite(kind, e));
  return (
    <>
      <PageHead
        title={title}
        description={description}
        actions={
          <>
            {scope === 'viu' && <ViuSelect />}
            {allowCreate && editable && (
              <button
                className="btn primary"
                onClick={() => setEdit({ ...blank, id: crypto.randomUUID() })}
              >
                <Plus size={16} />
                Thêm mới
              </button>
            )}
          </>
        }
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {scope === 'viu' && !selected ? (
          <p className="glass empty">Chưa có người được liên kết.</p>
        ) : (
          <>
            <p className="notice" style={{ marginBottom: 20 }}>
              {editable
                ? 'Thay đổi được lưu sau khi kiểm tra quyền và dữ liệu.'
                : 'Bạn đang có quyền xem; không có quyền chỉnh sửa mục này.'}
            </p>
            <DataTable
              title={title}
              rows={rows}
              searchText={(e) => e.name + ' ' + Object.values(e.fields).join(' ')}
              filter={
                <label className="field">
                  <span className="sr-only">Lọc hoạt động</span>
                  <select value={active} onChange={(e) => setActive(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Chưa hoạt động</option>
                  </select>
                </label>
              }
              columns={[
                { label: 'Tên', render: (e) => e.name },
                {
                  label: 'Thông tin',
                  render: (e) =>
                    details ? (
                      details(e)
                    ) : (
                      <div>
                        {fields
                          .filter((f) => f.type !== 'checkbox')
                          .slice(0, 3)
                          .map((f) => (
                            <div key={f.key}>
                              <small>{f.label}: </small>
                              {String(e.fields[f.key] ?? '—')}
                            </div>
                          ))}
                      </div>
                    ),
                },
                {
                  label: 'Trạng thái',
                  render: (e) => (
                    <Badge tone={e.active ? 'green' : 'amber'}>
                      {e.active ? 'Hoạt động' : 'Chưa hoạt động'}
                    </Badge>
                  ),
                },
                {
                  label: 'Thao tác',
                  render: (e) => (
                    <div className="row">
                      {extraAction?.(e)}
                      {canWrite(kind, e) && (
                        <>
                          <button className="btn small" onClick={() => setEdit(e)}>
                            Chỉnh sửa
                          </button>
                          {allowDelete && (
                            <button className="btn small danger" onClick={() => setRemove(e)}>
                              Xóa
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </State>
      {edit && (
        <Dialog
          title={(edit.version ? 'Chỉnh sửa: ' : 'Thêm mới: ') + title}
          onClose={() => setEdit(null)}
        >
          <Form
            fields={[
              ...(!fixedName ? [{ key: 'name', label: 'Tên', required: true, max: 200 }] : []),
              ...fields,
              ...(kind !== 'faces' &&
              kind !== 'configs' &&
              (kind !== 'organizations' || user.role === 'Admin')
                ? [{ key: 'active', label: 'Đang hoạt động', type: 'checkbox' as const }]
                : []),
            ]}
            initial={{ ...edit.fields, name: edit.name, active: edit.active }}
            onSubmit={async (v) => {
              const { name, active, ...values } = v;
              const entity = {
                ...edit,
                name: fixedName ? edit.name : String(name),
                active: active === undefined ? edit.active : Boolean(active),
                fields: values,
              };
              const next = beforeSave ? beforeSave(entity) : entity;
              if (kind === 'organizations' && edit.version && edit.active !== next.active) {
                setPendingSave(next);
                return;
              }
              await cmd.mutateAsync({ type: 'save', kind, entity: next });
              setEdit(null);
            }}
          />
        </Dialog>
      )}
      {pendingSave && (
        <Confirm
          title="Thay đổi trạng thái tổ chức?"
          description={
            'Thay đổi quyền đăng nhập của thành viên thuộc ' +
            pendingSave.name +
            '. Xác nhận tiếp tục?'
          }
          onClose={() => setPendingSave(null)}
          onConfirm={async () => {
            await cmd.mutateAsync({ type: 'save', kind, entity: pendingSave });
            setEdit(null);
          }}
        />
      )}
      {remove && (
        <Confirm
          title={`Xóa ${remove.name}?`}
          description="Thao tác xóa không thể hoàn tác. Dữ liệu chỉ được bỏ khỏi giao diện sau khi dịch vụ xác nhận thành công."
          onClose={() => setRemove(null)}
          onConfirm={() =>
            cmd.mutateAsync({ type: 'delete', kind, id: remove.id, version: remove.version })
          }
        />
      )}
    </>
  );
}

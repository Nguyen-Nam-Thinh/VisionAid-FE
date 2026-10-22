import { t } from '../i18n';
import { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useCommand, useLinkActions } from '../hooks/useService';
import { useLimit } from '../hooks/useLimit';
import type { Link } from '../models/domain';
import { Form } from './Form';
import { ViuSelect } from './ViuSelect';
import { PageHead, DataTable, State, Dialog, Confirm, Badge } from './UI';
export function LinkManagement({ family = false }: { family?: boolean }) {
  const { query, db, user, selected, permission } = useWorkspace();
  const cmd = useCommand();
  const actions = useLinkActions();
  const maxCaregivers = useLimit('caregiving.max_caregivers_per_viu');
  const maxVius = useLimit('caregiving.max_vius_per_caregiver');
  const [edit, setEdit] = useState<Link | null>(null);
  const [adding, setAdding] = useState(false);
  const [remove, setRemove] = useState<Link | null>(null);
  const [transfer, setTransfer] = useState<Link | null>(null);
  const canManage = !family || permission('primary');
  const rows = db?.links.filter((l) => !family || l.viuId === selected?.id) ?? [];
  return (
    <>
      <PageHead
        title={family ? t('Người chăm sóc phụ') : t('Phân công chăm sóc')}
        description={t(
          'Tối đa {maxCaregivers} người chăm sóc/người dùng và {maxVius} người dùng/người chăm sóc. Duy trì một người chăm sóc chính.',
          { maxCaregivers, maxVius },
        )}
        actions={
          <>
            {family && <ViuSelect />}
            {canManage && (
              <button className="btn primary" onClick={() => setAdding(true)}>
                {t('Thêm liên kết')}
              </button>
            )}
          </>
        }
      />
      <State loading={query.isPending} error={query.error} retry={() => query.refetch()}>
        {!canManage && (
          <p className="notice">{t('Chỉ người chăm sóc chính được quản lý liên kết này.')}</p>
        )}
        <DataTable
          title={t('Liên kết đang có')}
          rows={rows}
          searchText={(l) =>
            `${db?.people.find((p) => p.id === l.caregiverId)?.name} ${db?.people.find((p) => p.id === l.viuId)?.name}`
          }
          columns={[
            {
              label: t('Người chăm sóc'),
              render: (l) => db?.people.find((p) => p.id === l.caregiverId)?.name,
            },
            {
              label: t('Người dùng'),
              render: (l) => db?.people.find((p) => p.id === l.viuId)?.name,
            },
            {
              label: t('Vai trò'),
              render: (l) => <Badge>{l.primary ? t('Chính') : t('Phụ')}</Badge>,
            },
            {
              label: t('Quyền'),
              render: (l) =>
                [
                  l.alerts ? t('Cảnh báo') : '',
                  l.registry ? 'Registry' : '',
                  l.locations ? t('Địa điểm') : '',
                ]
                  .filter(Boolean)
                  .join(' · ') || t('Chỉ xem'),
            },
            {
              label: t('Thao tác'),
              render: (l) =>
                canManage && (
                  <div className="row">
                    <button className="btn small" onClick={() => setEdit(l)}>
                      {t('Quyền')}
                    </button>
                    {!l.primary && (
                      <button className="btn small" onClick={() => setTransfer(l)}>
                        {t('Đặt làm chính')}
                      </button>
                    )}
                    <button className="btn small danger" onClick={() => setRemove(l)}>
                      {t('Gỡ')}
                    </button>
                  </div>
                ),
            },
          ]}
        />
      </State>
      {adding && (
        <Dialog title={t('Thêm liên kết chăm sóc')} onClose={() => setAdding(false)}>
          {family ? (
            <Form
              fields={[
                {
                  key: 'email',
                  label: t('Email Caregiver đã đăng ký'),
                  type: 'email',
                  required: true,
                },
              ]}
              onSubmit={async (v) => {
                if (!selected) return;
                await actions.addSecondary(selected.id, String(v.email));
                setAdding(false);
              }}
            />
          ) : (
            <Form
              fields={[
                {
                  key: 'caregiverId',
                  label: t('Người chăm sóc'),
                  type: 'select',
                  required: true,
                  options: db?.people
                    .filter((p) => p.role === 'Caregiver' && p.active)
                    .map((p) => ({ value: p.id, label: p.name })),
                },
                {
                  key: 'viuId',
                  label: t('Người khiếm thị'),
                  type: 'select',
                  required: true,
                  options: db?.people
                    .filter((p) => p.role === 'VisuallyImpaired' && p.active)
                    .map((p) => ({ value: p.id, label: p.name })),
                },
                {
                  key: 'primary',
                  label: t('Người chăm sóc chính (khi chưa có)'),
                  type: 'checkbox',
                },
              ]}
              initial={{ primary: true }}
              onSubmit={async (v) => {
                await cmd.mutateAsync({
                  type: 'link',
                  link: {
                    id: crypto.randomUUID(),
                    caregiverId: String(v.caregiverId),
                    viuId: String(v.viuId),
                    primary: Boolean(v.primary),
                    alerts: true,
                    registry: true,
                    locations: true,
                  },
                });
                setAdding(false);
              }}
            />
          )}
        </Dialog>
      )}
      {edit && (
        <Dialog title={t('Quyền trên người dùng được liên kết')} onClose={() => setEdit(null)}>
          <Form
            fields={[
              { key: 'alerts', label: t('Nhận và xử lý cảnh báo'), type: 'checkbox' },
              { key: 'registry', label: t('Quản lý danh bạ khuôn mặt'), type: 'checkbox' },
              { key: 'locations', label: t('Quản lý địa điểm và geofence'), type: 'checkbox' },
            ]}
            initial={{ alerts: edit.alerts, registry: edit.registry, locations: edit.locations }}
            onSubmit={async (v) => {
              await cmd.mutateAsync({
                type: 'link',
                link: {
                  ...edit,
                  alerts: Boolean(v.alerts),
                  registry: Boolean(v.registry),
                  locations: Boolean(v.locations),
                },
              });
              setEdit(null);
            }}
          />
        </Dialog>
      )}
      {remove && (
        <Confirm
          title={t('Gỡ liên kết chăm sóc?')}
          description={t('Gỡ {name} khỏi {name2}. Quyền truy cập sẽ bị thu hồi.', {
            name: db?.people.find((p) => p.id === remove.caregiverId)?.name,
            name2: db?.people.find((p) => p.id === remove.viuId)?.name,
          })}
          onClose={() => setRemove(null)}
          onConfirm={() => cmd.mutateAsync({ type: 'unlink', id: remove.id })}
        />
      )}{' '}
      {transfer && (
        <Confirm
          title={t('Chuyển người chăm sóc chính?')}
          description={t('Chuyển vai trò chính sang {name}. {p1}', {
            name: db?.people.find((p) => p.id === transfer.caregiverId)?.name,
            p1:
              family && user.id !== transfer.caregiverId
                ? t('Bạn sẽ không còn quyền quản lý người chăm sóc phụ.')
                : '',
          })}
          onClose={() => setTransfer(null)}
          onConfirm={() =>
            cmd.mutateAsync({
              type: 'transfer',
              viuId: transfer.viuId,
              caregiverId: transfer.caregiverId,
            })
          }
        />
      )}
    </>
  );
}

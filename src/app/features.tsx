import { msg, type MessageId } from '../i18n';
import { lazy } from 'react';
const Audit = lazy(() =>
  import('../pages/super-admin/Audit').then((module) => ({ default: module.Audit })),
);
const Delivery = lazy(() =>
  import('../pages/super-admin/Delivery').then((module) => ({ default: module.Delivery })),
);
const Metrics = lazy(() =>
  import('../pages/super-admin/Metrics').then((module) => ({ default: module.Metrics })),
);
const Rules = lazy(() =>
  import('../pages/super-admin/Rules').then((module) => ({ default: module.Rules })),
);
const Configurations = lazy(() =>
  import('../pages/super-admin/Configurations').then((module) => ({
    default: module.Configurations,
  })),
);
const Linkage = lazy(() =>
  import('../pages/super-admin/Linkage').then((module) => ({ default: module.Linkage })),
);
const Accounts = lazy(() =>
  import('../pages/super-admin/Accounts').then((module) => ({ default: module.Accounts })),
);
const Organizations = lazy(() =>
  import('../pages/super-admin/Organizations').then((module) => ({
    default: module.Organizations,
  })),
);
const Routing = lazy(() =>
  import('../pages/center-admin/Routing').then((module) => ({ default: module.Routing })),
);
const Reports = lazy(() =>
  import('../pages/center-admin/Reports').then((module) => ({ default: module.Reports })),
);
const Fleet = lazy(() =>
  import('../pages/center-admin/Fleet').then((module) => ({ default: module.Fleet })),
);
const Assignments = lazy(() =>
  import('../pages/center-admin/Assignments').then((module) => ({ default: module.Assignments })),
);
const Vius = lazy(() =>
  import('../pages/center-admin/Vius').then((module) => ({ default: module.Vius })),
);
const Staff = lazy(() =>
  import('../pages/center-admin/Staff').then((module) => ({ default: module.Staff })),
);
const Organization = lazy(() =>
  import('../pages/center-admin/Organization').then((module) => ({ default: module.Organization })),
);
const Tts = lazy(() =>
  import('../pages/caregiver/Tts').then((module) => ({ default: module.Tts })),
);
const Notifications = lazy(() =>
  import('../pages/caregiver/Notifications').then((module) => ({ default: module.Notifications })),
);
const Activity = lazy(() =>
  import('../pages/caregiver/Activity').then((module) => ({ default: module.Activity })),
);
const Secondary = lazy(() =>
  import('../pages/caregiver/Secondary').then((module) => ({ default: module.Secondary })),
);
const Contacts = lazy(() =>
  import('../pages/caregiver/Contacts').then((module) => ({ default: module.Contacts })),
);
const Locations = lazy(() =>
  import('../pages/caregiver/Locations').then((module) => ({ default: module.Locations })),
);
const Registry = lazy(() =>
  import('../pages/caregiver/Registry').then((module) => ({ default: module.Registry })),
);
const Alerts = lazy(() =>
  import('../pages/caregiver/Alerts').then((module) => ({ default: module.Alerts })),
);
const LiveMap = lazy(() =>
  import('../pages/caregiver/LiveMap').then((module) => ({ default: module.LiveMap })),
);
import type { ComponentType } from 'react';
import type { Role } from '../models/domain';
const LinkedUsers = lazy(() =>
  import('../pages/caregiver/LinkedUsers').then((module) => ({ default: module.LinkedUsers })),
);
export interface Feature {
  role: Role;
  path: string;
  label: MessageId;
  component: ComponentType;
}
export const features: Feature[] = [
  { role: 'Admin', path: 'audit', label: msg('Nhật ký kiểm toán'), component: Audit },
  { role: 'Admin', path: 'delivery', label: msg('Theo dõi thông báo'), component: Delivery },
  { role: 'Admin', path: 'metrics', label: msg('Hiệu năng AI'), component: Metrics },
  { role: 'Admin', path: 'rules', label: msg('Quy tắc thông báo'), component: Rules },
  {
    role: 'Admin',
    path: 'configurations',
    label: msg('Cấu hình hệ thống'),
    component: Configurations,
  },
  { role: 'Admin', path: 'links', label: msg('Liên kết chăm sóc'), component: Linkage },
  { role: 'Admin', path: 'accounts', label: msg('Quản lý tài khoản'), component: Accounts },
  {
    role: 'Admin',
    path: 'organizations',
    label: msg('Tổ chức & trung tâm'),
    component: Organizations,
  },
  { role: 'CenterAdmin', path: 'routing', label: msg('Định tuyến thông báo'), component: Routing },
  { role: 'CenterAdmin', path: 'reports', label: msg('Báo cáo hoạt động'), component: Reports },
  { role: 'CenterAdmin', path: 'map', label: msg('Bản đồ toàn trung tâm'), component: Fleet },
  {
    role: 'CenterAdmin',
    path: 'assignments',
    label: msg('Phân công chăm sóc'),
    component: Assignments,
  },
  { role: 'CenterAdmin', path: 'users', label: msg('Người dùng VIU'), component: Vius },
  { role: 'CenterAdmin', path: 'staff', label: msg('Nhân viên chăm sóc'), component: Staff },
  {
    role: 'CenterAdmin',
    path: 'organization',
    label: msg('Hồ sơ tổ chức'),
    component: Organization,
  },
  { role: 'Caregiver', path: 'tts', label: msg('Giọng đọc hỗ trợ'), component: Tts },
  {
    role: 'Caregiver',
    path: 'notifications',
    label: msg('Tùy chọn thông báo'),
    component: Notifications,
  },
  { role: 'Caregiver', path: 'activity', label: msg('Nhật ký hoạt động'), component: Activity },
  { role: 'Caregiver', path: 'caregivers', label: msg('Người chăm sóc phụ'), component: Secondary },
  { role: 'Caregiver', path: 'contacts', label: msg('Liên hệ khẩn cấp'), component: Contacts },
  {
    role: 'Caregiver',
    path: 'locations',
    label: msg('Địa điểm & vùng an toàn'),
    component: Locations,
  },
  { role: 'Caregiver', path: 'registry', label: msg('Gương mặt thân quen'), component: Registry },
  { role: 'Caregiver', path: 'alerts', label: msg('Cảnh báo khẩn cấp'), component: Alerts },
  { role: 'Caregiver', path: 'map', label: msg('Bản đồ theo dõi'), component: LiveMap },
  { role: 'Caregiver', path: 'users', label: msg('Người được chăm sóc'), component: LinkedUsers },
];

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
  label: string;
  component: ComponentType;
}
export const features: Feature[] = [
  { role: 'Admin', path: 'audit', label: 'Nhật ký kiểm toán', component: Audit },
  { role: 'Admin', path: 'delivery', label: 'Theo dõi thông báo', component: Delivery },
  { role: 'Admin', path: 'metrics', label: 'Hiệu năng AI', component: Metrics },
  { role: 'Admin', path: 'rules', label: 'Quy tắc thông báo', component: Rules },
  { role: 'Admin', path: 'configurations', label: 'Cấu hình hệ thống', component: Configurations },
  { role: 'Admin', path: 'links', label: 'Liên kết chăm sóc', component: Linkage },
  { role: 'Admin', path: 'accounts', label: 'Quản lý tài khoản', component: Accounts },
  { role: 'Admin', path: 'organizations', label: 'Tổ chức & trung tâm', component: Organizations },
  { role: 'CenterAdmin', path: 'routing', label: 'Định tuyến thông báo', component: Routing },
  { role: 'CenterAdmin', path: 'reports', label: 'Báo cáo hoạt động', component: Reports },
  { role: 'CenterAdmin', path: 'map', label: 'Bản đồ toàn trung tâm', component: Fleet },
  { role: 'CenterAdmin', path: 'assignments', label: 'Phân công chăm sóc', component: Assignments },
  { role: 'CenterAdmin', path: 'users', label: 'Người dùng VIU', component: Vius },
  { role: 'CenterAdmin', path: 'staff', label: 'Nhân viên chăm sóc', component: Staff },
  { role: 'CenterAdmin', path: 'organization', label: 'Hồ sơ tổ chức', component: Organization },
  { role: 'Caregiver', path: 'tts', label: 'Giọng đọc hỗ trợ', component: Tts },
  {
    role: 'Caregiver',
    path: 'notifications',
    label: 'Tùy chọn thông báo',
    component: Notifications,
  },
  { role: 'Caregiver', path: 'activity', label: 'Nhật ký hoạt động', component: Activity },
  { role: 'Caregiver', path: 'caregivers', label: 'Người chăm sóc phụ', component: Secondary },
  { role: 'Caregiver', path: 'contacts', label: 'Liên hệ khẩn cấp', component: Contacts },
  { role: 'Caregiver', path: 'locations', label: 'Địa điểm & vùng an toàn', component: Locations },
  { role: 'Caregiver', path: 'registry', label: 'Gương mặt thân quen', component: Registry },
  { role: 'Caregiver', path: 'alerts', label: 'Cảnh báo khẩn cấp', component: Alerts },
  { role: 'Caregiver', path: 'map', label: 'Bản đồ theo dõi', component: LiveMap },
  { role: 'Caregiver', path: 'users', label: 'Người được chăm sóc', component: LinkedUsers },
];

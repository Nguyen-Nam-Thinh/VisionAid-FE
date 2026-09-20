import { Configurations } from '../pages/super-admin/Configurations';
import { Linkage } from '../pages/super-admin/Linkage';
import { Accounts } from '../pages/super-admin/Accounts';
import { Organizations } from '../pages/super-admin/Organizations';
import { Routing } from '../pages/center-admin/Routing';
import { Reports } from '../pages/center-admin/Reports';
import { Fleet } from '../pages/center-admin/Fleet';
import { Assignments } from '../pages/center-admin/Assignments';
import { Vius } from '../pages/center-admin/Vius';
import { Staff } from '../pages/center-admin/Staff';
import { Organization } from '../pages/center-admin/Organization';
import { Tts } from '../pages/caregiver/Tts';
import { Notifications } from '../pages/caregiver/Notifications';
import { Activity } from '../pages/caregiver/Activity';
import { Secondary } from '../pages/caregiver/Secondary';
import { Contacts } from '../pages/caregiver/Contacts';
import { Locations } from '../pages/caregiver/Locations';
import { Registry } from '../pages/caregiver/Registry';
import { Alerts } from '../pages/caregiver/Alerts';
import { LiveMap } from '../pages/caregiver/LiveMap';
import type { ComponentType } from 'react';
import type { Role } from '../models/domain';
import { LinkedUsers } from '../pages/caregiver/LinkedUsers';
export interface Feature {role:Role;path:string;label:string;component:ComponentType}
export const features:Feature[]=[{role:'Admin',path:'configurations',label:'Cấu hình hệ thống',component:Configurations},{role:'Admin',path:'links',label:'Liên kết chăm sóc',component:Linkage},{role:'Admin',path:'accounts',label:'Quản lý tài khoản',component:Accounts},{role:'Admin',path:'organizations',label:'Tổ chức & trung tâm',component:Organizations},{role:'CenterAdmin',path:'routing',label:'Định tuyến thông báo',component:Routing},{role:'CenterAdmin',path:'reports',label:'Báo cáo hoạt động',component:Reports},{role:'CenterAdmin',path:'map',label:'Bản đồ toàn trung tâm',component:Fleet},{role:'CenterAdmin',path:'assignments',label:'Phân công chăm sóc',component:Assignments},{role:'CenterAdmin',path:'users',label:'Người dùng VIU',component:Vius},{role:'CenterAdmin',path:'staff',label:'Nhân viên chăm sóc',component:Staff},{role:'CenterAdmin',path:'organization',label:'Hồ sơ tổ chức',component:Organization},{role:'Caregiver',path:'tts',label:'Giọng đọc hỗ trợ',component:Tts},{role:'Caregiver',path:'notifications',label:'Tùy chọn thông báo',component:Notifications},{role:'Caregiver',path:'activity',label:'Nhật ký hoạt động',component:Activity},{role:'Caregiver',path:'caregivers',label:'Người chăm sóc phụ',component:Secondary},{role:'Caregiver',path:'contacts',label:'Liên hệ khẩn cấp',component:Contacts},{role:'Caregiver',path:'locations',label:'Địa điểm & vùng an toàn',component:Locations},{role:'Caregiver',path:'registry',label:'Gương mặt thân quen',component:Registry},{role:'Caregiver',path:'alerts',label:'Cảnh báo khẩn cấp',component:Alerts},{role:'Caregiver',path:'map',label:'Bản đồ theo dõi',component:LiveMap},{role:'Caregiver',path:'users',label:'Người được chăm sóc',component:LinkedUsers}];





















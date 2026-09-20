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
export const features:Feature[]=[{role:'Caregiver',path:'caregivers',label:'Người chăm sóc phụ',component:Secondary},{role:'Caregiver',path:'contacts',label:'Liên hệ khẩn cấp',component:Contacts},{role:'Caregiver',path:'locations',label:'Địa điểm & vùng an toàn',component:Locations},{role:'Caregiver',path:'registry',label:'Gương mặt thân quen',component:Registry},{role:'Caregiver',path:'alerts',label:'Cảnh báo khẩn cấp',component:Alerts},{role:'Caregiver',path:'map',label:'Bản đồ theo dõi',component:LiveMap},{role:'Caregiver',path:'users',label:'Người được chăm sóc',component:LinkedUsers}];







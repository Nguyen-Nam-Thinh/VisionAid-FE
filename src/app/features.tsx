import { LiveMap } from '../pages/caregiver/LiveMap';
import type { ComponentType } from 'react';
import type { Role } from '../models/domain';
import { LinkedUsers } from '../pages/caregiver/LinkedUsers';
export interface Feature {role:Role;path:string;label:string;component:ComponentType}
export const features:Feature[]=[{role:'Caregiver',path:'map',label:'Bản đồ theo dõi',component:LiveMap},{role:'Caregiver',path:'users',label:'Người được chăm sóc',component:LinkedUsers}];


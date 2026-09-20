import { ResourcePage } from '../../components/ResourcePage';
import type { FieldSpec } from '../../components/Form';
export const organizationFields:FieldSpec[]=[{key:'address',label:'Địa chỉ',required:true},{key:'phone',label:'Điện thoại liên hệ'},{key:'email',label:'Email liên hệ',type:'email',required:true},{key:'taxCode',label:'Mã số thuế / giấy phép'}];
export function Organization(){return <ResourcePage kind="organizations" title="Hồ sơ trung tâm" description="Thông tin liên hệ và địa chỉ của tổ chức bạn đang quản lý." scope="org" fields={organizationFields} allowCreate={false} allowDelete={false}/>;}

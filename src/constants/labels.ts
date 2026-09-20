import type { AlertStatus, Role } from '../models/domain';
export const roles: Record<Role,string> = {Caregiver:'Người chăm sóc',CenterAdmin:'Quản trị trung tâm',Admin:'Quản trị hệ thống',VisuallyImpaired:'Người khiếm thị'};
export const statuses: Record<AlertStatus,string> = {DETECTED:'Đã phát hiện',DISMISSED:'Đã hủy',SENT:'Chờ hỗ trợ',ACKNOWLEDGED:'Đang hỗ trợ',ESCALATED:'Đã chuyển cấp',RESOLVED:'Đã giải quyết',CALLED:'Đã gọi hỗ trợ'};
export const activityLabels = {MOVEMENT:'Di chuyển',OCR:'Đọc văn bản',QR:'Quét QR',FACE:'Nhận diện',VOICE:'Lệnh giọng nói'};
export function normalizeRole(raw:string):Role|null {return ({CAREGIVER:'Caregiver',Caregiver:'Caregiver',CENTER_ADMIN:'CenterAdmin',CenterAdmin:'CenterAdmin',ADMIN:'Admin',Admin:'Admin',VISUALLY_IMPAIRED:'VisuallyImpaired',VisuallyImpaired:'VisuallyImpaired'} as Record<string,Role>)[raw]??null;}
export const formatTime=(at:string)=>new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(at));

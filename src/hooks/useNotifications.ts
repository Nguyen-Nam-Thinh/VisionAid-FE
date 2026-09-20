import { useState } from 'react';
import { requestBrowserPermission } from '../services/notifications/adapter';
export function useNotifications(){const [message,setMessage]=useState('');const [pending,setPending]=useState(false);return {message,pending,request:async()=>{setPending(true);try{setMessage(await requestBrowserPermission());}catch{setMessage('Không thể xin quyền thông báo. Kiểm tra cài đặt trình duyệt.');}finally{setPending(false);}}};}

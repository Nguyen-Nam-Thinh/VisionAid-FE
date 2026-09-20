import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { service } from '../services';
import { ServiceError } from '../services/contracts';
import type { Command, Person } from '../models/domain';
import { uiStore } from '../stores/ui';
export const useSession=()=>useQuery({queryKey:['session'],queryFn:()=>service.session(),retry:false,staleTime:30000});
export function useSnapshot(){const {data:user}=useSession();return useQuery({queryKey:['snapshot',user?.id,user?.orgId],queryFn:({signal})=>service.snapshot(signal),enabled:!!user,retry:false,staleTime:5000});}
export function useCommand(){const client=useQueryClient();return useMutation({mutationFn:(cmd:Command)=>service.execute(cmd),onSuccess:async()=>{await client.invalidateQueries({queryKey:['snapshot']});uiStore.set({notice:'Đã lưu thay đổi trong dữ liệu demo.'});},onError:async(error)=>{if(error instanceof ServiceError&&error.status===409)await client.invalidateQueries({queryKey:['snapshot']});}});}
export function useAuth(){const client=useQueryClient();const setSession=async(user:Person|null)=>{await client.cancelQueries();client.clear();uiStore.clear();client.setQueryData(['session'],user);};return {
 mode:service.mode,
 login:async(email:string,password:string)=>{const p=await service.login(email,password);await setSession(p);},
 register:async(name:string,email:string,password:string)=>{const p=await service.register(name,email,password);await setSession(p);},
 logout:async()=>{try{await service.logout();}finally{await setSession(null);}},
 resetDemo:async()=>{await service.resetDemo();await setSession(null);},
 recover:(email:string)=>service.recover(email),resetPassword:(code:string,password:string)=>service.resetPassword(code,password),
 changePassword:(current:string,next:string)=>service.changePassword(current,next),
 profile:async(values:Pick<Person,'name'|'phone'|'avatar'>)=>{const p=await service.profile(values);client.setQueryData(['session'],p);await client.invalidateQueries({queryKey:['snapshot']});},
 };}
export const useDemoAccounts=()=>useQuery({queryKey:['demo-accounts'],queryFn:()=>service.demoAccounts(),enabled:service.mode==='mock'});
export function useLinkActions(){const client=useQueryClient();return {generate:(id:string)=>service.generateLink(id),accept:async(code:string)=>{await service.acceptLink(code);await client.invalidateQueries({queryKey:['snapshot']});},resetPassword:(id:string)=>service.resetAccountPassword(id)};}

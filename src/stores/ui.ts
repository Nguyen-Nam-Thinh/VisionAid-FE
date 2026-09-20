import { useSyncExternalStore } from 'react';
// Only client interaction state. Server data belongs to TanStack Query.
let state={selectedViu:'',notice:''};const listeners=new Set<()=>void>();
export const uiStore={set:(next:Partial<typeof state>)=>{state={...state,...next};listeners.forEach(fn=>fn());},clear:()=>{state={selectedViu:'',notice:''};listeners.forEach(fn=>fn());}};
export function useUI(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>state);}

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createRealtimeClient, type Connection } from '../services/realtime/adapter';
import { useSession } from './useService';
export function useRealtime(){const {data:user}=useSession();const cache=useQueryClient();const client=useMemo(()=>createRealtimeClient(),[]);const [state,setState]=useState<Connection>('disconnected');useEffect(()=>{if(!user)return;return client.start(()=>{void cache.invalidateQueries({queryKey:['snapshot',user.id,user.orgId]});},setState);},[client,cache,user]);return {state,disconnect:client.disconnect,reconnect:client.reconnect};}

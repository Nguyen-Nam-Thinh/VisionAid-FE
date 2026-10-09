import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runtime } from '../configs/runtime';
import { apiAccessToken } from '../services/api/adapter';
import { hubUrl, startSignalR, refreshRealtimeQueries } from '../services/realtime/signalr';
import type { Person } from '../models/domain';
import { createCallClient } from '../services/realtime/calls';
import { callsApi } from '../services/api/calls';
import { onSessionEnded } from '../services/sessionLifecycle';
import { CallContext, CallPanel } from './CallPanel';
export function ApiRealtime({
  actor,
  children,
  enabled = true,
}: {
  actor: Person;
  children?: ReactNode;
  enabled?: boolean;
}) {
  const cache = useQueryClient();
  const [client] = useState(() =>
    createCallClient({
      api: callsApi,
      actor,
      changed: () => {
        void cache.invalidateQueries({ queryKey: ['api-calls', actor.id, actor.orgId] });
      },
    }),
  );
  const url = hubUrl(runtime.signalRUrl, runtime.apiBaseUrl, window.location.protocol);
  useEffect(() => {
    if (!url || !enabled || !['Caregiver', 'CenterAdmin'].includes(actor.role)) return;
    const stop = startSignalR(
      url,
      apiAccessToken,
      () => {
        void refreshRealtimeQueries(cache, { id: actor.id, orgId: actor.orgId });
      },
      (next) => {
        client.network(next);
        if (next === 'connected')
          void cache.invalidateQueries({ queryKey: ['session'] }, { cancelRefetch: false });
      },
      actor.role === 'Caregiver' ? (connection) => client.attach(connection) : undefined,
    );
    const unsubscribe = onSessionEnded(stop);
    return () => {
      unsubscribe();
      stop();
    };
  }, [url, cache, actor.id, actor.orgId, actor.role, enabled, client]);
  return (
    <CallContext.Provider value={actor.role === 'Caregiver' ? client : null}>
      {children}
      {enabled && actor.role === 'Caregiver' && <CallPanel client={client} />}
    </CallContext.Provider>
  );
}

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runtime } from '../configs/runtime';
import { apiAccessToken } from '../services/api/adapter';
import { hubUrl, startSignalR, refreshRealtimeQueries } from '../services/realtime/signalr';
import type { Person } from '../models/domain';
export function ApiRealtime({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const url = hubUrl(runtime.signalRUrl, runtime.apiBaseUrl, window.location.protocol);
  useEffect(() => {
    if (!url) return;
    return startSignalR(
      url,
      apiAccessToken,
      () => {
        void refreshRealtimeQueries(cache, { id: actor.id, orgId: actor.orgId });
      },
      (next) => {
        if (next === 'connected')
          void cache.invalidateQueries({ queryKey: ['session'] }, { cancelRefetch: false });
      },
    );
  }, [url, cache, actor.id, actor.orgId]);
  return null;
}

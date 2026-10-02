import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runtime } from '../configs/runtime';
import { apiAccessToken } from '../services/api/adapter';
import {
  hubUrl,
  startSignalR,
  refreshRealtimeQueries,
  type RealtimeState,
} from '../services/realtime/signalr';
import type { Person } from '../models/domain';
export function ApiRealtime({ actor }: { actor: Person }) {
  const cache = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RealtimeState>('connecting');
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
        setState(next);
        if (next === 'connected')
          void cache.invalidateQueries({ queryKey: ['session'] }, { cancelRefetch: false });
      },
    );
  }, [url, cache, actor.id, actor.orgId, attempt]);
  const labels = {
    connecting: 'Đang kết nối realtime…',
    connected: 'Đã kết nối realtime · Độ mới GPS theo thời gian thiết bị ghi nhận.',
    reconnecting: 'Đang nối lại realtime · Vẫn tải dữ liệu định kỳ.',
    disconnected: 'Realtime chưa kết nối · Vẫn tải dữ liệu định kỳ.',
  };
  return (
    <div className="demo-strip">
      <span aria-live="polite">
        {url ? labels[state] : 'Chưa có địa chỉ SignalR hợp lệ · Vẫn tải dữ liệu định kỳ.'}
      </span>
      {url && state === 'disconnected' && (
        <button className="btn small" onClick={() => setAttempt((v) => v + 1)}>
          Kết nối lại realtime
        </button>
      )}
    </div>
  );
}

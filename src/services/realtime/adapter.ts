import { service } from '../index';
export type Connection = 'connected' | 'disconnected' | 'reconnecting' | 'unconfigured';
export interface RealtimeClient {
  start(onData: () => void, onState: (state: Connection) => void): () => void;
  disconnect(): void;
  reconnect(): void;
}
export function createRealtimeClient(): RealtimeClient {
  let timer: ReturnType<typeof setInterval> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let active = false;
  let generation = 0;
  let state: Connection = 'disconnected';
  let data = () => {};
  let status: (s: Connection) => void = () => {};
  const stop = () => {
    if (timer) clearInterval(timer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    timer = undefined;
    reconnectTimer = undefined;
  };
  const connect = () => {
    if (!active) return;
    state = 'connected';
    status(state);
    data();
    timer = setInterval(async () => {
      const epoch = generation;
      try {
        await service.execute({ type: 'simulate', event: 'tick' });
        if (active && epoch === generation) data();
      } catch {
        if (active && epoch === generation) {
          state = 'disconnected';
          status(state);
          stop();
        }
      }
    }, 15000);
  };
  return {
    start(onData, onState) {
      active = true;
      data = onData;
      status = onState;
      if (service.mode === 'api') {
        state = 'unconfigured';
        status(state);
      } else connect();
      return () => {
        active = false;
        generation++;
        stop();
      };
    },
    disconnect() {
      generation++;
      stop();
      state = 'disconnected';
      status(state);
    },
    reconnect() {
      if (service.mode === 'api') return;
      generation++;
      stop();
      state = 'reconnecting';
      status(state);
      reconnectTimer = setTimeout(connect, 1500);
    },
  };
}
/** Integration TODO: /hubs/location is documented; verify auth, event payloads and authorized subscription methods before implementing API transport. */
export function acceptVersion(seen: Map<string, number>, id: string, version: number) {
  if ((seen.get(id) ?? -1) >= version) return false;
  seen.set(id, version);
  return true;
}

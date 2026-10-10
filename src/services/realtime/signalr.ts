import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr';
import { z } from 'zod';
import type { QueryClient } from '@tanstack/react-query';
import type { Person } from '../../models/domain';
export type RealtimeState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type Scope = Pick<Person, 'id' | 'orgId'>;
const uuid = z.string().uuid();
const date = z.string().datetime({ offset: true });
const schemas = {
  LocationUpdated: z.object({ viuId: uuid, recordedAt: date }),
  EmergencyAlert: z.object({ viuId: uuid, eventId: uuid, sentAt: date }),
  EscalationSuggestion: z.object({
    viuId: uuid,
    eventId: uuid,
    sentAt: date,
    minutesElapsed: z.number().int().nonnegative(),
  }),
  GeofenceBreach: z.object({ viuId: uuid, geofenceId: uuid, occurredAt: date }),
};
export type HubEvent = keyof typeof schemas;
export function hubUrl(configured: string, base: string, pageProtocol: string) {
  try {
    const url = new URL(configured || base.replace(/\/$/, '') + '/hubs/location');
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (pageProtocol === 'https:' && url.protocol !== 'https:')
    )
      return '';
    return url.href;
  } catch {
    return '';
  }
}
export function createEventFilter() {
  const seen = new Map<string, number>();
  return (name: HubEvent, value: unknown) => {
    const result = schemas[name].safeParse(value);
    if (!result.success) return false;
    const data = result.data;
    const key =
      name +
      ':' +
      ('eventId' in data ? data.eventId : 'geofenceId' in data ? data.geofenceId : data.viuId);
    const version =
      'recordedAt' in data
        ? Date.parse(data.recordedAt)
        : 'occurredAt' in data
          ? Date.parse(data.occurredAt)
          : Date.parse(data.sentAt) +
            ('minutesElapsed' in data && typeof data.minutesElapsed === 'number'
              ? data.minutesElapsed * 60000
              : 0);
    if ((seen.get(key) ?? -Infinity) >= version) return false;
    seen.delete(key);
    seen.set(key, version);
    // ponytail: remember 512 event keys per connection; evicted duplicates only trigger a safe REST refresh.
    if (seen.size > 512) seen.delete(seen.keys().next().value!);
    return true;
  };
}
export function refreshRealtimeQueries(cache: QueryClient, scope: Scope) {
  return cache.invalidateQueries(
    {
      predicate: (q) =>
        [
          'api-tracking-users',
          'api-location-live',
          'api-location-history',
          'api-alerts',
          'api-alert-detail',
          'api-alert-permission',
        ].includes(String(q.queryKey[0])) &&
        q.queryKey[1] === scope.id &&
        q.queryKey[2] === scope.orgId,
    },
    { cancelRefetch: false },
  );
}
export function startSignalR(
  url: string,
  accessToken: () => Promise<string>,
  onData: () => void,
  onState: (state: RealtimeState) => void,
  attach?: (connection: HubConnection) => () => void,
) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const accept = createEventFilter();
  const connection = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: async () => {
        if (!active) throw Error('Connection stopped');
        const token = await accessToken();
        if (!active) throw Error('Connection stopped');
        return token;
      },
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.None)
    .build();
  const refresh = () => {
    if (!active || timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (active) onData();
    }, 250);
  };
  const handlers = (Object.keys(schemas) as HubEvent[]).map((name) => {
    const handler = (value: unknown) => {
      if (active && accept(name, value)) refresh();
    };
    connection.on(name, handler);
    return { name, handler };
  });
  const detach = attach?.(connection);
  connection.onreconnecting(() => {
    if (active) onState('reconnecting');
  });
  connection.onreconnected(() => {
    if (active) {
      onState('connected');
      refresh();
    }
  });
  connection.onclose(() => {
    if (active) onState('disconnected');
  });
  onState('connecting');
  void connection
    .start()
    .then(() => {
      if (active) {
        onState('connected');
        refresh();
      } else void connection.stop().catch(() => {});
    })
    .catch(() => {
      if (active) onState('disconnected');
    });
  return () => {
    active = false;
    detach?.();
    if (timer) clearTimeout(timer);
    handlers.forEach(({ name, handler }) => connection.off(name, handler));
    void connection.stop().catch(() => {});
  };
}

import { z } from 'zod';
import type { HubConnection } from '@microsoft/signalr';
import type { Person } from '../../models/domain';
import type { CallSession, createCallsApi } from '../api/calls';
import type { RealtimeState } from './signalr';

const id = z.string().uuid();
const events = {
  WebRtcIncomingCall: z.object({
    sessionId: id,
    callerName: z.string(),
    triggerType: z.enum(['CaregiverInitiated', 'ViuVoiceCommand', 'SosAuto']),
    receiverRole: z.literal('video_viewer_audio_sender'),
  }),
  WebRtcCallAccepted: z.object({
    sessionId: id,
    receiverRole: z.literal('video_viewer_audio_sender'),
  }),
  WebRtcCallEnded: z.object({ sessionId: id, reason: z.string() }),
  WebRtcCallRejected: z.object({ sessionId: id }),
  WebRtcOffer: z.object({ sessionId: id, sdp: z.string().min(1).max(262144) }),
  WebRtcIceCandidate: z.object({ sessionId: id, candidateJson: z.string().max(16384) }),
};
const candidateSchema = z.object({
  candidate: z.string().max(16384),
  sdpMid: z.string().nullable().optional(),
  sdpMLineIndex: z.number().int().nonnegative().nullable().optional(),
  usernameFragment: z.string().nullable().optional(),
});
export type CallView = {
  network: RealtimeState;
  phase: 'idle' | 'preparing' | 'incoming' | 'ringing' | 'connecting' | 'connected' | 'ended';
  name: string;
  sessionId: string;
  viuId: string;
  message: string;
  muted: boolean;
  remote: MediaStream | null;
};
type Api = ReturnType<typeof createCallsApi>;
type CallHub = Pick<HubConnection, 'on' | 'off'> & {
  invoke: (method: string, sessionId: string, payload: string) => Promise<unknown>;
};
type Dependencies = {
  api: Api;
  actor: Person;
  changed: () => void;
  media?: () => Promise<MediaStream>;
  peer?: (config: RTCConfiguration) => RTCPeerConnection;
  lock?: () => Promise<() => void>;
};
// Hold a per-account browser lock until media is closed; another tab must not answer too.
async function browserLock(userId: string): Promise<() => void> {
  if (!navigator.locks)
    throw Error('Trình duyệt chưa hỗ trợ khóa cuộc gọi. Hãy dùng Chrome hoặc Edge mới.');
  return new Promise((resolve, reject) => {
    void navigator.locks
      .request(`visionaid.call.${userId}`, { ifAvailable: true }, (lock) => {
        if (!lock) {
          reject(Error('Cuộc gọi đang được xử lý ở tab khác.'));
          return;
        }
        return new Promise<void>((release) => resolve(release));
      })
      .catch(reject);
  });
}
export function createCallClient({
  api,
  actor,
  changed,
  media = () => navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
  peer = (config) => new RTCPeerConnection(config),
  lock = () => browserLock(actor.id),
}: Dependencies) {
  let view: CallView = {
    network: 'disconnected',
    phase: 'idle',
    name: '',
    sessionId: '',
    viuId: '',
    message: '',
    muted: false,
    remote: null,
  };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<CallView>) => {
    view = { ...view, ...patch };
    listeners.forEach((fn) => fn());
  };
  let generation = 0;
  let enabled = false;
  let hub: CallHub | undefined;
  let pc: RTCPeerConnection | undefined;
  let stream: MediaStream | undefined;
  let release: (() => void) | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let polling: ReturnType<typeof setInterval> | undefined;
  let syncing = false;
  let busy = false;
  let queue: Array<{ name: keyof typeof events; value: unknown }> = [];
  let ice: RTCIceCandidateInit[] = [];
  let chain = Promise.resolve();
  const closed = new Set<string>();
  const active = () => !['idle', 'ended'].includes(view.phase);
  const current = (epoch: number) => enabled && epoch === generation;
  const cleanup = () => {
    generation++;
    if (timeout) clearTimeout(timeout);
    if (polling) clearInterval(polling);
    timeout = polling = undefined;
    pc?.close();
    pc = undefined;
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    release?.();
    release = undefined;
    queue = [];
    ice = [];
    busy = false;
    syncing = false;
  };
  const finish = (message: string) => {
    if (view.sessionId) closed.add(view.sessionId);
    if (closed.size > 128) closed.delete(closed.values().next().value!);
    cleanup();
    update({ phase: 'ended', message, remote: null, muted: false });
    changed();
  };
  async function end(message = 'Đã kết thúc cuộc gọi.', reason = 'user_hangup') {
    if (!active()) return;
    const sessionId = view.sessionId;
    finish(message);
    const epoch = generation;
    if (sessionId) {
      try {
        await api.end(sessionId, reason);
      } catch {
        if (current(epoch))
          update({
            message: message + ' Chưa xác nhận kết thúc trên máy chủ. Kiểm tra lại lịch sử.',
          });
      }
      changed();
    }
  }
  const fail = () =>
    end('Không thể kết nối âm thanh hoặc hình ảnh. Hãy thử gọi lại.', 'connection_failed');
  const relay = async (method: string, value: string, epoch: number) => {
    if (!current(epoch) || !hub || view.network !== 'connected') return;
    await hub.invoke(method, view.sessionId, value);
  };
  const filters = (viuId = '') => ({ viuUserId: viuId, dateFrom: '', dateTo: '' });
  async function sync() {
    if (!active() || !view.sessionId || syncing || busy) return;
    syncing = true;
    const epoch = generation;
    try {
      const result = await api.history(actor, 1, filters(view.viuId));
      if (!current(epoch)) return;
      const call = result.items.find((item) => item.sessionId === view.sessionId);
      if (!call) {
        await end('Không còn xác minh được phiên gọi.', 'session_unavailable');
        return;
      }
      if (['Ended', 'Missed', 'Rejected'].includes(call.status)) {
        finish(
          call.status === 'Missed'
            ? 'Cuộc gọi không được trả lời.'
            : call.status === 'Rejected'
              ? 'Cuộc gọi đã bị từ chối.'
              : 'Cuộc gọi đã kết thúc.',
        );
        return;
      }
      if (call.status === 'Connected' && view.phase === 'incoming') {
        finish('Cuộc gọi đã được nhận trên thiết bị khác.');
        return;
      }
      await api.authorize(actor, view.viuId);
      if (current(epoch))
        update({
          message: view.phase === 'connected' ? 'Âm thanh và hình ảnh đã kết nối.' : view.message,
        });
    } catch {
      if (current(epoch))
        await end(
          'Không thể xác minh quyền hoặc trạng thái cuộc gọi.',
          'permission_or_network_lost',
        );
    } finally {
      if (current(epoch)) syncing = false;
    }
  }
  function watch() {
    if (polling) clearInterval(polling);
    polling = setInterval(() => {
      void sync();
    }, 10000);
    if (timeout) clearTimeout(timeout);
    // Local setup watchdog, not the server's configurable ring timeout or Missed status.
    timeout = setTimeout(() => {
      if (view.phase === 'incoming')
        finish('Cuộc gọi đến đã đóng. Xem lịch sử để kiểm tra trạng thái.');
      else void end('Chờ kết nối quá lâu. Hãy thử gọi lại.', 'client_setup_timeout');
    }, 60000);
  }
  async function acquire(epoch: number) {
    const unlock = await lock();
    if (!current(epoch)) {
      unlock();
      return false;
    }
    release = unlock;
    const tracks = await media();
    if (!current(epoch)) {
      tracks.getTracks().forEach((track) => track.stop());
      return false;
    }
    stream = tracks;
    if (!tracks.getAudioTracks().length) throw Error('Không tìm thấy micro hoạt động.');
    tracks.getAudioTracks().forEach((track) => {
      track.onended = () => {
        if (current(epoch)) void end('Micro đã ngắt kết nối.', 'microphone_lost');
      };
    });
    return true;
  }
  function prepare(session: CallSession, epoch: number) {
    if (!current(epoch) || !stream) return;
    pc = peer({
      iceServers: session.iceServers.map((server) => ({
        urls: server.urls,
        ...(server.username ? { username: server.username } : {}),
        ...(server.credential ? { credential: server.credential } : {}),
      })),
    });
    const connection = pc;
    stream.getAudioTracks().forEach((track) => connection.addTrack(track, stream!));
    const remote = new MediaStream();
    connection.ontrack = (event) => {
      if (!current(epoch)) return;
      remote.addTrack(event.track);
      update({ remote });
    };
    connection.onicecandidate = (event) => {
      if (event.candidate && current(epoch))
        void relay('RelayIceCandidate', JSON.stringify(event.candidate.toJSON()), epoch).catch(
          () => {
            if (current(epoch)) void fail();
          },
        );
    };
    connection.onconnectionstatechange = () => {
      if (!current(epoch)) return;
      if (connection.connectionState === 'connected') {
        if (timeout) clearTimeout(timeout);
        update({ phase: 'connected', message: 'Âm thanh và hình ảnh đã kết nối.' });
      } else if (['failed', 'disconnected'].includes(connection.connectionState)) void fail();
    };
  }
  async function process(name: keyof typeof events, value: unknown) {
    const parsed = events[name].safeParse(value);
    if (!parsed.success || !enabled || actor.role !== 'Caregiver') return;
    const data = parsed.data;
    if (name === 'WebRtcIncomingCall') {
      const incoming = events.WebRtcIncomingCall.parse(value);
      if (active() || busy || closed.has(data.sessionId)) return;
      busy = true;
      const epoch = generation;
      try {
        const history = await api.history(actor, 1, filters());
        if (!current(epoch) || active()) return;
        const call = history.items.find(
          (item) =>
            item.sessionId === data.sessionId &&
            item.receiverId === actor.id &&
            ['Initiated', 'Ringing'].includes(item.status),
        );
        if (!call?.viuUserId) return;
        update({
          phase: 'incoming',
          sessionId: call.sessionId,
          viuId: call.viuUserId,
          name: incoming.callerName || 'Người được chăm sóc',
          message:
            incoming.triggerType === 'SosAuto'
              ? 'Cuộc gọi SOS đến. Chọn nhận để bật micro.'
              : 'Cuộc gọi đến. Chọn nhận để bật micro.',
          remote: null,
        });
        watch();
      } catch {
        /* An unverified event must never open media or an actionable call. */
      } finally {
        if (current(epoch)) busy = false;
      }
      return;
    }
    if (!active() || data.sessionId !== view.sessionId) return;
    if (name === 'WebRtcCallEnded' || name === 'WebRtcCallRejected') {
      finish(name === 'WebRtcCallRejected' ? 'Cuộc gọi đã bị từ chối.' : 'Cuộc gọi đã kết thúc.');
      return;
    }
    if (name === 'WebRtcCallAccepted') {
      if (view.phase === 'ringing')
        update({ phase: 'connecting', message: 'Đã chấp nhận, đang chờ âm thanh và hình ảnh…' });
      return;
    }
    if (!pc || view.phase === 'incoming') {
      if (queue.length < 128) queue.push({ name, value });
      return;
    }
    const connection = pc;
    const epoch = generation;
    if (name === 'WebRtcOffer') {
      const offer = events.WebRtcOffer.parse(value);
      if (connection.remoteDescription?.sdp === offer.sdp) return;
      await connection.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
      if (!current(epoch)) return;
      for (const candidate of ice.splice(0)) {
        await connection.addIceCandidate(candidate);
        if (!current(epoch)) return;
      }
      const answer = await connection.createAnswer();
      if (!current(epoch)) return;
      await connection.setLocalDescription(answer);
      if (current(epoch)) await relay('RelayAnswer', answer.sdp!, epoch);
    } else if (name === 'WebRtcIceCandidate') {
      const candidate = candidateSchema.parse(
        JSON.parse(events.WebRtcIceCandidate.parse(value).candidateJson),
      );
      if (connection.remoteDescription) await connection.addIceCandidate(candidate);
      else if (ice.length < 128) ice.push(candidate);
    }
  }
  function receive(name: keyof typeof events, value: unknown) {
    if (!enabled) return;
    if (busy && !view.sessionId && view.phase === 'preparing') {
      if (queue.length < 128 && name !== 'WebRtcIncomingCall') queue.push({ name, value });
      return;
    }
    const epoch = generation;
    chain = chain
      .then(() => {
        if (current(epoch)) return process(name, value);
      })
      .catch(() => {
        if (current(epoch)) void fail();
      });
  }
  function flush() {
    const pending = queue.splice(0);
    pending.forEach((event) => receive(event.name, event.value));
  }
  async function begin(viuId: string, name: string, incoming = false) {
    if (
      !enabled ||
      view.network !== 'connected' ||
      busy ||
      (active() && !(incoming && view.phase === 'incoming'))
    )
      return;
    if (!incoming) cleanup();
    const epoch = generation;
    busy = true;
    let requested = false;
    let confirmed = false;
    update({
      phase: 'preparing',
      viuId,
      name,
      message: 'Đang xin quyền micro…',
      ...(incoming ? {} : { sessionId: '' }),
    });
    try {
      await api.authorize(actor, viuId);
      if (!current(epoch) || !(await acquire(epoch))) return;
      update({ message: 'Đang tạo kết nối…' });
      requested = true;
      const session = incoming
        ? await api.accept(view.sessionId)
        : await api.initiate(actor, viuId);
      if (!current(epoch)) {
        // The request can commit after the user cancels; do not leave it ringing.
        if (enabled) void api.end(session.sessionId, 'client_cancelled').catch(() => {});
        return;
      }
      confirmed = true;
      update({
        sessionId: session.sessionId,
        phase: incoming ? 'connecting' : 'ringing',
        message: incoming ? 'Đang chờ âm thanh và hình ảnh…' : 'Đang đổ chuông…',
      });
      prepare(session, epoch);
      busy = false;
      watch();
      flush();
      changed();
    } catch (error) {
      if (current(epoch)) {
        const message =
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Bạn chưa cho phép micro. Hãy cấp quyền rồi thử lại.'
            : error instanceof Error
              ? error.message
              : 'Không thể bắt đầu cuộc gọi.';
        if (incoming && !confirmed) {
          // A rejected accept may belong to another device; never end its media session.
          cleanup();
          update({ phase: requested ? 'ended' : 'incoming', message, remote: null });
          if (!requested) watch();
          changed();
        } else await end(message, 'client_setup_failed');
      }
    } finally {
      if (current(epoch)) busy = false;
    }
  }
  return {
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    snapshot: () => view,
    attach(connection: CallHub) {
      enabled = true;
      hub = connection;
      const handlers = (Object.keys(events) as Array<keyof typeof events>).map((name) => {
        const handler = (value: unknown) => receive(name, value);
        connection.on(name, handler);
        return { name, handler };
      });
      return () => {
        const sessionId = active() && view.phase !== 'incoming' ? view.sessionId : '';
        enabled = false;
        cleanup();
        if (sessionId) void api.end(sessionId, 'client_left').catch(() => {});
        hub = undefined;
        handlers.forEach(({ name, handler }) => connection.off(name, handler));
        update({
          phase: 'idle',
          network: 'disconnected',
          remote: null,
          sessionId: '',
          name: '',
          viuId: '',
          message: '',
        });
      };
    },
    network(state: RealtimeState) {
      update({ network: state });
      if (state !== 'connected' && active())
        void end(
          'Mất kết nối cuộc gọi. Micro đã tắt; hãy gọi lại khi mạng ổn định.',
          'signaling_lost',
        );
    },
    start: (viuId: string, name: string) => begin(viuId, name),
    accept: () => begin(view.viuId, view.name, true),
    async reject() {
      if (view.phase !== 'incoming' || busy) return;
      const sessionId = view.sessionId;
      finish('Đã đóng cuộc gọi đến.');
      const epoch = generation;
      try {
        await api.reject(sessionId);
      } catch {
        if (current(epoch))
          update({ message: 'Chưa xác nhận từ chối trên máy chủ. Kiểm tra lại lịch sử.' });
      }
      changed();
    },
    end,
    mute() {
      const muted = !view.muted;
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      update({ muted });
    },
    dismiss() {
      if (!active()) update({ phase: 'idle', message: '', sessionId: '', name: '', viuId: '' });
    },
  };
}
export type CallClient = ReturnType<typeof createCallClient>;

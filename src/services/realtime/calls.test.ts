import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCallClient } from './calls';
import type { Person } from '../../models/domain';
import type { CallSession, createCallsApi } from '../api/calls';

const userId = '01900000-0000-7000-8000-000000000001';
const viuId = '01900000-0000-7000-8000-000000000002';
const sessionId = '01900000-0000-7000-8000-000000000003';
const actor: Person = {
  id: userId,
  orgId: '',
  role: 'Caregiver',
  name: 'Test',
  email: '',
  phone: '',
  active: true,
};
const session: CallSession = {
  sessionId,
  status: 'Ringing',
  myRole: 'video_viewer_audio_sender',
  iceServers: [{ urls: 'turn:relay.test', username: 'temporary', credential: 'fixture' }],
};
const settle = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'MediaStream',
    class {
      addTrack = vi.fn();
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function fixture() {
  const track = { stop: vi.fn(), enabled: true };
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
  const connection = {
    addTrack: vi.fn(),
    close: vi.fn(),
    addIceCandidate: vi.fn(async () => {}),
    remoteDescription: null as RTCSessionDescriptionInit | null,
    setRemoteDescription: vi.fn(async (description: RTCSessionDescriptionInit) => {
      connection.remoteDescription = description;
    }),
    createAnswer: vi.fn(async () => ({ type: 'answer', sdp: 'answer' })),
    setLocalDescription: vi.fn(async () => {}),
    connectionState: 'new',
    onconnectionstatechange: () => {},
    onicecandidate: () => {},
  };
  const handlers = new Map<string, (value: unknown) => void>();
  const hub = {
    on: (name: string, handler: (value: unknown) => void) => {
      handlers.set(name, handler);
    },
    off: (name: string) => {
      handlers.delete(name);
    },
    invoke: vi.fn(async () => {}),
  };
  const call = {
    sessionId,
    status: 'Ringing',
    receiverId: userId,
    initiatorId: null,
    triggerType: 'SosAuto',
    viuUserId: viuId,
  };
  const api = {
    authorize: vi.fn(async () => {}),
    initiate: vi.fn(async () => session),
    accept: vi.fn(async () => ({ ...session, status: 'Connected' })),
    reject: vi.fn(async () => {}),
    end: vi.fn(async () => {}),
    history: vi.fn(async () => ({ items: [call] })),
  };
  const media = vi.fn(async () => stream);
  const release = vi.fn();
  const lock = vi.fn(async () => release);
  const peer = vi.fn(() => connection as unknown as RTCPeerConnection);
  const client = createCallClient({
    actor,
    api: api as unknown as ReturnType<typeof createCallsApi>,
    changed: vi.fn(),
    media,
    peer,
    lock,
  });
  const stop = client.attach(hub);
  client.network('connected');
  const emit = (name: string, payload: object = {}) =>
    handlers.get(name)?.({ sessionId, ...payload });
  return {
    client,
    stop,
    emit,
    api,
    call,
    track,
    stream,
    media,
    peer,
    connection,
    hub,
    handlers,
    lock,
    release,
  };
}
it('answers Mobile offers, queues early ICE, ignores foreign sessions and deduplicates SDP', async () => {
  const f = fixture();
  await f.client.start(viuId, 'VIU');
  expect(f.client.snapshot().phase).toBe('ringing');
  f.emit('WebRtcCallAccepted', { receiverRole: 'video_viewer_audio_sender' });
  f.emit('WebRtcIceCandidate', {
    candidateJson: JSON.stringify({ candidate: 'candidate', sdpMid: '0' }),
  });
  f.emit('WebRtcOffer', { sessionId: userId, sdp: 'foreign' });
  await settle();
  expect(f.connection.addIceCandidate).not.toHaveBeenCalled();
  expect(f.client.snapshot().phase).toBe('connecting');
  f.emit('WebRtcOffer', { sdp: 'offer' });
  f.emit('WebRtcOffer', { sdp: 'offer' });
  await settle();
  expect(f.connection.setRemoteDescription).toHaveBeenCalledTimes(1);
  expect(f.connection.addIceCandidate).toHaveBeenCalledTimes(1);
  expect(f.hub.invoke).toHaveBeenCalledWith('RelayAnswer', sessionId, 'answer');
  expect(f.client.snapshot().phase).not.toBe('connected');
  f.connection.connectionState = 'connected';
  f.connection.onconnectionstatechange();
  expect(f.client.snapshot().phase).toBe('connected');
  f.client.mute();
  expect(f.track.enabled).toBe(false);
  await f.client.end();
  expect(f.track.stop).toHaveBeenCalled();
  expect(f.connection.close).toHaveBeenCalled();
  expect(f.release).toHaveBeenCalled();
  f.stop();
  expect(f.handlers.size).toBe(0);
});
it('stops late microphone grants after cancel without creating a server session', async () => {
  const f = fixture();
  let grant!: (stream: MediaStream) => void;
  f.media.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        grant = resolve;
      }),
  );
  const pending = f.client.start(viuId, 'VIU');
  await settle();
  await f.client.end();
  grant(f.stream);
  await pending;
  expect(f.track.stop).toHaveBeenCalled();
  expect(f.api.initiate).not.toHaveBeenCalled();
  f.stop();
});
it('closes a session whose create response arrives after cancellation', async () => {
  const f = fixture();
  let resolve!: (value: CallSession) => void;
  f.api.initiate.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = f.client.start(viuId, 'VIU');
  await settle();
  await f.client.end();
  resolve(session);
  await pending;
  expect(f.api.end).toHaveBeenCalledWith(sessionId, 'client_cancelled');
  expect(f.peer).not.toHaveBeenCalled();
  f.stop();
});
it('buffers signals that beat the outgoing REST response', async () => {
  const f = fixture();
  let resolve!: (value: CallSession) => void;
  f.api.initiate.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = f.client.start(viuId, 'VIU');
  await settle();
  f.emit('WebRtcOffer', { sdp: 'early-offer' });
  resolve(session);
  await pending;
  await settle();
  expect(f.hub.invoke).toHaveBeenCalledWith('RelayAnswer', sessionId, 'answer');
  f.stop();
});
it('requires incoming membership and explicit acceptance before opening microphone', async () => {
  const f = fixture();
  const incoming = {
    callerName: 'VIU',
    triggerType: 'SosAuto',
    receiverRole: 'video_viewer_audio_sender',
  };
  f.emit('WebRtcIncomingCall', incoming);
  await settle();
  expect(f.client.snapshot().phase).toBe('incoming');
  expect(f.media).not.toHaveBeenCalled();
  f.emit('WebRtcOffer', { sdp: 'offer-before-accept' });
  await settle();
  expect(f.peer).not.toHaveBeenCalled();
  await f.client.accept();
  await settle();
  expect(f.api.accept).toHaveBeenCalledWith(sessionId);
  expect(f.hub.invoke).toHaveBeenCalledWith('RelayAnswer', sessionId, 'answer');
  f.emit('WebRtcCallEnded', { reason: 'remote_hangup' });
  await settle();
  f.emit('WebRtcIncomingCall', incoming);
  await settle();
  expect(f.client.snapshot().phase).toBe('ended');
  expect(f.track.stop).toHaveBeenCalled();
  f.stop();
});
it('rejects without requesting media and ignores incoming sessions owned by another receiver', async () => {
  const f = fixture();
  const incoming = {
    callerName: 'VIU',
    triggerType: 'ViuVoiceCommand',
    receiverRole: 'video_viewer_audio_sender',
  };
  f.call.receiverId = viuId;
  f.emit('WebRtcIncomingCall', incoming);
  await settle();
  expect(f.client.snapshot().phase).toBe('idle');
  f.call.receiverId = userId;
  f.emit('WebRtcIncomingCall', incoming);
  await settle();
  await f.client.reject();
  expect(f.api.reject).toHaveBeenCalledWith(sessionId);
  expect(f.media).not.toHaveBeenCalled();
  f.stop();
});
it('cleans media on disconnect and never revives it on reconnect', async () => {
  const f = fixture();
  await f.client.start(viuId, 'VIU');
  f.client.network('reconnecting');
  await settle();
  f.client.network('connected');
  f.emit('WebRtcOffer', { sdp: 'stale-offer' });
  await settle();
  expect(f.track.stop).toHaveBeenCalled();
  expect(f.client.snapshot().phase).toBe('ended');
  expect(f.connection.setRemoteDescription).not.toHaveBeenCalled();
  f.stop();
});
it('handles denied mic and tab lock without sending an initiation', async () => {
  const f = fixture();
  f.media.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));
  await f.client.start(viuId, 'VIU');
  expect(f.client.snapshot().message).toContain('chưa cho phép micro');
  f.lock.mockRejectedValueOnce(Error('tab khác'));
  await f.client.start(viuId, 'VIU');
  expect(f.api.initiate).not.toHaveBeenCalled();
  expect(f.release).toHaveBeenCalled();
  f.stop();
});
it('does not terminate another device session when accepting fails or another tab owns media', async () => {
  const f = fixture();
  const incoming = {
    callerName: 'VIU',
    triggerType: 'SosAuto',
    receiverRole: 'video_viewer_audio_sender',
  };
  f.emit('WebRtcIncomingCall', incoming);
  await settle();
  f.lock.mockRejectedValueOnce(Error('tab khác'));
  await f.client.accept();
  expect(f.client.snapshot().phase).toBe('incoming');
  expect(f.api.end).not.toHaveBeenCalled();
  f.api.accept.mockRejectedValueOnce(Error('Already connected'));
  await f.client.accept();
  expect(f.client.snapshot().phase).toBe('ended');
  expect(f.api.end).not.toHaveBeenCalled();
  expect(f.track.stop).toHaveBeenCalled();
  f.stop();
});
it('polls authoritative status and closes when access is revoked', async () => {
  const f = fixture();
  await f.client.start(viuId, 'VIU');
  f.api.authorize.mockRejectedValueOnce(Error('revoked'));
  await vi.advanceTimersByTimeAsync(10000);
  expect(f.track.stop).toHaveBeenCalled();
  expect(f.client.snapshot().phase).toBe('ended');
  f.stop();
});
it('retains the local end result when server end fails and stops pending media on logout', async () => {
  const f = fixture();
  await f.client.start(viuId, 'VIU');
  f.api.end.mockRejectedValueOnce(Error('offline'));
  await f.client.end();
  expect(f.client.snapshot().message).toContain('Chưa xác nhận');
  await f.client.start(viuId, 'VIU');
  f.stop();
  expect(f.client.snapshot().remote).toBeNull();
  expect(f.client.snapshot().sessionId).toBe('');
  expect(f.track.stop).toHaveBeenCalled();
});

it('recovers voice calls once from REST without autoaccepting and ignores late terminal events', async () => {
  const f = fixture();
  f.call.triggerType = 'ViuVoiceCommand';
  await Promise.all([f.client.recover(), f.client.recover()]);
  expect(f.api.history).toHaveBeenCalledTimes(1);
  expect(f.client.snapshot().message).toContain('giọng nói');
  expect(f.media).not.toHaveBeenCalled();
  expect(f.api.accept).not.toHaveBeenCalled();
  f.emit('WebRtcCallEnded', { reason: 'Missed' });
  await settle();
  f.client.dismiss();
  await settle();
  expect(f.client.snapshot().phase).toBe('idle');
  f.stop();
});
it('does not revive terminal-before-incoming or failed/foreign recovery', async () => {
  const f = fixture();
  f.emit('WebRtcCallEnded', { reason: 'Missed' });
  await settle();
  await f.client.recover();
  expect(f.client.snapshot().phase).toBe('idle');
  f.call.sessionId = viuId;
  f.call.receiverId = viuId;
  await f.client.recover();
  expect(f.client.snapshot().phase).toBe('idle');
  f.api.history.mockRejectedValueOnce(Error('402'));
  await f.client.recover();
  expect(f.api.end).not.toHaveBeenCalled();
  expect(f.media).not.toHaveBeenCalled();
  f.stop();
});
it('keeps active media when another incoming arrives and recovers it after dismissal', async () => {
  const f = fixture();
  await f.client.start(viuId, 'VIU');
  f.call.sessionId = viuId;
  f.emit('WebRtcIncomingCall', {
    sessionId: viuId,
    callerName: 'SOS',
    triggerType: 'SosAuto',
    receiverRole: 'video_viewer_audio_sender',
  });
  await settle();
  expect(f.client.snapshot().pending).toBe(true);
  expect(f.client.snapshot().sessionId).toBe(sessionId);
  expect(f.track.stop).not.toHaveBeenCalled();
  await f.client.end();
  f.client.dismiss();
  await settle();
  expect(f.client.snapshot().sessionId).toBe(viuId);
  expect(f.client.snapshot().phase).toBe('incoming');
  f.stop();
});

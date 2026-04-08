import { Injectable } from '@angular/core';

interface PeerState {
  pc: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
  audioEl: HTMLAudioElement;
}

@Injectable({ providedIn: 'root' })
export class VoiceSignalingService {

  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private peers = new Map<string, PeerState>();

  private channelId = '';
  private userId = '';

  private readonly iceConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  get isActive(): boolean {
    return this.ws !== null;
  }

  get peerCount(): number {
    return this.peers.size;
  }

  async start(channelId: string, userId: string): Promise<void> {
    if (this.isActive) return;

    this.channelId = channelId;
    this.userId = userId;
    this.audioChunks = [];

    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Start MediaRecorder to capture a local copy of what is being transmitted
    this.mediaRecorder = new MediaRecorder(this.localStream);
    this.mediaRecorder.ondataavailable = (evt) => {
      if (evt.data.size > 0) this.audioChunks.push(evt.data);
    };
    this.mediaRecorder.start(100); // collect in 100 ms chunks

    this.ws = new WebSocket('ws://localhost:8082/ws/voice');

    this.ws.onopen = () => {
      this.send({ type: 'JOIN', channelId, fromUserId: userId });
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    this.ws.onerror = (e) => console.error('Voice WS error', e);
    this.ws.onclose = () => this.cleanupPeers();
  }

  /** Stops recording, returns the recorded Blob (or null if nothing was captured). */
  stop(): Promise<Blob | null> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'LEAVE', channelId: this.channelId, fromUserId: this.userId });
    }
    this.ws?.close();
    this.ws = null;

    this.cleanupPeers();

    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.releaseStream();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = this.audioChunks.length > 0
          ? new Blob(this.audioChunks, { type: mimeType })
          : null;
        this.audioChunks = [];
        this.releaseStream();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  private releaseStream(): void {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.mediaRecorder = null;
  }

  private cleanupPeers(): void {
    this.peers.forEach((state) => {
      state.pc.close();
      state.audioEl.srcObject = null;
      state.audioEl.remove();
    });
    this.peers.clear();
  }

  private send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: any): void {
    if (msg.targetUserId && msg.targetUserId !== this.userId) return;

    switch (msg.type as string) {
      case 'PEERS':
        break;
      case 'JOINED':
        if (msg.fromUserId !== this.userId) this.createOffer(msg.fromUserId);
        break;
      case 'LEFT':
        this.closePeer(msg.fromUserId);
        break;
      case 'OFFER':
        this.handleOffer(msg.fromUserId, msg.data);
        break;
      case 'ANSWER':
        this.handleAnswer(msg.fromUserId, msg.data);
        break;
      case 'ICE':
        this.handleIce(msg.fromUserId, msg.data);
        break;
    }
  }

  private makePeer(peerId: string): PeerState {
    const pc = new RTCPeerConnection(this.iceConfig);
    const audioEl = new Audio();
    audioEl.autoplay = true;

    this.localStream?.getTracks().forEach(track => pc.addTrack(track, this.localStream!));

    pc.ontrack = (evt) => { if (evt.streams[0]) audioEl.srcObject = evt.streams[0]; };

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        this.send({
          type: 'ICE', channelId: this.channelId,
          fromUserId: this.userId, targetUserId: peerId,
          data: evt.candidate.toJSON()
        });
      }
    };

    const state: PeerState = { pc, pendingCandidates: [], audioEl };
    this.peers.set(peerId, state);
    return state;
  }

  private async createOffer(peerId: string): Promise<void> {
    if (this.peers.has(peerId)) return;
    const state = this.makePeer(peerId);
    const offer = await state.pc.createOffer();
    await state.pc.setLocalDescription(offer);
    this.send({
      type: 'OFFER', channelId: this.channelId,
      fromUserId: this.userId, targetUserId: peerId,
      data: { type: offer.type, sdp: offer.sdp }
    });
  }

  private async handleOffer(fromId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    if (this.peers.has(fromId)) return;
    const state = this.makePeer(fromId);
    await state.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    for (const c of state.pendingCandidates) await state.pc.addIceCandidate(new RTCIceCandidate(c));
    state.pendingCandidates = [];
    const answer = await state.pc.createAnswer();
    await state.pc.setLocalDescription(answer);
    this.send({
      type: 'ANSWER', channelId: this.channelId,
      fromUserId: this.userId, targetUserId: fromId,
      data: { type: answer.type, sdp: answer.sdp }
    });
  }

  private async handleAnswer(fromId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const state = this.peers.get(fromId);
    if (!state) return;
    await state.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    for (const c of state.pendingCandidates) await state.pc.addIceCandidate(new RTCIceCandidate(c));
    state.pendingCandidates = [];
  }

  private async handleIce(fromId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const state = this.peers.get(fromId);
    if (!state) return;
    if (state.pc.remoteDescription) {
      await state.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      state.pendingCandidates.push(candidate);
    }
  }

  private closePeer(peerId: string): void {
    const state = this.peers.get(peerId);
    if (!state) return;
    state.pc.close();
    state.audioEl.srcObject = null;
    state.audioEl.remove();
    this.peers.delete(peerId);
  }
}

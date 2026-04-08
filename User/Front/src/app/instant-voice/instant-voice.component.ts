import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChannelService, Channel, AudioMessage } from '../shared/services/channel.service';
import { AuthService } from '../services/auth.service';
import { VoiceSignalingService } from '../shared/services/voice-signaling.service';

interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePhoto?: string;
}

@Component({
  selector: 'app-instant-voice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instant-voice.component.html',
  styleUrl: './instant-voice.component.css',
})
export class InstantVoiceComponent implements OnInit, OnDestroy {

  view: 'list' | 'detail' | 'create' = 'list';
  channels: Channel[] = [];
  selectedChannel: Channel | null = null;

  isRecording = false;
  isSaving = false;
  recordingError = '';
  loading = false;
  error = '';
  pendingDeleteChannel: Channel | null = null;

  newChannelName = '';
  newChannelPrivate = false;
  selectedMemberIds: string[] = [];

  allUsers: AppUser[] = [];
  usersLoading = false;
  channelMembers: AppUser[] = [];
  membersLoading = false;

  audioHistory: AudioMessage[] = [];
  audioLoading = false;

  playingId: string | null = null;
  private activeAudio: HTMLAudioElement | null = null;

  currentUserId = '';
  currentUserRole = '';
  currentUserPost = '';
  currentUserName = '';

  get isMembreSimple(): boolean { return this.currentUserRole === 'MEMBRE_SIMPLE'; }

  get selectedUsers(): AppUser[] {
    return this.allUsers.filter(u => this.selectedMemberIds.includes(u.id));
  }

  get listenerCount(): number { return this.voiceService.listenerCount; }

  constructor(
    private channelService: ChannelService,
    private authService: AuthService,
    private http: HttpClient,
    public voiceService: VoiceSignalingService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.userId ?? '';
    this.currentUserRole = user?.role ?? '';
    this.authService.getMe().subscribe({
      next: (data: any) => {
        this.currentUserPost = data?.post ?? '';
        this.currentUserName = `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim() || data?.email || 'Unknown';
        if (this.currentUserRole === 'MEMBRE_SIMPLE' && this.currentUserPost) {
          this.channelService.syncMemberPostChannel(this.currentUserId, this.currentUserPost).subscribe({
            next: () => this.loadChannels(), error: () => this.loadChannels()
          });
        } else {
          this.loadChannels();
        }
      },
      error: () => this.loadChannels()
    });
  }

  loadChannels() {
    this.loading = true;
    this.error = '';
    this.channelService.getAll(this.currentUserId, this.currentUserRole, this.currentUserPost).subscribe({
      next: (data) => { this.channels = data; this.loading = false; },
      error: () => { this.error = 'Could not load channels. Is the backend running?'; this.loading = false; }
    });
  }

  openChannel(channel: Channel) {
    this.selectedChannel = channel;
    this.view = 'detail';
    this.audioHistory = [];
    this.channelMembers = [];
    this.membersLoading = true;
    this.recordingError = '';

    this.http.get<AppUser[]>('http://localhost:8081/api/users').subscribe({
      next: (users) => {
        const ids = channel.memberIds ?? [];
        this.channelMembers = users.filter(u =>
          u.role !== 'MEMBRE_SIMPLE' || ids.includes(u.id)
        );
        this.membersLoading = false;
      },
      error: () => { this.membersLoading = false; }
    });

    this.loadAudioHistory(channel.id);

    // Join signaling immediately so we can receive audio from anyone who starts talking
    this.voiceService.joinChannel(channel.id, this.currentUserId);
  }

  loadAudioHistory(channelId: string) {
    this.audioLoading = true;
    this.http.get<AudioMessage[]>(`http://localhost:8082/api/channels/${channelId}/audio`).subscribe({
      next: (msgs) => { this.audioHistory = msgs; this.audioLoading = false; },
      error: () => { this.audioLoading = false; }
    });
  }

  playAudio(msg: AudioMessage) {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
      if (this.playingId === msg.id) { this.playingId = null; return; }
    }
    const audio = new Audio(`data:${msg.contentType};base64,${msg.audioData}`);
    audio.play().catch(() => {});
    audio.onended = () => { this.playingId = null; this.activeAudio = null; };
    this.activeAudio = audio;
    this.playingId = msg.id;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  requestDeleteChannel(channel: Channel, event: Event) {
    event.stopPropagation();
    this.pendingDeleteChannel = channel;
  }

  cancelDelete() { this.pendingDeleteChannel = null; }

  confirmDelete() {
    const channel = this.pendingDeleteChannel;
    if (!channel) return;
    this.pendingDeleteChannel = null;
    const doDelete = () => {
      this.channelService.delete(channel.id).subscribe({
        next: () => { this.channels = this.channels.filter(c => c.id !== channel.id); },
        error: () => { this.error = 'Failed to delete channel.'; }
      });
    };
    if (channel.isPostChannel) {
      this.authService.clearPostByName(channel.name).subscribe({
        next: () => doDelete(), error: () => doDelete()
      });
    } else {
      doDelete();
    }
  }

  goToCreate() {
    this.usersLoading = true;
    this.http.get<AppUser[]>('http://localhost:8081/api/users').subscribe({
      next: (users) => { this.allUsers = users.filter(u => u.id !== this.currentUserId); this.usersLoading = false; },
      error: () => { this.usersLoading = false; }
    });
    this.view = 'create';
  }

  onPrivacyChange() { if (!this.newChannelPrivate) this.selectedMemberIds = []; }

  toggleMember(userId: string) {
    const idx = this.selectedMemberIds.indexOf(userId);
    if (idx === -1) this.selectedMemberIds.push(userId);
    else this.selectedMemberIds.splice(idx, 1);
  }

  isMemberSelected(userId: string): boolean {
    return this.selectedMemberIds.includes(userId);
  }

  goBack() {
    if (this.isRecording) this.cancelRecordingQuietly();
    this.voiceService.leaveChannel();
    this.activeAudio?.pause();
    this.activeAudio = null;
    this.playingId = null;
    this.view = 'list';
    this.selectedChannel = null;
    this.audioHistory = [];
    this.error = '';
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      this.isSaving = true;
      this.recordingError = '';
      try {
        const blob = await this.voiceService.stopTransmitting();
        if (blob && blob.size > 0) await this.uploadAudio(blob);
      } finally {
        this.isSaving = false;
        this.loadAudioHistory(this.selectedChannel!.id);
      }
    } else {
      this.recordingError = '';
      try {
        await this.voiceService.startTransmitting();
        this.isRecording = true;
      } catch (err: any) {
        this.recordingError = err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow access and try again.'
          : 'Could not access microphone. Check your device settings.';
      }
    }
  }

  private cancelRecordingQuietly() {
    this.isRecording = false;
    this.voiceService.stopTransmitting().catch(() => {});
  }

  private uploadAudio(blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.http.post<AudioMessage>(
          `http://localhost:8082/api/channels/${this.selectedChannel!.id}/audio`,
          { userId: this.currentUserId, userName: this.currentUserName, audioData: base64, contentType: blob.type || 'audio/webm' }
        ).subscribe({
          next: (saved) => { this.audioHistory.unshift(saved); resolve(); },
          error: () => resolve()
        });
      };
      reader.readAsDataURL(blob);
    });
  }

  ngOnDestroy() {
    if (this.isRecording) this.cancelRecordingQuietly();
    this.voiceService.leaveChannel();
  }

  createChannel() {
    if (!this.newChannelName.trim()) return;
    this.loading = true;
    const memberIds = [this.currentUserId, ...this.selectedMemberIds];
    this.channelService.create(
      { name: this.newChannelName.trim(), isPrivate: this.newChannelPrivate, memberIds },
      this.currentUserId, this.currentUserRole
    ).subscribe({
      next: (channel) => { this.channels.push(channel); this.resetForm(); },
      error: () => { this.error = 'Failed to create channel.'; this.loading = false; }
    });
  }

  private resetForm() {
    this.newChannelName = '';
    this.newChannelPrivate = false;
    this.selectedMemberIds = [];
    this.allUsers = [];
    this.loading = false;
    this.view = 'list';
  }
}

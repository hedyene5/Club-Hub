import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChannelService, Channel } from '../shared/services/channel.service';
import { AuthService } from '../services/auth.service';

interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-instant-voice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instant-voice.component.html',
  styleUrl: './instant-voice.component.css',
})
export class InstantVoiceComponent implements OnInit {

  view: 'list' | 'detail' | 'create' = 'list';
  channels: Channel[] = [];
  selectedChannel: Channel | null = null;

  isRecording = false;
  loading = false;
  error = '';

  newChannelName = '';
  newChannelPrivate = false;
  newChannelHasSubChannel = false;
  newSubChannelName = '';
  selectedMemberIds: string[] = [];

  allUsers: AppUser[] = [];
  usersLoading = false;

  currentUserId = '';
  currentUserRole = '';

  get isMembreSimple(): boolean {
    return this.currentUserRole === 'MEMBRE_SIMPLE';
  }

  get selectedUsers(): AppUser[] {
    return this.allUsers.filter(u => this.selectedMemberIds.includes(u.id));
  }

  constructor(
    private channelService: ChannelService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.userId ?? '';
    this.currentUserRole = user?.role ?? '';
    this.loadChannels();
  }

  loadChannels() {
    this.loading = true;
    this.error = '';
    this.channelService.getAll(this.currentUserId).subscribe({
      next: (data: Channel[]) => { this.channels = data; this.loading = false; },
      error: () => { this.error = 'Could not load channels. Is the backend running?'; this.loading = false; }
    });
  }

  openChannel(channel: Channel) {
    this.selectedChannel = channel;
    this.view = 'detail';
  }

  deleteChannel(id: string, event: Event) {
    event.stopPropagation();
    this.channelService.delete(id).subscribe({
      next: () => { this.channels = this.channels.filter(c => c.id !== id); },
      error: () => { this.error = 'Failed to delete channel.'; }
    });
  }

  deleteSubChannel(subId: string) {
    if (!this.selectedChannel) return;
    this.channelService.deleteSubChannel(this.selectedChannel.id, subId).subscribe({
      next: (updated: Channel) => { this.selectedChannel = updated; },
      error: () => { this.error = 'Failed to delete sub-channel.'; }
    });
  }

  goToCreate() {
    this.usersLoading = true;
    this.http.get<AppUser[]>('http://localhost:8081/api/users').subscribe({
      next: (users) => {
        this.allUsers = users.filter(u => u.id !== this.currentUserId);
        this.usersLoading = false;
      },
      error: () => { this.usersLoading = false; }
    });
    this.view = 'create';
  }

  toggleMember(userId: string) {
    const idx = this.selectedMemberIds.indexOf(userId);
    if (idx === -1) {
      this.selectedMemberIds.push(userId);
    } else {
      this.selectedMemberIds.splice(idx, 1);
    }
  }

  isMemberSelected(userId: string): boolean {
    return this.selectedMemberIds.includes(userId);
  }

  goBack() {
    this.view = 'list';
    this.selectedChannel = null;
    this.error = '';
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
  }

  createChannel() {
    if (!this.newChannelName.trim()) return;
    this.loading = true;

    const memberIds = [this.currentUserId, ...this.selectedMemberIds];

    this.channelService.create(
      { name: this.newChannelName.trim(), isPrivate: this.newChannelPrivate, memberIds },
      this.currentUserId,
      this.currentUserRole
    ).subscribe({
      next: (channel: Channel) => {
        if (this.newChannelHasSubChannel && this.newSubChannelName.trim()) {
          this.channelService.addSubChannel(channel.id, { name: this.newSubChannelName.trim() }).subscribe({
            next: (updated: Channel) => { this.channels.push(updated); this.resetForm(); },
            error: () => { this.channels.push(channel); this.resetForm(); }
          });
        } else {
          this.channels.push(channel);
          this.resetForm();
        }
      },
      error: () => { this.error = 'Failed to create channel.'; this.loading = false; }
    });
  }

  private resetForm() {
    this.newChannelName = '';
    this.newChannelPrivate = false;
    this.newChannelHasSubChannel = false;
    this.newSubChannelName = '';
    this.selectedMemberIds = [];
    this.allUsers = [];
    this.loading = false;
    this.view = 'list';
  }
}

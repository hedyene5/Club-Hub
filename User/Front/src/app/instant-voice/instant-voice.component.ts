import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChannelService, Channel } from '../shared/services/channel.service';
import { AuthService } from '../services/auth.service';
import { switchMap } from 'rxjs';

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
export class InstantVoiceComponent implements OnInit {

  view: 'list' | 'detail' | 'create' = 'list';
  channels: Channel[] = [];
  selectedChannel: Channel | null = null;

  isRecording = false;
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

  currentUserId = '';
  currentUserRole = '';
  currentUserPost = '';

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
    // Fetch full user to get the post field
    this.authService.getMe().subscribe({
      next: (data: any) => {
        this.currentUserPost = data?.post ?? '';
        // If this is a MEMBRE_SIMPLE with a post, ensure their channel exists
        if (this.currentUserRole === 'MEMBRE_SIMPLE' && this.currentUserPost) {
          this.channelService.syncMemberPostChannel(this.currentUserId, this.currentUserPost).subscribe({
            next: () => this.loadChannels(),
            error: () => this.loadChannels()
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
      next: (data: Channel[]) => { this.channels = data; this.loading = false; },
      error: () => { this.error = 'Could not load channels. Is the backend running?'; this.loading = false; }
    });
  }

  openChannel(channel: Channel) {
    this.selectedChannel = channel;
    this.view = 'detail';
    this.channelMembers = [];
    this.membersLoading = true;
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
  }

  requestDeleteChannel(channel: Channel, event: Event) {
    event.stopPropagation();
    this.pendingDeleteChannel = channel;
  }

  cancelDelete() {
    this.pendingDeleteChannel = null;
  }

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
      // Clear posts for all members who had this post, then delete the channel
      this.authService.clearPostByName(channel.name).subscribe({
        next: () => doDelete(),
        error: () => doDelete()
      });
    } else {
      doDelete();
    }
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

  onPrivacyChange() {
    if (!this.newChannelPrivate) {
      this.selectedMemberIds = [];
    }
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
      next: (channel: Channel) => { this.channels.push(channel); this.resetForm(); },
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

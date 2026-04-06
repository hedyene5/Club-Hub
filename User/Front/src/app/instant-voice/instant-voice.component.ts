import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelService, Channel } from '../shared/services/channel.service';

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

  constructor(private channelService: ChannelService) {}

  ngOnInit() {
    this.loadChannels();
  }

  loadChannels() {
    this.loading = true;
    this.error = '';
    this.channelService.getAll().subscribe({
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
    this.view = 'create';
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
    this.channelService.create({ name: this.newChannelName.trim(), isPrivate: this.newChannelPrivate }).subscribe({
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
    this.loading = false;
    this.view = 'list';
  }
}

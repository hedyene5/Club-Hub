import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChannelService } from '../../shared/services/channel.service';

interface SimpleMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  post: string;
  postInput: string;
  saving: boolean;
  saved: boolean;
}

@Component({
  selector: 'app-members',
  imports: [CommonModule, FormsModule],
  templateUrl: './members.component.html',
})
export class MembersComponent implements OnInit {
  members: SimpleMember[] = [];
  loading = true;
  error = '';

  constructor(private authService: AuthService, private channelService: ChannelService) {}

  ngOnInit() {
    this.authService.getSimpleMembers().subscribe({
      next: (data) => {
        this.members = data.map((m: any) => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phoneNumber: m.phoneNumber,
          post: m.post ?? '',
          postInput: m.post ?? '',
          saving: false,
          saved: false,
        }));
        this.loading = false;
        // Sync channels for members who already have a post assigned
        this.members
          .filter(m => m.post)
          .forEach(m => this.channelService.ensurePostChannel(m.post, m.id).subscribe());
      },
      error: () => {
        this.error = 'Failed to load members.';
        this.loading = false;
      },
    });
  }

  savePost(member: SimpleMember) {
    if (!member.postInput.trim()) return;
    member.saving = true;
    member.saved = false;
    this.authService.assignPost(member.id, member.postInput.trim()).subscribe({
      next: (updated: any) => {
        member.post = updated.post ?? member.postInput;
        // Ensure the post channel exists and add this member to it
        this.channelService.ensurePostChannel(member.post, member.id).subscribe();
        member.saving = false;
        member.saved = true;
        setTimeout(() => (member.saved = false), 2000);
      },
      error: () => {
        member.saving = false;
      },
    });
  }
}

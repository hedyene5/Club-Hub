import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

  constructor(private authService: AuthService) {}

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
      },
      error: () => {
        this.error = 'Failed to load members.';
        this.loading = false;
      },
    });
  }

  savePost(member: SimpleMember) {
    member.saving = true;
    member.saved = false;
    this.authService.assignPost(member.id, member.postInput).subscribe({
      next: (updated: any) => {
        member.post = updated.post ?? member.postInput;
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

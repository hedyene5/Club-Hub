import { Component } from '@angular/core';
import { InputFieldComponent } from './../../form/input/input-field.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import { SupabaseService } from '../../../../services/supabase.service';

@Component({
  selector: 'app-user-meta-card',
  imports: [
    ModalComponent,
    InputFieldComponent,
    ButtonComponent,
    CommonModule
  ],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent {

  isOpen = false;
  uploading = false;

  user = {
    firstName: '',
    lastName: '',
    role: '',
    location: '',
    avatar: '',
    social: { facebook: '', x: '', linkedin: '', instagram: '' },
    email: '',
    phone: '',
    bio: '',
  };

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {
    const session = this.authService.getCurrentUser();
    if (session) {
      this.user.firstName = session.firstName;
      this.user.lastName  = session.lastName;
      this.user.email     = session.email;
      this.user.phone     = session.phoneNumber ?? '';
      this.user.role      = session.role;
      this.user.avatar    = session.profilePhoto ?? '';
    }
  }

  openModal()  { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  // ── Upload avatar ──────────────────────────────────────────
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const userId = this.authService.getCurrentUser()?.userId ?? 'unknown';

    this.uploading = true;
    try {
      const url = await this.supabaseService.uploadAvatar(file, userId);
      this.user.avatar = url;

      // Sauvegarde l'URL dans le localStorage pour la session
      const session = this.authService.getCurrentUser();
      if (session) {
        session.profilePhoto = url;
        localStorage.setItem('user', JSON.stringify(session));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      this.uploading = false;
    }
  }

  handleSave() {
    this.closeModal();
  }
}
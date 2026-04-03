import { Component } from '@angular/core';
import { InputFieldComponent } from './../../form/input/input-field.component';
import { ModalService } from '../../../services/modal.service';

import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-meta-card',
  imports: [
    ModalComponent,
    InputFieldComponent,
    ButtonComponent
],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent {

  constructor(public modal: ModalService, private authService: AuthService) {
    const session = this.authService.getCurrentUser();
    if (session) {
      this.user.firstName = session.firstName;
      this.user.lastName = session.lastName;
      this.user.email = session.email;
      this.user.phone = session.phoneNumber;
      this.user.role = session.role;
      this.user.avatar = session.profilePhoto || '';
    }
  }

  isOpen = false;
  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  user = {
    firstName: '',
    lastName: '',
    role: '',
    location: '',
    avatar: '',
    social: {
      facebook: '',
      x: '',
      linkedin: '',
      instagram: '',
    },
    email: '',
    phone: '',
    bio: '',
  };

  handleSave() {
    console.log('Saving changes...');
    this.modal.closeModal();
  }
}

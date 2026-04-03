import { Component, NgZone } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-signup-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {

  showPassword = false;
  isChecked = false;

  fname = '';
  lname = '';
  phoneNumber = '';
  email = '';
  password = '';
  role = 'MEMBRE_SIMPLE';
  clubId = '';
  profilePhoto = '';

  roles = [
    { value: 'PRESIDENT',           label: 'Président' },
    { value: 'VICE_PRESIDENT',      label: 'Vice-Président' },
    { value: 'SECRETAIRE_GENERALE', label: 'Secrétaire Général(e)' },
    { value: 'TRESORIER',           label: 'Trésorier(e)' },
    { value: 'RH',                  label: 'Ressources Humaines' },
    { value: 'MEMBRE_SIMPLE',       label: 'Membre Simple' },
  ];

  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router, private ngZone: NgZone) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      this.error = 'The image must be less than 3MB.';
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 400;
      let { width, height } = img;
      if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
      else { width = Math.round(width * MAX / height); height = MAX; }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      this.ngZone.run(() => { this.profilePhoto = base64; });
    };
    img.src = objectUrl;
  }

  onSignUp() {
    if (!this.isChecked) {
      this.error = 'Vous devez accepter les conditions d\'utilisation';
      return;
    }

    this.error = '';
    this.loading = true;

    this.authService.register({
      firstName: this.fname,
      lastName: this.lname,
      phoneNumber: this.phoneNumber,
      email: this.email,
      password: this.password,
      role: this.role,
      clubId: this.clubId,
      profilePhoto: this.profilePhoto
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error ?? 'Une erreur est survenue';
      }
    });
  }
}
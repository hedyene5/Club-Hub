import { Component } from '@angular/core';
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

  roles = [
    { value: 'PRESIDENT',           label: 'Président' },
    { value: 'VICE_PRESIDENT',      label: 'Vice-Président' },
    { value: 'SECRETAIRE_GENERALE', label: 'Secrétaire Général(e)' },
    { value: 'TRESORIER',           label: 'Trésorier(e)' },
    { value: 'RH',                  label: 'Ressources Humaines' },
    { value: 'MEMBRE_SIMPLE',       label: 'Membre Simple' },
  ];

  profilePhoto: string | null = null;

  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.profilePhoto = reader.result as string; };
    reader.readAsDataURL(file);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
    }).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Si c'est un président sans clubId, on va vers setup-club
        if (this.role === 'PRESIDENT' && !this.clubId) {
          // Stocker les infos du user pour setup-club (pas besoin du token, il est dans le cookie)
          localStorage.setItem('pendingUser', JSON.stringify({
            id: response.userId,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName
          }));
          this.router.navigate(['/setup-club']);
        } else {
          // Sinon, rediriger selon le rôle
          if (response.clubId) {
            this.router.navigate(['/clubs', response.clubId]);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error ?? 'Une erreur est survenue';
      }
    });
  }
}
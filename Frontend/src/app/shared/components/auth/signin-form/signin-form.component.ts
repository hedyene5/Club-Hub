import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {
  showPassword = false;
  isChecked = false;
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  onSignIn() {
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }
    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('✅ Login réussi:', response);

        if (response.clubId) {
          // ✅ Le club existe, aller à la page du club dans le back-office
          this.router.navigate(['/app/clubs', response.clubId]);
        } else if (response.role === 'PRESIDENT') {
          // Président sans club → création du club
          this.router.navigate(['/app/setup-club']);
        } else {
          // Membre sans clubId dans la réponse — essayer via getMe()
          this.authService.getMe().subscribe({
            next: (me: any) => {
              if (me.clubId) {
                this.router.navigate(['/app/clubs', me.clubId]);
              } else {
                // Aucun club → on redirige vers la page de setup (ou dashboard)
                this.router.navigate(['/app/setup-club']);
              }
            },
            error: () => this.router.navigate(['/app/setup-club'])
          });
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error || 'Email ou mot de passe incorrect';
      }
    });
  }
}
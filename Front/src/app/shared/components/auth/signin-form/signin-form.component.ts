import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent implements OnInit {
  showPassword = false;
  isChecked = false;
  email = '';
  password = '';
  loading = false;
  error = '';
  returnUrl: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Récupérer l'URL de retour depuis les query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    console.log('🔗 Return URL:', this.returnUrl);
  }

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
      next: (response) => {
        this.loading = false;
        console.log('✅ Login réussi:', response);

        // Si returnUrl existe, rediriger vers cette URL
        if (this.returnUrl) {
          console.log('↩️ Redirection vers returnUrl:', this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
          return;
        }

        // Sinon, comportement par défaut
        if (response.clubId) {
          this.router.navigate(['/clubs', response.clubId]);
        } else if (response.role === 'PRESIDENT') {
          this.router.navigate(['/setup-club']);
        } else {
          // Membre sans clubId dans la réponse — essayer via getMe()
          this.authService.getMe().subscribe({
            next: (me) => {
              if (me.clubId) {
                this.router.navigate(['/clubs', me.clubId]);
              } else {
                this.router.navigate(['/']);
              }
            },
            error: () => this.router.navigate(['/'])
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error || 'Email ou mot de passe incorrect';
      }
    });
  }
}
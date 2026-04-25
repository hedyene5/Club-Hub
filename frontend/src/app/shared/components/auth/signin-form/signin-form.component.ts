import { Component, inject } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../treasury/services/auth.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  showPassword = false;
  isChecked = false;
  email = '';
  password = '';
  error = '';
  loading = false;

  private auth = inject(AuthService);
  private router = inject(Router);

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Remplissez email et mot de passe.';
      return;
    }

    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        if (user) {
          if (user.role === 'MEMBRE_SIMPLE') {
            this.router.navigateByUrl('/treasury/espace-membre');
          } else {
            this.router.navigateByUrl('/treasury');
          }
        } else {
          this.error = 'Email ou mot de passe incorrect.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Service indisponible. Verifiez que le backend tourne.';
      }
    });
  }
}

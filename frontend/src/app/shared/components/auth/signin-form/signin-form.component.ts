import { Component } from '@angular/core';

import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/User/auth.service';
import {ButtonComponent} from "../../ui/button/button.component";
import {CheckboxComponent} from "../../form/input/checkbox.component";
import {InputFieldComponent} from "../../form/input/input-field.component";
import {LabelComponent} from "../../form/label/label.component";

@Component({
    selector: 'app-signin-form',
    imports: [

        RouterModule,
        FormsModule,
        CommonModule,
        ButtonComponent,
        CheckboxComponent,
        InputFieldComponent,
        LabelComponent
    ],
    standalone : true,
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

    constructor(private authService: AuthService, private router: Router) {}

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    onSignIn() {
        this.error = '';
        this.loading = true;

        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/conversations']);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error ?? 'Email ou mot de passe incorrect';
            }
        });
    }
}
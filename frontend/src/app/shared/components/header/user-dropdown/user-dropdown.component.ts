import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent {
  isOpen = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
  ) {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  /**
   * Vraie déconnexion :
   * 1) POST /api/auth/logout → backend efface le cookie HttpOnly `jwt`
   * 2) authService.logout() → efface localStorage + signal côté front
   * 3) navigate vers /signin (pas un routerLink, sinon le guestGuard
   *    intercepte avant que la session soit nettoyée)
   *
   * Si le backend est injoignable, on déconnecte quand même côté front.
   */
  logout(): void {
    this.closeDropdown();

    const finishLogout = () => {
      this.authService.logout();
      this.router.navigate(['/signin']);
    };

    this.http
      .post('http://localhost:8084/api/auth/logout', {}, { withCredentials: true, responseType: 'text' })
      .subscribe({
        next: () => finishLogout(),
        error: (err) => {
          console.warn('Logout backend a échoué — déconnexion locale quand même.', err);
          finishLogout();
        },
      });
  }
}

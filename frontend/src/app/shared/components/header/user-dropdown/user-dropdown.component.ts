import { Component, inject } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../../treasury/services/auth.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemTwoComponent]
})
export class UserDropdownComponent {
  isOpen = false;
  private auth = inject(AuthService);

  get user() { return this.auth.current(); }
  get displayName(): string {
    const u = this.user;
    return u ? u.firstName + ' ' + u.lastName : 'Non connecte';
  }
  get displayEmail(): string {
    return this.user?.email || '';
  }
  get initial(): string {
    const u = this.user;
    return u ? (u.firstName[0] + u.lastName[0]).toUpperCase() : '?';
  }

  toggleDropdown() { this.isOpen = !this.isOpen; }
  closeDropdown() { this.isOpen = false; }

  onLogout() {
    this.closeDropdown();
    this.auth.logout().subscribe();
  }
}

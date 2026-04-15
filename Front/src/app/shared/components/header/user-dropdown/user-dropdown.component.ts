import { Component, OnInit, OnDestroy } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService, StoredUser } from '../../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  user: StoredUser | null = null;
  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // ✅ S'abonner aux changements de profil en temps réel
    this.userSubscription = this.authService.userProfile$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  getUserName(): string {
    if (!this.user) return 'User';
    return `${this.user.firstName} ${this.user.lastName}`.trim() || 'User';
  }

  getUserAvatar(): string {
    return this.user?.profilePhoto || '/images/user/owner.png';
  }

  getUserEmail(): string {
    return this.user?.email || '';
  }
}

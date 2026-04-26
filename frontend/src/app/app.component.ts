import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SessionGuardService } from './services/User/session-guard.service';
import { AuthService } from './services/User/auth.service';
import { FrontOfficeHeaderComponent } from './shared/layout/header/front-office-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FrontOfficeHeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Club HUB';
  isAuthenticated = false;

  constructor(
      private sessionGuard: SessionGuardService,
      private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Use the same observable as header for consistency
    this.authService.getCurrentUser$().subscribe(user => {
      this.isAuthenticated = !!user;

      if (user) {
        this.sessionGuard.startWatching();
      } else {
        localStorage.removeItem('user');
      }
    });

    // Initial session restore
    this.authService.restoreSession().subscribe({
      error: () => {
        this.isAuthenticated = false;
        localStorage.removeItem('user');
      }
    });
  }
}
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionGuardService {

  private intervalId: any;

  constructor(
      private authService: AuthService,
      private router: Router,
      private ngZone: NgZone
  ) {}

  startWatching(): void {
    // Immediately validate on start, then every 30 seconds
    this.checkNow();
    this.intervalId = setInterval(() => this.checkNow(), 30000);
  }

  stopWatching(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private checkNow(): void {
    this.authService.checkSession().subscribe({
      next: (res) => {
        // Refresh localStorage with latest user data from server
        console.log('✅ Session still valid');
      },
      error: () => {
        this.ngZone.run(() => {
          this.stopWatching();
          localStorage.removeItem('user');
          alert('⚠️ Session expirée ! Veuillez vous reconnecter.');
          this.router.navigate(['/signin']);
        });
      }
    });
  }
}
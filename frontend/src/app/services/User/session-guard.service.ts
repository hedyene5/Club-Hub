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
    this.intervalId = setInterval(() => {
      this.authService.checkSession().subscribe({
        next: () => {
          console.log('✅ Session still valid');
        },
        error: () => {
          this.ngZone.run(() => {
            clearInterval(this.intervalId);
            localStorage.removeItem('user');
            alert('⚠️ Session expirée ! Veuillez vous reconnecter.');
            this.router.navigate(['/signin']);
          });
        }
      });
    }, 30000); // vérifie toutes les 30 secondes
  }

  stopWatching(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
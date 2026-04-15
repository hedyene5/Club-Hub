// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/signin']);
  return false;
};

// Guard pour rediriger vers le club si déjà connecté (utilisé sur signin/signup)
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const clubId = authService.getCurrentClubId();
    if (clubId) {
      router.navigate(['/clubs', clubId]);
    } else {
      router.navigate(['/setup-club']);
    }
    return false;
  }
  return true;
};

// Guard pour rediriger '/' vers le club ou signin
export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const clubId = authService.getCurrentClubId();
    if (clubId) {
      router.navigate(['/clubs', clubId]);
    } else {
      router.navigate(['/setup-club']);
    }
  } else {
    router.navigate(['/signin']);
  }
  return false;
};

// Guard pour CEO/Secrétaire seulement
export const ceoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getCurrentRole();
  
  if (role === 'PRESIDENT' || role === 'RH' || role === 'SECRETAIRE_GENERALE') {
    return true;
  }

  router.navigate(['/']);
  return false;
};
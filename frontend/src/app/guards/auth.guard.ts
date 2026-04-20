// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

/**
 * Bloque l'accès si l'utilisateur n'est pas connecté.
 * Redirige vers /signin.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/signin']);
  return false;
};

/**
 * Empêche un utilisateur déjà connecté d'accéder aux pages signin / signup.
 * - Si l'utilisateur a un club  → redirige vers /clubs/:id
 * - Sinon (signup ou signin sans club) → redirige vers /setup-club pour créer le club
 */
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

/**
 * Redirection intelligente pour la racine /.
 * - Pas connecté          → /signin
 * - Connecté avec club    → /clubs/:id
 * - Connecté sans club    → /setup-club
 */
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

/** Réservé au PRESIDENT / RH / SECRETAIRE_GENERALE. */
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

/** Réservé au PRESIDENT (gestion des rôles, settings du club). */
export const presidentGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getCurrentRole() === 'PRESIDENT') {
    return true;
  }

  router.navigate(['/']);
  return false;
};

/** Réservé au TRESORIER (approve / reject borrowed items). */
export const treasurerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getCurrentRole() === 'TRESORIER') {
    return true;
  }

  router.navigate(['/']);
  return false;
};

/** Réservé au SECRETAIRE_GENERALE (rédaction des PV des événements). */
export const secretaryGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getCurrentRole() === 'SECRETAIRE_GENERALE') {
    return true;
  }

  router.navigate(['/']);
  return false;
};

import { Routes } from '@angular/router';

import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';

import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';

import { ClubFormComponent } from './pages/clubs/club-form/club-form.component';
import { ClubDetailComponent } from './pages/clubs/club-detail/club-detail.component';
import { ClubListComponent } from './pages/clubs/club-list/club-list.component';

import { UserListComponent } from './pages/users/user-list/user-list.component';
import { RoleManagementComponent } from './pages/roles/role-management.component';
import { SetupClubComponent } from './pages/setup-club/setup-club.component';

import {
  authGuard,
  ceoGuard,
  guestGuard,
  homeGuard,
  presidentGuard,
} from './guards/auth.guard';

/**
 * Routes for the standalone "user module" build.
 *
 * Scope = everything a teammate needs to plug into the user/auth flow:
 *   - sign-in / sign-up (anonymous)
 *   - club setup right after first signup
 *   - profile editing
 *   - clubs browsing (needed for profile + setup-club)
 *   - users / roles administration (PRESIDENT scope)
 *
 * All event/RSVP/task/borrowing screens have been removed in this branch
 * — they live in their own feature branches and are not required to run
 * the auth + user-management surface in isolation.
 */
export const routes: Routes = [
  // Root — homeGuard redirects to /signin, /setup-club or /dashboard
  // depending on auth state and whether the user already owns a club.
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },

  // -------- Public auth pages (no app shell) --------
  { path: 'signin', component: SignInComponent, canActivate: [guestGuard], title: 'Sign In | ClubHub' },
  { path: 'signup', component: SignUpComponent, canActivate: [guestGuard], title: 'Sign Up | ClubHub' },

  // Right after sign-up: pick / create a club. Authenticated but pre-club.
  { path: 'setup-club', component: SetupClubComponent, canActivate: [authGuard], title: 'Créer votre club | ClubHub' },

  // -------- Authenticated app shell (sidebar + header) --------
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: EcommerceComponent, title: 'Dashboard | ClubHub' },
      { path: 'profile',   component: ProfileComponent,   title: 'Profile | ClubHub' },

      // -------- Clubs (used by profile + setup) --------
      {
        path: 'clubs',
        children: [
          { path: '',         component: ClubListComponent,   title: 'Tous les clubs' },
          { path: 'create',   component: ClubFormComponent,   canActivate: [ceoGuard], title: 'Créer un club' },
          { path: ':id',      component: ClubDetailComponent, title: 'Détail club' },
          { path: ':id/edit', component: ClubFormComponent,   canActivate: [ceoGuard], title: 'Modifier le club' },
        ],
      },

      // -------- Members --------
      { path: 'users',   component: UserListComponent, canActivate: [ceoGuard], title: 'Membres' },
      { path: 'members', redirectTo: 'users', pathMatch: 'full' },

      // -------- Roles (PRESIDENT only) --------
      { path: 'roles', component: RoleManagementComponent, canActivate: [presidentGuard], title: 'Gestion des rôles' },
    ],
  },

  // 404 catch-all (must be last)
  { path: '**', redirectTo: '' },
];

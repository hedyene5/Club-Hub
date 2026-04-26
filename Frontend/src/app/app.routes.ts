import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';

import { AllBorrowedComponent } from './pages/borrowed-items/all-borrowed/all-borrowed.component';
import { LendersComponent } from './pages/borrowed-items/lenders/lenders.component';

import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';

import { ClubFormComponent } from './pages/clubs/club-form/club-form.component';
import { ClubDetailComponent } from './pages/clubs/club-detail/club-detail.component';
import { ClubListComponent } from './pages/clubs/club-list/club-list.component';

import { ElectionListComponent } from './pages/elections/election-list/election-list.component';
import { ElectionFormComponent } from './pages/elections/election-form/election-form.component';
import { ElectionDetailComponent } from './pages/elections/election-detail/election-detail.component';

import { UserListComponent } from './pages/users/user-list/user-list.component';
import { RoleManagementComponent } from './pages/roles/role-management.component';
import { SetupClubComponent } from './pages/setup-club/setup-club.component';

import {
  authGuard,
  ceoGuard,
  guestGuard,
  homeGuard,
  presidentGuard,
  secretaryGuard,
  roleManagementGuard,
  clubSettingsGuard,
  voice2BureauGuard,
  voice2MyReportsGuard,
} from './guards/auth.guard';

export const routes: Routes = [
  // Racine — redirige selon l'état (logged in / no club / has club)
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },

  // -------- Pages d'authentification (sans layout) --------
  { path: 'signin',     component: SignInComponent,    canActivate: [guestGuard], title: 'Sign In | ClubHub' },
  { path: 'signup',     component: SignUpComponent,    canActivate: [guestGuard], title: 'Sign Up | ClubHub' },

  // setup-club est accessible aussitôt connecté (avant d'avoir un club)
  { path: 'setup-club', component: SetupClubComponent, canActivate: [authGuard], title: 'Créer votre club | ClubHub' },

  // -------- Application protégée (avec sidebar + header) --------
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: EcommerceComponent, title: 'Dashboard | ClubHub' },
      { path: 'calendar',  component: CalenderComponent,  title: 'Calendar | ClubHub' },
      { path: 'profile',   component: ProfileComponent,   title: 'Profile | ClubHub' },

      {
        path: 'events',
        loadComponent: () => import('./pages/all-events/all-events.component').then(m => m.AllEventsComponent),
        title: 'Events | ClubHub',
      },
      // -------- Événements virtuels (VEM) : prefix /ameni/... (groupement sans layout parent) --------
      {
        path: 'ameni',
        children: [
          {
            path: 'events',
            loadComponent: () => import('./ameni-ve/pages/events/events.component').then(m => m.EventsComponent),
            title: 'Virtual Events | ClubHub',
          },
          {
            path: 'meeting/:id',
            loadComponent: () => import('./ameni-ve/pages/meeting-room/meeting-room.component').then(m => m.MeetingRoomComponent),
            title: 'Réunion Jitsi | ClubHub',
          },
          {
            path: 'lobby/:roomId',
            loadComponent: () => import('./ameni-ve/pages/lobby/lobby.component').then(m => m.LobbyComponent),
            title: 'Lobby 3D | ClubHub',
          },
          {
            path: 'lobby',
            loadComponent: () => import('./ameni-ve/pages/lobby/lobby.component').then(m => m.LobbyComponent),
            title: 'Lobby 3D | ClubHub',
          },
          {
            path: 'virtual-room',
            loadComponent: () => import('./ameni-ve/pages/virtual-room/virtual-room.component').then(m => m.VirtualRoomComponent),
            title: 'Salle virtuelle 3D | ClubHub',
          },
          {
            path: 'recordings',
            loadComponent: () => import('./ameni-ve/pages/recordings/recordings.component').then(m => m.RecordingsComponent),
            title: 'Enregistrements virtuels | ClubHub',
          },
        ],
      },
      {
        path: 'rsvp',
        loadComponent: () => import('./pages/rsvp/rsvp.component').then(m => m.RsvpComponent),
        title: 'RSVP | ClubHub',
      },
      // -------- Voice2 (intégration additive isolée) --------
      {
        path: 'voice2',
        children: [
          {
            path: 'analytics',
            loadComponent: () =>
              import('./voice2/pages/analytics/analytics.component').then(
                (m) => m.Voice2AnalyticsComponent,
              ),
            title: 'Voice2 Analytics | ClubHub',
          },
          {
            path: 'management',
            loadComponent: () =>
              import('./voice2/pages/management/management.component').then(
                (m) => m.Voice2ManagementComponent,
              ),
            title: 'Voice2 Management | ClubHub',
          },
          {
            path: 'instant-voice',
            loadComponent: () =>
              import('./voice2/pages/instant-voice/instant-voice.component').then(
                (m) => m.Voice2InstantVoiceComponent,
              ),
            title: 'Voice2 Instant Voice | ClubHub',
          },
          {
            path: 'audio-reports',
            canActivate: [voice2BureauGuard],
            loadComponent: () =>
              import('./voice2/pages/audio-reports/audio-reports.component').then(
                (m) => m.Voice2AudioReportsComponent,
              ),
            title: 'Voice2 Audio Reports | ClubHub',
          },
          {
            path: 'my-reports',
            canActivate: [voice2MyReportsGuard],
            loadComponent: () =>
              import('./voice2/pages/my-reports/my-reports.component').then(
                (m) => m.Voice2MyReportsComponent,
              ),
            title: 'Voice2 My Reports | ClubHub',
          },
        ],
      },
      {
        path: 'addTask',
        loadComponent: () => import('./pages/tasks/event-tasks/event-tasks/event-tasks.component').then(m => m.EventTasksComponent),
        title: 'Assign Tasks | ClubHub',
      },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/my-tasks/my-tasks/my-tasks.component').then(m => m.MyTasksComponent),
        title: 'My Tasks | ClubHub',
      },

      { path: 'borrowed-items', component: AllBorrowedComponent, title: 'Borrowed Items | ClubHub' },
      { path: 'lenders',        component: LendersComponent,     title: 'Lenders | ClubHub' },

      // -------- Clubs --------
      {
        path: 'clubs',
        children: [
          { path: '',         component: ClubListComponent,   title: 'Tous les clubs' },
          { path: 'create',   component: ClubFormComponent,   canActivate: [ceoGuard],       title: 'Créer un club' },
          { path: ':id',      component: ClubDetailComponent, title: 'Détail club' },
          { path: ':id/edit', component: ClubFormComponent,   canActivate: [clubSettingsGuard], title: 'Modifier le club' },
        ],
      },

      // -------- Élections --------
      {
        path: 'elections',
        children: [
          { path: '',         component: ElectionListComponent,   title: 'Élections' },
          { path: 'create',   component: ElectionFormComponent,   title: 'Créer une élection' },
          { path: ':id',      component: ElectionDetailComponent, title: 'Détail élection' },
          { path: ':id/edit', component: ElectionFormComponent,   title: 'Modifier l\'élection' },
        ],
      },

      // -------- Membres --------
      { path: 'users',   component: UserListComponent, canActivate: [ceoGuard], title: 'Membres' },
      { path: 'members', redirectTo: 'users', pathMatch: 'full' },

      // -------- Rôles (PRESIDENT seulement) --------
      { path: 'roles', component: RoleManagementComponent, canActivate: [roleManagementGuard], title: 'Gestion des rôles' },

      // -------- Procès-Verbaux (SECRETAIRE_GENERALE seulement) --------
      {
        path: 'pv',
        canActivate: [secretaryGuard],
        loadComponent: () => import('./pages/pv/pv-page.component').then(m => m.PvPageComponent),
        title: 'Procès-Verbaux | ClubHub',
      },
    ],
  },

  // 404 — wildcard MUST be last
  { path: '**', redirectTo: '' },
];

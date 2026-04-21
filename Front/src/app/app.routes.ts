import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { QrValidationComponent } from './components/qr-validation/qr-validation.component';
import { ScanSuccessComponent } from './components/scan-success/scan-success.component';
import { VoteWithTokenComponent } from './components/vote-with-token/vote-with-token.component';

// ========== IMPORTS ==========
import { ClubListComponent } from './pages/clubs/club-list/club-list.component';
import { ClubFormComponent } from './pages/clubs/club-form/club-form.component';
import { ClubDetailComponent } from './pages/clubs/club-detail/club-detail.component';
import { ElectionListComponent } from './pages/elections/election-list/election-list.component';
import { ElectionFormComponent } from './pages/elections/election-form/election-form.component';
import { ElectionDetailComponent } from './pages/elections/election-detail/election-detail.component';
import { UserListComponent } from './pages/users/user-list/user-list.component';
import { RoleManagementComponent } from './pages/roles/role-management.component';
import { authGuard, ceoGuard, guestGuard } from './guards/auth.guard';
import { SetupClubComponent } from './pages/setup-club/setup-club.component';

export const routes: Routes = [
  // Route racine → signin
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full'
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Calendar'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Profile'
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Form Elements'
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Basic Tables'
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Blank Page'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Invoice'
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Line Chart'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Bar Chart'
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Alerts'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Avatars'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Badges'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Buttons'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Images'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Videos'
      },
      
      // ========== ROUTES CLUBS ==========
      {
        path: 'clubs',
        children: [
          // ❌ SUPPRIMER la route '' qui listait tous les clubs
          // { path: '', component: ClubListComponent }, ← À ENLEVER
          { path: 'create', component: ClubFormComponent, canActivate: [ceoGuard], title: 'Créer un Club' },
          { path: ':id', component: ClubDetailComponent, title: 'Détail Club' },
          { path: ':id/edit', component: ClubFormComponent, canActivate: [ceoGuard], title: 'Modifier un Club' }
        ]
      },
      
      // ========== ROUTES ELECTIONS ==========
      {
        path: 'elections',
        children: [
          { path: '', component: ElectionListComponent, title: 'Gestion des Élections' },
          { path: 'create', component: ElectionFormComponent, title: 'Créer une Élection' },
          { path: ':id', component: ElectionDetailComponent, title: 'Détail Élection' },
          { path: ':id/edit', component: ElectionFormComponent, title: 'Modifier une Élection' }
        ]
      },

      // ========== ROUTES USERS ==========
      {
        path: 'users',
        component: UserListComponent,
        canActivate: [ceoGuard], // ← Seul CEO/Secrétaire peut voir
        title: 'Gestion des Membres'
      },

      // ========== ROUTES ROLES ==========
      {
        path: 'roles',
        component: RoleManagementComponent,
        canActivate: [ceoGuard], // ← Seul le président peut gérer les rôles
        title: 'Gestion des Rôles'
      },

      {
        path: 'setup-club',
        component: SetupClubComponent,
        title: 'Créer votre club'
      }
      
    ]
  },
  
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Sign In'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign Up'
  },
  
  // ========== ROUTES QR CODE (PUBLIC - Sans authGuard) ==========
  // Ces routes doivent être accessibles sans connexion pour permettre
  // le scan QR depuis un smartphone non connecté
  {
    path: 'elections/scan/success',
    component: ScanSuccessComponent,
    title: 'Validation Réussie'
  },
  {
    path: 'elections/scan/:token',
    component: QrValidationComponent,
    canActivate: [authGuard], // Nécessite connexion mais redirige avec returnUrl
    title: 'Validation QR Code'
  },
  {
    path: 'elections/:id/vote',
    component: VoteWithTokenComponent,
    canActivate: [authGuard], // Nécessite connexion mais redirige avec returnUrl
    title: 'Voter'
  },
  
  // error page
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page non trouvée'
  }
];
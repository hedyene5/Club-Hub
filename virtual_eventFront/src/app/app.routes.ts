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
import { CalendarComponent } from './pages/calendar/calendar.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', component: EcommerceComponent, pathMatch: 'full', title: 'CLUB HUB' },
      { path: 'calendar', component: CalendarComponent, title: 'CLUB HUB Calendar' },
      { path: 'profile', component: ProfileComponent, title: 'CLUB HUB Profile' },
      { path: 'form-elements', component: FormElementsComponent, title: 'CLUB HUB Form Elements' },
      { path: 'basic-tables', component: BasicTablesComponent, title: 'CLUB HUB Basic Tables' },
      { path: 'blank', component: BlankComponent, title: 'CLUB HUB Blank' },
      { path: 'invoice', component: InvoicesComponent, title: 'CLUB HUB Invoice Details' },
      { path: 'line-chart', component: LineChartComponent, title: 'CLUB HUB Line Chart' },
      { path: 'bar-chart', component: BarChartComponent, title: 'CLUB HUB Bar Chart' },
      { path: 'alerts', component: AlertsComponent, title: 'CLUB HUB Alerts' },
      { path: 'avatars', component: AvatarElementComponent, title: 'CLUB HUB Avatars' },
      { path: 'badge', component: BadgesComponent, title: 'CLUB HUB Badges' },
      { path: 'buttons', component: ButtonsComponent, title: 'CLUB HUB Buttons' },
      { path: 'images', component: ImagesComponent, title: 'CLUB HUB Images' },
      { path: 'videos', component: VideosComponent, title: 'CLUB HUB Videos' },
      { path: 'recordings',loadComponent: () => import('./pages/recordings/recordings.component') .then(m => m.RecordingsComponent) },
      // ✅ Events route doit être ici
      { path: 'events', loadComponent: () => import('./pages/events/events.component').then(m => m.EventsComponent), title: 'CLUB HUB Events' },
      { path: 'meeting/:id',loadComponent: () => import('./pages/meeting-room/meeting-room.component') .then(m => m.MeetingRoomComponent), title: 'CLUB HUB Meeting Room' },
    ]
  },
  // auth pages
  { path: 'signin', component: SignInComponent, title: 'CLUB HUB Sign In' },
  { path: 'signup', component: SignUpComponent, title: 'CLUB HUB Sign Up' },
  
  // 404
  { path: '**', component: NotFoundComponent, title: 'CLUB HUB Not Found' }
];
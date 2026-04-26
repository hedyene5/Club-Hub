import { Routes } from '@angular/router';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { ConversationListComponent } from './messaging-components/conversation-list.component/conversation-list.component';

// Import your stock components
import { ProductsComponent } from "./stock/products/products.component";
import { TicketsComponent } from "./stock/tickets/tickets.component";
import { CartComponent } from "./stock/cart/cart.component";
import { OrdersComponent } from "./stock/orders/orders.component";
import { AdminComponent } from "./stock/admin/admin.component";
import { ProductDetailComponent } from "./stock/product-detail/product-detail.component";

const landingRoutes = () =>
    import('./landing/landing-page.component').then(m => m.LandingPageComponent);

const featureDetailRoutes = () =>
    import('./landing/features/feature-detail.component').then(m => m.FeatureDetailComponent);

export const routes: Routes = [
  // 1. Public Landing Page
  {
    path: 'landing',
    loadComponent: landingRoutes,
    title: 'ClubHub — The operating system for student organizations',
  },

  // 2. Public Feature Detail Pages
  {
    path: 'features/:featureId',
    loadComponent: featureDetailRoutes,
    title: 'Learn about this feature | ClubHub',
  },

  // 3. AUTH Pages
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Sign In | ClubHub',
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign Up | ClubHub',
  },

  // 4. PROTECTED Routes (inside children if you have layout, but currently flat)
  {
    path: 'messaging',
    component: ConversationListComponent,
    title: 'messaging',
  },

  // Stock / Commerce Routes
  { path: 'products', component: ProductsComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'tickets', component: TicketsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'admin', component: AdminComponent },

  // Old redirect (keep for backward compatibility)
  {
    path: 'voice-communication-details',
    redirectTo: '/features/voice',
    pathMatch: 'full'
  },

  // 5. Default redirect to landing (MUST be near the end)
  {
    path: '',
    redirectTo: '/landing',
    pathMatch: 'full'
  },

  // 6. 404 - Catch all
  {
    path: '**',
    redirectTo: '/landing'
  }
];
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { credentialsInterceptor } from './treasury/services/credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Toutes les requetes HTTP passent par credentialsInterceptor
    // → withCredentials: true (cookie jwt) + redirection /treasury/login sur 401
    provideHttpClient(withInterceptors([credentialsInterceptor]))
  ]
};

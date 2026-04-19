import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken?.() ?? null;

    // Routes publiques (pas besoin de Bearer header — le cookie HttpOnly suffit)
    const isPublic =
      req.url.includes('/api/auth/') ||
      req.url.endsWith('/users') ||
      req.url.includes('/users?');

    // ✅ withCredentials: true → indispensable pour que le navigateur
    //    envoie/reçoive le cookie `jwt` HttpOnly de l'auth.
    let newReq = req.clone({ withCredentials: true });

    if (token && !isPublic) {
      newReq = newReq.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(newReq);
  }
}

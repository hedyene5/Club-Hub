import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: string;
  clubId: string;
  profilePhoto?: string; // ← ajoute cette ligne
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  //clubId: string;
  phoneNumber?: string;
  profilePhoto?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/register`, payload, {
      withCredentials: true  // ← envoie/reçoit les cookies
    }).pipe(
      tap(res => this.saveUser(res))
    );
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, payload, {
      withCredentials: true  // ← envoie/reçoit les cookies
    }).pipe(
      tap(res => this.saveUser(res))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.api}/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => localStorage.removeItem('user'))
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  getCurrentUser(): AuthResponse | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  getMe(): Observable<any> {
    return this.http.get('http://localhost:8081/api/users/me', {
      withCredentials: true
    });
  }

  // On garde juste les infos user dans localStorage (pas le token !)
  private saveUser(res: AuthResponse): void {
    localStorage.setItem('user', JSON.stringify(res));
  }
  checkSession(): Observable<any> {
  return this.http.get('http://localhost:8081/api/auth/check', {
    withCredentials: true
  });
}
}
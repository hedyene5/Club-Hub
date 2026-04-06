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
  clubId: string;
  phoneNumber?: string;
  profilePhoto?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api      = 'http://localhost:8081/api/auth';
  private usersApi = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/register`, payload, {
      withCredentials: true
    }).pipe(tap(res => this.saveUser(res)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, payload, {
      withCredentials: true
    }).pipe(tap(res => this.saveUser(res)));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.api}/logout`, {}, {
      withCredentials: true
    }).pipe(tap(() => localStorage.removeItem('user')));
  }

  checkSession(): Observable<any> {
    return this.http.get(`${this.api}/check`, {
      withCredentials: true
    });
  }

  // ── Récupère le user depuis MongoDB par son ID ──────────────────
  getMe(): Observable<any> {
    const session = this.getCurrentUser();
    const userId = session?.userId;
    if (!userId) {
      return new Observable(obs => obs.complete());
    }
    return this.http.get(`${this.usersApi}/${userId}`, {
      withCredentials: true
    });
  }

  // ── Met à jour la photo dans MongoDB ────────────────────────────
  updateProfilePhoto(userId: string, photoUrl: string): Observable<any> {
    return this.http.put(
      `${this.usersApi}/${userId}/photo`,
      { photoUrl },
      { withCredentials: true }
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  getCurrentUser(): AuthResponse | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  private saveUser(res: AuthResponse): void {
    localStorage.setItem('user', JSON.stringify(res));
  }
}
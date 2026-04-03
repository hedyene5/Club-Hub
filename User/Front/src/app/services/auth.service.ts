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
  profilePhoto: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  clubId: string;
  profilePhoto: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  getMe(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('http://localhost:8080/api/users/me');
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/register`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): AuthResponse | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res));
  }
}
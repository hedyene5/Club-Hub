import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: string;
  clubId: string;
  profilePhoto?: string;
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
  private api = 'http://localhost:8083/api/auth';

  private currentUser$ = new BehaviorSubject<AuthResponse | null>(
      this.getUserFromStorage()
  );

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
    }).pipe(tap(() => {
      localStorage.removeItem('user');
      this.currentUser$.next(null);
    }));
  }

  restoreSession(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.api}/check`, {
      withCredentials: true
    }).pipe(tap(res => this.saveUser(res)));
  }

  checkSession(): Observable<any> {
    return this.http.get(`${this.api}/check`, {
      withCredentials: true
    });
  }

  isLoggedIn(): boolean {
    return !!this.currentUser$.getValue();
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUser$.getValue();
  }

  getCurrentUser$(): Observable<AuthResponse | null> {
    return this.currentUser$.asObservable();
  }

  getMe(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('http://localhost:8083/api/users/me', {
      withCredentials: true
    });
  }

  private saveUser(res: AuthResponse): void {
    const userToSave = { ...res, token: undefined };
    localStorage.setItem('user', JSON.stringify(userToSave));
    this.currentUser$.next(userToSave);
  }

  private getUserFromStorage(): AuthResponse | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
}
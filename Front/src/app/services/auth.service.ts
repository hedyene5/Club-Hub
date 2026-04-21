import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: string;
  clubId: string;
  profilePhoto: string;
  customRoleId?: string;  // ✅ ID du rôle personnalisé (optionnel)
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

export interface LegacyUser {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role: string;
  clubId: string;
  clubName?: string;
  profilePhoto?: string;
  active?: boolean;
}

export interface StoredUser extends AuthResponse {
  clubName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ✅ Appel via le User Service (port 8081)
  private gateway = environment.authUrl.replace('/api', '');
  private api = `${this.gateway}/api/auth`;
  private usersApi = `${this.gateway}/api/users`;

  // ✅ Observable pour synchroniser les changements de profil en temps réel
  private userProfileSubject = new BehaviorSubject<StoredUser | null>(this.getCurrentUser());
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(private http: HttpClient) {}

  getMe(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.gateway}/api/users/me`).pipe(
      tap(res => {
        const existing = this.getCurrentUser();
        const updated = { ...existing, ...res };
        localStorage.setItem('user', JSON.stringify(updated));
        this.userProfileSubject.next(updated); // ✅ Émettre le changement
      })
    );
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
    this.userProfileSubject.next(null); // ✅ Émettre la déconnexion
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): StoredUser | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  getCurrentClubId(): string {
    return this.getCurrentUser()?.clubId || '';
  }

  getCurrentRole(): string {
    return this.getCurrentUser()?.role || '';
  }

  isCEO(): boolean {
    const role = this.getCurrentRole();
    return role === 'PRESIDENT' || role === 'CEO';
  }

  isSecretary(): boolean {
    const role = this.getCurrentRole();
    return role === 'RH' || role === 'SECRETAIRE_GENERALE' || role === 'SECRETARY';
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    const userData: StoredUser = { ...res, clubName: '' };
    localStorage.setItem('user', JSON.stringify(userData));
    this.userProfileSubject.next(userData); // ✅ Émettre le changement
  }

  updateClubName(clubName: string): void {
    const user = this.getCurrentUser();
    if (user) {
      user.clubName = clubName;
      localStorage.setItem('user', JSON.stringify(user));
      this.userProfileSubject.next(user); // ✅ Émettre le changement
    }
  }

  // ✅ Méthode pour mettre à jour le profil localement et émettre le changement
  updateLocalProfile(updates: Partial<StoredUser>): void {
    const user = this.getCurrentUser();
    if (user) {
      const updated = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      this.userProfileSubject.next(updated); // ✅ Émettre le changement
    }
  }

  // ===== MÉTHODES COMPATIBILITÉ =====
  createUser(user: LegacyUser): Observable<LegacyUser> {
    // Utiliser l'endpoint register au lieu de POST /api/users
    return this.http.post<LegacyUser>(`${this.api}/register`, user);
  }

  getUsersByClub(): Observable<LegacyUser[]> {
    const clubId = this.getCurrentClubId();
    return this.http.get<LegacyUser[]>(`${this.usersApi}/club/${clubId}`);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.usersApi}/${id}`);
  }

  updateUser(id: string, userData: any): Observable<LegacyUser> {
    return this.http.put<LegacyUser>(`${this.usersApi}/${id}`, userData);
  }

  updateProfilePhoto(userId: string, photoUrl: string): Observable<any> {
    return this.http.put(`${this.usersApi}/${userId}/photo`, { photoUrl }).pipe(
      tap(() => {
        // ✅ Mettre à jour localement et émettre le changement
        this.updateLocalProfile({ profilePhoto: photoUrl });
      })
    );
  }
}
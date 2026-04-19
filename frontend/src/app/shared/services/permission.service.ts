import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Permissions de l'utilisateur courant pour son club.
 *
 * Source : `/api/roles/club/{clubId}/users/{userId}/permissions` exposé par
 * le user-service. Si le user n'a pas encore de club, on garde la liste vide.
 *
 * Le service expose :
 *   - `permissions$` (Observable) consommé par les composants réactifs
 *   - `getPermissions(): string[]`
 *   - `hasPermission(code)` / `hasAnyPermission(...codes)` / `hasAllPermissions(...codes)`
 *   - `loadUserPermissions()` pour forcer un refresh (utilisé après création/édition de rôle)
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly apiUrl = 'http://localhost:8084/api/roles';

  private permissionsSubject = new BehaviorSubject<string[]>([]);
  public permissions$: Observable<string[]> = this.permissionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.loadUserPermissions();

    // Refresh à chaque login / logout / changement de profil.
    this.authService.userProfile$.subscribe((user) => {
      if (user) {
        // Petit délai pour que clubId soit propagé partout
        setTimeout(() => this.loadUserPermissions(), 100);
      } else {
        this.permissionsSubject.next([]);
      }
    });
  }

  loadUserPermissions(): void {
    const user = this.authService.getCurrentUser();
    const userId = user?.userId;
    const clubId = user?.clubId;

    if (!userId || !clubId) {
      this.permissionsSubject.next([]);
      return;
    }

    this.http
      .get<string[]>(`${this.apiUrl}/club/${clubId}/users/${userId}/permissions`)
      .subscribe({
        next: (perms) => this.permissionsSubject.next(perms ?? []),
        error: (err) => {
          console.error('Erreur chargement permissions utilisateur:', err);
          this.permissionsSubject.next([]);
        },
      });
  }

  getPermissions(): string[] {
    return this.permissionsSubject.value;
  }

  hasPermission(code: string): boolean {
    return this.permissionsSubject.value.includes(code);
  }

  hasAnyPermission(...codes: string[]): boolean {
    const perms = this.permissionsSubject.value;
    return codes.some((c) => perms.includes(c));
  }

  hasAllPermissions(...codes: string[]): boolean {
    const perms = this.permissionsSubject.value;
    return codes.every((c) => perms.includes(c));
  }

  checkPermission(
    userId: string,
    permission: string,
  ): Observable<{ hasPermission: boolean }> {
    return this.http.post<{ hasPermission: boolean }>(`${this.apiUrl}/check`, {
      userId,
      permission,
    });
  }
}

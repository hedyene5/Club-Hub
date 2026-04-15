import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = 'http://localhost:8084/api/permissions';
  private permissionsSubject = new BehaviorSubject<string[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Charger les permissions au démarrage
    this.loadUserPermissions();
    
    // ✅ Écouter les changements d'utilisateur (login/logout)
    // skip(1) pour ignorer la première émission (déjà chargé ci-dessus)
    this.authService.userProfile$.pipe(
      // On commence à écouter après le premier chargement
    ).subscribe(user => {
      if (user) {
        console.log('🔄 Nouvel utilisateur connecté, rechargement des permissions...');
        // Petit délai pour s'assurer que localStorage est à jour
        setTimeout(() => this.loadUserPermissions(), 100);
      } else {
        console.log('🔄 Utilisateur déconnecté, réinitialisation des permissions...');
        this.permissionsSubject.next([]);
      }
    });
  }

  /**
   * Charge les permissions de l'utilisateur connecté
   */
  loadUserPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (user?.userId) {
      console.log('📡 Chargement des permissions pour:', user.userId);
      this.http.get<string[]>(`${this.apiUrl}/user/${user.userId}`).subscribe({
        next: (permissions) => {
          console.log('✅ Permissions chargées:', permissions);
          this.permissionsSubject.next(permissions);
        },
        error: (err) => {
          console.error('❌ Erreur chargement permissions:', err);
          this.permissionsSubject.next([]);
        }
      });
    } else {
      console.log('⚠️ Aucun utilisateur connecté');
      this.permissionsSubject.next([]);
    }
  }

  /**
   * Vérifie si l'utilisateur a une permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.permissionsSubject.value;
    return permissions.includes(permission);
  }

  /**
   * Vérifie si l'utilisateur a au moins une des permissions
   */
  hasAnyPermission(...permissions: string[]): boolean {
    const userPermissions = this.permissionsSubject.value;
    return permissions.some(p => userPermissions.includes(p));
  }

  /**
   * Vérifie si l'utilisateur a toutes les permissions
   */
  hasAllPermissions(...permissions: string[]): boolean {
    const userPermissions = this.permissionsSubject.value;
    return permissions.every(p => userPermissions.includes(p));
  }

  /**
   * Récupère toutes les permissions de l'utilisateur
   */
  getPermissions(): string[] {
    return this.permissionsSubject.value;
  }

  /**
   * Vérifie une permission via l'API (pour être sûr)
   */
  checkPermission(userId: string, permission: string): Observable<{ hasPermission: boolean }> {
    return this.http.post<{ hasPermission: boolean }>(`${this.apiUrl}/check`, {
      userId,
      permission
    });
  }
}

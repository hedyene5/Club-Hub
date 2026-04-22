import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface ResponsableStatus {
  isResponsable: boolean;
  subGroupId?: string;
  subGroupName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommitteeResponsableService {
  private apiUrl = 'http://192.168.1.20:8083/api/clubs';
  
  // ✅ Cache du statut de responsable
  private responsableStatusSubject = new BehaviorSubject<ResponsableStatus | null>(null);
  public responsableStatus$ = this.responsableStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Charger le statut au démarrage
    this.loadResponsableStatus();
    
    // Recharger quand l'utilisateur change
    this.authService.userProfile$.subscribe(user => {
      if (user) {
        this.loadResponsableStatus();
      } else {
        this.responsableStatusSubject.next(null);
      }
    });
  }

  /**
   * ✅ Charge dynamiquement le statut de responsable depuis le backend
   */
  loadResponsableStatus(): void {
    const user = this.authService.getCurrentUser();
    const clubId = user?.clubId;
    const userId = user?.userId;
    
    if (!clubId || !userId) {
      console.log('⚠️ Pas de clubId ou userId');
      this.responsableStatusSubject.next({ isResponsable: false });
      return;
    }
    
    console.log('🔍 Vérification du statut de responsable pour userId:', userId, 'clubId:', clubId);
    
    this.http.get<ResponsableStatus>(`${this.apiUrl}/${clubId}/is-responsable/${userId}`).subscribe({
      next: (status) => {
        console.log('✅ Statut de responsable:', status);
        this.responsableStatusSubject.next(status);
      },
      error: (err) => {
        console.error('❌ Erreur chargement statut responsable:', err);
        this.responsableStatusSubject.next({ isResponsable: false });
      }
    });
  }

  /**
   * Vérifie si l'utilisateur actuel est responsable d'un comité
   */
  isResponsable(): boolean {
    const status = this.responsableStatusSubject.value;
    return status?.isResponsable || false;
  }

  /**
   * Récupère l'ID du comité dont l'utilisateur est responsable
   */
  getMySubGroupId(): string | null {
    const status = this.responsableStatusSubject.value;
    return status?.subGroupId || null;
  }

  /**
   * Récupère le nom du comité dont l'utilisateur est responsable
   */
  getMySubGroupName(): string | null {
    const status = this.responsableStatusSubject.value;
    return status?.subGroupName || null;
  }

  /**
   * Récupère le rôle affiché dynamiquement
   */
  getDisplayRole(): string {
    const status = this.responsableStatusSubject.value;
    if (status?.isResponsable && status.subGroupName) {
      return `Responsable ${status.subGroupName}`;
    }
    
    // Fallback sur le rôle stocké
    return this.authService.getCurrentRole();
  }
}

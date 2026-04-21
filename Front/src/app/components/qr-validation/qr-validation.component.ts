import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-qr-validation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-validation.component.html',
  styleUrls: ['./qr-validation.component.css']
})
export class QrValidationComponent implements OnInit {
  token: string = '';
  member: any = null;
  loading: boolean = true;
  error: string = '';
  processing: boolean = false;

  private apiUrl = `${environment.apiUrl}/qr-tokens`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.params['token'];
    console.log('🔍 Token QR reçu:', this.token);
    this.loadMemberInfo();
  }

  loadMemberInfo() {
    this.loading = true;
    this.error = '';

    this.http.get<any>(`${this.apiUrl}/${this.token}`).subscribe({
      next: (response) => {
        console.log('✅ Réponse API:', response);
        if (response.success) {
          this.member = response.data;
          this.loading = false;
        } else {
          this.error = response.message || 'Token QR invalide';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('❌ Erreur API:', err);
        this.error = 'Impossible de charger les informations du membre';
        this.loading = false;
      }
    });
  }

  validatePresence() {
    if (this.processing) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const validatedBy = currentUser.userId || currentUser.id;

    if (!validatedBy) {
      alert('Erreur: Impossible d\'identifier le responsable. Veuillez vous reconnecter.');
      return;
    }

    if (!confirm(`Confirmer la validation de présence pour ${this.member.name} ?`)) {
      return;
    }

    this.processing = true;

    this.http.post<any>(`${this.apiUrl}/${this.token}/validate`, {
      validatedBy: validatedBy
    }).subscribe({
      next: (response) => {
        console.log('✅ Validation réussie:', response);
        if (response.success) {
          this.router.navigate(['/elections/scan/success'], {
            queryParams: {
              memberName: response.memberName,
              action: 'validated'
            }
          });
        } else {
          alert('Erreur: ' + response.message);
          this.processing = false;
        }
      },
      error: (err) => {
        console.error('❌ Erreur validation:', err);
        alert('Erreur lors de la validation: ' + (err.error?.message || err.message));
        this.processing = false;
      }
    });
  }

  rejectPresence() {
    if (this.processing) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const validatedBy = currentUser.userId || currentUser.id;

    if (!validatedBy) {
      alert('Erreur: Impossible d\'identifier le responsable. Veuillez vous reconnecter.');
      return;
    }

    const reason = prompt('Raison du rejet (optionnel):');
    
    if (!confirm(`Confirmer le rejet de présence pour ${this.member.name} ?`)) {
      return;
    }

    this.processing = true;

    this.http.post<any>(`${this.apiUrl}/${this.token}/reject`, {
      validatedBy: validatedBy,
      reason: reason || 'Non spécifiée'
    }).subscribe({
      next: (response) => {
        console.log('✅ Rejet réussi:', response);
        if (response.success) {
          this.router.navigate(['/elections/scan/success'], {
            queryParams: {
              memberName: response.memberName,
              action: 'rejected'
            }
          });
        } else {
          alert('Erreur: ' + response.message);
          this.processing = false;
        }
      },
      error: (err) => {
        console.error('❌ Erreur rejet:', err);
        alert('Erreur lors du rejet: ' + (err.error?.message || err.message));
        this.processing = false;
      }
    });
  }
}

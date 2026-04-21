import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-vote-with-token',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vote-with-token.component.html',
  styleUrls: ['./vote-with-token.component.css']
})
export class VoteWithTokenComponent implements OnInit {
  electionId: string = '';
  votingToken: string = '';
  election: any = null;
  candidates: any[] = [];
  loading: boolean = true;
  error: string = '';
  voting: boolean = false;
  selectedCandidateId: string = '';

  private apiUrl = 'http://172.18.72.32:8083/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.electionId = this.route.snapshot.params['id'];
    this.votingToken = this.route.snapshot.queryParams['token'];

    console.log('🗳️ Election ID:', this.electionId);
    console.log('🔑 Voting Token:', this.votingToken);

    if (!this.votingToken) {
      this.error = 'Token de vote manquant';
      this.loading = false;
      return;
    }

    this.validateToken();
  }

  validateToken() {
    this.loading = true;
    this.error = '';

    this.http.get<any>(`${this.apiUrl}/qr-tokens/voting/${this.votingToken}/validate`).subscribe({
      next: (response) => {
        console.log('✅ Validation token:', response);
        if (response.valid) {
          this.loadElection();
        } else {
          this.error = response.message || 'Token invalide ou expiré';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('❌ Erreur validation token:', err);
        this.error = 'Impossible de valider le token';
        this.loading = false;
      }
    });
  }

  loadElection() {
    this.http.get<any>(`${this.apiUrl}/elections/${this.electionId}`).subscribe({
      next: (election) => {
        console.log('✅ Élection chargée:', election);
        this.election = election;
        this.candidates = election.candidates.filter((c: any) => c.status === 'APPROVED');
        this.loading = false;

        if (this.candidates.length === 0) {
          this.error = 'Aucun candidat approuvé pour cette élection';
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement élection:', err);
        this.error = 'Impossible de charger l\'élection';
        this.loading = false;
      }
    });
  }

  selectCandidate(candidateId: string) {
    this.selectedCandidateId = candidateId;
  }

  vote() {
    if (!this.selectedCandidateId) {
      alert('Veuillez sélectionner un candidat');
      return;
    }

    if (!confirm('Confirmer votre vote ? Cette action est définitive.')) {
      return;
    }

    this.voting = true;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const voterId = currentUser.userId || currentUser.id;

    this.http.post<any>(`${this.apiUrl}/elections/${this.electionId}/vote-with-token`, {
      voterId: voterId,
      candidateId: this.selectedCandidateId,
      token: this.votingToken
    }).subscribe({
      next: (response) => {
        console.log('✅ Vote enregistré:', response);
        if (response.success) {
          this.router.navigate(['/elections/vote/success'], {
            queryParams: {
              electionTitle: this.election.title
            }
          });
        } else {
          alert('Erreur: ' + response.error);
          this.voting = false;
        }
      },
      error: (err) => {
        console.error('❌ Erreur vote:', err);
        alert('Erreur lors du vote: ' + (err.error?.error || err.message));
        this.voting = false;
      }
    });
  }
}

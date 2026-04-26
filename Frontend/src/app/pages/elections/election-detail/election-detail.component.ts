import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ElectionService } from '../../../shared/services/election.service';
import { ClubService } from '../../../services/club.service';
import { AuthService } from '../../../services/auth.service';
import { Election, Candidate, Vote, EligibilityResult } from '../../../models/election.model';
import { SubGroup } from '../../../models/club.model';

@Component({
  selector: 'app-election-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './election-detail.component.html',
  styleUrls: ['./election-detail.component.css']
})
export class ElectionDetailComponent implements OnInit {
  election: Election | null = null;
  clubId: string | null = null;
  loading = true;
  
  // Formulaires existants
  candidateForm: FormGroup;
  voteForm: FormGroup;
  showCandidateForm = false;
  showVoteForm = false;
  
  // Formulaire de candidature
  applicationForm: FormGroup;
  showApplicationForm = false;
  submitting = false;
  clubSubGroups: SubGroup[] = [];

  constructor(
    private electionService: ElectionService,
    private clubService: ClubService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Formulaire pour ajouter un candidat (CEO)
    this.candidateForm = this.fb.group({
      userId: ['', Validators.required],
      name: ['', Validators.required],
      manifesto: ['', Validators.required]
    });
    
    // Formulaire pour voter
    this.voteForm = this.fb.group({
      voterId: ['', Validators.required],
      candidateId: ['', Validators.required]
    });
    
    // Formulaire de candidature (pour les membres)
    this.applicationForm = this.fb.group({
      userId: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subGroupTarget: [''],
      yearsInClub: [0, [Validators.min(0), Validators.max(10)]],
      motivation: ['', Validators.required],
      manifesto: [''],
      skills: [''],
      conditionsAccepted: [false, Validators.requiredTrue]
    });
  }
  isCEO: boolean = false;
  isAdmin: boolean = false;  // PRESIDENT, RH, SECRETAIRE_GENERALE
  currentUserId: string = '';
  hasAlreadyApplied: boolean = false;
  hasAlreadyVoted: boolean = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const role = this.authService.getCurrentRole();
    this.isAdmin = ['PRESIDENT', 'RH', 'SECRETAIRE_GENERALE'].includes(role);
    this.isCEO = role === 'PRESIDENT';
    this.currentUserId = this.authService.getCurrentUser()?.userId || '';

    if (id) {
      this.loadElection(id);
      this.loadCurrentUser();
    }
  }

  loadElection(id: string): void {
    this.electionService.getElectionById(id).subscribe({
      next: (data) => {
        this.election = data;
        this.clubId = data.clubId;
        this.loading = false;
        
        // Vérifier si déjà candidat ou déjà voté
        this.hasAlreadyApplied = data.candidates?.some(c => c.userId === this.currentUserId) || false;
        this.hasAlreadyVoted = data.votes?.some((v: any) => v.voterId === this.currentUserId) || false;

        if (this.clubId) {
          this.loadClubSubGroups(this.clubId);
        }
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user chargé:', currentUser);
    
    if (currentUser) {
      this.applicationForm.patchValue({
        userId: currentUser.userId,        // ← userId au lieu de id
        name: currentUser.firstName + ' ' + currentUser.lastName,  // ← nom composé
        email: currentUser.email
      });
      this.voteForm.patchValue({
        voterId: currentUser.userId
      });
    } else {
      console.log('Aucun utilisateur connecté');
    }
  }

  loadClubSubGroups(clubId: string): void {
    this.clubService.getClubById(clubId).subscribe({
      next: (club) => {
        this.clubSubGroups = club.subGroups || [];
      },
      error: (err) => console.error('Erreur chargement sous-groupes:', err)
    });
  }

  // ========== Gestion des candidats (CEO) ==========
  addCandidate(): void {
    if (this.candidateForm.invalid || !this.election) return;
    
    this.electionService.addCandidate(this.election.id!, this.candidateForm.value).subscribe({
      next: () => {
        this.loadElection(this.election!.id!);
        this.candidateForm.reset();
        this.showCandidateForm = false;
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  validateCandidate(candidateId: string): void {
    if (this.election) {
      this.electionService.validateCandidate(this.election.id!, candidateId).subscribe({
        next: () => this.loadElection(this.election!.id!),
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  rejectCandidate(candidateId: string): void {
    if (this.election) {
      const reason = prompt('Raison du rejet :');
      if (reason) {
        this.electionService.rejectCandidate(this.election.id!, candidateId, reason).subscribe({
          next: () => this.loadElection(this.election!.id!),
          error: (err) => console.error('Erreur:', err)
        });
      }
    }
  }

  // ========== Soumettre une candidature (pour les membres) ==========
  submitApplication(): void {
    if (this.applicationForm.invalid) return;
    
    this.submitting = true;
    const applicationData = this.applicationForm.value;
    
    // Convertir les compétences en tableau
    if (applicationData.skills) {
      applicationData.skills = applicationData.skills.split(',').map((s: string) => s.trim());
    } else {
      applicationData.skills = [];
    }
    
    this.electionService.submitCandidacy(this.election!.id!, applicationData).subscribe({
      next: (result: EligibilityResult) => {
        this.submitting = false;
        if (result.eligible) {
          alert('✅ ' + result.reasons.join('\n'));
          this.showApplicationForm = false;
          this.applicationForm.reset({ conditionsAccepted: false });
          this.loadElection(this.election!.id!);
        } else {
          alert('❌ ' + result.reasons.join('\n'));
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('Erreur:', err);
        alert('Erreur lors de la soumission');
      }
    });
  }

  // ========== Gestion des votes ==========
  castVote(): void {
    if (this.voteForm.invalid || !this.election) return;
    
    this.electionService.castVote(this.election.id!, this.voteForm.value).subscribe({
      next: () => {
        this.loadElection(this.election!.id!);
        this.voteForm.reset();
        this.showVoteForm = false;
        this.hasAlreadyVoted = true;
      },
      error: (err) => {
        const msg = err.error || err.message || 'Erreur lors du vote';
        alert('❌ ' + msg);
      }
    });
  }

  // ========== Gestion de l'élection ==========
  startElection(): void {
    if (this.election) {
      this.electionService.startElection(this.election.id!).subscribe({
        next: () => this.loadElection(this.election!.id!),
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  closeElection(): void {
    if (this.election) {
      this.electionService.closeElection(this.election.id!).subscribe({
        next: () => this.loadElection(this.election!.id!),
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  deleteElection(): void {
    if (!this.election || !confirm('Supprimer cette élection définitivement ?')) return;
    this.electionService.deleteElection(this.election.id!).subscribe({
      next: () => this.router.navigate(['/clubs', this.clubId]),
      error: (err) => console.error('Erreur:', err)
    });
  }

  // ========== Utilitaires ==========
  getStatusColor(status: string): string {
    switch(status) {
      case 'PLANNED': return 'bg-yellow-100 text-yellow-800';
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getCandidateStatusColor(status: string): string {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  getWinnerName(): string {
    if (!this.election?.results?.winnerId) return 'Aucun';
    
    const winner = this.election.candidates.find(
      c => c.userId === this.election?.results?.winnerId
    );
    
    return winner?.name || this.election.results.winnerId;
  }
}
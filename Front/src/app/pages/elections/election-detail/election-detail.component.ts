import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ElectionService } from '../../../services/election.service';
import { ClubService } from '../../../services/club.service';
import { AuthService } from '../../../services/auth.service';
import { AiGenerationService } from '../../../services/ai-generation.service';
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
  
  // Cache pour les candidats groupés par comité
  private candidatesByCommitteeCache: Array<{key: string, value: Candidate[]}> = [];
  
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
  
  // Génération IA
  generatingWithAI = false;
  aiError: string | null = null;

  constructor(
    private electionService: ElectionService,
    private clubService: ClubService,
    private authService: AuthService,
    private aiService: AiGenerationService,
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
      userIdeas: [''],  // Nouveau champ pour les idées de l'utilisateur
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
  votedCommittees: Set<string> = new Set(); // Comités pour lesquels l'utilisateur a déjà voté
  availableCommittees: any[] = [];
  votingMode: string = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const role = this.authService.getCurrentRole();
    this.isAdmin = ['PRESIDENT', 'RH', 'SECRETAIRE_GENERALE'].includes(role);
    this.isCEO = role === 'PRESIDENT';
    this.currentUserId = this.authService.getCurrentUser()?.userId || '';

    if (id) {
      this.loadElection(id);
      this.loadCurrentUser();
      // loadAvailableCommittees sera appelé dans loadElection() après avoir les données
    }
  }

  loadElection(id: string): void {
    this.electionService.getElectionById(id).subscribe({
      next: (data) => {
        this.election = data;
        this.clubId = data.clubId;
        this.loading = false;
        
        // Vérifier si déjà candidat
        this.hasAlreadyApplied = data.candidates?.some(c => c.userId === this.currentUserId) || false;
        
        // Identifier les comités pour lesquels l'utilisateur a déjà voté
        this.votedCommittees.clear();
        if (data.votes) {
          data.votes.forEach((vote: any) => {
            if (vote.voterId === this.currentUserId && vote.subGroupId) {
              this.votedCommittees.add(vote.subGroupId);
            }
          });
        }
        
        console.log('Comités déjà votés:', Array.from(this.votedCommittees));

        if (this.clubId) {
          this.loadClubSubGroups(this.clubId);
        }
        
        // Charger les comités disponibles APRÈS avoir chargé l'élection
        if (this.currentUserId) {
          this.loadAvailableCommittees(id);
        }
        
        // Mettre à jour le cache des candidats groupés
        this.updateCandidatesByCommitteeCache();
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

  loadAvailableCommittees(electionId: string): void {
    if (!this.currentUserId) {
      console.error('currentUserId est vide, impossible de charger les comités');
      return;
    }
    
    this.electionService.getAvailableCommittees(electionId, this.currentUserId).subscribe({
      next: (result) => {
        this.votingMode = result.votingMode || 'ALL_CLUB_MEMBERS';
        this.availableCommittees = result.availableCommittees || [];
        
        // Mettre à jour le cache après avoir chargé les comités disponibles
        this.updateCandidatesByCommitteeCache();
      },
      error: (err) => {
        console.error('Erreur chargement comités disponibles:', err);
      }
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
  generateWithAI(): void {
    const userIdeas = this.applicationForm.get('userIdeas')?.value;
    
    if (!userIdeas || userIdeas.trim().length === 0) {
      this.aiError = 'Veuillez d\'abord décrire vos idées dans le champ ci-dessus';
      return;
    }
    
    this.generatingWithAI = true;
    this.aiError = null;
    
    const request = {
      candidateName: this.applicationForm.get('name')?.value || 'Candidat',
      clubName: 'ClubHub',
      position: this.applicationForm.get('subGroupTarget')?.value || 'Membre',
      userIdeas: userIdeas
    };
    
    this.aiService.generateMotivationLetter(
      request,
      this.currentUserId,
      this.clubId || undefined
    ).subscribe({
      next: (response) => {
        // Remplir automatiquement les champs
        this.applicationForm.patchValue({
          motivation: response.motivationLetter,
          manifesto: response.program,
          skills: response.skills.join(', ')
        });
        
        this.generatingWithAI = false;
        this.aiError = null;
      },
      error: (err) => {
        console.error('Erreur génération IA:', err);
        this.generatingWithAI = false;
        this.aiError = 'Erreur lors de la génération. Vérifiez que le service IA est démarré.';
      }
    });
  }

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
  castVoteForCandidate(candidateId: string, committeeName: string): void {
    if (!this.election) {
      alert('❌ Erreur: Élection non chargée');
      return;
    }
    
    if (!this.currentUserId) {
      alert('❌ Erreur: Utilisateur non identifié');
      return;
    }
    
    const vote = {
      voterId: this.currentUserId,
      candidateId: candidateId
    };
    
    this.electionService.castVote(this.election.id!, vote).subscribe({
      next: () => {
        alert('✅ Vote enregistré pour le comité ' + committeeName);
        this.loadElection(this.election!.id!);
      },
      error: (err) => {
        console.error('Erreur lors du vote:', err);
        const msg = err.error || err.message || 'Erreur lors du vote';
        alert('❌ ' + msg);
      }
    });
  }

  getCandidatesByCommittee(): Array<{key: string, value: Candidate[]}> {
    return this.candidatesByCommitteeCache;
  }

  private updateCandidatesByCommitteeCache(): void {
    if (!this.election || !this.election.candidates) {
      this.candidatesByCommitteeCache = [];
      return;
    }
    
    // Grouper les candidats approuvés par comité
    const map = new Map<string, Candidate[]>();
    this.election.candidates
      .filter(c => c.status === 'APPROVED')
      .forEach(candidate => {
        const committee = candidate.subGroupTarget || 'Autre';
        if (!map.has(committee)) {
          map.set(committee, []);
        }
        map.get(committee)!.push(candidate);
      });
    
    // Filtrer selon le mode de vote
    let filteredEntries: Array<[string, Candidate[]]>;
    
    if (this.votingMode === 'COMMITTEE_MEMBERS_ONLY') {
      // Mode COMMITTEE_ONLY : Afficher seulement les comités dont l'utilisateur est membre
      const userCommitteeNames = this.availableCommittees
        .filter(c => c.canVote)
        .map(c => c.committeeName);
      
      filteredEntries = Array.from(map.entries()).filter(([committeeName]) => 
        userCommitteeNames.includes(committeeName)
      );
    } else {
      // Mode ALL_CLUB_MEMBERS : Afficher tous les comités
      filteredEntries = Array.from(map.entries());
    }
    
    // Convertir en Array pour compatibilité Angular
    this.candidatesByCommitteeCache = filteredEntries.map(([key, value]) => ({key, value}));
  }

  canVoteForCommittee(committeeName: string): boolean {
    if (!this.availableCommittees || this.availableCommittees.length === 0) {
      return false;
    }
    
    const committee = this.availableCommittees.find(c => c.committeeName === committeeName);
    return committee ? committee.canVote : false;
  }

  hasVotedForCommittee(committeeName: string): boolean {
    if (!this.availableCommittees || this.availableCommittees.length === 0) {
      return false;
    }
    
    const committee = this.availableCommittees.find(c => c.committeeName === committeeName);
    if (!committee) return false;
    
    return this.votedCommittees.has(committee.subGroupId);
  }

  getVotableCandidates(): Candidate[] {
    if (!this.election || !this.election.candidates) {
      return [];
    }
    
    // Si pas de comités disponibles chargés, retourner tous les candidats approuvés
    if (!this.availableCommittees.length) {
      return this.election.candidates.filter(c => c.status === 'APPROVED');
    }
    
    // En mode COMMITTEE_MEMBERS_ONLY, filtrer par comités disponibles
    if (this.votingMode === 'COMMITTEE_MEMBERS_ONLY') {
      const votableCommittees = this.availableCommittees
        .filter(c => c.canVote)
        .map(c => c.committeeName);
      
      return this.election.candidates.filter(candidate => 
        candidate.status === 'APPROVED' && 
        votableCommittees.includes(candidate.subGroupTarget)
      );
    }
    
    // En mode ALL_CLUB_MEMBERS, tous les candidats approuvés
    return this.election.candidates.filter(c => c.status === 'APPROVED');
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
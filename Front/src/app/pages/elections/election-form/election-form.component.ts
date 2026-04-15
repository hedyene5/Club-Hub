import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ElectionService } from '../../../services/election.service';
import { AuthService } from '../../../services/auth.service';
import { ClubService } from '../../../services/club.service';
import { SubGroup } from '../../../models/club.model';

@Component({
  selector: 'app-election-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './election-form.component.html',
  styleUrls: ['./election-form.component.css']
})
export class ElectionFormComponent implements OnInit {
  electionForm: FormGroup;
  isEditMode = false;
  electionId: string | null = null;
  clubId: string = '';
  clubName: string = '';
  loading = false;
  electionTypes = ['PRESIDENT', 'BUREAU'];
  clubSubGroups: SubGroup[] = [];  // Comités du club

  constructor(
    private fb: FormBuilder,
    private electionService: ElectionService,
    private authService: AuthService,
    private clubService: ClubService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.electionForm = this.fb.group({
      clubId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      type: ['VIRTUAL', Validators.required],
      electionType: ['PRESIDENT', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      anonymous: [true],
      // Options bureau
      voteScope: ['OWN_SUBGROUP'],   // OWN_SUBGROUP | ALL_SUBGROUPS
      voteLimit: ['ONCE'],           // ONCE | PER_SUBGROUP
      committees: this.fb.array([])  // Comités inclus dans l'élection
    });
  }

  ngOnInit(): void {
    const clubIdFromQuery = this.route.snapshot.queryParamMap.get('clubId');
    const currentUser = this.authService.getCurrentUser();
    this.clubId = clubIdFromQuery || currentUser?.clubId || '';

    if (this.clubId) {
      this.clubService.getClubById(this.clubId).subscribe({
        next: (club) => {
          this.clubName = club.name;
          this.clubSubGroups = club.subGroups || [];
          // Si élection bureau déjà sélectionnée, charger les comités
          if (this.electionForm.get('electionType')?.value === 'BUREAU') {
            this.initCommittees();
          }
        }
      });
    }

    this.electionForm.patchValue({ clubId: this.clubId });

    this.electionId = this.route.snapshot.paramMap.get('id');
    if (this.electionId) {
      this.isEditMode = true;
      this.loadElection();
    }

    this.electionForm.get('electionType')?.valueChanges.subscribe(value => {
      if (value === 'BUREAU') {
        this.initCommittees();
      } else {
        this.clearCommittees();
      }
    });

    // Propager la règle globale voteScope vers tous les comités
    this.electionForm.get('voteScope')?.valueChanges.subscribe(value => {
      this.committeesArray.controls.forEach(ctrl => {
        ctrl.get('voteScope')?.setValue(value, { emitEvent: false });
      });
    });
  }

  get committeesArray(): FormArray {
    return this.electionForm.get('committees') as FormArray;
  }

  initCommittees(): void {
    this.clearCommittees();
    const globalVoteScope = this.electionForm.get('voteScope')?.value || 'OWN_SUBGROUP';
    this.clubSubGroups.forEach(sg => {
      this.committeesArray.push(this.fb.group({
        subGroupId: [sg.id],
        subGroupName: [sg.name],
        included: [true],
        maxCandidates: [5],
        voteScope: [globalVoteScope]  // ← valeur globale par défaut
      }));
    });
  }

  clearCommittees(): void {
    while (this.committeesArray.length) {
      this.committeesArray.removeAt(0);
    }
  }

  loadElection(): void {
    this.electionService.getElectionById(this.electionId!).subscribe({
      next: (election) => {
        this.electionForm.patchValue({
          clubId: election.clubId,
          title: election.title,
          description: election.description,
          type: election.type,
          electionType: election.electionType || 'PRESIDENT',
          startDate: election.startDate.toString().slice(0, 16),
          endDate: election.endDate.toString().slice(0, 16),
          anonymous: election.anonymous,
          voteScope: (election as any).voteScope || 'OWN_SUBGROUP',
          voteLimit: (election as any).voteLimit || 'ONCE'
        });
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  onSubmit(): void {
    if (this.electionForm.invalid) return;
    this.loading = true;
    const formValue = this.electionForm.value;

    // Construire les positions depuis les comités inclus
    const positions = formValue.electionType === 'BUREAU'
      ? formValue.committees
          .filter((c: any) => c.included)
          .map((c: any) => ({
            id: c.subGroupId,
            title: 'Responsable ' + c.subGroupName,
            description: 'Responsable du comité ' + c.subGroupName,
            maxCandidates: c.maxCandidates,
            subGroupId: c.subGroupId,
            subGroupName: c.subGroupName,
            voteScope: c.voteScope
          }))
      : [];

    const electionData = {
      ...formValue,
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      positions,
      committees: undefined // ne pas envoyer le FormArray brut
    };

    const obs = this.isEditMode
      ? this.electionService.updateElection(this.electionId!, electionData)
      : this.electionService.createElection(electionData);

    obs.subscribe({
      next: () => this.router.navigate(['/clubs', this.clubId]),
      error: (err) => { console.error(err); this.loading = false; }
    });
  }
}
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClubService } from '../../../services/club.service';
import { AuthService } from '../../../services/auth.service';
import { Club, Member, SubGroup, SubGroupRecommendation } from '../../../models/club.model';
import { ElectionService } from '../../../services/election.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CustomRoleService, CustomRole } from '../../../services/custom-role.service';
import { filter } from 'rxjs/operators';
import { PermissionService } from '../../../services/permission.service';
import { RoleEventsService } from '../../../services/role-events.service';
import { CommitteeResponsableService } from '../../../services/committee-responsable.service';

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './club-detail.component.html',
  styleUrls: ['./club-detail.component.css']
})
export class ClubDetailComponent implements OnInit, OnDestroy {
  club: Club | null = null;
  loading = true;
  recommendation: SubGroupRecommendation | null = null;
  clubElections: any[] = [];
  private userProfileSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private permissionsSubscription?: Subscription;
  private roleChangedSubscription?: Subscription;

  // Formulaires
  memberForm: FormGroup;
  subGroupForm: FormGroup;
  assignForm: FormGroup;

  // États d'affichage
  showMemberForm = false;
  showSubGroupForm = false;
  showAssignForm = false;

  // Pour l'édition de sous-groupe
  editingSubGroupId: string | null = null;
  editSubGroupData: { name: string; description: string } = { name: '', description: '' };

  // Pour l'édition de membre
  editingMemberId: string | null = null;
  editMemberData: { name: string; email: string; role: string } = { 
    name: '', 
    email: '', 
    role: '' 
  };

  roles = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE_GENERALE', 'TRESORIER', 'RH', 'MEMBRE_SIMPLE'];
  customRoles: CustomRole[] = [];
  allRoles: string[] = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE_GENERALE', 'TRESORIER', 'RH', 'MEMBRE_SIMPLE', '➕ Autre (créer un nouveau rôle)'];
  isAdmin = false;

  constructor(
    private clubService: ClubService,
    public authService: AuthService,  // ✅ Changed to public for template access
    private electionService: ElectionService,
    private customRoleService: CustomRoleService,
    public permissionService: PermissionService,
    public committeeResponsableService: CommitteeResponsableService,  // ✅ NOUVEAU
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private roleEventsService: RoleEventsService
  ) {
    this.memberForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['MEMBRE_SIMPLE', Validators.required]
    });

    this.subGroupForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });

    this.assignForm = this.fb.group({
      userId: ['', Validators.required],
      subGroupId: ['', Validators.required],
      subGroupRole: ['MEMBRE_COMITE', Validators.required]  // ✅ Par défaut: MEMBRE_COMITE
    });
  }

  ngOnInit(): void {
    const role = this.authService.getCurrentRole();
    this.isAdmin = role === 'PRESIDENT' || role === 'RH' || role === 'SECRETAIRE_GENERALE';
    
    console.log('🔍 ngOnInit - Role:', role, 'isAdmin:', this.isAdmin);
    console.log('🔍 Permissions actuelles:', this.permissionService.getPermissions());

    const id = this.route.snapshot.paramMap.get('id');
    console.log('🔍 ngOnInit - Club ID:', id);
    
    if (id) {
      this.loadClub(id);
      this.getRecommendation(id);
      this.loadClubElections(id);
      this.loadCustomRoles(id);
    }

    // ✅ S'abonner aux changements de profil pour mettre à jour la liste des membres
    this.userProfileSubscription = this.authService.userProfile$.subscribe(updatedUser => {
      if (updatedUser && this.club) {
        // Mettre à jour le membre dans la liste si son profil a changé
        const memberIndex = this.club.members.findIndex(m => m.userId === updatedUser.userId);
        if (memberIndex !== -1) {
          // Recharger le club pour avoir les données à jour
          this.loadClub(this.club.id!);
        }
      }
    });

    // ✅ S'abonner aux changements de permissions pour forcer la détection
    this.permissionsSubscription = this.permissionService.permissions$.subscribe(permissions => {
      console.log('🔄 Permissions mises à jour:', permissions);
      // Forcer Angular à détecter les changements
      this.cdr.detectChanges();
    });

    // ✅ NOUVEAU: S'abonner aux changements de statut de responsable
    this.committeeResponsableService.responsableStatus$.subscribe(status => {
      console.log('🔄 Statut de responsable mis à jour:', status);
      // Recharger les permissions quand le statut change
      if (status) {
        this.permissionService.loadUserPermissions();
      }
      this.cdr.detectChanges();
    });

    // ✅ S'abonner aux changements de rôles (création/modification/suppression)
    this.roleChangedSubscription = this.roleEventsService.roleChanged$.subscribe(() => {
      console.log('🔄 Rôles modifiés, rechargement des rôles personnalisés...');
      if (this.club?.id) {
        this.loadCustomRoles(this.club.id);
      }
    });

    // ✅ Recharger les rôles personnalisés quand on revient sur cette page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Vérifier si on est sur la page club-detail
        if (event.url.includes('/clubs/') && this.club?.id) {
          console.log('🔄 Navigation détectée, rechargement des rôles...');
          this.loadCustomRoles(this.club.id);
          // Recharger aussi les permissions et le statut de responsable
          this.permissionService.loadUserPermissions();
          this.committeeResponsableService.loadResponsableStatus();
        }
      });
  }

  // ✅ Vérifier si l'utilisateur est responsable d'un comité spécifique
  // UTILISE LA DÉTECTION DYNAMIQUE via committeeResponsableService
  isResponsibleOf(subGroupId: string): boolean {
    if (!this.club) return false;
    
    // ✅ Utiliser le service de détection dynamique
    const mySubGroupId = this.committeeResponsableService.getMySubGroupId();
    return mySubGroupId === subGroupId;
  }

  // ✅ Vérifier si l'utilisateur peut gérer un comité (admin OU responsable de ce comité)
  // MAIS le responsable ne peut PAS modifier/supprimer le comité, seulement gérer les membres
  canManageSubGroup(subGroupId: string): boolean {
    // Seuls les admins peuvent modifier/supprimer des comités
    return this.isAdmin;
  }
  
  // ✅ Vérifier si l'utilisateur peut gérer les membres d'un comité
  canManageSubGroupMembers(subGroupId: string): boolean {
    // Admin peut tout gérer
    if (this.isAdmin) return true;
    
    // Responsable peut gérer les membres de SON comité (détection dynamique)
    return this.isResponsibleOf(subGroupId);
  }

  // ✅ Obtenir l'ID du comité dont l'utilisateur est responsable
  // UTILISE LA DÉTECTION DYNAMIQUE
  getMyResponsibleSubGroupId(): string | null {
    return this.committeeResponsableService.getMySubGroupId();
  }

  // ✅ Vérifier si un membre appartient au comité du responsable
  isMemberInMySubGroup(memberId: string): boolean {
    const mySubGroupId = this.getMyResponsibleSubGroupId();
    if (!mySubGroupId || !this.club) return false;
    
    const member = this.club.members.find(m => m.userId === memberId);
    return member?.subGroupId === mySubGroupId;
  }

  // ✅ Le responsable NE PEUT PAS supprimer des membres du club
  // Seuls les admins et RH peuvent supprimer
  canDeleteMember(memberId: string): boolean {
    // Seuls les admins et ceux avec permission DELETE_MEMBERS (RH) peuvent supprimer
    return this.isAdmin || this.permissionService.hasPermission('DELETE_MEMBERS');
  }

  // ✅ Vérifier si le responsable peut retirer un membre d'un comité spécifique
  canRemoveFromSubGroup(subGroupId: string): boolean {
    // Admin peut tout faire
    if (this.isAdmin) {
      return true;
    }
    
    // Responsable peut retirer seulement de SON comité
    return this.isResponsibleOf(subGroupId);
  }

  // ✅ Obtenir le rôle d'affichage d'un membre (avec appartenance aux comités)
  getDisplayRole(member: any): string {
    // 1. PRESIDENT a la priorité absolue
    if (member.role === 'PRESIDENT') {
      return 'PRESIDENT';
    }
    
    // 2. Vérifier si le membre est RESPONSABLE d'un comité
    if (this.club?.subGroups) {
      for (const subGroup of this.club.subGroups) {
        if (subGroup.responsableId === member.userId) {
          return `Responsable ${subGroup.name}`;
        }
      }
    }
    
    // 3. Vérifier si le membre appartient à un comité (MEMBRE_COMITE)
    if (this.club?.subGroups && member.subGroupId) {
      const subGroup = this.club.subGroups.find(sg => sg.id === member.subGroupId);
      if (subGroup) {
        return `Membre du comité ${subGroup.name}`;
      }
    }
    
    // 4. Sinon, afficher le rôle de base
    return member.role;
  }

  ngOnDestroy(): void {
    this.userProfileSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    this.permissionsSubscription?.unsubscribe();
    this.roleChangedSubscription?.unsubscribe();
  }

  loadClubElections(clubId: string): void {
    this.electionService.getElectionsByClub(clubId).subscribe({
      next: (elections) => {
        this.clubElections = elections;
      },
      error: (err) => console.error('Erreur élections:', err)
    });
  }

  loadCustomRoles(clubId: string): void {
    console.log('🔍 Chargement des rôles personnalisés pour le club:', clubId);
    console.log('📋 allRoles AVANT chargement:', this.allRoles);
    
    this.customRoleService.getRolesByClub(clubId).subscribe({
      next: (customRoles) => {
        console.log('✅ Rôles personnalisés reçus:', customRoles);
        
        // Debug: afficher chaque rôle avec son statut isActive
        customRoles.forEach(role => {
          console.log(`   - ${role.roleName}: isActive = ${role.isActive} (type: ${typeof role.isActive})`);
        });
        
        this.customRoles = customRoles.filter(r => r.isActive);
        console.log('✅ Rôles actifs filtrés:', this.customRoles);
        
        // Combiner les rôles par défaut + rôles personnalisés + "Autre"
        this.allRoles = [
          ...this.roles,
          ...this.customRoles.map(r => r.roleName),
          '➕ Autre (créer un nouveau rôle)'
        ];
        console.log('📋 allRoles APRÈS chargement:', this.allRoles);
      },
      error: (err) => {
        console.error('❌ Erreur chargement rôles personnalisés:', err);
        console.error('❌ Détails de l\'erreur:', err.error);
        console.error('❌ Status:', err.status);
        // Si erreur, utiliser seulement les rôles par défaut + "Autre"
        this.allRoles = [...this.roles, '➕ Autre (créer un nouveau rôle)'];
        console.log('📋 allRoles après erreur:', this.allRoles);
      }
    });
  }

  onRoleChange(event: any): void {
    const selectedRole = event.target.value;
    if (selectedRole === '➕ Autre (créer un nouveau rôle)') {
      // Sauvegarder l'état du formulaire dans sessionStorage
      sessionStorage.setItem('returnToClub', this.club?.id || '');
      
      // Réinitialiser le select à MEMBRE_SIMPLE
      this.memberForm.patchValue({ role: 'MEMBRE_SIMPLE' });
      
      // Rediriger vers la page de gestion des rôles
      this.router.navigate(['/roles']);
    }
  }

  loadClub(id: string): void {
    this.clubService.getClubById(id).subscribe({
      next: (data) => {
        this.club = data;
        this.loading = false;

        // ❌ NE PAS donner les droits admin au responsable!
        // Le responsable a des permissions limitées gérées par les méthodes canManageSubGroupMembers(), etc.
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }

  // ✅ Méthode pour recharger les membres du club (appelée après modification de profil)
  refreshClubMembers(): void {
    if (this.club?.id) {
      this.loadClub(this.club.id);
    }
  }

  getRecommendation(clubId: string): void {
    this.clubService.recommendRole(clubId, 'user_ahmed').subscribe({
      next: (data) => {
        this.recommendation = data;
      },
      error: (err) => console.error('Erreur recommandation:', err)
    });
  }

  // ========== Gestion des membres ==========
  openMemberForm(): void {
    this.showMemberForm = !this.showMemberForm;
    if (this.showMemberForm && this.club?.id) {
      console.log('🔄 Ouverture du formulaire membre, rechargement des rôles...');
      this.loadCustomRoles(this.club.id);
    }
  }

  debugRoles(): void {
    console.log('=== DEBUG ROLES ===');
    console.log('Club ID:', this.club?.id);
    console.log('Roles par défaut:', this.roles);
    console.log('Custom roles:', this.customRoles);
    console.log('All roles:', this.allRoles);
    console.log('==================');
  }

  addMember(): void {
    if (this.memberForm.invalid || !this.club?.id) return;
  
    const formValue = this.memberForm.value;
    const selectedRole = formValue.role;
    
    // Vérifier si c'est un rôle personnalisé
    const customRole = this.customRoles.find(r => r.roleName === selectedRole);
    
    const newUser: any = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      role: selectedRole,  // ✅ Toujours envoyer le nom du rôle (système OU personnalisé)
      clubId: this.club.id,
      phoneNumber: '',
      profilePhoto: '',
      active: true
    };
    
    if (customRole) {
      // ✅ Si c'est un rôle personnalisé, ajouter aussi l'ID pour les permissions
      newUser.customRoleId = customRole.id;
      console.log('✅ Ajout avec rôle personnalisé:', customRole.roleName, 'ID:', customRole.id);
      console.log('📦 Payload envoyé:', JSON.stringify(newUser, null, 2));
    } else {
      console.log('✅ Ajout avec rôle système:', selectedRole);
      console.log('📦 Payload envoyé:', JSON.stringify(newUser, null, 2));
    }
  
    this.authService.createUser(newUser).subscribe({
      next: (createdUser: any) => {
        // ✅ FIX: Backend returns 'userId' field in AuthResponse
        const userId = createdUser.userId || createdUser.id || createdUser._id;
        
        if (!userId) {
          console.error('❌ User ID not found in response:', createdUser);
          alert('❌ Erreur: ID utilisateur non trouvé');
          return;
        }

        const member: Member = {
          userId: userId,
          email: createdUser.email,
          name: `${formValue.firstName} ${formValue.lastName}`.trim(),
          role: selectedRole,  // ✅ Afficher le vrai nom du rôle
          status: 'APPROVED',
          joinedDate: new Date(),
          subGroupId: null
        };
  
        this.clubService.addMember(this.club!.id!, member).subscribe({
          next: () => {
            // ✅ FIX: Reset state BEFORE reloading
            this.memberForm.reset({ role: 'MEMBRE_SIMPLE' });
            this.showMemberForm = false;
            this.editingMemberId = null;
            
            // Reload club data
            this.loadClub(this.club!.id!);
            
            alert(`✅ Membre ajouté !\nEmail: ${formValue.email}\nMot de passe: ${formValue.password}`);
          },
          error: (err) => {
            console.error('Erreur ajout membre au club:', err);
            alert('❌ Erreur lors de l\'ajout du membre au club');
          }
        });
      },
      error: (err) => {
        console.error('Erreur création utilisateur:', err);
        alert(err.error?.error === 'Email déjà utilisé' 
          ? '❌ Email déjà utilisé' 
          : '❌ Erreur création compte');
      }
    });
  }
  approveMember(userId: string): void {
    if (!this.club) return;
    this.clubService.approveMember(this.club.id!, userId).subscribe({
      next: () => this.loadClub(this.club!.id!),
      error: (err) => console.error('Erreur:', err)
    });
  }

  rejectMember(userId: string): void {
    if (!this.club) return;
    if (confirm('Êtes-vous sûr de vouloir rejeter ce membre ?')) {
      this.clubService.rejectMember(this.club.id!, userId).subscribe({
        next: () => this.loadClub(this.club!.id!),
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  changeRole(userId: string, role: string): void {
    if (!this.club) return;
    this.clubService.changeMemberRole(this.club.id!, userId, role).subscribe({
      next: () => this.loadClub(this.club!.id!),
      error: (err) => console.error('Erreur:', err)
    });
  }

  deleteMember(userId: string): void {
    if (!this.club) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      this.clubService.rejectMember(this.club.id!, userId).subscribe({
        next: () => {
          this.authService.deleteUser(userId).subscribe({
            next: () => {
              this.loadClub(this.club!.id!);
              alert('✅ Membre supprimé');
            },
            error: (err) => {
              console.error('Erreur suppression user:', err);
              this.loadClub(this.club!.id!);
              alert('✅ Membre supprimé du club');
            }
          });
        },
        error: (err) => {
          console.error('Erreur suppression du club:', err);
          alert('❌ Erreur lors de la suppression');
        }
      });
    }
  }

  // ========== Gestion des membres (modification) ==========
  startEditMember(member: any): void {
    this.editingMemberId = member.userId;
    this.editMemberData = {
      name: member.name,
      email: member.email,
      role: member.role
    };
  }

  cancelEditMember(): void {
    this.editingMemberId = null;
    this.editMemberData = { name: '', email: '', role: '' };
  }

  saveEditMember(userId: string): void {
    if (!this.club) return;
    
    // ✅ FIX: Validate userId before making API calls
    if (!userId || userId === 'null' || userId === 'undefined') {
      alert('❌ Erreur: ID membre invalide');
      this.cancelEditMember();
      return;
    }
    
    const updatedMember = {
      name: this.editMemberData.name,
      email: this.editMemberData.email,
      role: this.editMemberData.role
    };
    
    this.clubService.updateMemberInClub(this.club.id!, userId, updatedMember).subscribe({
      next: () => {
        this.authService.updateUser(userId, updatedMember).subscribe({
          next: () => {
            this.loadClub(this.club!.id!);
            this.cancelEditMember();
            alert('✅ Membre modifié');
          },
          error: (err) => {
            console.error('Erreur update user:', err);
            this.loadClub(this.club!.id!);
            this.cancelEditMember();
            alert('✅ Membre modifié dans le club');
          }
        });
      },
      error: (err) => {
        console.error('Erreur update club:', err);
        alert('❌ Erreur lors de la modification');
      }
    });
  }

  // ========== Gestion des sous-groupes ==========
  addSubGroup(): void {
    if (this.subGroupForm.invalid || !this.club) return;

    this.clubService.addSubGroup(this.club.id!, this.subGroupForm.value).subscribe({
      next: () => {
        this.loadClub(this.club!.id!);
        this.subGroupForm.reset();
        this.showSubGroupForm = false;
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  removeSubGroup(subGroupId: string): void {
    if (!this.club) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce sous-groupe ?')) {
      this.clubService.removeSubGroup(this.club.id!, subGroupId).subscribe({
        next: () => this.loadClub(this.club!.id!),
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  startEditSubGroup(subGroup: SubGroup): void {
    this.editingSubGroupId = subGroup.id!;
    this.editSubGroupData = {
      name: subGroup.name,
      description: subGroup.description
    };
  }

  cancelEditSubGroup(): void {
    this.editingSubGroupId = null;
    this.editSubGroupData = { name: '', description: '' };
  }

  saveEditSubGroup(subGroupId: string): void {
    if (!this.club) return;
  
    const originalSubGroup = this.club.subGroups.find(sg => sg.id === subGroupId);
    
    const updatedSubGroup: SubGroup = {
      id: subGroupId,
      name: this.editSubGroupData.name,
      description: this.editSubGroupData.description,
      memberIds: originalSubGroup?.memberIds || []
    };
  
    this.clubService.updateSubGroup(this.club.id!, subGroupId, updatedSubGroup).subscribe({
      next: () => {
        this.loadClub(this.club!.id!);
        this.cancelEditSubGroup();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  assignToSubGroup(): void {
    if (this.assignForm.invalid || !this.club) return;

    const { userId, subGroupId, subGroupRole } = this.assignForm.value;
    
    // ✅ Récupérer le mode d'appartenance aux comités
    const mode = this.club.rules?.committeeMembershipMode || 'MULTIPLE_ALLOWED';
    
    // ✅ RÈGLE 1: Mode SINGLE_ONLY - Un membre ne peut être que dans UN SEUL comité
    if (mode === 'SINGLE_ONLY') {
      // ✅ FIX: Vérifier dans TOUS les sous-groupes, pas seulement member.subGroupId
      // car en mode MULTIPLE_ALLOWED, subGroupId peut être écrasé
      const existingSubGroup = this.club.subGroups.find(sg => 
        sg.id !== subGroupId && sg.memberIds.includes(userId)
      );
      
      if (existingSubGroup) {
        const currentSubGroupName = existingSubGroup.name;
        alert(`❌ Ce club n'autorise qu'un seul comité par membre.\n\nLe membre est déjà dans le comité "${currentSubGroupName}".\n\nVeuillez d'abord le retirer de ce comité.`);
        return;
      }
    }
    
    // ✅ RÈGLE 2: Mode MULTIPLE_ALLOWED - Un membre peut être RESPONSABLE d'UN SEUL comité
    if (mode === 'MULTIPLE_ALLOWED' && subGroupRole === 'RESPONSABLE') {
      // Vérifier si le membre est déjà responsable d'un autre comité
      const isAlreadyResponsable = this.club.subGroups.some(sg => 
        sg.id !== subGroupId && sg.responsableId === userId
      );
      
      if (isAlreadyResponsable) {
        const currentResponsableSubGroup = this.club.subGroups.find(sg => 
          sg.id !== subGroupId && sg.responsableId === userId
        );
        const currentSubGroupName = currentResponsableSubGroup?.name || 'un comité';
        alert(`❌ Un membre ne peut être RESPONSABLE que d'UN SEUL comité.\n\nCe membre est déjà responsable du comité "${currentSubGroupName}".\n\nIl peut rejoindre ce comité en tant que MEMBRE_COMITE.`);
        return;
      }
    }
    
    // ✅ RÈGLE 3: Mode MULTIPLE_ALLOWED - Un RESPONSABLE ne peut appartenir qu'à SON comité
    if (mode === 'MULTIPLE_ALLOWED') {
      // Vérifier si le membre est déjà RESPONSABLE d'un autre comité
      const responsableSubGroup = this.club.subGroups.find(sg => 
        sg.responsableId === userId
      );
      
      if (responsableSubGroup && responsableSubGroup.id !== subGroupId) {
        const responsableSubGroupName = responsableSubGroup.name;
        alert(`❌ Un responsable de comité ne peut appartenir qu'à son propre comité.\n\nCe membre est responsable du comité "${responsableSubGroupName}".\n\nPour rejoindre un autre comité, il doit d'abord quitter son rôle de responsable.`);
        return;
      }
    }
    
    // ✅ VALIDATION: Si l'utilisateur est responsable de comité (détection dynamique)
    const mySubGroupId = this.committeeResponsableService.getMySubGroupId();
    if (mySubGroupId && !this.isAdmin) {
      // Vérifier qu'il assigne dans SON comité uniquement
      if (subGroupId !== mySubGroupId) {
        alert('❌ Vous ne pouvez assigner des membres que dans votre propre comité');
        return;
      }
      // Les responsables ne peuvent pas créer d'autres responsables
      if (subGroupRole === 'RESPONSABLE') {
        alert('❌ Seul le président peut nommer des responsables de comité');
        return;
      }
    }
    
    // Trouver le nom du comité
    const subGroup = this.club.subGroups.find(sg => sg.id === subGroupId);
    if (!subGroup) {
      alert('❌ Comité introuvable');
      return;
    }
    
    // ✅ Le backend gère maintenant le changement de rôle automatiquement
    this.clubService.assignToSubGroup(this.club.id!, userId, subGroupId, subGroupRole).subscribe({
      next: () => {
        this.loadClub(this.club!.id!);
        this.assignForm.reset({ subGroupRole: 'MEMBRE_COMITE' });
        this.showAssignForm = false;
        
        if (subGroupRole === 'RESPONSABLE') {
          alert(`✅ Membre assigné au comité en tant que Responsable\nNouveau rôle: Responsable ${subGroup.name}`);
        } else {
          alert(`✅ Membre assigné au comité`);
        }
        
        // ✅ Recharger les permissions ET le statut de responsable si c'est l'utilisateur actuel
        const currentUserId = this.authService.getCurrentUser()?.userId;
        if (userId === currentUserId) {
          this.permissionService.loadUserPermissions();
          this.committeeResponsableService.loadResponsableStatus();
        }
      },
      error: (err) => {
        console.error('Erreur:', err);
        const errorMessage = err.error?.message || err.error || 'Erreur lors de l\'assignation';
        alert('❌ ' + errorMessage);
      }
    });
  }

  // ========== Utilitaires ==========
  getStatusColor(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleColor(role: string): string {
    // Rôles de base du club
    if (role === 'PRESIDENT') return 'bg-purple-100 text-purple-800';
    if (role === 'VICE_PRESIDENT') return 'bg-indigo-100 text-indigo-800';
    if (role === 'SECRETAIRE_GENERALE') return 'bg-blue-100 text-blue-800';
    if (role === 'TRESORIER') return 'bg-green-100 text-green-800';
    if (role === 'RH') return 'bg-orange-100 text-orange-800';
    
    // Rôles de responsable de comité
    if (role.startsWith('Responsable ')) return 'bg-red-100 text-red-800';
    
    // Rôles de membre de comité
    if (role.startsWith('Membre du comité ')) return 'bg-yellow-100 text-yellow-800';
    
    // Rôles par défaut
    if (role === 'MEMBRE_SIMPLE') return 'bg-gray-100 text-gray-800';
    
    // Rôles personnalisés ou autres
    return 'bg-cyan-100 text-cyan-800';
  }

  deleteClub(): void {
    if (this.club?.id && confirm('Êtes-vous sûr de vouloir supprimer ce club ?')) {
      this.clubService.deleteClub(this.club.id).subscribe({
        next: () => this.router.navigate(['/clubs']),
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  getMemberNameById(memberId: string): string {
    const member = this.club?.members.find(m => m.userId === memberId);
    return member?.name || memberId;
  }

  getMemberById(memberId: string): any {
    return this.club?.members.find(m => m.userId === memberId) || null;
  }

  removeMemberFromSubGroup(subGroupId: string, userId: string): void {
    if (!this.club || !confirm('Retirer ce membre du sous-groupe ?')) return;
    
    // ✅ VALIDATION: Si responsable de comité, vérifier que c'est SON comité (détection dynamique)
    const mySubGroupId = this.committeeResponsableService.getMySubGroupId();
    if (mySubGroupId && !this.isAdmin) {
      if (subGroupId !== mySubGroupId) {
        alert('❌ Vous ne pouvez retirer des membres que de votre propre comité');
        return;
      }
    }
    
    this.clubService.removeFromSubGroup(this.club.id!, subGroupId, userId).subscribe({
      next: () => {
        this.loadClub(this.club!.id!);
        alert('✅ Membre retiré du comité');
        
        // ✅ Recharger les permissions ET le statut si c'est l'utilisateur actuel
        const currentUserId = this.authService.getCurrentUser()?.userId;
        if (userId === currentUserId) {
          this.permissionService.loadUserPermissions();
          this.committeeResponsableService.loadResponsableStatus();
        }
      },
      error: (err) => {
        console.error('Erreur:', err);
        alert('❌ Erreur lors du retrait');
      }
    });
  }

  // ✅ NOUVEAU: Changer le rôle d'un membre dans le comité
  changeSubGroupRole(subGroupId: string, userId: string, event: any): void {
    if (!this.club) return;
    
    const newRole = event.target.value;
    const currentUserId = this.authService.getCurrentUser()?.userId;
    
    // ✅ VALIDATION: Ne peut pas changer son propre rôle
    if (userId === currentUserId) {
      alert('❌ Vous ne pouvez pas changer votre propre rôle');
      event.target.value = this.club.members.find(m => m.userId === userId)?.subGroupRole || 'MEMBRE_COMITE';
      return;
    }
    
    // ✅ VALIDATION: Si responsable, vérifier que c'est SON comité (détection dynamique)
    const mySubGroupId = this.committeeResponsableService.getMySubGroupId();
    if (mySubGroupId && !this.isAdmin) {
      if (subGroupId !== mySubGroupId) {
        alert('❌ Vous ne pouvez changer les rôles que dans votre propre comité');
        event.target.value = this.club.members.find(m => m.userId === userId)?.subGroupRole || 'MEMBRE_COMITE';
        return;
      }
    }
    
    // Confirmer le changement
    const member = this.club.members.find(m => m.userId === userId);
    const subGroup = this.club.subGroups.find(sg => sg.id === subGroupId);
    
    if (!member || !subGroup) return;
    
    const action = newRole === 'RESPONSABLE' ? 'promouvoir' : 'rétrograder';
    const newRoleLabel = newRole === 'RESPONSABLE' ? 'Responsable' : 'Membre du comité';
    
    if (!confirm(`Voulez-vous ${action} ${member.name} en tant que ${newRoleLabel} ?`)) {
      event.target.value = member.subGroupRole || 'MEMBRE_COMITE';
      return;
    }
    
    // Appeler le service pour changer le rôle
    this.clubService.assignToSubGroup(this.club.id!, userId, subGroupId, newRole).subscribe({
      next: () => {
        this.loadClub(this.club!.id!);
        
        if (newRole === 'RESPONSABLE') {
          alert(`✅ ${member.name} est maintenant Responsable du comité ${subGroup.name}`);
        } else {
          alert(`✅ ${member.name} est maintenant Membre du comité ${subGroup.name}`);
        }
        
        // Recharger les permissions ET le statut si c'est l'utilisateur actuel
        if (userId === currentUserId) {
          this.permissionService.loadUserPermissions();
          this.committeeResponsableService.loadResponsableStatus();
        }
      },
      error: (err) => {
        console.error('Erreur:', err);
        alert('❌ Erreur lors du changement de rôle');
        event.target.value = member.subGroupRole || 'MEMBRE_COMITE';
      }
    });
  }
}
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
    private authService: AuthService,
    private electionService: ElectionService,
    private customRoleService: CustomRoleService,
    public permissionService: PermissionService,
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
      subGroupId: ['', Validators.required]
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
          // Recharger aussi les permissions
          this.permissionService.loadUserPermissions();
        }
      });
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

        // Vérifier si l'user est RESPONSABLE d'un sous-groupe → droits admin sur son sous-groupe
        const currentUserId = this.authService.getCurrentUser()?.userId;
        if (!this.isAdmin && currentUserId) {
          const memberInClub = data.members.find(m => m.userId === currentUserId);
          if (memberInClub && (memberInClub as any).subGroupRole === 'RESPONSABLE') {
            this.isAdmin = true;
          }
        }
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

  debugPermissions(): void {
    console.log('=== DEBUG PERMISSIONS ===');
    console.log('isAdmin:', this.isAdmin);
    console.log('Current role:', this.authService.getCurrentRole());
    console.log('Permissions:', this.permissionService.getPermissions());
    console.log('Has ADD_MEMBERS:', this.permissionService.hasPermission('ADD_MEMBERS'));
    console.log('Has EDIT_MEMBERS:', this.permissionService.hasPermission('EDIT_MEMBERS'));
    console.log('Has DELETE_MEMBERS:', this.permissionService.hasPermission('DELETE_MEMBERS'));
    console.log('Has ASSIGN_TO_SUBGROUPS:', this.permissionService.hasPermission('ASSIGN_TO_SUBGROUPS'));
    console.log('Has CREATE_SUBGROUPS:', this.permissionService.hasPermission('CREATE_SUBGROUPS'));
    console.log('========================');
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

    const { userId, subGroupId } = this.assignForm.value;
    this.clubService.assignToSubGroup(this.club.id!, userId, subGroupId).subscribe({
      next: () => {
        this.loadClub(this.club!.id!);
        this.assignForm.reset();
        this.showAssignForm = false;
      },
      error: (err) => console.error('Erreur:', err)
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
    switch(role) {
      case 'CEO': return 'bg-purple-100 text-purple-800';
      case 'SECRETARY': return 'bg-blue-100 text-blue-800';
      case 'TREASURER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
    this.clubService.removeFromSubGroup(this.club.id!, subGroupId, userId).subscribe({
      next: () => this.loadClub(this.club!.id!),
      error: (err) => console.error('Erreur:', err)
    });
  }
}
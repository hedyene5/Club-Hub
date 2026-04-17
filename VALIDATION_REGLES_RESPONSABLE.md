# ✅ Validation des Règles Métier - Responsable de Comité

## 🎯 OBJECTIF MÉTIER

Quand un membre devient **RESPONSABLE** d'un comité (son `userId` = `responsableId` du SubGroup):

### ✅ Règle 1 – Changement de Rôle Automatique

**Comportement attendu:**
- Son rôle affiché devient automatiquement `"Responsable [nom du comité]"`
- Exemple: "Responsable Media", "Responsable Event"
- Cela remplace son rôle précédent

**✅ IMPLÉMENTATION ACTUELLE:**

**Backend - ClubService.assignToSubGroup():**
```java
// ✅ Sauvegarder le rôle initial
if (subGroupRole.equals("RESPONSABLE") && member.getInitialRole() == null) {
    member.setInitialRole(member.getRole());
    System.out.println("📝 Rôle initial sauvegardé: " + member.getRole());
}

// ✅ Si RESPONSABLE, mettre à jour dans le service User
if (subGroupRole.equals("RESPONSABLE")) {
    String newRole = "Responsable " + subGroup.getName();
    String url = userServiceUrl + "/" + userId + "/role";
    
    Map<String, String> roleUpdate = new HashMap<>();
    roleUpdate.put("role", newRole);
    
    HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
    restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
    
    System.out.println("✅ Rôle mis à jour dans le service User: " + newRole);
}
```

**Backend - ClubService.removeFromSubGroup():**
```java
// ✅ Restaurer le rôle initial quand retiré
if (wasResponsable && initialRole != null) {
    System.out.println("🔄 Restauration du rôle initial: " + initialRole);
    m.setRole(initialRole);
    m.setInitialRole(null);
    
    // Appel REST API pour restaurer dans User service
    Map<String, String> roleUpdate = new HashMap<>();
    roleUpdate.put("role", initialRole);
    restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
}
```

**✅ STATUT: IMPLÉMENTÉ ET FONCTIONNEL**

---

### ✅ Règle 2 – Permissions Complètes sur SON SEUL Comité

**Comportement attendu:**
- ✅ Peut **assigner** n'importe quel membre du club à son comité
- ✅ Peut **retirer** n'importe quel membre de son comité
- ✅ Peut **changer les rôles** dans son comité (MEMBRE_COMITE ↔ RESPONSABLE)
- ✅ Peut **gérer toutes les tâches** de son comité

**✅ IMPLÉMENTATION ACTUELLE:**

**Frontend - club-detail.component.ts:**
```typescript
// ✅ Vérifier si l'utilisateur est responsable d'un comité spécifique
isResponsibleOf(subGroupId: string): boolean {
    const subGroup = this.club.subGroups.find(sg => sg.id === subGroupId);
    const currentUserId = this.authService.getCurrentUser()?.userId;
    return subGroup?.responsableId === currentUserId;
}

// ✅ Vérifier si peut gérer les membres d'un comité
canManageSubGroupMembers(subGroupId: string): boolean {
    if (this.isAdmin) return true;
    return this.isResponsibleOf(subGroupId);
}

// ✅ Vérifier si peut retirer des membres d'un comité
canRemoveFromSubGroup(subGroupId: string): boolean {
    if (this.isAdmin) return true;
    return this.isResponsibleOf(subGroupId);
}

// ✅ Obtenir l'ID du comité dont l'utilisateur est responsable
getMyResponsibleSubGroupId(): string | null {
    const currentUserId = this.authService.getCurrentUser()?.userId;
    if (!currentUserId || !this.club) return null;
    
    const mySubGroup = this.club.subGroups.find(sg => sg.responsableId === currentUserId);
    return mySubGroup?.id || null;
}
```

**Frontend - Validation dans assignToSubGroup():**
```typescript
assignToSubGroup(): void {
    const { userId, subGroupId, subGroupRole } = this.assignForm.value;
    
    // ✅ VALIDATION: Si responsable de comité
    const mySubGroupId = this.getMyResponsibleSubGroupId();
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
    
    // Appel du service
    this.clubService.assignToSubGroup(this.club.id!, userId, subGroupId, subGroupRole).subscribe(...);
}
```

**Frontend - Validation dans removeMemberFromSubGroup():**
```typescript
removeMemberFromSubGroup(subGroupId: string, userId: string): void {
    // ✅ VALIDATION: Si responsable, vérifier que c'est SON comité
    const mySubGroupId = this.getMyResponsibleSubGroupId();
    if (mySubGroupId && !this.isAdmin) {
        if (subGroupId !== mySubGroupId) {
            alert('❌ Vous ne pouvez retirer des membres que de votre propre comité');
            return;
        }
    }
    
    this.clubService.removeFromSubGroup(this.club.id!, subGroupId, userId).subscribe(...);
}
```

**Frontend - Validation dans changeSubGroupRole():**
```typescript
changeSubGroupRole(subGroupId: string, userId: string, event: any): void {
    const newRole = event.target.value;
    const currentUserId = this.authService.getCurrentUser()?.userId;
    
    // ✅ VALIDATION: Ne peut pas changer son propre rôle
    if (userId === currentUserId) {
        alert('❌ Vous ne pouvez pas changer votre propre rôle');
        return;
    }
    
    // ✅ VALIDATION: Si responsable, vérifier que c'est SON comité
    const mySubGroupId = this.getMyResponsibleSubGroupId();
    if (mySubGroupId && !this.isAdmin) {
        if (subGroupId !== mySubGroupId) {
            alert('❌ Vous ne pouvez changer les rôles que dans votre propre comité');
            return;
        }
    }
    
    this.clubService.assignToSubGroup(this.club.id!, userId, subGroupId, newRole).subscribe(...);
}
```

**✅ STATUT: IMPLÉMENTÉ ET FONCTIONNEL**

---

### ✅ Règle 3 – Aucun Droit sur les Autres Comités

**Comportement attendu:**
- ❌ Ne peut pas assigner/retirer des membres d'un autre comité
- ❌ Ne peut pas modifier un autre comité
- ❌ Ne peut pas créer/supprimer un comité

**✅ IMPLÉMENTATION ACTUELLE:**

**Frontend - Interface conditionnelle:**
```typescript
// ✅ Seuls les admins peuvent modifier/supprimer des comités
canManageSubGroup(subGroupId: string): boolean {
    // Seuls les admins peuvent modifier/supprimer des comités
    return this.isAdmin;
}
```

**Frontend HTML - Boutons conditionnels:**
```html
<!-- ✅ Seuls les admins peuvent créer des comités -->
<button *ngIf="isAdmin || permissionService.hasPermission('CREATE_SUBGROUPS')" 
        (click)="showSubGroupForm = !showSubGroupForm">
    + Créer un comité
</button>

<!-- ✅ Seuls les admins peuvent modifier/supprimer des comités -->
<div *ngIf="(isAdmin || permissionService.hasPermission('EDIT_SUBGROUPS') || 
             permissionService.hasPermission('DELETE_SUBGROUPS')) && 
             editingSubGroupId !== sg.id">
    <button *ngIf="isAdmin || permissionService.hasPermission('EDIT_SUBGROUPS')" 
            (click)="startEditSubGroup(sg)">✏️</button>
    <button *ngIf="isAdmin || permissionService.hasPermission('DELETE_SUBGROUPS')" 
            (click)="removeSubGroup(sg.id!)">🗑️</button>
</div>

<!-- ✅ Colonne Actions visible seulement pour SON comité -->
<th *ngIf="canRemoveFromSubGroup(sg.id!)">Actions</th>

<!-- ✅ Dropdown de rôle visible seulement pour SON comité -->
<select *ngIf="canManageSubGroupMembers(sg.id!) && 
               memberId !== authService.getCurrentUser()?.userId"
        [value]="m.subGroupRole || 'MEMBRE_COMITE'"
        (change)="changeSubGroupRole(sg.id!, memberId, $event)">
    <option value="MEMBRE_COMITE">📋 Membre du comité</option>
    <option value="RESPONSABLE">👑 Responsable</option>
</select>
```

**✅ STATUT: IMPLÉMENTÉ ET FONCTIONNEL**

---

### ✅ Règle 4 – Pas les Droits d'un Président

**Comportement attendu:**
- ❌ Ne peut pas ajouter un nouveau membre au club
- ❌ Ne peut pas supprimer un membre du club
- ❌ Ne peut pas créer des élections

**✅ IMPLÉMENTATION ACTUELLE:**

**Frontend - Méthodes de vérification:**
```typescript
// ✅ Le responsable NE PEUT PAS supprimer des membres du club
canDeleteMember(memberId: string): boolean {
    // Seuls les admins et ceux avec permission DELETE_MEMBERS (RH) peuvent supprimer
    return this.isAdmin || this.permissionService.hasPermission('DELETE_MEMBERS');
}
```

**Frontend HTML - Boutons conditionnels:**
```html
<!-- ✅ Seuls les admins peuvent ajouter des membres au club -->
<button *ngIf="isAdmin || permissionService.hasPermission('ADD_MEMBERS')" 
        (click)="openMemberForm()">
    + Ajouter un membre
</button>

<!-- ✅ Seuls les admins peuvent supprimer des membres du club -->
<button *ngIf="canDeleteMember(member.userId)" 
        (click)="deleteMember(member.userId)">
    🗑️
</button>

<!-- ✅ Seuls les admins peuvent créer des élections -->
<a *ngIf="isAdmin || permissionService.hasPermission('CREATE_ELECTIONS')" 
   [routerLink]="['/elections/create']">
    + Nouvelle élection
</a>
```

**Backend - PermissionService:**
```java
private List<String> getCommitteeResponsablePermissions() {
    List<String> permissions = new ArrayList<>();
    
    // Permissions de base (comme un membre simple)
    permissions.add("VIEW_MEMBERS");
    permissions.add("VIEW_SUBGROUPS");
    permissions.add("VIEW_ELECTIONS");
    permissions.add("VOTE_ELECTIONS");
    permissions.add("VIEW_EVENTS");
    permissions.add("VIEW_CLUB_INFO");
    permissions.add("JOIN_VOICE_CHANNELS");
    
    // ✅ Permission spéciale: UNIQUEMENT assigner/retirer des membres de son comité
    permissions.add("ASSIGN_TO_SUBGROUPS");
    
    // ❌ PAS de permission pour:
    // - ADD_MEMBERS (ajouter au club)
    // - DELETE_MEMBERS (supprimer du club)
    // - CREATE_SUBGROUPS (créer comité)
    // - DELETE_SUBGROUPS (supprimer comité)
    // - CREATE_ELECTIONS (créer élections)
    
    return permissions;
}
```

**✅ STATUT: IMPLÉMENTÉ ET FONCTIONNEL**

---

## 🔒 Règle 5 – Vérification Backend (À IMPLÉMENTER)

**Comportement attendu:**
Chaque endpoint qui modifie un comité doit vérifier:
- Soit l'utilisateur est `PRESIDENT`
- Soit l'utilisateur est le `responsableId` du comité ciblé
- Sinon, retourner `403 Forbidden`

**❌ STATUT ACTUEL: NON IMPLÉMENTÉ**

Les endpoints backend actuels ne vérifient pas les permissions. Ils font confiance au frontend.

**🔧 À IMPLÉMENTER:**

### 1. Créer un service de vérification des permissions

```java
@Service
public class ClubAuthorizationService {
    
    public boolean canManageSubGroup(String userId, String clubId, String subGroupId) {
        // Vérifier si l'utilisateur est PRESIDENT
        User user = userService.getUserById(userId);
        if (user.getRole().equals("PRESIDENT")) {
            return true;
        }
        
        // Vérifier si l'utilisateur est responsable de ce comité
        Club club = clubRepository.findById(clubId).orElse(null);
        if (club != null) {
            SubGroup subGroup = club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .findFirst()
                .orElse(null);
            
            if (subGroup != null && subGroup.getResponsableId().equals(userId)) {
                return true;
            }
        }
        
        return false;
    }
}
```

### 2. Ajouter les vérifications dans ClubController

```java
@PutMapping("/{clubId}/members/{userId}/subgroup/{subGroupId}")
public ResponseEntity<Club> assignToSubGroup(
        @PathVariable String clubId,
        @PathVariable String userId,
        @PathVariable String subGroupId,
        @RequestBody(required = false) Map<String, String> requestBody,
        @RequestHeader("X-User-Id") String currentUserId) {  // ← Ajouter l'ID de l'utilisateur actuel
    
    try {
        // ✅ VÉRIFICATION DES PERMISSIONS
        if (!clubAuthorizationService.canManageSubGroup(currentUserId, clubId, subGroupId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String subGroupRole = (requestBody != null && requestBody.containsKey("subGroupRole")) 
            ? requestBody.get("subGroupRole") 
            : "MEMBRE";
        
        Club updated = clubService.assignToSubGroup(clubId, userId, subGroupId, subGroupRole);
        return ResponseEntity.ok(updated);
    } catch (RuntimeException e) {
        return ResponseEntity.notFound().build();
    }
}
```

### 3. Ajouter l'intercepteur pour extraire l'userId du JWT

```java
@Component
public class UserIdInterceptor implements HandlerInterceptor {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = extractTokenFromRequest(request);
        if (token != null) {
            String userId = jwtUtil.extractUserId(token);
            request.setAttribute("currentUserId", userId);
        }
        return true;
    }
}
```

---

## 📊 Tableau Récapitulatif des Règles

| Règle | Description | Statut | Implémentation |
|-------|-------------|--------|----------------|
| **Règle 1** | Changement de rôle automatique | ✅ IMPLÉMENTÉ | Backend: ClubService + REST API User |
| **Règle 2** | Permissions complètes sur SON comité | ✅ IMPLÉMENTÉ | Frontend: Méthodes de vérification |
| **Règle 3** | Aucun droit sur autres comités | ✅ IMPLÉMENTÉ | Frontend: Boutons conditionnels |
| **Règle 4** | Pas les droits d'un président | ✅ IMPLÉMENTÉ | Frontend + Backend: PermissionService |
| **Règle 5** | Vérification backend | ❌ À FAIRE | Backend: ClubAuthorizationService |

---

## 🧪 Tests de Validation

### Test 1: Changement de Rôle Automatique ✅
1. Connecté en tant que PRESIDENT
2. Assigner Bob comme RESPONSABLE du comité "Marketing"
3. ✅ Vérifier dans MongoDB User collection: `role: "Responsable Marketing"`
4. ✅ Vérifier dans MongoDB Club collection: `subGroup.responsableId: "bob-id"`
5. Retirer Bob du comité
6. ✅ Vérifier que son rôle est restauré

### Test 2: Permissions sur SON Comité ✅
1. Connecté en tant que Bob (Responsable Marketing)
2. ✅ Peut assigner Alice au comité Marketing
3. ✅ Peut retirer Alice du comité Marketing
4. ✅ Peut changer le rôle d'Alice dans le comité Marketing

### Test 3: Aucun Droit sur Autres Comités ✅
1. Connecté en tant que Bob (Responsable Marketing)
2. ❌ Ne voit pas les boutons de gestion du comité "Technique"
3. ❌ Dropdown "Comité" affiche seulement "Marketing"
4. ❌ Ne peut pas modifier/supprimer le comité "Technique"

### Test 4: Pas les Droits d'un Président ✅
1. Connecté en tant que Bob (Responsable Marketing)
2. ❌ Bouton "Ajouter un membre" (au club) caché
3. ❌ Bouton "Créer un comité" caché
4. ❌ Bouton "Nouvelle élection" caché
5. ❌ Boutons 🗑️ sur les membres du club cachés

### Test 5: Vérification Backend ❌
**À TESTER APRÈS IMPLÉMENTATION**
1. Faire un appel REST direct (Postman) pour assigner à un autre comité
2. ❌ Devrait retourner 403 Forbidden
3. Faire un appel REST avec userId = responsableId
4. ✅ Devrait retourner 200 OK

---

## 🎉 Conclusion

### ✅ IMPLÉMENTÉ (4/5 règles):
1. ✅ Changement de rôle automatique
2. ✅ Permissions complètes sur SON comité
3. ✅ Aucun droit sur autres comités
4. ✅ Pas les droits d'un président

### ❌ À IMPLÉMENTER (1/5 règles):
5. ❌ Vérification backend des permissions

**Recommandation:** Implémenter la Règle 5 pour sécuriser les endpoints backend et éviter les appels REST directs non autorisés.

Le système frontend est complet et fonctionnel. La sécurité backend doit être ajoutée pour une protection complète.

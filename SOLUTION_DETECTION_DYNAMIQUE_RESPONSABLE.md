# ✅ Solution: Détection Dynamique du Responsable de Comité

## 🎯 Problème Résolu

**AVANT:**
- Le système vérifiait `user.role` qui contenait "MEMBRE_SIMPLE"
- L'utilisateur n'obtenait pas les permissions de responsable
- Même si `subGroup.responsableId` était correctement défini

**APRÈS:**
- Le système vérifie dynamiquement si `subGroup.responsableId === currentUserId`
- Les permissions sont accordées en temps réel
- Le rôle affiché est "Responsable [nom du comité]"

---

## 🔧 Modifications Apportées

### 1. Backend - PermissionService (User Service)

**Fichier:** `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/service/PermissionService.java`

#### Ajout de la méthode de détection dynamique:

```java
@Autowired
private RestTemplate restTemplate;

private String clubServiceUrl = "http://localhost:8083/api/clubs";

/**
 * ✅ Vérifie dynamiquement si l'utilisateur est responsable d'un comité
 * en interrogeant le Club Service
 */
private boolean isCommitteeResponsable(String userId, String clubId) {
    try {
        // Appeler le Club Service pour récupérer le club
        String url = clubServiceUrl + "/" + clubId;
        Map<String, Object> club = restTemplate.getForObject(url, Map.class);
        
        if (club != null && club.containsKey("subGroups")) {
            List<Map<String, Object>> subGroups = (List<Map<String, Object>>) club.get("subGroups");
            
            // Vérifier si userId est responsableId d'un des comités
            for (Map<String, Object> subGroup : subGroups) {
                String responsableId = (String) subGroup.get("responsableId");
                if (userId.equals(responsableId)) {
                    String subGroupName = (String) subGroup.get("name");
                    System.out.println("✅ Utilisateur est responsable du comité: " + subGroupName);
                    return true;
                }
            }
        }
        
        return false;
    } catch (Exception e) {
        System.err.println("❌ Erreur: " + e.getMessage());
        return false;
    }
}
```

#### Modification de getUserPermissions():

```java
public List<String> getUserPermissions(String userId) {
    User user = userRepo.findById(userId).orElseThrow();
    List<String> permissions = new ArrayList<>();

    // ✅ PRIORITÉ 1: Vérifier dynamiquement si c'est un responsable de comité
    if (user.getClubId() != null && !user.getClubId().isEmpty()) {
        boolean isResponsable = isCommitteeResponsable(userId, user.getClubId());
        if (isResponsable) {
            System.out.println("✅ DÉTECTION DYNAMIQUE: Responsable de comité détecté");
            permissions.addAll(getCommitteeResponsablePermissions());
            return permissions;  // Retourner immédiatement
        }
    }

    // PRIORITÉ 2: Rôle système
    if (user.isSystemRole()) {
        permissions.addAll(getSystemRolePermissions(user.getSystemRole()));
    }
    // PRIORITÉ 3: Fallback sur role string
    else if (user.getRole() != null && user.getRole().startsWith("Responsable ")) {
        permissions.addAll(getCommitteeResponsablePermissions());
    }

    // PRIORITÉ 4: Rôle personnalisé
    if (user.getCustomRoleId() != null) {
        // ... ajouter permissions personnalisées
    }

    return permissions;
}
```

---

### 2. Backend - ClubController (Club Service)

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/controller/ClubController.java`

#### Ajout d'un endpoint pour vérifier le statut:

```java
/**
 * ✅ Endpoint pour vérifier si un utilisateur est responsable d'un comité
 */
@GetMapping("/{clubId}/is-responsable/{userId}")
public ResponseEntity<Map<String, Object>> isResponsable(
        @PathVariable String clubId,
        @PathVariable String userId) {
    try {
        Club club = clubService.getClubById(clubId).orElseThrow();
        
        // Chercher si userId est responsableId d'un comité
        for (SubGroup subGroup : club.getSubGroups()) {
            if (userId.equals(subGroup.getResponsableId())) {
                Map<String, Object> response = new HashMap<>();
                response.put("isResponsable", true);
                response.put("subGroupId", subGroup.getId());
                response.put("subGroupName", subGroup.getName());
                return ResponseEntity.ok(response);
            }
        }
        
        // Pas responsable
        Map<String, Object> response = new HashMap<>();
        response.put("isResponsable", false);
        return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
        return ResponseEntity.notFound().build();
    }
}
```

---

### 3. Frontend - CommitteeResponsableService

**Fichier:** `Front/src/app/services/committee-responsable.service.ts` (NOUVEAU)

```typescript
@Injectable({ providedIn: 'root' })
export class CommitteeResponsableService {
  private apiUrl = 'http://localhost:8084/api/clubs';
  
  private responsableStatusSubject = new BehaviorSubject<ResponsableStatus | null>(null);
  public responsableStatus$ = this.responsableStatusSubject.asObservable();

  /**
   * ✅ Charge dynamiquement le statut de responsable depuis le backend
   */
  loadResponsableStatus(): void {
    const user = this.authService.getCurrentUser();
    const clubId = user?.clubId;
    const userId = user?.userId;
    
    if (!clubId || !userId) {
      this.responsableStatusSubject.next({ isResponsable: false });
      return;
    }
    
    this.http.get<ResponsableStatus>(`${this.apiUrl}/${clubId}/is-responsable/${userId}`)
      .subscribe({
        next: (status) => {
          console.log('✅ Statut de responsable:', status);
          this.responsableStatusSubject.next(status);
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          this.responsableStatusSubject.next({ isResponsable: false });
        }
      });
  }

  isResponsable(): boolean {
    return this.responsableStatusSubject.value?.isResponsable || false;
  }

  getMySubGroupId(): string | null {
    return this.responsableStatusSubject.value?.subGroupId || null;
  }

  getDisplayRole(): string {
    const status = this.responsableStatusSubject.value;
    if (status?.isResponsable && status.subGroupName) {
      return `Responsable ${status.subGroupName}`;
    }
    return this.authService.getCurrentRole();
  }
}
```

---

### 4. Frontend - ClubDetailComponent

**Fichier:** `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`

#### Injection du service:

```typescript
constructor(
  // ... autres services
  public committeeResponsableService: CommitteeResponsableService,  // ✅ NOUVEAU
) { }
```

#### Utilisation de la détection dynamique:

```typescript
// ✅ AVANT: Vérification manuelle dans le club
isResponsibleOf(subGroupId: string): boolean {
  const subGroup = this.club.subGroups.find(sg => sg.id === subGroupId);
  const currentUserId = this.authService.getCurrentUser()?.userId;
  return subGroup?.responsableId === currentUserId;
}

// ✅ APRÈS: Utilisation du service de détection dynamique
isResponsibleOf(subGroupId: string): boolean {
  const mySubGroupId = this.committeeResponsableService.getMySubGroupId();
  return mySubGroupId === subGroupId;
}

getMyResponsibleSubGroupId(): string | null {
  return this.committeeResponsableService.getMySubGroupId();
}
```

#### Rechargement du statut après modifications:

```typescript
assignToSubGroup(): void {
  this.clubService.assignToSubGroup(...).subscribe({
    next: () => {
      // ✅ Recharger les permissions ET le statut
      if (userId === currentUserId) {
        this.permissionService.loadUserPermissions();
        this.committeeResponsableService.loadResponsableStatus();  // ✅ NOUVEAU
      }
    }
  });
}
```

---

## 🔄 Flux de Détection Dynamique

### Scénario: Jean est responsable du comité "media"

#### 1. Jean se connecte

```
Frontend: AuthService.login()
  ↓
Frontend: CommitteeResponsableService.loadResponsableStatus()
  ↓
HTTP GET: /api/clubs/69dd71081e564f2fc24aafdb/is-responsable/69e00dbebf596604ae458ed9
  ↓
Backend: ClubController.isResponsable()
  → Cherche dans subGroups si responsableId === userId
  → Trouve: subGroup "media" avec responsableId = "69e00dbebf596604ae458ed9"
  ↓
Response: { isResponsable: true, subGroupId: "71b1d6ee...", subGroupName: "media" }
  ↓
Frontend: responsableStatusSubject.next({ isResponsable: true, ... })
```

#### 2. Chargement des permissions

```
Frontend: PermissionService.loadUserPermissions()
  ↓
HTTP GET: /api/permissions/user/69e00dbebf596604ae458ed9
  ↓
Backend: PermissionService.getUserPermissions()
  → user.clubId = "69dd71081e564f2fc24aafdb"
  → Appel: isCommitteeResponsable(userId, clubId)
    ↓
    HTTP GET: /api/clubs/69dd71081e564f2fc24aafdb
    → Récupère le club
    → Cherche dans subGroups si responsableId === userId
    → Trouve: subGroup "media"
    ↓
    Return: true
  ↓
  → getCommitteeResponsablePermissions()
  → Return: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS", ...]
  ↓
Response: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS", ...]
  ↓
Frontend: permissionsSubject.next([...])
```

#### 3. Affichage de l'interface

```
Frontend: club-detail.component.html
  ↓
canManageSubGroupMembers(subGroupId) ?
  → isAdmin ? true
  → isResponsibleOf(subGroupId) ?
    → committeeResponsableService.getMySubGroupId() === subGroupId ?
    → "71b1d6ee..." === "71b1d6ee..." ?
    → true ✅
  ↓
Affiche: Bouton "Assigner", Bouton "Retirer", Dropdown de rôle
```

---

## 📊 Comparaison Avant/Après

| Aspect | AVANT (Bugué) | APRÈS (Corrigé) |
|--------|---------------|-----------------|
| **Détection** | Vérifie `user.role` | Vérifie `subGroup.responsableId` dynamiquement |
| **Source de vérité** | Collection `users` | Collection `clubs` (subGroups) |
| **Permissions** | Basées sur role string | Basées sur responsableId |
| **Rôle affiché** | "MEMBRE_SIMPLE" | "Responsable media" |
| **Boutons visibles** | Aucun | Gestion de SON comité |
| **Synchronisation** | Manuelle (peut échouer) | Automatique (temps réel) |

---

## 🧪 Tests de Validation

### Test 1: Vérifier la détection dynamique

```bash
# 1. Connectez-vous avec Jean (responsable du comité "media")
# 2. Ouvrez la console du navigateur (F12)
# 3. Cherchez les logs:

✅ Statut de responsable: { isResponsable: true, subGroupId: "71b1d6ee...", subGroupName: "media" }
✅ DÉTECTION DYNAMIQUE: Responsable de comité détecté
📋 Permissions finales: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS", ...]
```

### Test 2: Vérifier les permissions

```bash
# Dans la console du navigateur:
this.permissionService.getPermissions()

# Résultat attendu:
["VIEW_MEMBERS", "VIEW_SUBGROUPS", "VIEW_ELECTIONS", "VOTE_ELECTIONS", 
 "VIEW_EVENTS", "VIEW_CLUB_INFO", "JOIN_VOICE_CHANNELS", "ASSIGN_TO_SUBGROUPS"]
```

### Test 3: Vérifier l'affichage des boutons

```
Connecté en tant que Jean (Responsable media):

Comité "media":
  ✅ Bouton "Assigner un membre" visible
  ✅ Bouton "Retirer" visible pour chaque membre
  ✅ Dropdown de rôle visible

Comité "technique":
  ❌ Bouton "Assigner un membre" caché
  ❌ Bouton "Retirer" caché
  ❌ Dropdown de rôle caché

Niveau club:
  ❌ Bouton "Ajouter un membre" caché
  ❌ Bouton "Créer un comité" caché
  ❌ Bouton "Nouvelle élection" caché
```

### Test 4: Vérifier le rôle affiché

```typescript
// Dans la console:
this.committeeResponsableService.getDisplayRole()

// Résultat attendu:
"Responsable media"
```

---

## ✅ Avantages de la Solution

### 1. Source de Vérité Unique
- Les permissions sont basées sur `subGroup.responsableId`
- Pas de dépendance sur `user.role` qui peut être obsolète

### 2. Détection en Temps Réel
- Le statut est vérifié à chaque connexion
- Les permissions sont rechargées après chaque modification

### 3. Synchronisation Automatique
- Quand un utilisateur devient responsable → permissions mises à jour
- Quand un utilisateur est retiré → permissions révoquées

### 4. Pas de Modification de la Base
- Pas besoin de mettre à jour `user.role` manuellement
- Le système fonctionne même si `user.role` est "MEMBRE_SIMPLE"

### 5. Scalabilité
- Fonctionne pour plusieurs comités
- Fonctionne pour plusieurs responsables
- Pas de conflit entre les rôles

---

## 🎉 Conclusion

Le système détecte maintenant dynamiquement si un utilisateur est responsable d'un comité en vérifiant `subGroup.responsableId` au lieu de se fier à `user.role`.

**Résultat:**
- ✅ Jean (responsableId du comité "media") obtient les permissions de responsable
- ✅ Son rôle affiché est "Responsable media"
- ✅ Il peut gérer les membres de SON comité
- ✅ Il ne peut PAS gérer d'autres comités
- ✅ Il ne peut PAS ajouter/supprimer des membres du club

Le problème est résolu! 🚀

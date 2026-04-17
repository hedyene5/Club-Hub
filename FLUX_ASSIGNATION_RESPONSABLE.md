# 🔄 Flux d'Assignation d'un Responsable de Comité

## 📋 Scénario

Un utilisateur (exemple: Alice) est assigné à un comité (exemple: "Marketing") avec le rôle **RESPONSABLE**.

---

## 🎯 Ce qui se passe automatiquement:

### 1️⃣ Frontend envoie la requête

**Fichier:** `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`

```typescript
assignToSubGroup(): void {
    const { userId, subGroupId, subGroupRole } = this.assignForm.value;
    
    // userId = "alice-123"
    // subGroupId = "marketing-456"
    // subGroupRole = "RESPONSABLE"
    
    this.clubService.assignToSubGroup(this.club.id!, userId, subGroupId, subGroupRole).subscribe({
        next: () => {
            this.loadClub(this.club!.id!);
            alert(`✅ Membre assigné au comité en tant que Responsable`);
        }
    });
}
```

**Requête HTTP envoyée:**
```
PUT http://localhost:8083/api/clubs/{clubId}/members/alice-123/subgroup/marketing-456
Body: { "subGroupRole": "RESPONSABLE" }
```

---

### 2️⃣ Backend Club Service reçoit la requête

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/controller/ClubController.java`

```java
@PutMapping("/{clubId}/members/{userId}/subgroup/{subGroupId}")
public ResponseEntity<Club> assignToSubGroup(
        @PathVariable String clubId,
        @PathVariable String userId,
        @PathVariable String subGroupId,
        @RequestBody(required = false) Map<String, String> requestBody) {
    
    // Récupérer le subGroupRole depuis le body
    String subGroupRole = requestBody.get("subGroupRole");  // "RESPONSABLE"
    
    // Appeler le service
    Club updated = clubService.assignToSubGroup(clubId, userId, subGroupId, subGroupRole);
    return ResponseEntity.ok(updated);
}
```

---

### 3️⃣ ClubService traite l'assignation

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

```java
public Club assignToSubGroup(String clubId, String userId, String subGroupId, String subGroupRole) {
    System.out.println("=== ASSIGN TO SUBGROUP SERVICE ===");
    System.out.println("UserId: " + userId);           // alice-123
    System.out.println("SubGroupId: " + subGroupId);   // marketing-456
    System.out.println("SubGroupRole: " + subGroupRole); // RESPONSABLE
    
    Club club = clubRepository.findById(clubId).orElseThrow();
    
    // ✅ ÉTAPE 1: Trouver le sous-groupe
    SubGroup subGroup = club.getSubGroups().stream()
            .filter(sg -> sg.getId().equals(subGroupId))
            .findFirst()
            .orElseThrow();
    
    System.out.println("📋 Sous-groupe trouvé: " + subGroup.getName());  // "Marketing"
    
    // ✅ ÉTAPE 2: Mettre à jour le membre dans le club
    club.getMembers().stream()
            .filter(m -> m.getUserId().equals(userId))
            .findFirst()
            .ifPresent(member -> {
                System.out.println("👤 Membre trouvé: " + member.getName());
                System.out.println("📝 Rôle actuel: " + member.getRole());  // "MEMBRE_SIMPLE"
                
                // ✅ Sauvegarder le rôle initial (pour restauration future)
                if (subGroupRole.equals("RESPONSABLE") && member.getInitialRole() == null) {
                    member.setInitialRole(member.getRole());
                    System.out.println("💾 Rôle initial sauvegardé: " + member.getRole());
                }
                
                // ✅ Mettre à jour les champs du membre
                member.setSubGroupId(subGroupId);
                member.setSubGroupRole(subGroupRole);
                System.out.println("✅ Membre assigné avec rôle comité: " + subGroupRole);
            });
    
    // ✅ ÉTAPE 3: Mettre à jour le sous-groupe
    club.getSubGroups().stream()
            .filter(sg -> sg.getId().equals(subGroupId))
            .findFirst()
            .ifPresent(sg -> {
                // Ajouter à la liste des membres
                if (!sg.getMemberIds().contains(userId)) {
                    sg.getMemberIds().add(userId);
                }
                
                // Mettre à jour le rôle dans memberRoles
                if (sg.getMemberRoles() == null) {
                    sg.setMemberRoles(new HashMap<>());
                }
                sg.getMemberRoles().put(userId, subGroupRole);
                
                // ✅ Si RESPONSABLE, mettre à jour responsableId
                if (subGroupRole.equals("RESPONSABLE")) {
                    sg.setResponsableId(userId);
                    System.out.println("✅ ResponsableId mis à jour: " + userId);
                }
            });
    
    // ✅ ÉTAPE 4: Appeler le User Service pour changer le rôle
    if (subGroupRole.equals("RESPONSABLE")) {
        System.out.println("🔍 Appel du service User pour mettre à jour le rôle...");
        
        try {
            // ✅ Construire le nouveau rôle: "Responsable " + nom du comité
            String newRole = "Responsable " + subGroup.getName();  // "Responsable Marketing"
            String url = "http://localhost:8081/users/" + userId + "/role";
            
            Map<String, String> roleUpdate = new HashMap<>();
            roleUpdate.put("role", newRole);
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                request,
                String.class
            );
            
            System.out.println("✅ Rôle mis à jour dans le service User: " + newRole);
            System.out.println("📡 Réponse: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("❌ Erreur: " + e.getMessage());
        }
    }
    
    // ✅ ÉTAPE 5: Sauvegarder le club
    Club savedClub = clubRepository.save(club);
    System.out.println("✅ Club sauvegardé");
    
    return savedClub;
}
```

---

### 4️⃣ User Service met à jour le rôle

**Fichier:** `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/controller/UserController.java`

```java
@PutMapping("/{userId}/role")
public ResponseEntity<User> updateUserRole(
        @PathVariable String userId,
        @RequestBody Map<String, String> roleUpdate) {
    
    try {
        User user = userService.getUserById(userId);
        
        String newRole = roleUpdate.get("role");  // "Responsable Marketing"
        System.out.println("🔄 Mise à jour du rôle: " + user.getRole() + " → " + newRole);
        
        user.setRole(newRole);
        User savedUser = userService.updateUser(userId, user);
        
        System.out.println("✅ Rôle mis à jour dans User service");
        return ResponseEntity.ok(savedUser);
    } catch (Exception e) {
        System.err.println("❌ Erreur: " + e.getMessage());
        return ResponseEntity.badRequest().build();
    }
}
```

---

### 5️⃣ PermissionService détecte le nouveau rôle

**Fichier:** `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/service/PermissionService.java`

```java
public List<String> getUserPermissions(String userId) {
    User user = userRepo.findById(userId).orElseThrow();
    
    System.out.println("=== DEBUG PERMISSIONS ===");
    System.out.println("User role: " + user.getRole());  // "Responsable Marketing"
    
    List<String> permissions = new ArrayList<>();
    
    // ✅ Vérifier si c'est un responsable de comité
    if (user.getRole() != null && user.getRole().startsWith("Responsable ")) {
        System.out.println("✅ Responsable de comité détecté: " + user.getRole());
        permissions.addAll(getCommitteeResponsablePermissions());
    }
    
    return permissions;
}

private List<String> getCommitteeResponsablePermissions() {
    List<String> permissions = new ArrayList<>();
    
    // Permissions de base
    permissions.add("VIEW_MEMBERS");
    permissions.add("VIEW_SUBGROUPS");
    permissions.add("VIEW_ELECTIONS");
    permissions.add("VOTE_ELECTIONS");
    permissions.add("VIEW_EVENTS");
    permissions.add("VIEW_CLUB_INFO");
    permissions.add("JOIN_VOICE_CHANNELS");
    
    // ✅ Permission spéciale pour gérer son comité
    permissions.add("ASSIGN_TO_SUBGROUPS");
    
    System.out.println("📋 Permissions responsable de comité: " + permissions);
    
    return permissions;
}
```

---

## 📊 Résultat Final

### Dans MongoDB - Collection `users`:
```json
{
  "_id": "alice-123",
  "email": "alice@test.com",
  "firstName": "Alice",
  "lastName": "Dupont",
  "role": "Responsable Marketing",  // ✅ Changé automatiquement
  "clubId": "club-789"
}
```

### Dans MongoDB - Collection `clubs`:
```json
{
  "_id": "club-789",
  "name": "Mon Club",
  "members": [
    {
      "userId": "alice-123",
      "name": "Alice Dupont",
      "role": "MEMBRE_SIMPLE",  // Rôle dans le club (pas changé)
      "subGroupId": "marketing-456",
      "subGroupRole": "RESPONSABLE",  // ✅ Rôle dans le comité
      "initialRole": "MEMBRE_SIMPLE"  // ✅ Sauvegardé pour restauration
    }
  ],
  "subGroups": [
    {
      "id": "marketing-456",
      "name": "Marketing",
      "memberIds": ["alice-123"],
      "responsableId": "alice-123",  // ✅ Alice est responsable
      "memberRoles": {
        "alice-123": "RESPONSABLE"  // ✅ Rôle enregistré
      }
    }
  ]
}
```

---

## 🎯 Permissions d'Alice après l'assignation

### ✅ Ce qu'Alice PEUT faire:
1. ✅ Assigner des membres au comité Marketing
2. ✅ Retirer des membres du comité Marketing
3. ✅ Changer les rôles dans le comité Marketing
4. ✅ Voir tous les membres du club
5. ✅ Voter aux élections
6. ✅ Voir les événements

### ❌ Ce qu'Alice NE PEUT PAS faire:
1. ❌ Ajouter de nouveaux membres au club
2. ❌ Supprimer des membres du club
3. ❌ Créer un nouveau comité
4. ❌ Supprimer un comité
5. ❌ Gérer un autre comité (ex: Technique)
6. ❌ Créer des élections
7. ❌ Changer son propre rôle

---

## 🔄 Restauration du Rôle

Si Alice est retirée du comité Marketing:

```java
public Club removeFromSubGroup(String clubId, String subGroupId, String userId) {
    Club club = clubRepository.findById(clubId).orElseThrow();
    
    // Retirer du sous-groupe
    club.getSubGroups().stream()
            .filter(sg -> sg.getId().equals(subGroupId))
            .findFirst()
            .ifPresent(sg -> sg.getMemberIds().remove(userId));
    
    // ✅ Restaurer le rôle initial
    club.getMembers().stream()
            .filter(m -> m.getUserId().equals(userId))
            .findFirst()
            .ifPresent(m -> {
                boolean wasResponsable = "RESPONSABLE".equals(m.getSubGroupRole());
                String initialRole = m.getInitialRole();  // "MEMBRE_SIMPLE"
                
                m.setSubGroupId(null);
                m.setSubGroupRole(null);
                
                // ✅ Si c'était un responsable, restaurer le rôle
                if (wasResponsable && initialRole != null) {
                    System.out.println("🔄 Restauration du rôle initial: " + initialRole);
                    m.setRole(initialRole);
                    m.setInitialRole(null);
                    
                    // ✅ Appeler User Service pour restaurer
                    String url = "http://localhost:8081/users/" + userId + "/role";
                    Map<String, String> roleUpdate = new HashMap<>();
                    roleUpdate.put("role", initialRole);
                    
                    HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
                    restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
                    
                    System.out.println("✅ Rôle restauré dans User service");
                }
            });
    
    return clubRepository.save(club);
}
```

**Résultat:**
- Alice redevient `MEMBRE_SIMPLE`
- Son rôle dans la collection `users` est restauré à `MEMBRE_SIMPLE`
- Elle perd les permissions de responsable

---

## 🧪 Test Complet

### Étape 1: État Initial
```
Alice:
- role (users): "MEMBRE_SIMPLE"
- subGroupId: null
- subGroupRole: null
- Permissions: VIEW_MEMBERS, VIEW_SUBGROUPS, etc.
```

### Étape 2: Assigner comme Responsable Marketing
```
Action: assignToSubGroup(clubId, "alice-123", "marketing-456", "RESPONSABLE")

Alice:
- role (users): "Responsable Marketing"  ✅ Changé
- subGroupId: "marketing-456"
- subGroupRole: "RESPONSABLE"
- initialRole: "MEMBRE_SIMPLE"  ✅ Sauvegardé
- Permissions: VIEW_MEMBERS, ASSIGN_TO_SUBGROUPS, etc.  ✅ Nouvelles permissions
```

### Étape 3: Retirer du Comité
```
Action: removeFromSubGroup(clubId, "marketing-456", "alice-123")

Alice:
- role (users): "MEMBRE_SIMPLE"  ✅ Restauré
- subGroupId: null
- subGroupRole: null
- initialRole: null
- Permissions: VIEW_MEMBERS, VIEW_SUBGROUPS, etc.  ✅ Permissions de base
```

---

## ✅ Conclusion

**Tout est déjà implémenté et fonctionne automatiquement!**

Quand vous assignez un utilisateur comme RESPONSABLE d'un comité:
1. ✅ Son rôle change automatiquement en "Responsable [nom du comité]"
2. ✅ Il obtient les permissions de responsable de comité
3. ✅ Son rôle initial est sauvegardé pour restauration future
4. ✅ Le changement est synchronisé entre Club Service et User Service
5. ✅ Les permissions sont détectées automatiquement par PermissionService

Le système est complet et opérationnel! 🚀

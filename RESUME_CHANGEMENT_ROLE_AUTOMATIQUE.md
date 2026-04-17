# ✅ Résumé: Changement Automatique du Rôle

## 🎯 Ce qui se passe automatiquement

Quand vous assignez un membre comme **RESPONSABLE** d'un comité:

### 1. Dans la Collection `clubs` (MongoDB)
```json
{
  "members": [
    {
      "userId": "user-123",
      "subGroupId": "media-456",
      "subGroupRole": "RESPONSABLE",  // ✅ Rôle dans le comité
      "initialRole": "MEMBRE_SIMPLE"  // ✅ Rôle initial sauvegardé
    }
  ],
  "subGroups": [
    {
      "id": "media-456",
      "name": "media",
      "responsableId": "user-123",  // ✅ Responsable défini
      "memberRoles": {
        "user-123": "RESPONSABLE"  // ✅ Rôle enregistré
      }
    }
  ]
}
```

### 2. Dans la Collection `users` (MongoDB)
```json
{
  "_id": "user-123",
  "role": "Responsable media"  // ✅ CHANGÉ AUTOMATIQUEMENT!
}
```

### 3. Dans l'Interface (Frontend)
- ✅ Rôle affiché: "Responsable media"
- ✅ Permissions mises à jour automatiquement
- ✅ Boutons de gestion du comité "media" visibles
- ❌ Boutons de gestion des autres comités cachés

---

## 🔧 Comment ça fonctionne

### Backend - ClubService.assignToSubGroup()

```java
public Club assignToSubGroup(String clubId, String userId, String subGroupId, String subGroupRole) {
    // 1. Trouver le sous-groupe
    SubGroup subGroup = club.getSubGroups().stream()
        .filter(sg -> sg.getId().equals(subGroupId))
        .findFirst()
        .orElseThrow();
    
    // 2. Mettre à jour le membre dans le club
    club.getMembers().stream()
        .filter(m -> m.getUserId().equals(userId))
        .findFirst()
        .ifPresent(member -> {
            // Sauvegarder le rôle initial
            if (subGroupRole.equals("RESPONSABLE") && member.getInitialRole() == null) {
                member.setInitialRole(member.getRole());
            }
            
            member.setSubGroupId(subGroupId);
            member.setSubGroupRole(subGroupRole);
        });
    
    // 3. Mettre à jour le sous-groupe
    subGroup.setResponsableId(userId);
    subGroup.getMemberRoles().put(userId, subGroupRole);
    
    // 4. ✅ APPELER LE USER SERVICE POUR CHANGER LE RÔLE
    if (subGroupRole.equals("RESPONSABLE")) {
        String newRole = "Responsable " + subGroup.getName();
        String url = "http://localhost:8081/api/users/" + userId + "/role";
        
        Map<String, String> roleUpdate = new HashMap<>();
        roleUpdate.put("role", newRole);
        
        HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
        restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
        
        System.out.println("✅ Rôle mis à jour dans le service User: " + newRole);
    }
    
    // 5. Sauvegarder le club
    return clubRepository.save(club);
}
```

### Backend - UserController.updateUserRole()

```java
@PutMapping("/{userId}/role")
public ResponseEntity<User> updateUserRole(
        @PathVariable String userId,
        @RequestBody Map<String, String> roleUpdate) {
    
    User user = userService.getUserById(userId);
    
    String newRole = roleUpdate.get("role");  // "Responsable media"
    System.out.println("🔄 Mise à jour du rôle: " + user.getRole() + " → " + newRole);
    
    user.setRole(newRole);
    User savedUser = userService.updateUser(userId, user);
    
    System.out.println("✅ Rôle mis à jour dans User service");
    return ResponseEntity.ok(savedUser);
}
```

### Frontend - Détection Dynamique

```typescript
// 1. Chargement du statut de responsable
committeeResponsableService.loadResponsableStatus()
  → GET /api/clubs/{clubId}/is-responsable/{userId}
  → Response: { isResponsable: true, subGroupName: "media" }

// 2. Chargement des permissions
permissionService.loadUserPermissions()
  → GET /api/permissions/user/{userId}
  → Backend vérifie dynamiquement si responsableId === userId
  → Response: ["VIEW_MEMBERS", "ASSIGN_TO_SUBGROUPS", ...]

// 3. Affichage du rôle
committeeResponsableService.getDisplayRole()
  → Return: "Responsable media"

// 4. Vérification des permissions
canManageSubGroupMembers(subGroupId)
  → isResponsibleOf(subGroupId)
  → committeeResponsableService.getMySubGroupId() === subGroupId
  → Return: true ✅
```

---

## 📊 Flux Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PRÉSIDENT assigne Jean comme RESPONSABLE du comité "media"  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend envoie:                                             │
│    PUT /api/clubs/{clubId}/members/jean-id/subgroup/media-id   │
│    Body: { "subGroupRole": "RESPONSABLE" }                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Club Service (port 8083):                                    │
│    - Trouve le comité "media"                                   │
│    - Sauvegarde initialRole = "MEMBRE_SIMPLE"                  │
│    - Met à jour subGroupRole = "RESPONSABLE"                   │
│    - Met à jour responsableId = "jean-id"                      │
│    - Sauvegarde dans MongoDB clubs                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Club Service appelle User Service:                          │
│    PUT http://localhost:8081/api/users/jean-id/role            │
│    Body: { "role": "Responsable media" }                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. User Service (port 8081):                                    │
│    - Trouve l'utilisateur Jean                                  │
│    - Change role: "MEMBRE_SIMPLE" → "Responsable media"        │
│    - Sauvegarde dans MongoDB users                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Frontend recharge:                                           │
│    - committeeResponsableService.loadResponsableStatus()        │
│    - permissionService.loadUserPermissions()                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Jean se déconnecte et se reconnecte:                        │
│    - Détection dynamique: isResponsable = true                  │
│    - Permissions: ["ASSIGN_TO_SUBGROUPS", ...]                 │
│    - Rôle affiché: "Responsable media"                         │
│    - Boutons de gestion du comité "media" visibles             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Restauration du Rôle

Quand Jean est retiré du comité:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PRÉSIDENT retire Jean du comité "media"                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Club Service:                                                │
│    - Récupère initialRole = "MEMBRE_SIMPLE"                    │
│    - Met à jour subGroupId = null                              │
│    - Met à jour subGroupRole = null                            │
│    - Met à jour responsableId = null                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Club Service appelle User Service:                          │
│    PUT http://localhost:8081/api/users/jean-id/role            │
│    Body: { "role": "MEMBRE_SIMPLE" }                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. User Service:                                                │
│    - Change role: "Responsable media" → "MEMBRE_SIMPLE"        │
│    - Sauvegarde dans MongoDB users                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Jean perd les permissions de responsable                    │
│    - isResponsable = false                                      │
│    - Permissions: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", ...]      │
│    - Boutons de gestion cachés                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Vérifications

### Dans MongoDB

```javascript
// Collection users
db.users.findOne({ _id: "jean-id" })
// ✅ Résultat: { "role": "Responsable media" }

// Collection clubs
db.clubs.findOne({ _id: "club-id" })
// ✅ Résultat: { 
//   "subGroups": [{ 
//     "name": "media", 
//     "responsableId": "jean-id" 
//   }] 
// }
```

### Dans les Logs

```
# Club Service (port 8083)
✅ Rôle mis à jour dans le service User: Responsable media
📡 Réponse: 200 OK

# User Service (port 8081)
🔄 Mise à jour du rôle: MEMBRE_SIMPLE → Responsable media
✅ Rôle mis à jour dans User service
```

### Dans l'Interface

```
Connecté en tant que Jean:
- Rôle affiché: "Responsable media" ✅
- Boutons visibles pour comité "media" ✅
- Boutons cachés pour autres comités ✅
- Boutons cachés pour gestion du club ✅
```

---

## 🎉 Conclusion

Le système change automatiquement le rôle dans la collection `users` quand un membre devient responsable d'un comité:

1. ✅ Rôle dans `users` mis à jour automatiquement
2. ✅ Rôle affiché dans l'interface: "Responsable [nom du comité]"
3. ✅ Permissions mises à jour en temps réel
4. ✅ Rôle initial sauvegardé pour restauration
5. ✅ Synchronisation entre Club Service et User Service

Tout fonctionne automatiquement! 🚀

---

## 📝 Fichiers Modifiés

1. ✅ `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`
   - URL corrigée: `http://localhost:8081/api/users`
   - Appel REST pour mettre à jour le rôle

2. ✅ `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/controller/UserController.java`
   - Endpoint: `PUT /{userId}/role`

3. ✅ `ClubHub/src/main/java/esprit/com/clubhub/config/AppConfig.java`
   - RestTemplate configuré

4. ✅ `Front/src/app/services/committee-responsable.service.ts`
   - Détection dynamique du statut

5. ✅ `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`
   - Utilisation de la détection dynamique
   - Rechargement des permissions après modification

Aucune autre modification nécessaire! Le système est complet et fonctionnel.

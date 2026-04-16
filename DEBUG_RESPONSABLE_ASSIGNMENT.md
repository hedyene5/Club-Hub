# Debug: Assignation Responsable de Comité

## 🐛 Problème Observé

Quand on assigne un membre comme RESPONSABLE d'un comité:
- ✅ Message de succès affiché
- ❌ Le rôle ne change pas dans la base de données
- ❌ Les permissions ne sont pas appliquées

## 🔍 Étapes de Débogage

### 1. Vérifier les Logs Backend

Après avoir assigné un membre comme responsable, cherchez dans les logs backend (console Spring Boot):

```
=== ASSIGN TO SUBGROUP SERVICE ===
ClubId: [id]
UserId: [id]
SubGroupId: [id]
SubGroupRole: [RESPONSABLE ou MEMBRE]
```

**Points à vérifier:**
- ✅ Le `SubGroupRole` doit être "RESPONSABLE" (pas "Membre" ou autre)
- ✅ Le message "🔍 Recherche de l'utilisateur dans la collection User..." doit apparaître
- ✅ Le message "✅ Rôle mis à jour dans la base User: Responsable [Nom]" doit apparaître

**Si vous voyez:**
```
ℹ️ SubGroupRole n'est pas RESPONSABLE, pas de mise à jour du rôle User
```
→ Le problème est que le frontend envoie "Membre" au lieu de "RESPONSABLE"

**Si vous voyez:**
```
❌ Utilisateur non trouvé dans la collection User: [userId]
```
→ Le userId ne correspond pas à un utilisateur dans la base

### 2. Vérifier la Requête HTTP

Ouvrez les DevTools du navigateur (F12) → Onglet Network

Cherchez la requête PUT vers:
```
PUT http://localhost:8084/api/clubs/{clubId}/members/{userId}/subgroup/{subGroupId}
```

**Vérifier le Body de la requête:**
```json
{
  "subGroupRole": "RESPONSABLE"
}
```

**Si le body est vide ou contient autre chose:**
→ Le problème est dans le frontend (club.service.ts)

### 3. Vérifier la Base de Données

#### Collection `users`
```javascript
db.users.findOne({ _id: ObjectId("userId") })
```

**Vérifier:**
- Le champ `role` doit être "Responsable [Nom du Comité]"
- Si le rôle n'a pas changé → le backend n'a pas mis à jour

#### Collection `clubs`
```javascript
db.clubs.findOne({ _id: ObjectId("clubId") })
```

**Vérifier dans `members`:**
```javascript
{
  "userId": "...",
  "name": "...",
  "role": "...",
  "initialRole": "MEMBRE_SIMPLE",  // ← Doit être présent
  "subGroupId": "...",
  "subGroupRole": "RESPONSABLE",   // ← Doit être RESPONSABLE
  "status": "APPROVED"
}
```

### 4. Tester Manuellement l'API

Utilisez Postman ou curl pour tester directement:

```bash
curl -X PUT http://localhost:8084/api/clubs/{clubId}/members/{userId}/subgroup/{subGroupId} \
  -H "Content-Type: application/json" \
  -d '{"subGroupRole": "RESPONSABLE"}'
```

Vérifiez ensuite dans la base de données si le rôle a changé.

## 🔧 Solutions Possibles

### Solution 1: Le Frontend n'envoie pas le bon paramètre

**Fichier**: `Front/src/app/services/club.service.ts`

Vérifiez que la méthode envoie bien le body:

```typescript
assignToSubGroup(clubId: string, userId: string, subGroupId: string, subGroupRole: string = 'MEMBRE'): Observable<Club> {
  return this.http.put<Club>(
    `${this.apiUrl}/${clubId}/members/${userId}/subgroup/${subGroupId}`, 
    { subGroupRole }  // ← IMPORTANT: doit être dans le body
  );
}
```

### Solution 2: Le Backend ne reçoit pas le paramètre

**Fichier**: `ClubHub/src/main/java/esprit/com/clubhub/controller/ClubController.java`

Vérifiez que le controller accepte le body:

```java
@PutMapping("/{clubId}/members/{userId}/subgroup/{subGroupId}")
public ResponseEntity<Club> assignToSubGroup(
    @PathVariable String clubId,
    @PathVariable String userId,
    @PathVariable String subGroupId,
    @RequestBody(required = false) Map<String, String> requestBody) {
    
    String subGroupRole = (requestBody != null && requestBody.containsKey("subGroupRole")) 
        ? requestBody.get("subGroupRole") 
        : "MEMBRE";
    
    System.out.println("=== ASSIGN TO SUBGROUP CONTROLLER ===");
    System.out.println("SubGroupRole reçu: " + subGroupRole);
    
    Club updated = clubService.assignToSubGroup(clubId, userId, subGroupId, subGroupRole);
    return ResponseEntity.ok(updated);
}
```

### Solution 3: Problème de Casse (RESPONSABLE vs Responsable)

Le frontend envoie peut-être "Responsable" au lieu de "RESPONSABLE".

**Dans le frontend**, vérifiez le formulaire:
```html
<select formControlName="subGroupRole">
  <option value="MEMBRE">Membre</option>
  <option value="RESPONSABLE">Responsable</option>  <!-- ← Doit être RESPONSABLE en majuscules -->
</select>
```

### Solution 4: Le UserRepo n'est pas injecté

Vérifiez que `UserRepo` est bien injecté dans `ClubService`:

```java
@Service
public class ClubService {
    @Autowired
    private ClubRepository clubRepository;
    
    @Autowired
    private UserRepo userRepo;  // ← Doit être présent
}
```

## 📋 Checklist de Vérification

- [ ] Les logs backend montrent "SubGroupRole: RESPONSABLE"
- [ ] Les logs backend montrent "✅ Rôle mis à jour dans la base User"
- [ ] La requête HTTP contient `{"subGroupRole": "RESPONSABLE"}` dans le body
- [ ] Le rôle dans la collection `users` est "Responsable [Comité]"
- [ ] Le champ `initialRole` est sauvegardé dans la collection `clubs`
- [ ] Le champ `subGroupRole` est "RESPONSABLE" dans la collection `clubs`
- [ ] Les permissions sont chargées après l'assignation
- [ ] Le frontend appelle `permissionService.loadUserPermissions()` après assignation

## 🧪 Test Complet

1. **Créer un comité** "Test Marketing"
2. **Créer un membre** avec rôle "MEMBRE_SIMPLE"
3. **Assigner comme RESPONSABLE**:
   - Sélectionner le membre
   - Sélectionner le comité "Test Marketing"
   - Sélectionner "Responsable" dans le dropdown
   - Cliquer "Assigner"
4. **Vérifier les logs backend** (voir ci-dessus)
5. **Vérifier la base de données**:
   ```javascript
   // Collection users
   db.users.findOne({ email: "membre@test.com" })
   // Doit avoir: role: "Responsable Test Marketing"
   
   // Collection clubs
   db.clubs.findOne({ name: "Mon Club" })
   // Dans members, trouver le membre et vérifier:
   // - initialRole: "MEMBRE_SIMPLE"
   // - subGroupRole: "RESPONSABLE"
   ```
6. **Se déconnecter et se reconnecter** avec le compte du membre
7. **Vérifier les permissions** dans la console:
   ```
   ✅ Permissions chargées: Array(12)
   // Doit contenir: ADD_MEMBERS, DELETE_MEMBERS, ASSIGN_TO_SUBGROUPS, etc.
   ```

## 🎯 Résultat Attendu

Après l'assignation:
- ✅ Rôle dans User: "Responsable Test Marketing"
- ✅ Rôle dans Club Member: reste inchangé (ou "Responsable Test Marketing")
- ✅ initialRole dans Club Member: "MEMBRE_SIMPLE"
- ✅ subGroupRole dans Club Member: "RESPONSABLE"
- ✅ Permissions: 12 permissions (base + gestion comité)
- ✅ Interface: boutons "Assigner", "Retirer", "Supprimer" visibles pour SON comité

## 📞 Si Ça Ne Marche Toujours Pas

1. Copiez les logs backend complets
2. Copiez la requête HTTP (Network tab)
3. Copiez le document User de la base de données
4. Copiez le document Club (section members) de la base de données
5. Partagez ces informations pour un diagnostic plus précis

# Fix: Persistance du Rôle Responsable de Comité

## 🐛 Problème Identifié

Le rôle "Responsable [Comité]" changeait uniquement dans l'interface (collection `clubs`) mais pas dans la base de données `User`. Résultat:
- ❌ Les permissions ne s'appliquaient pas
- ❌ Le rôle n'était pas persisté après déconnexion/reconnexion
- ❌ Le rôle initial n'était pas restauré lors du retrait du comité

## ✅ Solution Implémentée

### 1. Ajout du Champ `initialRole` dans Member

**Fichier**: `ClubHub/src/main/java/esprit/com/clubhub/entity/Member.java`

```java
private String initialRole; // Rôle initial avant de devenir responsable
```

Ce champ permet de sauvegarder le rôle original du membre avant qu'il ne devienne responsable, pour pouvoir le restaurer plus tard.

### 2. Injection de UserRepo dans ClubService

**Fichier**: `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

```java
@Autowired
private UserRepo userRepo;
```

Permet de mettre à jour la collection `User` directement depuis le `ClubService`.

### 3. Modification de `assignToSubGroup()`

**Fichier**: `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

La méthode fait maintenant:

1. **Sauvegarde le rôle initial** (si c'est la première fois qu'on assigne comme responsable)
   ```java
   if (subGroupRole.equals("RESPONSABLE") && member.getInitialRole() == null) {
       member.setInitialRole(member.getRole());
   }
   ```

2. **Met à jour le rôle dans la collection User**
   ```java
   if (subGroupRole.equals("RESPONSABLE")) {
       userRepo.findById(userId).ifPresent(user -> {
           String newRole = "Responsable " + subGroup.getName();
           user.setRole(newRole);
           userRepo.save(user);
       });
   }
   ```

3. **Met à jour le membre dans le club**
   ```java
   member.setSubGroupId(subGroupId);
   member.setSubGroupRole(subGroupRole);
   ```

### 4. Modification de `removeFromSubGroup()`

**Fichier**: `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

La méthode fait maintenant:

1. **Détecte si le membre était responsable**
   ```java
   boolean wasResponsable = "RESPONSABLE".equals(m.getSubGroupRole());
   String initialRole = m.getInitialRole();
   ```

2. **Restaure le rôle initial dans le club ET dans User**
   ```java
   if (wasResponsable && initialRole != null) {
       m.setRole(initialRole);
       m.setInitialRole(null);
       
       userRepo.findById(userId).ifPresent(user -> {
           user.setRole(initialRole);
           userRepo.save(user);
       });
   }
   ```

### 5. Simplification du Frontend

**Fichier**: `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`

- ❌ Supprimé l'appel à `changeMemberRole()` (le backend le fait maintenant)
- ✅ Ajouté le rechargement des permissions si c'est l'utilisateur actuel
  ```typescript
  if (userId === currentUserId) {
      this.permissionService.loadUserPermissions();
  }
  ```

## 🔄 Flux Complet

### Scénario 1: Assigner comme Responsable

1. **Utilisateur**: Ahmed (rôle: MEMBRE_SIMPLE)
2. **Action**: Président assigne Ahmed comme Responsable du comité "Marketing"
3. **Backend**:
   - Sauvegarde `initialRole = "MEMBRE_SIMPLE"` dans Member
   - Change `role = "Responsable Marketing"` dans Member (club)
   - Change `role = "Responsable Marketing"` dans User (base de données)
   - Définit `subGroupRole = "RESPONSABLE"`
4. **Résultat**:
   - ✅ Ahmed se déconnecte/reconnecte → son rôle est toujours "Responsable Marketing"
   - ✅ Les permissions s'appliquent correctement
   - ✅ Ahmed peut gérer son comité

### Scénario 2: Retirer du Comité

1. **Utilisateur**: Ahmed (rôle: Responsable Marketing, initialRole: MEMBRE_SIMPLE)
2. **Action**: Président retire Ahmed du comité Marketing
3. **Backend**:
   - Détecte que Ahmed était RESPONSABLE
   - Restaure `role = "MEMBRE_SIMPLE"` dans Member (club)
   - Restaure `role = "MEMBRE_SIMPLE"` dans User (base de données)
   - Réinitialise `initialRole = null`
   - Réinitialise `subGroupRole = null`
4. **Résultat**:
   - ✅ Ahmed retrouve son rôle initial "MEMBRE_SIMPLE"
   - ✅ Il perd les permissions de responsable
   - ✅ Il ne peut plus gérer le comité

## 📊 Données Stockées

### Collection `clubs` - Member

```json
{
  "userId": "123",
  "name": "Ahmed Ben Ali",
  "role": "Responsable Marketing",        // ✅ Rôle actuel
  "initialRole": "MEMBRE_SIMPLE",         // ✅ Rôle initial sauvegardé
  "subGroupId": "sg-456",
  "subGroupRole": "RESPONSABLE",          // ✅ Rôle dans le comité
  "status": "APPROVED"
}
```

### Collection `users` - User

```json
{
  "_id": "123",
  "firstName": "Ahmed",
  "lastName": "Ben Ali",
  "email": "ahmed@example.com",
  "role": "Responsable Marketing",        // ✅ Rôle synchronisé
  "clubId": "club-789"
}
```

## 🎯 Avantages

1. **Persistance**: Le rôle est maintenant stocké dans la base User
2. **Permissions**: Les permissions s'appliquent correctement car le rôle est dans User
3. **Réversibilité**: Le rôle initial est restauré automatiquement
4. **Synchronisation**: Les deux collections (clubs et users) sont toujours synchronisées
5. **Simplicité**: Le frontend n'a plus besoin de gérer le changement de rôle

## 🧪 Tests à Effectuer

### Test 1: Assignation comme Responsable
1. Créer un membre avec rôle "MEMBRE_SIMPLE"
2. L'assigner comme Responsable d'un comité
3. Vérifier dans MongoDB:
   - Collection `clubs`: `role = "Responsable [Comité]"`, `initialRole = "MEMBRE_SIMPLE"`
   - Collection `users`: `role = "Responsable [Comité]"`
4. Se déconnecter et se reconnecter
5. Vérifier que le rôle est toujours "Responsable [Comité]"
6. Vérifier que les permissions s'appliquent (peut gérer son comité)

### Test 2: Retrait du Comité
1. Retirer le responsable du comité
2. Vérifier dans MongoDB:
   - Collection `clubs`: `role = "MEMBRE_SIMPLE"`, `initialRole = null`
   - Collection `users`: `role = "MEMBRE_SIMPLE"`
3. Vérifier que les permissions de responsable sont retirées
4. Vérifier qu'il ne peut plus gérer le comité

### Test 3: Membre Simple dans Comité
1. Assigner un membre comme "Membre" (pas responsable)
2. Vérifier que son rôle ne change PAS
3. Vérifier qu'il n'a PAS les permissions de responsable

## 🔒 Sécurité

- ✅ Le rôle est maintenant persisté dans la base de données
- ✅ Les permissions sont basées sur le rôle dans User (source de vérité)
- ✅ Le rôle initial est protégé et restauré automatiquement
- ✅ Pas de désynchronisation possible entre clubs et users

## 📝 Notes Importantes

1. **Migration**: Les membres existants n'ont pas de `initialRole`. Il sera défini lors de la prochaine assignation comme responsable.

2. **Rôles Personnalisés**: Si un membre a un rôle personnalisé et devient responsable, son rôle personnalisé est sauvegardé dans `initialRole` et sera restauré.

3. **Multiples Comités**: Un membre ne peut être responsable que d'UN SEUL comité à la fois (limitation actuelle).

4. **Logs**: Le backend affiche des logs détaillés pour le debugging:
   - `📝 Rôle initial sauvegardé: [role]`
   - `🔄 Mise à jour du rôle dans User: [old] → [new]`
   - `✅ Rôle mis à jour dans la base User`
   - `✅ Rôle restauré dans la base User`

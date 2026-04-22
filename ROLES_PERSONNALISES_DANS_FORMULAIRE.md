# ✅ RÔLES PERSONNALISÉS DANS LE FORMULAIRE D'AJOUT DE MEMBRE

## 📋 Fonctionnalité

Les rôles personnalisés créés dans la page `/roles` s'affichent automatiquement dans la liste déroulante lors de l'ajout d'un nouveau membre.

---

## 🔧 Comment Ça Fonctionne

### 1. Création d'un Rôle Personnalisé

**Page:** `http://192.168.1.20:4200/roles`

1. Cliquer sur "Créer un rôle"
2. Remplir le formulaire:
   - Nom: "Responsable Marketing"
   - Description: "Gère la communication du club"
   - Permissions: Cocher les permissions souhaitées
3. Cliquer sur "Créer le rôle"

**Résultat:** Le rôle est sauvegardé dans MongoDB avec `isActive: true`

### 2. Chargement des Rôles dans le Formulaire

**Page:** `http://192.168.1.20:4200/clubs/{clubId}`

Quand vous ouvrez la page d'un club, le composant `club-detail` exécute:

```typescript
loadCustomRoles(clubId: string): void {
  this.customRoleService.getRolesByClub(clubId).subscribe({
    next: (customRoles) => {
      // Filtrer uniquement les rôles actifs
      this.customRoles = customRoles.filter(r => r.isActive);
      
      // Combiner rôles système + rôles personnalisés + option "Autre"
      this.allRoles = [
        ...this.roles,                              // Rôles système (6)
        ...this.customRoles.map(r => r.roleName),  // Rôles personnalisés
        '➕ Autre (créer un nouveau rôle)'         // Option pour créer
      ];
    }
  });
}
```

### 3. Affichage dans le Formulaire

**Template HTML:**

```html
<select formControlName="role" (change)="onRoleChange($event)">
  <option *ngFor="let role of allRoles" [value]="role">
    {{ role }}
  </option>
</select>
```

**Résultat:** La liste déroulante affiche:
- PRESIDENT
- VICE_PRESIDENT
- SECRETAIRE_GENERALE
- TRESORIER
- RH
- MEMBRE_SIMPLE
- **Responsable Marketing** ← Rôle personnalisé
- **Responsable Événements** ← Rôle personnalisé
- ➕ Autre (créer un nouveau rôle)

### 4. Sélection d'un Rôle Personnalisé

Quand vous sélectionnez "Responsable Marketing" et créez le membre:

```typescript
addMember(): void {
  const selectedRole = this.memberForm.value.role;
  
  // Vérifier si c'est un rôle personnalisé
  const customRole = this.customRoles.find(r => r.roleName === selectedRole);
  
  const newUser = {
    firstName: formValue.firstName,
    lastName: formValue.lastName,
    email: formValue.email,
    password: formValue.password,
    role: selectedRole,  // "Responsable Marketing"
    clubId: this.club.id
  };
  
  if (customRole) {
    // Ajouter l'ID du rôle personnalisé pour les permissions
    newUser.customRoleId = customRole.id;
  }
  
  // Créer l'utilisateur et l'ajouter au club
  this.authService.createUser(newUser).subscribe(...);
}
```

**Résultat:** Le membre est créé avec le rôle "Responsable Marketing" et hérite de ses permissions.

---

## 🎯 Flux Complet

```
1. Président crée un rôle "Responsable Marketing"
   └─> Permissions: VIEW_MEMBERS, CREATE_EVENTS, SEND_NOTIFICATIONS
   └─> Sauvegardé dans MongoDB (collection: custom_roles)

2. Président va sur la page du club
   └─> loadCustomRoles() charge les rôles personnalisés
   └─> allRoles = [système] + [personnalisés] + [Autre]

3. Président clique sur "+ Ajouter un membre"
   └─> Formulaire s'affiche avec la liste déroulante

4. Président sélectionne "Responsable Marketing"
   └─> Le rôle est sélectionné dans le formulaire

5. Président remplit les infos et clique sur "Ajouter"
   └─> Membre créé avec role: "Responsable Marketing"
   └─> Membre ajouté au club

6. Le nouveau membre se connecte
   └─> PermissionService.getUserPermissions() récupère ses permissions
   └─> Permissions: VIEW_MEMBERS, CREATE_EVENTS, SEND_NOTIFICATIONS
   └─> Le membre peut uniquement faire ce qui est autorisé
```

---

## 🧪 Test Complet

### Étape 1: Créer un Rôle Personnalisé

```powershell
# Tester l'API
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/roles/permissions" -UseBasicParsing
```

**Accéder à la page:**
```
http://192.168.1.20:4200/roles
```

**Créer un rôle:**
- Nom: "Responsable Marketing"
- Description: "Gère la communication"
- Permissions:
  - ✅ VIEW_MEMBERS
  - ✅ VIEW_EVENTS
  - ✅ CREATE_EVENTS
  - ✅ EDIT_EVENTS
  - ✅ SEND_NOTIFICATIONS

**Cliquer sur "Créer le rôle"**

### Étape 2: Vérifier que le Rôle Existe

```powershell
# Remplacer {clubId} par l'ID de votre club
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/roles/club/{clubId}" -UseBasicParsing
```

**Résultat attendu:**
```json
[
  {
    "id": "xxx",
    "clubId": "yyy",
    "roleName": "Responsable Marketing",
    "description": "Gère la communication",
    "permissions": ["VIEW_MEMBERS", "VIEW_EVENTS", "CREATE_EVENTS", "EDIT_EVENTS", "SEND_NOTIFICATIONS"],
    "isActive": true
  }
]
```

### Étape 3: Tester le Formulaire

```powershell
# Script de test automatique
./test-custom-roles-in-member-form.ps1
```

**Ou manuellement:**

1. Ouvrir: `http://192.168.1.20:4200/clubs/{clubId}`
2. Cliquer sur "+ Ajouter un membre"
3. Vérifier la liste déroulante "Rôle"

**Résultat attendu:**
```
PRESIDENT
VICE_PRESIDENT
SECRETAIRE_GENERALE
TRESORIER
RH
MEMBRE_SIMPLE
Responsable Marketing  ← Votre rôle personnalisé
➕ Autre (créer un nouveau rôle)
```

### Étape 4: Créer un Membre avec le Rôle Personnalisé

1. Remplir le formulaire:
   - Prénom: "Jean"
   - Nom: "Dupont"
   - Email: "jean.dupont@example.com"
   - Mot de passe: "password123"
   - Rôle: **"Responsable Marketing"**

2. Cliquer sur "Ajouter"

3. Vérifier que le membre apparaît dans la liste avec le rôle "Responsable Marketing"

### Étape 5: Vérifier les Permissions

1. Se déconnecter
2. Se connecter avec jean.dupont@example.com / password123
3. Vérifier que le membre peut:
   - ✅ Voir les membres
   - ✅ Voir les événements
   - ✅ Créer des événements
   - ✅ Modifier des événements
   - ✅ Envoyer des notifications

4. Vérifier que le membre ne peut PAS:
   - ❌ Ajouter des membres
   - ❌ Supprimer des membres
   - ❌ Créer des élections
   - ❌ Modifier le club

---

## 🔍 Diagnostic

### Problème: Les rôles personnalisés ne s'affichent pas

**Vérification 1: Backend démarré?**
```powershell
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/roles/permissions" -UseBasicParsing
```

**Vérification 2: Rôles créés?**
```powershell
# Remplacer {clubId}
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/roles/club/{clubId}" -UseBasicParsing
```

**Vérification 3: Rôles actifs?**
```powershell
# Vérifier que isActive = true
```

**Vérification 4: Console du navigateur (F12)**
```
🔍 Chargement des rôles personnalisés pour le club: xxx
✅ Rôles personnalisés reçus: [...]
✅ Rôles actifs filtrés: [...]
📋 allRoles APRÈS chargement: [...]
```

### Problème: Erreur lors du chargement des rôles

**Console du navigateur:**
```
❌ Erreur chargement rôles personnalisés: {...}
```

**Solutions:**
1. Vérifier que Spring Boot est démarré
2. Vérifier l'URL de l'API dans `custom-role.service.ts`
3. Vérifier le CORS dans `application.properties`
4. Vérifier que le contrôleur `CustomRoleController` existe

### Problème: Les permissions ne sont pas appliquées

**Vérifier les permissions de l'utilisateur:**
```powershell
# Remplacer {userId}
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/permissions/user/{userId}" -UseBasicParsing
```

**Résultat attendu:**
```json
["VIEW_MEMBERS", "VIEW_EVENTS", "CREATE_EVENTS", "EDIT_EVENTS", "SEND_NOTIFICATIONS"]
```

---

## 📌 Points Importants

1. **Les rôles personnalisés sont spécifiques à un club**: Chaque club a ses propres rôles personnalisés

2. **Seuls les rôles actifs s'affichent**: Si `isActive = false`, le rôle n'apparaît pas dans la liste

3. **Le rechargement est automatique**: Quand vous créez un rôle et revenez sur la page du club, les rôles sont rechargés automatiquement grâce à `RoleEventsService`

4. **L'option "Autre" redirige vers /roles**: Si vous cliquez sur "➕ Autre", vous êtes redirigé vers la page de création de rôles

5. **Les permissions sont cumulatives**: Si un membre a un rôle système ET un rôle personnalisé, il a les permissions des deux

---

## 🎯 Résumé

Le système est **déjà fonctionnel**! Les rôles personnalisés s'affichent automatiquement dans le formulaire d'ajout de membre.

**Pour l'utiliser:**

1. Créer un rôle personnalisé sur `/roles`
2. Aller sur la page du club
3. Cliquer sur "+ Ajouter un membre"
4. Sélectionner le rôle personnalisé dans la liste
5. Créer le membre

**Le membre aura uniquement les permissions du rôle sélectionné!**

---

**Date:** 22 avril 2026
**Status:** ✅ Fonctionnel
**Test:** `./test-custom-roles-in-member-form.ps1`

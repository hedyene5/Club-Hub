# 🚀 Guide de Test Rapide - Permissions des Rôles Personnalisés

## ⚠️ AVANT DE COMMENCER

Vous devez avoir:
1. ✅ Des rôles personnalisés dans MongoDB (collection `custom_roles`)
2. ✅ Le User Service redémarré avec le nouveau code

---

## 📝 ÉTAPE 1: Redémarrer le User Service

### Option A: Script Automatique (Recommandé)
```
1. Arrêtez le User Service actuel (Ctrl+C dans son terminal)
2. Double-cliquez sur: CORRIGER_PERMISSIONS_MAINTENANT.bat
3. Attendez "Started ClubHubApplication"
```

### Option B: Commandes Manuelles
```bash
# Terminal 1: Arrêtez le User Service (Ctrl+C)

# Terminal 2: Redémarrez
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw clean spring-boot:run
```

---

## 🧪 ÉTAPE 2: Vérifier que l'endpoint fonctionne

### Test 1: Via le navigateur

Ouvrez: `http://localhost:8081/api/permissions/user/VOTRE_USER_ID`

Remplacez `VOTRE_USER_ID` par un vrai ID d'utilisateur de MongoDB.

**Résultat attendu**: Un JSON avec une liste de permissions
```json
["VIEW_MEMBERS", "DELETE_MEMBERS", "ADD_MEMBERS"]
```

**Si erreur 403 ou 404**: Le service n'est pas correctement redémarré.

---

## 🎯 ÉTAPE 3: Tester avec un utilisateur réel

### Scénario: Créer un utilisateur "Chef" avec permissions limitées

#### 3.1 Vérifier les rôles dans MongoDB

Ouvrez MongoDB Compass:
- Base: `User`
- Collection: `custom_roles`
- Cherchez un rôle, par exemple "Chef"

Vérifiez qu'il a:
```json
{
  "_id": "67abc123...",
  "roleName": "Chef",
  "permissions": ["VIEW_MEMBERS", "DELETE_MEMBERS"],
  "isActive": true,
  "clubId": "69dd..."
}
```

#### 3.2 Créer un utilisateur avec ce rôle

**Connectez-vous en PRESIDENT**, puis:

1. Allez dans **"Clubs"** → Votre club
2. Cliquez **"Ajouter un membre"**
3. Remplissez:
   - Prénom: `Test`
   - Nom: `Chef`
   - Email: `chef@test.com`
   - Password: `test123`
   - Rôle: Sélectionnez **"Chef"** (votre rôle personnalisé)
4. Cliquez **"Ajouter"**

#### 3.3 Vérifier dans MongoDB que customRoleId est enregistré

MongoDB Compass:
- Base: `User`
- Collection: `users`
- Cherchez: `chef@test.com`

Vérifiez:
```json
{
  "_id": "69dd...",
  "email": "chef@test.com",
  "role": "Chef",
  "customRoleId": "67abc123...",  ← DOIT ÊTRE PRÉSENT!
  ...
}
```

**Si `customRoleId` est absent ou null**: Le frontend n'envoie pas le customRoleId correctement.

#### 3.4 Tester les permissions

1. **Déconnectez-vous** du compte PRESIDENT
2. **Connectez-vous** avec:
   - Email: `chef@test.com`
   - Password: `test123`

3. **Ouvrez la console du navigateur** (F12)
   
   Vous devez voir:
   ```
   ✅ Permissions chargées: ["VIEW_MEMBERS", "DELETE_MEMBERS"]
   ```

4. **Allez dans "Clubs"** → Votre club

5. **Vérifiez les boutons**:

   | Bouton | Doit être |
   |--------|-----------|
   | "Ajouter un membre" | ❌ CACHÉ (pas ADD_MEMBERS) |
   | "✏️ Modifier" | ❌ CACHÉ (pas EDIT_MEMBERS) |
   | "🗑️ Supprimer" | ✅ VISIBLE (a DELETE_MEMBERS) |

---

## ✅ RÉSULTAT ATTENDU

### Pour un rôle "Chef" avec permissions [VIEW_MEMBERS, DELETE_MEMBERS]:

```
┌─────────────────────────────────────────────────────────────┐
│ Liste des Membres                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nom          Email              Rôle        Actions        │
│ ────────────────────────────────────────────────────────── │
│ John Doe     john@test.com      PRESIDENT   ✏️ 🗑️         │
│ Jane Smith   jane@test.com      MEMBRE      ✏️ 🗑️         │
│                                                             │
│ [Bouton "Ajouter un membre" est CACHÉ]                     │
└─────────────────────────────────────────────────────────────┘
```

**L'utilisateur "Chef" peut**:
- ✅ Voir la liste des membres
- ✅ Supprimer des membres (bouton 🗑️ visible)
- ❌ Ajouter des membres (bouton caché)
- ❌ Modifier des membres (bouton ✏️ caché)

---

## 🐛 DÉPANNAGE

### Problème 1: Permissions vides []

**Console navigateur montre**:
```
✅ Permissions chargées: []
```

**Causes possibles**:
1. `customRoleId` est null dans l'utilisateur MongoDB
2. Le rôle n'existe pas dans `custom_roles`
3. Le rôle a `isActive: false`

**Solution**:
- Vérifiez dans MongoDB que l'utilisateur a bien un `customRoleId`
- Vérifiez que le rôle existe et est actif

---

### Problème 2: Tous les boutons sont visibles

**Causes possibles**:
1. L'utilisateur est PRESIDENT (a tous les droits)
2. Les permissions ne sont pas chargées
3. Le HTML utilise `isAdmin` au lieu de `permissionService.hasPermission()`

**Solution**:
- Vérifiez que vous êtes connecté avec le bon utilisateur
- Vérifiez la console: les permissions doivent être chargées
- Vérifiez que le HTML utilise bien `permissionService.hasPermission()`

---

### Problème 3: Erreur 404 sur /api/permissions/user/{userId}

**Cause**: Le User Service n'a pas été redémarré correctement

**Solution**:
1. Arrêtez le User Service (Ctrl+C)
2. Supprimez le dossier `target`:
   ```bash
   cd Club-Hub-Voice-Channel-Management/User/ClubHub
   rm -rf target
   ```
3. Recompilez et redémarrez:
   ```bash
   ./mvnw clean spring-boot:run
   ```

---

### Problème 4: customRoleId est null dans MongoDB

**Cause**: Le frontend n'envoie pas le customRoleId lors de la création

**Solution**:
1. Ouvrez la console du navigateur (F12)
2. Créez un nouveau membre avec un rôle personnalisé
3. Vérifiez les logs:
   ```
   ✅ Ajout avec rôle personnalisé: Chef ID: 67abc123...
   📦 Payload envoyé: { ..., "customRoleId": "67abc123..." }
   ```
4. Si `customRoleId` est absent, le frontend a un problème
5. Rechargez la page et réessayez

---

## 📊 FLUX COMPLET

```
1. PRÉSIDENT crée rôle "Chef"
   └─> MongoDB: custom_roles
       {
         roleName: "Chef",
         permissions: ["VIEW_MEMBERS", "DELETE_MEMBERS"],
         isActive: true
       }

2. PRÉSIDENT crée user avec rôle "Chef"
   └─> Frontend envoie:
       {
         role: "Chef",
         customRoleId: "67abc123..."
       }
   └─> MongoDB: users
       {
         email: "chef@test.com",
         role: "Chef",
         customRoleId: "67abc123..."
       }

3. User "Chef" se connecte
   └─> Frontend appelle:
       GET /api/permissions/user/{userId}
   └─> Backend PermissionService:
       - Lit user.customRoleId
       - Charge CustomRole depuis MongoDB
       - Retourne: ["VIEW_MEMBERS", "DELETE_MEMBERS"]
   └─> Frontend:
       - Stocke les permissions
       - Cache/montre les boutons

4. Affichage
   └─> permissionService.hasPermission('ADD_MEMBERS')
       → false → Bouton "Ajouter" CACHÉ
   └─> permissionService.hasPermission('DELETE_MEMBERS')
       → true → Bouton "Supprimer" VISIBLE
```

---

## 📞 BESOIN D'AIDE?

Si après avoir suivi ce guide ça ne marche toujours pas:

1. Partagez les logs du User Service (terminal backend)
2. Partagez les logs de la console navigateur (F12)
3. Partagez une capture d'écran de MongoDB:
   - Collection `users` → Votre utilisateur "Chef"
   - Collection `custom_roles` → Le rôle "Chef"

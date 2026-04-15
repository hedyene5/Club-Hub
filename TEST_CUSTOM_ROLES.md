# 🧪 Guide de Test - Rôles Personnalisés avec Permissions

## ⚠️ ÉTAPE OBLIGATOIRE: Recompiler le User Service

**IMPORTANT**: Les fichiers `PermissionService.java` et `PermissionController.java` ne sont PAS compilés!

```bash
# 1. Arrêter le User Service (Ctrl+C dans le terminal)

# 2. Aller dans le dossier User Service
cd Club-Hub-Voice-Channel-Management/User/ClubHub

# 3. Recompiler avec clean (OBLIGATOIRE)
./mvnw clean spring-boot:run
```

**Attendez** que vous voyiez ce message:
```
Started ClubHubApplication in X.XXX seconds
```

---

## 📋 Scénario de Test Complet

### Étape 1: Créer un rôle personnalisé "Chef"

1. **Connectez-vous en tant que PRESIDENT**
   - Email: votre email président
   - Password: votre mot de passe

2. **Allez dans "Gestion des Rôles"** (menu latéral gauche)

3. **Cliquez sur "Créer un nouveau rôle"**

4. **Remplissez le formulaire**:
   - Nom du rôle: `Chef`
   - Description: `Chef d'équipe avec droits limités`
   - Permissions à cocher:
     - ✅ VIEW_MEMBERS (Voir les membres)
     - ✅ DELETE_MEMBERS (Supprimer les membres)
     - ❌ ADD_MEMBERS (NE PAS cocher)
     - ❌ EDIT_MEMBERS (NE PAS cocher)

5. **Cliquez sur "Créer le rôle"**

6. **Vérifiez** que le rôle apparaît dans la liste avec `isActive: true`

---

### Étape 2: Créer un utilisateur avec le rôle "Chef"

1. **Allez dans "Clubs"** → Cliquez sur votre club

2. **Cliquez sur "Ajouter un membre"**

3. **Remplissez le formulaire**:
   - Prénom: `Test`
   - Nom: `Chef`
   - Email: `chef@test.com`
   - Mot de passe: `test123`
   - Rôle: Sélectionnez **"Chef"** (votre rôle personnalisé)

4. **Cliquez sur "Ajouter"**

5. **Ouvrez la console du navigateur** (F12) et vérifiez les logs:
   ```
   ✅ Ajout avec rôle personnalisé: Chef ID: 67abc123...
   📦 Payload envoyé: {
     "firstName": "Test",
     "lastName": "Chef",
     "email": "chef@test.com",
     "role": "Chef",
     "customRoleId": "67abc123...",
     ...
   }
   ```

6. **Vérifiez les logs du User Service** (terminal backend):
   ```
   === REGISTER DEBUG ===
   Email: chef@test.com
   Role: Chef
   CustomRoleId: 67abc123...
   =====================
   ✅ CustomRoleId enregistré: 67abc123...
   ✅ User sauvegardé - ID: 69dd..., Role: Chef, CustomRoleId: 67abc123...
   ```

---

### Étape 3: Tester les permissions du rôle "Chef"

1. **Déconnectez-vous** du compte PRESIDENT
   - Cliquez sur votre profil → Déconnexion

2. **Connectez-vous avec le compte "Chef"**
   - Email: `chef@test.com`
   - Password: `test123`

3. **Ouvrez la console du navigateur** (F12) et vérifiez:
   ```
   ✅ Permissions chargées: ["VIEW_MEMBERS", "DELETE_MEMBERS"]
   ```

4. **Allez dans "Clubs"** → Cliquez sur votre club

5. **Vérifiez les boutons visibles**:
   - ❌ Bouton "Ajouter un membre" → **CACHÉ** (pas de permission ADD_MEMBERS)
   - ❌ Bouton "✏️ Modifier" → **CACHÉ** (pas de permission EDIT_MEMBERS)
   - ✅ Bouton "🗑️ Supprimer" → **VISIBLE** (a la permission DELETE_MEMBERS)

---

## 🔍 Vérification dans MongoDB

Vous pouvez vérifier dans MongoDB Compass:

1. **Base de données**: `User`
2. **Collection**: `users`
3. **Cherchez l'utilisateur**: `chef@test.com`
4. **Vérifiez les champs**:
   ```json
   {
     "_id": "69dd...",
     "email": "chef@test.com",
     "role": "Chef",
     "customRoleId": "67abc123...",
     ...
   }
   ```

5. **Collection**: `customRoles`
6. **Cherchez le rôle**: `Chef`
7. **Vérifiez les permissions**:
   ```json
   {
     "_id": "67abc123...",
     "roleName": "Chef",
     "permissions": ["VIEW_MEMBERS", "DELETE_MEMBERS"],
     "isActive": true,
     ...
   }
   ```

---

## ✅ Résultat Attendu

| Rôle | Voir membres | Ajouter | Modifier | Supprimer |
|------|-------------|---------|----------|-----------|
| PRESIDENT | ✅ | ✅ | ✅ | ✅ |
| MEMBRE_SIMPLE | ✅ | ❌ | ❌ | ❌ |
| Chef (personnalisé) | ✅ | ❌ | ❌ | ✅ |

---

## 🐛 Dépannage

### Problème: 404 sur /api/permissions/user/{userId}

**Cause**: Le User Service n'a pas été recompilé avec `clean`

**Solution**:
```bash
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw clean spring-boot:run
```

### Problème: Permissions vides []

**Cause**: Le `customRoleId` n'a pas été enregistré dans l'utilisateur

**Solution**: Vérifiez les logs de la console et du backend pour voir si `customRoleId` est bien envoyé et reçu

### Problème: Tous les boutons sont visibles pour "Chef"

**Cause**: Les permissions ne sont pas chargées ou le frontend utilise `isAdmin` au lieu des permissions

**Solution**: Vérifiez que le HTML utilise bien `permissionService.hasPermission()` et non seulement `isAdmin`

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de la console navigateur (F12)
2. Vérifiez les logs du User Service (terminal backend)
3. Vérifiez MongoDB avec Compass
4. Partagez les logs pour diagnostic

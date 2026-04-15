# 🚀 Comment Activer les Permissions des Rôles Personnalisés

## ⚠️ PROBLÈME ACTUEL

Les permissions des rôles personnalisés **NE FONCTIONNENT PAS** parce que:
- Les fichiers `PermissionService.java` et `PermissionController.java` existent ✅
- Mais ils ne sont **PAS COMPILÉS** dans l'application en cours ❌
- Maven dit: "Nothing to compile - all classes are up to date"

## ✅ SOLUTION EN 3 ÉTAPES

### Étape 1: Arrêter le User Service

Dans le terminal où tourne le User Service:
```
Appuyez sur: Ctrl + C
```

Vous devez voir le processus s'arrêter.

---

### Étape 2: Recompiler avec CLEAN

**Option A: Utiliser le script automatique**
```bash
# Double-cliquez sur ce fichier:
RECOMPILER_USER_SERVICE.bat
```

**Option B: Commandes manuelles**
```bash
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw clean spring-boot:run
```

---

### Étape 3: Attendre le message de succès

Vous devez voir dans le terminal:
```
Started ClubHubApplication in 2.052 seconds (process running for 2.4)
Tomcat started on port 8081 (http) with context path '/'
```

✅ **C'est prêt!** Le service est maintenant compilé avec les nouveaux fichiers.

---

## 🧪 TESTER QUE ÇA MARCHE

### Test 1: Vérifier l'endpoint permissions

Ouvrez votre navigateur et allez sur:
```
http://localhost:8081/api/permissions/user/VOTRE_USER_ID
```

Si vous voyez un JSON avec des permissions → ✅ Ça marche!
Si vous voyez une erreur 404 → ❌ Le service n'est pas recompilé

---

### Test 2: Créer un rôle "Chef" et tester

1. **Connectez-vous en PRESIDENT**

2. **Créez un rôle "Chef"**:
   - Menu: "Gestion des Rôles"
   - Nom: `Chef`
   - Permissions:
     - ✅ VIEW_MEMBERS
     - ✅ DELETE_MEMBERS
     - ❌ ADD_MEMBERS (ne pas cocher)
     - ❌ EDIT_MEMBERS (ne pas cocher)
   - Cliquez "Créer"

3. **Créez un utilisateur avec ce rôle**:
   - Menu: "Clubs" → Votre club
   - Cliquez "Ajouter un membre"
   - Prénom: `Test`
   - Nom: `Chef`
   - Email: `chef@test.com`
   - Password: `test123`
   - Rôle: Sélectionnez **"Chef"**
   - Cliquez "Ajouter"

4. **Déconnectez-vous et reconnectez-vous**:
   - Email: `chef@test.com`
   - Password: `test123`

5. **Vérifiez les boutons** (dans la page du club):
   - ❌ Bouton "Ajouter un membre" → **DOIT ÊTRE CACHÉ**
   - ❌ Bouton "✏️ Modifier" → **DOIT ÊTRE CACHÉ**
   - ✅ Bouton "🗑️ Supprimer" → **DOIT ÊTRE VISIBLE**

---

## 📊 COMMENT ÇA FONCTIONNE

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PRÉSIDENT crée rôle "Chef"                               │
│    Permissions: [VIEW_MEMBERS, DELETE_MEMBERS]              │
│    → Enregistré dans MongoDB: customRoles collection        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PRÉSIDENT crée user avec rôle "Chef"                     │
│    Frontend envoie:                                          │
│    {                                                         │
│      role: "Chef",                                           │
│      customRoleId: "67abc123..."  ← ID du rôle              │
│    }                                                         │
│    → Enregistré dans MongoDB: users collection              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User "Chef" se connecte                                   │
│    Frontend appelle:                                         │
│    GET /api/permissions/user/{userId}                        │
│                                                              │
│    Backend PermissionService:                                │
│    - Lit user.customRoleId = "67abc123..."                  │
│    - Charge CustomRole depuis MongoDB                        │
│    - Retourne: ["VIEW_MEMBERS", "DELETE_MEMBERS"]           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend cache/montre les boutons                        │
│                                                              │
│    permissionService.hasPermission('ADD_MEMBERS')           │
│    → false → Bouton "Ajouter" CACHÉ                         │
│                                                              │
│    permissionService.hasPermission('EDIT_MEMBERS')          │
│    → false → Bouton "Modifier" CACHÉ                        │
│                                                              │
│    permissionService.hasPermission('DELETE_MEMBERS')        │
│    → true → Bouton "Supprimer" VISIBLE                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 DÉPANNAGE

### Problème: Toujours 404 sur /api/permissions/user/{userId}

**Cause**: Le User Service n'a pas été recompilé correctement

**Solution**:
1. Arrêtez le User Service (Ctrl+C)
2. Supprimez le dossier `target`:
   ```bash
   cd Club-Hub-Voice-Channel-Management/User/ClubHub
   rm -rf target
   ```
3. Recompilez:
   ```bash
   ./mvnw clean compile spring-boot:run
   ```

---

### Problème: Les boutons sont tous visibles pour "Chef"

**Cause**: Les permissions ne sont pas chargées

**Solution**:
1. Ouvrez la console du navigateur (F12)
2. Vérifiez si vous voyez:
   ```
   ✅ Permissions chargées: ["VIEW_MEMBERS", "DELETE_MEMBERS"]
   ```
3. Si vous voyez `[]` (vide), vérifiez que:
   - Le user a bien un `customRoleId` dans MongoDB
   - Le rôle existe dans la collection `customRoles`
   - Le rôle a `isActive: true`

---

### Problème: "customRoleId" est null dans MongoDB

**Cause**: Le frontend n'envoie pas le customRoleId

**Solution**:
1. Ouvrez la console du navigateur (F12)
2. Créez un nouveau membre avec un rôle personnalisé
3. Vérifiez les logs:
   ```
   ✅ Ajout avec rôle personnalisé: Chef ID: 67abc123...
   📦 Payload envoyé: { ..., "customRoleId": "67abc123..." }
   ```
4. Si `customRoleId` est absent, rechargez la page et réessayez

---

## 📞 BESOIN D'AIDE?

Si après avoir suivi ces étapes ça ne marche toujours pas:

1. Partagez les logs du User Service (terminal backend)
2. Partagez les logs de la console navigateur (F12)
3. Vérifiez dans MongoDB Compass:
   - Collection `users` → Cherchez votre user "Chef"
   - Collection `customRoles` → Cherchez le rôle "Chef"

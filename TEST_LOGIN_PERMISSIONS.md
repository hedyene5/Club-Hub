# 🧪 Test - Permissions Lors du Login

## ✅ Correction Appliquée

Le `PermissionService` écoute maintenant les changements d'utilisateur via `authService.userProfile$`.

Quand un utilisateur se connecte:
1. `authService.login()` est appelé
2. `saveSession()` émet via `userProfileSubject`
3. `PermissionService` reçoit l'événement
4. Les permissions sont rechargées automatiquement

---

## 🧪 Scénario de Test

### Étape 1: Connectez-vous avec User 1 (rôle "llll")

1. Ouvrez la console du navigateur (F12)
2. Allez sur la page de connexion
3. Connectez-vous avec:
   - Email: (user avec rôle "llll")
   - Password: (son mot de passe)

**Logs attendus**:
```
✅ Login réussi: {...}
🔄 Nouvel utilisateur connecté, rechargement des permissions...
📡 Chargement des permissions pour: 69ded3b8fac5d2705179ed38
✅ Permissions chargées: ["ADD_MEMBERS", "VIEW_MEMBERS", ...]
```

4. Allez dans la page du club
5. Cliquez sur "🐛 Debug Permissions"

**Résultat attendu**:
```
=== DEBUG PERMISSIONS ===
isAdmin: false
Current role: llll
Permissions: ["ADD_MEMBERS", "VIEW_MEMBERS", ...]
Has ADD_MEMBERS: true
========================
```

---

### Étape 2: Déconnectez-vous

1. Cliquez sur votre profil → Déconnexion

**Logs attendus**:
```
🔄 Utilisateur déconnecté, réinitialisation des permissions...
```

---

### Étape 3: Connectez-vous avec User 2 (rôle "hhh")

1. Connectez-vous avec un autre utilisateur:
   - Email: (user avec rôle "hhh")
   - Password: (son mot de passe)

**Logs attendus**:
```
✅ Login réussi: {...}
🔄 Nouvel utilisateur connecté, rechargement des permissions...
📡 Chargement des permissions pour: 69decb2fbf50536a8216aa12
✅ Permissions chargées: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"]
```

2. Allez dans la page du club
3. Cliquez sur "🐛 Debug Permissions"

**Résultat attendu**:
```
=== DEBUG PERMISSIONS ===
isAdmin: false
Current role: hhh
Permissions: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"]
Has ADD_MEMBERS: false
Has EDIT_MEMBERS: false
Has DELETE_MEMBERS: false
========================
```

4. **Vérifiez les boutons**:
   - ❌ Bouton "Ajouter un membre" → CACHÉ (pas ADD_MEMBERS)
   - ❌ Bouton "✏️ Modifier" → CACHÉ (pas EDIT_MEMBERS)
   - ❌ Bouton "🗑️ Supprimer" → CACHÉ (pas DELETE_MEMBERS)

---

## ✅ Résultat Attendu

### Avant la correction:
```
User 1 (llll) se connecte
  → Permissions: ["ADD_MEMBERS", ...]
  → Bouton "Ajouter" visible ✅

User 1 se déconnecte

User 2 (hhh) se connecte
  → Permissions: ["ADD_MEMBERS", ...] ❌ (anciennes permissions!)
  → Bouton "Ajouter" visible ❌ (ne devrait pas!)
  → F5 → Permissions: ["VIEW_MEMBERS", ...] ✅
  → Bouton "Ajouter" caché ✅
```

### Après la correction:
```
User 1 (llll) se connecte
  → Permissions: ["ADD_MEMBERS", ...]
  → Bouton "Ajouter" visible ✅

User 1 se déconnecte
  → Permissions: [] ✅

User 2 (hhh) se connecte
  → Permissions: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"] ✅
  → Bouton "Ajouter" caché ✅
  → Pas besoin de F5! ✅
```

---

## 🔍 Logs de Debug

Vous devriez voir dans la console:

### Au login:
```
✅ Login réussi: {userId: "...", role: "hhh", ...}
🔄 Nouvel utilisateur connecté, rechargement des permissions...
📡 Chargement des permissions pour: 69decb2fbf50536a8216aa12
✅ Permissions chargées: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"]
🔄 Permissions mises à jour: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"]
```

### Au logout:
```
🔄 Utilisateur déconnecté, réinitialisation des permissions...
```

---

## 🐛 Si Ça Ne Marche Toujours Pas

### Problème 1: Permissions de l'ancien user persistent

**Symptôme**: Après connexion avec User 2, vous voyez encore les permissions de User 1.

**Cause**: Le `userProfile$` n'émet pas lors du login.

**Solution**:
1. Vérifiez que `authService.login()` appelle bien `saveSession()`
2. Vérifiez que `saveSession()` appelle `this.userProfileSubject.next(userData)`
3. Ajoutez un log dans `saveSession()`:
   ```typescript
   console.log('📢 Émission userProfile:', userData);
   ```

---

### Problème 2: Permissions chargées mais boutons pas mis à jour

**Symptôme**: Les permissions sont correctes dans la console, mais les boutons ne changent pas.

**Cause**: Angular ne détecte pas le changement.

**Solution**: Le `ChangeDetectorRef` devrait déjà gérer ça. Vérifiez les logs:
```
🔄 Permissions mises à jour: [...]
```

Si ce log n'apparaît pas, le component ne s'abonne pas à `permissions$`.

---

### Problème 3: Double chargement des permissions

**Symptôme**: Vous voyez deux fois "✅ Permissions chargées" au login.

**Cause**: Le constructor charge les permissions ET l'événement `userProfile$` les recharge.

**Solution**: C'est normal et pas grave. Le deuxième chargement écrase le premier.

---

## 📊 Flux Complet

```
1. User 1 (llll) se connecte
   └─> signin-form.component.ts: authService.login()
   └─> auth.service.ts: saveSession()
   └─> userProfileSubject.next(userData)
   └─> permission.service.ts: reçoit l'événement
   └─> loadUserPermissions()
   └─> GET /api/permissions/user/69ded3b8...
   └─> Backend retourne: ["ADD_MEMBERS", "VIEW_MEMBERS", ...]
   └─> permissionsSubject.next(permissions)
   └─> club-detail.component.ts: reçoit via permissions$
   └─> cdr.detectChanges()
   └─> Angular met à jour la vue
   └─> Bouton "Ajouter" visible ✅

2. User 1 se déconnecte
   └─> auth.service.ts: logout()
   └─> userProfileSubject.next(null)
   └─> permission.service.ts: reçoit l'événement
   └─> permissionsSubject.next([])
   └─> Permissions réinitialisées ✅

3. User 2 (hhh) se connecte
   └─> signin-form.component.ts: authService.login()
   └─> auth.service.ts: saveSession()
   └─> userProfileSubject.next(userData)
   └─> permission.service.ts: reçoit l'événement
   └─> loadUserPermissions()
   └─> GET /api/permissions/user/69decb2f...
   └─> Backend retourne: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"]
   └─> permissionsSubject.next(permissions)
   └─> club-detail.component.ts: reçoit via permissions$
   └─> cdr.detectChanges()
   └─> Angular met à jour la vue
   └─> Bouton "Ajouter" caché ✅
```

---

## 📞 Besoin d'Aide?

Si après ce test ça ne marche toujours pas:

1. Partagez les logs de la console lors du login
2. Partagez les logs du bouton "🐛 Debug Permissions"
3. Indiquez quel utilisateur vous utilisez et quelles permissions il devrait avoir

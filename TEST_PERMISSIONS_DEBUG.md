# 🐛 Test des Permissions avec Debug

## ✅ Le Backend Fonctionne!

Vos logs montrent que le backend retourne bien les permissions:
```
✅ Permissions finales: [VIEW_MEMBERS, VIEW_SUBGROUPS, ASSIGN_TO_SUBGROUPS]
```

Le problème est maintenant dans le **FRONTEND**.

---

## 🧪 Test avec le Bouton Debug

### Étape 1: Connectez-vous avec un utilisateur à rôle personnalisé

Par exemple, l'utilisateur avec le rôle "hhh":
- Email: (l'email de cet utilisateur)
- Password: (son mot de passe)

### Étape 2: Allez dans la page du club

Menu: "Clubs" → Cliquez sur votre club

### Étape 3: Cliquez sur le bouton "🐛 Debug Permissions"

Vous verrez un nouveau bouton jaune en haut de la liste des membres.

### Étape 4: Ouvrez la console du navigateur (F12)

Vous devriez voir:
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

---

## 🔍 Interprétation des Résultats

### Cas 1: Permissions est un tableau vide []

```
Permissions: []
```

**Problème**: Les permissions ne sont pas chargées depuis le backend.

**Causes possibles**:
1. L'utilisateur n'a pas de `customRoleId` dans MongoDB
2. Le rôle n'existe pas ou est inactif
3. Erreur réseau (vérifiez l'onglet Network dans F12)

**Solution**:
- Vérifiez dans MongoDB que l'utilisateur a bien un `customRoleId`
- Vérifiez que le rôle existe dans `custom_roles` avec `isActive: true`
- Rechargez la page (F5)

---

### Cas 2: Permissions est correct mais boutons visibles

```
Permissions: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"]
Has ADD_MEMBERS: false
Has EDIT_MEMBERS: false
Has DELETE_MEMBERS: false
```

Mais les boutons "Ajouter", "Modifier", "Supprimer" sont TOUS visibles.

**Problème**: `isAdmin` est `true` alors qu'il devrait être `false`.

**Causes possibles**:
1. Le rôle de l'utilisateur est PRESIDENT, RH, ou SECRETAIRE_GENERALE
2. L'utilisateur est RESPONSABLE d'un sous-groupe

**Solution**:
- Vérifiez `isAdmin:` dans les logs
- Si `isAdmin: true`, c'est normal que tous les boutons soient visibles
- Connectez-vous avec un utilisateur qui a un rôle personnalisé simple

---

### Cas 3: Permissions correct, isAdmin false, mais boutons toujours visibles

```
isAdmin: false
Permissions: ["VIEW_MEMBERS"]
Has ADD_MEMBERS: false
```

Mais le bouton "Ajouter un membre" est visible.

**Problème**: Le HTML utilise `*ngIf="isAdmin || permissionService.hasPermission('ADD_MEMBERS')"`

Cela signifie: "Montrer si isAdmin OU si a la permission".

**Vérification**:
- Ouvrez l'inspecteur (F12)
- Cliquez sur le bouton "Ajouter un membre"
- Regardez le code HTML
- Vérifiez la condition `*ngIf`

---

## 🎯 Résultat Attendu

Pour un utilisateur avec le rôle "hhh" qui a les permissions:
```
[VIEW_MEMBERS, VIEW_SUBGROUPS, ASSIGN_TO_SUBGROUPS]
```

Les boutons doivent être:

| Bouton | Permission requise | Doit être |
|--------|-------------------|-----------|
| "Ajouter un membre" | ADD_MEMBERS | ❌ CACHÉ |
| "✏️ Modifier" | EDIT_MEMBERS | ❌ CACHÉ |
| "🗑️ Supprimer" | DELETE_MEMBERS | ❌ CACHÉ |

**Tous les boutons d'action doivent être cachés** car l'utilisateur n'a aucune de ces permissions.

---

## 🔧 Si les Permissions ne se Chargent Pas

### Vérification 1: Appel API

Ouvrez F12 → Onglet "Network"

Cherchez un appel à:
```
GET http://localhost:8084/api/permissions/user/{userId}
```

**Si l'appel n'existe pas**: Le PermissionService ne charge pas les permissions.

**Si l'appel retourne 404**: Le backend n'est pas correctement démarré.

**Si l'appel retourne 200**: Vérifiez la réponse (doit être un tableau JSON).

### Vérification 2: Timing

Le problème peut être que les permissions sont chargées APRÈS l'affichage de la page.

**Solution**: Recharger les permissions manuellement.

Ajoutez dans `ngOnInit`:
```typescript
// Recharger les permissions après un court délai
setTimeout(() => {
  this.permissionService.loadUserPermissions();
}, 500);
```

---

## 📊 Flux Complet

```
1. User "hhh" se connecte
   └─> AuthService stocke user dans localStorage
   └─> Token JWT stocké

2. AppComponent démarre
   └─> PermissionService.loadUserPermissions()
   └─> GET /api/permissions/user/{userId}
   └─> Backend retourne: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS"]
   └─> PermissionService stocke dans BehaviorSubject

3. ClubDetailComponent s'affiche
   └─> ngOnInit() vérifie isAdmin
   └─> isAdmin = false (car role = "hhh")
   └─> HTML vérifie: isAdmin || permissionService.hasPermission('ADD_MEMBERS')
   └─> false || false = false
   └─> Bouton "Ajouter" CACHÉ ✅

4. Boutons d'action
   └─> "Modifier": isAdmin || hasPermission('EDIT_MEMBERS')
       → false || false = false → CACHÉ ✅
   └─> "Supprimer": isAdmin || hasPermission('DELETE_MEMBERS')
       → false || false = false → CACHÉ ✅
```

---

## 🐛 Commandes de Debug

Dans la console du navigateur (F12), vous pouvez taper:

```javascript
// Voir les permissions actuelles
angular.getComponent(document.querySelector('app-club-detail')).permissionService.getPermissions()

// Voir si isAdmin
angular.getComponent(document.querySelector('app-club-detail')).isAdmin

// Recharger les permissions
angular.getComponent(document.querySelector('app-club-detail')).permissionService.loadUserPermissions()
```

---

## 📞 Prochaines Étapes

1. Connectez-vous avec l'utilisateur "hhh"
2. Allez dans la page du club
3. Cliquez sur "🐛 Debug Permissions"
4. Partagez les logs de la console
5. Je vous dirai exactement quel est le problème

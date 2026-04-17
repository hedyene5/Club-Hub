# 🧪 Test: Changement de Rôle dans le Comité

## 🎯 Objectif

Vérifier que le responsable peut changer les rôles des membres dans SON comité.

---

## ✅ Test 1: Promouvoir un Membre en Responsable

### Étapes:
1. Connectez-vous en tant que PRESIDENT
2. Créez un comité "Marketing"
3. Assignez Bob comme RESPONSABLE du comité Marketing
4. Assignez Alice comme MEMBRE_COMITE du comité Marketing
5. Déconnectez-vous
6. Reconnectez-vous avec le compte de Bob
7. Allez sur la page du club
8. Dans la liste des membres du comité Marketing, trouvez Alice
9. Dans la colonne "Rôle dans le comité", changez le dropdown de "📋 Membre du comité" à "👑 Responsable"
10. Confirmez le changement

### Résultat Attendu:
- ✅ Alice est promue en RESPONSABLE
- ✅ Badge "👑 Responsable" affiché pour Alice
- ✅ Message: "Alice est maintenant Responsable du comité Marketing"
- ✅ Le rôle d'Alice dans la base: "Responsable Marketing"

### Vérification MongoDB:
```javascript
// Collection users
db.users.findOne({ email: "alice@test.com" })
{
  "role": "Responsable Marketing"  // ✅ Changé
}

// Collection clubs
db.clubs.findOne({ name: "Mon Club" })
// Dans subGroups[0] (Marketing):
{
  "responsableId": "alice-id",  // ✅ Mis à jour
  "memberRoles": {
    "alice-id": "RESPONSABLE"  // ✅ Mis à jour
  }
}
```

---

## ✅ Test 2: Rétrograder un Responsable en Membre

### Étapes:
1. Connecté en tant que Bob (Responsable Marketing)
2. Alice est maintenant RESPONSABLE du comité Marketing
3. Dans la liste des membres du comité Marketing, trouvez Alice
4. Dans la colonne "Rôle dans le comité", changez le dropdown de "👑 Responsable" à "📋 Membre du comité"
5. Confirmez le changement

### Résultat Attendu:
- ✅ Alice est rétrogradée en MEMBRE_COMITE
- ✅ Badge "📋 Membre du comité" affiché pour Alice
- ✅ Message: "Alice est maintenant Membre du comité Marketing"
- ✅ Le rôle d'Alice est restauré dans la base

### Vérification MongoDB:
```javascript
// Collection users
db.users.findOne({ email: "alice@test.com" })
{
  "role": "MEMBRE_SIMPLE"  // ✅ Restauré
}

// Collection clubs
db.clubs.findOne({ name: "Mon Club" })
// Dans subGroups[0] (Marketing):
{
  "responsableId": "bob-id",  // ✅ Reste Bob
  "memberRoles": {
    "alice-id": "MEMBRE_COMITE"  // ✅ Mis à jour
  }
}
```

---

## ✅ Test 3: Tentative de Changer Son Propre Rôle

### Étapes:
1. Connecté en tant que Bob (Responsable Marketing)
2. Dans la liste des membres du comité Marketing, trouvez Bob (vous-même)
3. Vérifiez la colonne "Rôle dans le comité"

### Résultat Attendu:
- ❌ Le dropdown n'apparaît PAS pour Bob
- ✅ Seul le badge "👑 Responsable" est affiché
- ❌ Bob ne peut pas changer son propre rôle

### Explication:
Le code vérifie:
```typescript
*ngIf="canManageSubGroupMembers(sg.id!) && memberId !== authService.getCurrentUser()?.userId"
```

---

## ✅ Test 4: Tentative de Changer un Rôle dans un Autre Comité

### Étapes:
1. Connecté en tant que Bob (Responsable Marketing)
2. Créez un autre comité "Technique" (en tant que PRESIDENT)
3. Assignez Charlie comme MEMBRE_COMITE du comité Technique
4. Reconnectez-vous avec le compte de Bob
5. Allez dans la liste des membres du comité Technique

### Résultat Attendu:
- ❌ Le dropdown de rôle n'apparaît PAS pour Charlie
- ✅ Seul le badge est affiché
- ❌ Bob ne peut pas changer les rôles dans le comité Technique

### Explication:
Le code vérifie:
```typescript
canManageSubGroupMembers(sg.id!)  // Retourne false pour le comité Technique
```

---

## ✅ Test 5: Validation du Changement de Rôle

### Étapes:
1. Connecté en tant que Bob (Responsable Marketing)
2. Changez le rôle d'Alice en "Responsable"
3. Vérifiez la console du navigateur (F12)

### Résultat Attendu:
```
Logs du service:
=== ASSIGN TO SUBGROUP SERVICE ===
SubGroupRole: RESPONSABLE
📋 Sous-groupe trouvé: Marketing
👤 Membre trouvé: Alice (rôle actuel: MEMBRE_SIMPLE)
✅ Membre assigné avec rôle comité: RESPONSABLE
✅ ResponsableId mis à jour: alice-id
🔍 Appel du service User pour mettre à jour le rôle...
✅ Rôle mis à jour dans le service User: Responsable Marketing
```

---

## 📊 Interface Utilisateur

### Pour le Responsable (Bob):

**Dans SON comité (Marketing):**
```
┌─────────────────────────────────────────────────────────────┐
│ Comité: Marketing                                           │
├──────────┬──────────────┬──────────────────────┬───────────┤
│ Nom      │ Rôle Club    │ Rôle Comité          │ Actions   │
├──────────┼──────────────┼──────────────────────┼───────────┤
│ Bob      │ MEMBRE_SIMPLE│ 👑 Responsable       │           │ ← Pas de dropdown
│ Alice    │ MEMBRE_SIMPLE│ [Dropdown ▼]         │ [Retirer] │ ← Dropdown visible
│          │              │ ├ 📋 Membre du comité│           │
│          │              │ └ 👑 Responsable     │           │
└──────────┴──────────────┴──────────────────────┴───────────┘
```

**Dans un autre comité (Technique):**
```
┌─────────────────────────────────────────────────────────────┐
│ Comité: Technique                                           │
├──────────┬──────────────┬──────────────────────────────────┤
│ Nom      │ Rôle Club    │ Rôle Comité                      │
├──────────┼──────────────┼──────────────────────────────────┤
│ Charlie  │ MEMBRE_SIMPLE│ 📋 Membre du comité              │ ← Pas de dropdown
└──────────┴──────────────┴──────────────────────────────────┘
```

---

## 🔍 Validations Implémentées

### 1. Ne peut pas changer son propre rôle
```typescript
if (userId === currentUserId) {
  alert('❌ Vous ne pouvez pas changer votre propre rôle');
  return;
}
```

### 2. Ne peut changer que dans SON comité
```typescript
if (subGroupId !== mySubGroupId) {
  alert('❌ Vous ne pouvez changer les rôles que dans votre propre comité');
  return;
}
```

### 3. Confirmation avant changement
```typescript
if (!confirm(`Voulez-vous ${action} ${member.name} en tant que ${newRoleLabel} ?`)) {
  return;
}
```

---

## ✅ Checklist de Validation

- [ ] Le dropdown de rôle apparaît pour les membres de SON comité
- [ ] Le dropdown de rôle n'apparaît PAS pour soi-même
- [ ] Le dropdown de rôle n'apparaît PAS dans les autres comités
- [ ] Peut promouvoir un membre en responsable
- [ ] Peut rétrograder un responsable en membre
- [ ] Le rôle est mis à jour dans la base de données
- [ ] Les permissions sont mises à jour après changement
- [ ] Message de confirmation affiché
- [ ] Validation empêche de changer son propre rôle
- [ ] Validation empêche de changer dans un autre comité

---

## 🎉 Résultat Final

Si tous les tests passent:
- ✅ Le responsable peut changer les rôles dans SON comité
- ✅ Le responsable ne peut PAS changer son propre rôle
- ✅ Le responsable ne peut PAS changer les rôles dans d'autres comités
- ✅ Les validations fonctionnent correctement
- ✅ L'interface s'adapte selon les permissions

La fonctionnalité de changement de rôle est complète! 🚀

# 🧪 Test Rapide - Responsable de Comité

## ✅ Permissions Finales

Le responsable de comité peut UNIQUEMENT:
1. ✅ Assigner des membres à SON comité
2. ✅ Retirer des membres de SON comité

Il NE PEUT PAS:
- ❌ Supprimer des membres du club
- ❌ Modifier des membres
- ❌ Créer/Modifier/Supprimer des comités
- ❌ Gérer d'autres comités

---

## 🚀 Démarrage Rapide

```powershell
# 1. Arrêter tous les services Java
Get-Process java* | Stop-Process -Force

# 2. Terminal 1 - Service User (8081)
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw clean spring-boot:run

# 3. Terminal 2 - Service Club (8083)
cd ClubHub
./mvnw clean spring-boot:run

# 4. Terminal 3 - Gateway (8084)
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw clean spring-boot:run

# 5. Terminal 4 - Frontend (4200)
cd Front
ng serve
```

---

## 🧪 Tests à Effectuer

### Test 1: Nommer un Responsable

1. Connectez-vous en tant que **PRESIDENT**
2. Allez sur la page du club
3. Cliquez "📌 Assigner un membre à un comité"
4. Sélectionnez un membre (ex: Ahmed)
5. Sélectionnez un comité (ex: Marketing)
6. Sélectionnez "Responsable"
7. Cliquez "Assigner"

**Résultat attendu:**
- ✅ Badge "👑 Responsable" en violet
- ✅ Rôle dans la base: "Responsable Marketing"

---

### Test 2: Connexion en tant que Responsable

1. Déconnectez-vous
2. Reconnectez-vous avec le compte d'Ahmed
3. Allez sur la page du club

**Résultat attendu:**
- ✅ Bouton "📌 Assigner un membre à un comité" visible
- ✅ Colonne "Actions" visible dans SON comité (Marketing)
- ❌ Bouton "Ajouter un membre" caché
- ❌ Bouton "Créer un comité" caché
- ❌ Boutons ✏️ cachés
- ❌ Boutons 🗑️ cachés (dans la liste des membres du club)

**Console du navigateur (F12):**
```
✅ Responsable de comité détecté: Responsable Marketing
📋 Permissions responsable de comité: Array(8)
  0: "VIEW_MEMBERS"
  1: "VIEW_SUBGROUPS"
  2: "VIEW_ELECTIONS"
  3: "VOTE_ELECTIONS"
  4: "VIEW_EVENTS"
  5: "VIEW_CLUB_INFO"
  6: "JOIN_VOICE_CHANNELS"
  7: "ASSIGN_TO_SUBGROUPS"
```

**Note:** Pas de "DELETE_MEMBERS" dans la liste!

---

### Test 3: Assigner un Membre à SON Comité ✅

1. Connecté en tant qu'Ahmed (Responsable Marketing)
2. Cliquez "📌 Assigner un membre à un comité"
3. Sélectionnez "Sara"
4. Dropdown "Comité" affiche UNIQUEMENT "Marketing (Mon comité)"
5. Dropdown "Rôle" affiche UNIQUEMENT "Membre"
6. Cliquez "Assigner"

**Résultat attendu:**
- ✅ Sara ajoutée au comité Marketing
- ✅ Badge "Membre" en gris

---

### Test 4: Retirer un Membre de SON Comité ✅

1. Connecté en tant qu'Ahmed (Responsable Marketing)
2. Allez dans la liste des membres du comité Marketing
3. Vérifiez que la colonne "Actions" est visible
4. Cliquez "Retirer" à côté de Sara
5. Confirmez

**Résultat attendu:**
- ✅ Sara retirée du comité Marketing
- ✅ Sara reste dans la liste des membres du club
- ✅ Message: "Membre retiré du comité"

---

### Test 5: Vérifier que le Bouton 🗑️ est Caché ❌

1. Connecté en tant qu'Ahmed (Responsable Marketing)
2. Allez dans la liste des membres du club
3. Vérifiez la colonne "Actions"

**Résultat attendu:**
- ❌ Aucun bouton 🗑️ visible (pour aucun membre)
- ❌ Ahmed ne peut PAS supprimer de membres du club

---

### Test 6: Vérifier les Autres Comités ❌

1. Connecté en tant qu'Ahmed (Responsable Marketing)
2. Allez dans la liste des membres du comité "Technique"

**Résultat attendu:**
- ❌ Colonne "Actions" cachée
- ❌ Aucun bouton "Retirer" visible
- ❌ Ahmed ne peut PAS retirer des membres d'autres comités

---

## ✅ Checklist de Validation

### Interface Responsable de Comité

**Boutons VISIBLES:**
- ✅ "📌 Assigner un membre à un comité"
- ✅ "Retirer" dans SON comité uniquement

**Boutons CACHÉS:**
- ❌ "Ajouter un membre" (au club)
- ❌ "Créer un comité"
- ❌ ✏️ (modifier membres)
- ❌ ✏️ (modifier comités)
- ❌ 🗑️ (supprimer membres du club)
- ❌ 🗑️ (supprimer comités)
- ❌ "Retirer" dans les autres comités

### Permissions Backend

**Permissions ACCORDÉES:**
- ✅ VIEW_MEMBERS
- ✅ VIEW_SUBGROUPS
- ✅ VIEW_ELECTIONS
- ✅ VOTE_ELECTIONS
- ✅ VIEW_EVENTS
- ✅ VIEW_CLUB_INFO
- ✅ JOIN_VOICE_CHANNELS
- ✅ ASSIGN_TO_SUBGROUPS

**Permissions NON ACCORDÉES:**
- ❌ ADD_MEMBERS
- ❌ EDIT_MEMBERS
- ❌ DELETE_MEMBERS
- ❌ CREATE_SUBGROUPS
- ❌ EDIT_SUBGROUPS
- ❌ DELETE_SUBGROUPS
- ❌ CREATE_ELECTIONS

---

## 📊 Vérification MongoDB

### Collection `users`

```javascript
db.users.findOne({ email: "ahmed@test.com" })
```

**Résultat attendu:**
```json
{
  "_id": "user123",
  "email": "ahmed@test.com",
  "role": "Responsable Marketing"  // ✅ Changé automatiquement
}
```

### Collection `clubs`

```javascript
db.clubs.findOne({ name: "Mon Club" })
```

**Dans le tableau `members`:**
```json
{
  "userId": "user123",
  "name": "Ahmed",
  "role": "MEMBRE_SIMPLE",
  "subGroupId": "marketing-id",
  "subGroupRole": "RESPONSABLE",
  "initialRole": "MEMBRE_SIMPLE"
}
```

---

## 🎯 Résumé des Tests

| Test | Action | Résultat Attendu |
|------|--------|------------------|
| 1 | Nommer responsable | ✅ Rôle change dans la base |
| 2 | Connexion responsable | ✅ Boutons conditionnels affichés |
| 3 | Assigner à SON comité | ✅ Membre ajouté |
| 4 | Retirer de SON comité | ✅ Membre retiré (reste dans le club) |
| 5 | Bouton 🗑️ | ❌ Caché pour tous les membres |
| 6 | Autres comités | ❌ Aucune action possible |

---

## ❌ Si Quelque Chose Ne Marche Pas

### Le bouton 🗑️ est visible
```
Problème: Le responsable voit le bouton supprimer
Solution: Vérifiez que DELETE_MEMBERS n'est PAS dans les permissions
```

### Le bouton "Retirer" n'apparaît pas
```
Problème: Le bouton "Retirer" est caché dans son comité
Solution: Vérifiez que ASSIGN_TO_SUBGROUPS est dans les permissions
```

### Peut retirer d'autres comités
```
Problème: Le responsable peut retirer des membres d'autres comités
Solution: Vérifiez la méthode canRemoveFromSubGroup()
```

---

## 🎉 Validation Finale

Si tous les tests passent:
- ✅ Le responsable peut assigner à SON comité
- ✅ Le responsable peut retirer de SON comité
- ❌ Le responsable ne peut PAS supprimer du club
- ❌ Le responsable ne peut PAS gérer d'autres comités

Tout est correct! 🚀

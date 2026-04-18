# 🧪 Test du Bug Fix - Élection de Responsable

## ✅ Services Actifs

- ✅ User Service: http://localhost:8081
- ✅ Club Service: http://localhost:8083 (avec correction élection)
- ✅ Gateway: http://localhost:8084
- ✅ Frontend: http://localhost:4200

---

## 🎯 Test Complet (10 minutes)

### Préparation: Créer le Club et les Membres

1. **Allez sur http://localhost:4200**
2. **Connectez-vous avec un compte PRESIDENT**
3. **Créez un club:**
   - Nom: "Test Élection"
   - Mode: "Plusieurs comités autorisés"

4. **Créez un comité "Event"**

5. **Ajoutez 3 membres:**
   - Alice (alice@test.com) - MEMBRE_SIMPLE
   - Bob (bob@test.com) - MEMBRE_SIMPLE
   - Charlie (charlie@test.com) - MEMBRE_SIMPLE

6. **Assignez Bob comme RESPONSABLE du comité "Event"**
   - Vérifiez que Bob apparaît comme "Responsable" dans le comité

---

### ÉTAPE 1: Vérifier l'État Initial dans MongoDB

Ouvrez MongoDB Compass et vérifiez:

#### Collection `clubs`

```javascript
db.clubs.findOne({ name: "Test Élection" })
```

**Vérifications:**
- `subGroups[0].name` = "Event"
- `subGroups[0].responsableId` = userId de Bob ✅
- `subGroups[0].memberRoles[userId-bob]` = "RESPONSABLE" ✅
- `members` → Bob a `subGroupRole: "RESPONSABLE"` ✅
- `members` → Bob a `role: "Responsable Event"` ✅

#### Collection `users`

```javascript
db.users.findOne({ email: "bob@test.com" })
```

**Vérifications:**
- `role` = "Responsable Event" ✅

---

### ÉTAPE 2: Créer une Élection de Bureau

1. **Dans le club, créez une nouvelle élection:**
   - Type: Élection de Bureau
   - Titre: "Élection Responsable Event"
   - Date début: Aujourd'hui
   - Date fin: Demain
   - Position: "Responsable Event"

2. **Ajoutez les candidats:**
   - Alice → Comité "Event"
   - Charlie → Comité "Event"

3. **Validez les candidatures** (en tant que PRESIDENT)

4. **Démarrez l'élection**

---

### ÉTAPE 3: Voter

1. **Connectez-vous avec différents comptes et votez:**
   - 5 votes pour Alice
   - 3 votes pour Charlie

2. **Clôturez l'élection**

**Résultat attendu:** Alice gagne avec 5 votes

---

### ÉTAPE 4: Vérifier les Mises à Jour (LE TEST CRITIQUE)

#### A. Vérifier dans l'Interface

1. **Allez sur la page du club**
2. **Ouvrez le comité "Event"**

**Vérifications:**
- ✅ Alice apparaît comme "Responsable"
- ✅ Bob apparaît comme "Membre du comité"
- ✅ Charlie apparaît comme "Membre du comité"

#### B. Vérifier dans MongoDB - Collection `clubs`

```javascript
db.clubs.findOne({ name: "Test Élection" })
```

**Vérifications CRITIQUES (c'était le bug):**

1. **SubGroup responsableId:**
   ```json
   {
     "subGroups": [
       {
         "name": "Event",
         "responsableId": "userId-alice"  // ✅ DOIT être Alice maintenant
       }
     ]
   }
   ```

2. **SubGroup memberRoles:**
   ```json
   {
     "subGroups": [
       {
         "memberRoles": {
           "userId-alice": "RESPONSABLE",      // ✅ NOUVEAU
           "userId-bob": "MEMBRE_COMITE",      // ✅ NOUVEAU (était RESPONSABLE)
           "userId-charlie": "MEMBRE_COMITE"
         }
       }
     ]
   }
   ```

3. **Members subGroupRole:**
   ```json
   {
     "members": [
       {
         "userId": "userId-alice",
         "subGroupRole": "RESPONSABLE",  // ✅ NOUVEAU
         "role": "Responsable Event"     // ✅ NOUVEAU
       },
       {
         "userId": "userId-bob",
         "subGroupRole": "MEMBRE_COMITE", // ✅ NOUVEAU (était RESPONSABLE)
         "role": "MEMBRE_SIMPLE"          // ✅ NOUVEAU (rôle initial restauré)
       }
     ]
   }
   ```

#### C. Vérifier dans MongoDB - Collection `users`

```javascript
db.users.findOne({ email: "alice@test.com" })
```

**Vérification CRITIQUE:**
```json
{
  "email": "alice@test.com",
  "role": "Responsable Event"  // ✅ NOUVEAU (c'était le bug principal)
}
```

```javascript
db.users.findOne({ email: "bob@test.com" })
```

**Vérification CRITIQUE:**
```json
{
  "email": "bob@test.com",
  "role": "MEMBRE_SIMPLE"  // ✅ NOUVEAU (rôle initial restauré)
}
```

---

### ÉTAPE 5: Vérifier les Permissions (LE TEST FINAL)

#### Test A: Alice a les Permissions de Responsable

1. **Connectez-vous avec le compte d'Alice**
2. **Allez sur la page du club**
3. **Ouvrez le comité "Event"**

**Vérifications:**
- ✅ Alice peut voir le bouton "Assigner à un comité"
- ✅ Alice peut assigner un nouveau membre au comité
- ✅ Alice peut retirer un membre du comité
- ✅ Alice peut changer le rôle d'un membre dans le comité

#### Test B: Bob n'a PLUS les Permissions de Responsable

1. **Connectez-vous avec le compte de Bob**
2. **Allez sur la page du club**
3. **Ouvrez le comité "Event"**

**Vérifications:**
- ✅ Bob ne voit PAS le bouton "Assigner à un comité"
- ✅ Bob ne peut PAS retirer un membre du comité
- ✅ Bob ne peut PAS changer le rôle d'un membre dans le comité
- ✅ Bob apparaît comme simple membre du comité

---

## 📊 Tableau de Vérification

| Vérification | Avant (Bugué) | Après (Corrigé) | Status |
|--------------|---------------|-----------------|--------|
| Interface - Alice "Responsable" | ✅ | ✅ | ☐ |
| Interface - Bob "Membre" | ✅ | ✅ | ☐ |
| `clubs.subGroups.responsableId` | ❌ Bob | ✅ Alice | ☐ |
| `clubs.subGroups.memberRoles[alice]` | ❌ Pas mis à jour | ✅ "RESPONSABLE" | ☐ |
| `clubs.subGroups.memberRoles[bob]` | ❌ Pas mis à jour | ✅ "MEMBRE_COMITE" | ☐ |
| `clubs.members` - Alice role | ❌ "MEMBRE_SIMPLE" | ✅ "Responsable Event" | ☐ |
| `clubs.members` - Bob role | ❌ "Responsable Event" | ✅ "MEMBRE_SIMPLE" | ☐ |
| `users` - Alice role | ❌ "MEMBRE_SIMPLE" | ✅ "Responsable Event" | ☐ |
| `users` - Bob role | ❌ "Responsable Event" | ✅ "MEMBRE_SIMPLE" | ☐ |
| Permissions - Alice peut gérer | ❌ Non | ✅ Oui | ☐ |
| Permissions - Bob ne peut plus gérer | ❌ Peut encore | ✅ Ne peut plus | ☐ |

---

## 🔍 Commandes MongoDB Utiles

### Voir Tous les Champs Importants

```javascript
db.clubs.findOne(
  { name: "Test Élection" },
  {
    "subGroups.name": 1,
    "subGroups.responsableId": 1,
    "subGroups.memberRoles": 1,
    "members.name": 1,
    "members.userId": 1,
    "members.role": 1,
    "members.subGroupRole": 1
  }
)
```

### Voir les Rôles de Tous les Utilisateurs

```javascript
db.users.find(
  { email: { $in: ["alice@test.com", "bob@test.com", "charlie@test.com"] } },
  { email: 1, role: 1 }
)
```

---

## 🐛 Si le Bug Persiste

Si après l'élection, vous constatez que:
- Alice n'a PAS le rôle "Responsable Event" dans la collection `users`
- Bob garde le rôle "Responsable Event" dans la collection `users`
- `subGroups.responsableId` n'est PAS mis à jour

**Alors le bug n'est PAS corrigé.**

### Vérifier les Logs

Regardez les logs du Club Service:

```powershell
# Dans le terminal où le Club Service tourne
# Cherchez ces messages après la clôture de l'élection:
```

**Logs attendus:**
```
🏆 Comité 'Event' → gagnant: userId-alice
  🔄 Ancien responsable Bob → MEMBRE_COMITE
  🔄 Rôle restauré: MEMBRE_SIMPLE
  ✅ Rôle restauré dans User Service: MEMBRE_SIMPLE
  📝 Rôle initial sauvegardé: MEMBRE_SIMPLE
  ✅ Alice → RESPONSABLE Event
  ✅ Rôle mis à jour dans User Service: Responsable Event
  📡 Réponse: 200 OK
  ✅ SubGroup mis à jour: responsableId=userId-alice
✅ Rôles bureau mis à jour dans la base de données
```

Si vous voyez des erreurs comme:
```
❌ Erreur mise à jour User Service: ...
```

Alors il y a un problème de communication entre Club Service et User Service.

---

## ✅ Conclusion

Si tous les tests passent:

- ✅ Le gagnant devient RESPONSABLE dans toutes les bases de données
- ✅ Le gagnant a les permissions de responsable
- ✅ L'ancien responsable perd ses permissions
- ✅ L'ancien responsable retrouve son rôle initial
- ✅ L'interface et le backend sont synchronisés

**Le bug critique est corrigé! 🎉**

# 🧪 Test de la RÈGLE 3 - Responsable Exclusif

## ✅ Services Actifs

- ✅ User Service: http://localhost:8081
- ✅ Club Service: http://localhost:8083 (avec RÈGLE 3)
- ✅ Gateway: http://localhost:8084
- ✅ Frontend: http://localhost:4200 (avec RÈGLE 3)

---

## 🎯 Test Rapide (3 minutes)

### Étape 1: Créer un Club en Mode MULTIPLE_ALLOWED

1. Allez sur **http://localhost:4200**
2. Connectez-vous avec un compte PRESIDENT
3. Créez un nouveau club:
   - Nom: "Test Responsable Exclusif"
   - Description: "Test de la RÈGLE 3"
   - **Mode:** Sélectionnez "Plusieurs comités autorisés"

### Étape 2: Créer 2 Comités

1. Dans le club, créez 2 comités:
   - Comité 1: "Event"
   - Comité 2: "Media"

### Étape 3: Ajouter 2 Membres

1. Ajoutez Alice:
   - Prénom: Alice
   - Nom: Test
   - Email: alice.test@example.com
   - Rôle: MEMBRE_SIMPLE

2. Ajoutez Bob:
   - Prénom: Bob
   - Nom: Test
   - Email: bob.test@example.com
   - Rôle: MEMBRE_SIMPLE

---

## 🧪 Tests

### Test A: Membre Simple dans Plusieurs Comités (doit réussir)

1. Assignez Alice au comité "Event" comme **MEMBRE_COMITE**
2. Assignez Alice au comité "Media" comme **MEMBRE_COMITE**

**✅ Résultat attendu:** Succès - Alice est dans 2 comités

**Vérification:**
- Alice apparaît dans la liste des membres du comité "Event"
- Alice apparaît dans la liste des membres du comité "Media"

---

### Test B: Responsable dans Plusieurs Comités (doit échouer - RÈGLE 3)

1. Assignez Bob au comité "Event" comme **RESPONSABLE**

**✅ Résultat attendu:** Succès - Bob est RESPONSABLE de "Event"

2. Essayez d'assigner Bob au comité "Media" comme **MEMBRE_COMITE**

**❌ Résultat attendu:** Erreur avec le message:

```
❌ Un responsable de comité ne peut appartenir qu'à son propre comité.

Ce membre est responsable du comité "Event".

Pour rejoindre un autre comité, il doit d'abord quitter son rôle de responsable.
```

**🎉 Si vous voyez ce message, la RÈGLE 3 fonctionne!**

---

### Test C: Responsable Devient Membre Simple puis Rejoint Autre Comité (doit réussir)

1. Dans le comité "Event", trouvez Bob (qui est RESPONSABLE)
2. Changez son rôle de **RESPONSABLE** → **MEMBRE_COMITE**

**✅ Résultat attendu:** Succès - Bob est maintenant MEMBRE_COMITE de "Event"

3. Assignez Bob au comité "Media" comme **MEMBRE_COMITE**

**✅ Résultat attendu:** Succès - Bob est maintenant dans 2 comités

**Vérification:**
- Bob apparaît dans "Event" avec le rôle MEMBRE_COMITE
- Bob apparaît dans "Media" avec le rôle MEMBRE_COMITE

---

### Test D: Double Responsabilité (doit échouer - RÈGLE 2)

1. Ajoutez Charlie:
   - Prénom: Charlie
   - Nom: Test
   - Email: charlie.test@example.com

2. Assignez Charlie au comité "Event" comme **RESPONSABLE**

**✅ Résultat attendu:** Succès

3. Essayez d'assigner Charlie au comité "Media" comme **RESPONSABLE**

**❌ Résultat attendu:** Erreur avec le message:

```
❌ Un membre ne peut être RESPONSABLE que d'UN SEUL comité.

Ce membre est déjà responsable du comité "Event".

Il peut rejoindre ce comité en tant que MEMBRE_COMITE.
```

---

## 📊 Tableau de Vérification

| Test | Action | Résultat Attendu | Status |
|------|--------|------------------|--------|
| A | MEMBRE_COMITE → 2 comités | ✅ Succès | ☐ |
| B | RESPONSABLE → 2ème comité (comme membre) | ❌ Erreur (RÈGLE 3) | ☐ |
| C | RESPONSABLE → MEMBRE → 2ème comité | ✅ Succès | ☐ |
| D | RESPONSABLE → 2ème comité (comme responsable) | ❌ Erreur (RÈGLE 2) | ☐ |

---

## 🎨 Vérification Visuelle

### Sur la Page du Club

Vous devriez voir une section colorée en vert:

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Règle d'appartenance aux comités                     │
│                                                          │
│ Plusieurs comités autorisés                             │
│                                                          │
│ • Un membre peut appartenir à plusieurs comités         │
│ • Un membre ne peut être RESPONSABLE que d'UN SEUL      │
│   comité                                                 │
│ • Un RESPONSABLE ne peut appartenir qu'à son propre     │
│   comité                                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Vérification dans MongoDB

Pour vérifier que tout fonctionne:

```powershell
.\check-mongodb.ps1
```

Ou dans MongoDB Compass:

### Vérifier le Responsable

```javascript
// Collection: clubs
db.clubs.findOne({ name: "Test Responsable Exclusif" })
```

Cherchez dans `subGroups`:
```json
{
  "subGroups": [
    {
      "id": "...",
      "name": "Event",
      "responsableId": "userId-bob",
      "memberIds": ["userId-bob"],
      "memberRoles": {
        "userId-bob": "RESPONSABLE"
      }
    }
  ]
}
```

### Vérifier le Rôle dans Users

```javascript
// Collection: users
db.users.findOne({ email: "bob.test@example.com" })
```

Si Bob est RESPONSABLE de "Event":
```json
{
  "role": "Responsable Event"
}
```

---

## 📋 Résumé des 3 Règles

### Mode MULTIPLE_ALLOWED

1. **RÈGLE 1:** Un membre simple peut appartenir à plusieurs comités ✅
2. **RÈGLE 2:** Un membre ne peut être RESPONSABLE que d'UN SEUL comité ✅
3. **RÈGLE 3:** Un RESPONSABLE ne peut appartenir qu'à SON comité ✅

### Mode SINGLE_ONLY

- Un membre ne peut appartenir qu'à UN SEUL comité (peu importe le rôle) ✅

---

## ✅ Conclusion

Si tous les tests passent:

- ✅ Les membres simples peuvent être dans plusieurs comités
- ✅ Les responsables ne peuvent être que dans LEUR comité
- ✅ Un membre ne peut être responsable que d'UN comité
- ✅ Les messages d'erreur sont clairs et explicites

**Le système est maintenant cohérent et évite les conflits de rôles! 🎉**

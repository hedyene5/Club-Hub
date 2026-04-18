# 🧪 Test du Bug Fix - Élection avec Plusieurs Comités

## ✅ Services Actifs

- ✅ User Service: http://localhost:8081
- ✅ Club Service: http://localhost:8083 (avec correction)
- ✅ Gateway: http://localhost:8084
- ✅ Frontend: http://localhost:4200

---

## 🎯 Test Rapide (5 minutes)

### ÉTAPE 1: Créer le Club et les Comités

1. **Allez sur http://localhost:4200**
2. **Connectez-vous avec un compte PRESIDENT**
3. **Créez un club:**
   - Nom: "Test Élection Multiple"
   - Mode: **"Plusieurs comités autorisés"** (IMPORTANT)

4. **Créez 3 comités:**
   - "Event"
   - "Media"
   - "Technique"

---

### ÉTAPE 2: Ajouter les Membres

1. **Ajoutez 3 membres:**
   - Alice (alice@test.com) - MEMBRE_SIMPLE
   - Bob (bob@test.com) - MEMBRE_SIMPLE
   - Charlie (charlie@test.com) - MEMBRE_SIMPLE

---

### ÉTAPE 3: Assigner Alice à Plusieurs Comités

1. **Assignez Alice au comité "Event" comme MEMBRE_COMITE**
2. **Assignez Alice au comité "Media" comme MEMBRE_COMITE**
3. **Assignez Alice au comité "Technique" comme MEMBRE_COMITE**

**Vérification:**
- ✅ Alice apparaît dans les 3 comités
- ✅ Alice a le rôle "Membre du comité" dans chaque comité

---

### ÉTAPE 4: Vérifier dans MongoDB (État Initial)

```javascript
db.clubs.findOne({ name: "Test Élection Multiple" })
```

**Vérifications:**

```json
{
  "subGroups": [
    {
      "name": "Event",
      "memberIds": ["userId-alice", ...],  // ✅ Alice est dedans
      "memberRoles": {
        "userId-alice": "MEMBRE_COMITE"    // ✅
      }
    },
    {
      "name": "Media",
      "memberIds": ["userId-alice", ...],  // ✅ Alice est dedans
      "memberRoles": {
        "userId-alice": "MEMBRE_COMITE"    // ✅
      }
    },
    {
      "name": "Technique",
      "memberIds": ["userId-alice", ...],  // ✅ Alice est dedans
      "memberRoles": {
        "userId-alice": "MEMBRE_COMITE"    // ✅
      }
    }
  ]
}
```

---

### ÉTAPE 5: Créer et Clôturer l'Élection

1. **Créez une élection de bureau pour "Event":**
   - Type: Élection de Bureau
   - Position: "Responsable Event"
   - Candidats: Alice, Bob

2. **Validez les candidatures**

3. **Démarrez l'élection**

4. **Votez:**
   - 5 votes pour Alice
   - 3 votes pour Bob

5. **Clôturez l'élection**

**Résultat:** Alice gagne

---

### ÉTAPE 6: Vérifier le Résultat (LE TEST CRITIQUE)

#### A. Vérifier dans l'Interface

1. **Comité "Event":**
   - ✅ Alice apparaît comme "Responsable"

2. **Comité "Media":**
   - ✅ Alice n'apparaît PLUS dans la liste des membres (c'était le bug)

3. **Comité "Technique":**
   - ✅ Alice n'apparaît PLUS dans la liste des membres (c'était le bug)

#### B. Vérifier dans MongoDB

```javascript
db.clubs.findOne({ name: "Test Élection Multiple" })
```

**Vérifications CRITIQUES:**

1. **Comité "Event" - Alice est responsable:**
   ```json
   {
     "subGroups": [
       {
         "name": "Event",
         "responsableId": "userId-alice",  // ✅
         "memberIds": ["userId-alice"],     // ✅ Alice est dedans
         "memberRoles": {
           "userId-alice": "RESPONSABLE"    // ✅
         }
       }
     ]
   }
   ```

2. **Comité "Media" - Alice n'est PLUS dedans:**
   ```json
   {
     "subGroups": [
       {
         "name": "Media",
         "responsableId": null,
         "memberIds": [],  // ✅ Alice n'est PLUS dedans (FIX)
         "memberRoles": {} // ✅ Alice n'est PLUS dedans (FIX)
       }
     ]
   }
   ```

3. **Comité "Technique" - Alice n'est PLUS dedans:**
   ```json
   {
     "subGroups": [
       {
         "name": "Technique",
         "responsableId": null,
         "memberIds": [],  // ✅ Alice n'est PLUS dedans (FIX)
         "memberRoles": {} // ✅ Alice n'est PLUS dedans (FIX)
       }
     ]
   }
   ```

4. **Member Alice - Seulement dans Event:**
   ```json
   {
     "members": [
       {
         "userId": "userId-alice",
         "subGroupId": "id-event",      // ✅ Seulement Event
         "subGroupRole": "RESPONSABLE", // ✅
         "role": "Responsable Event"    // ✅
       }
     ]
   }
   ```

---

## 📊 Tableau de Vérification

| Vérification | Avant (Bugué) | Après (Corrigé) | Status |
|--------------|---------------|-----------------|--------|
| Interface - Alice dans Event | ✅ "Responsable" | ✅ "Responsable" | ☐ |
| Interface - Alice dans Media | ❌ "Responsable" (incohérence) | ✅ Pas dans la liste | ☐ |
| Interface - Alice dans Technique | ❌ "Responsable" (incohérence) | ✅ Pas dans la liste | ☐ |
| MongoDB - Event.memberIds | ✅ Alice dedans | ✅ Alice dedans | ☐ |
| MongoDB - Media.memberIds | ❌ Alice dedans (BUG) | ✅ Alice absente | ☐ |
| MongoDB - Technique.memberIds | ❌ Alice dedans (BUG) | ✅ Alice absente | ☐ |
| MongoDB - Event.memberRoles[alice] | ✅ "RESPONSABLE" | ✅ "RESPONSABLE" | ☐ |
| MongoDB - Media.memberRoles[alice] | ❌ "MEMBRE_COMITE" (BUG) | ✅ Absent | ☐ |
| MongoDB - Technique.memberRoles[alice] | ❌ "MEMBRE_COMITE" (BUG) | ✅ Absent | ☐ |

---

## 🔍 Logs à Vérifier

Après avoir clôturé l'élection, regardez les logs du Club Service:

**Logs attendus:**
```
🏆 Comité 'Event' → gagnant: userId-alice
  🔄 Ancien responsable ... → MEMBRE_COMITE
  🔍 Vérification des autres comités pour le gagnant...
  🔄 Gagnant retiré du comité 'Media' (memberIds)
  🔄 Gagnant retiré du comité 'Media' (memberRoles)
  🔄 Gagnant retiré du comité 'Technique' (memberIds)
  🔄 Gagnant retiré du comité 'Technique' (memberRoles)
  📝 Rôle initial sauvegardé: MEMBRE_SIMPLE
  ✅ Alice → RESPONSABLE Event
  ✅ Rôle mis à jour dans User Service: Responsable Event
  📡 Réponse: 200 OK
  ✅ SubGroup mis à jour: responsableId=userId-alice
✅ Rôles bureau mis à jour dans la base de données
```

**Si vous voyez ces logs, le fix fonctionne! 🎉**

---

## 🧪 Test Avancé: Responsable d'un Autre Comité

### Scénario

1. **Assignez Bob comme RESPONSABLE du comité "Media"**
2. **Assignez Bob au comité "Technique" comme MEMBRE_COMITE**
3. **Créez une élection pour "Technique"**
4. **Bob gagne l'élection**

### Résultat Attendu

- ✅ Bob devient RESPONSABLE de "Technique"
- ✅ Bob n'est PLUS responsable de "Media"
- ✅ Bob n'est PLUS dans "Media" du tout
- ✅ "Media" n'a plus de responsable (`responsableId: null`)

### Vérification MongoDB

```javascript
db.clubs.findOne({ name: "Test Élection Multiple" })
```

**Comité "Media":**
```json
{
  "name": "Media",
  "responsableId": null,  // ✅ Bob n'est plus responsable
  "memberIds": [],        // ✅ Bob n'est plus dedans
  "memberRoles": {}       // ✅ Bob n'est plus dedans
}
```

**Comité "Technique":**
```json
{
  "name": "Technique",
  "responsableId": "userId-bob",  // ✅ Bob est responsable
  "memberIds": ["userId-bob"],     // ✅ Bob est dedans
  "memberRoles": {
    "userId-bob": "RESPONSABLE"    // ✅
  }
}
```

---

## ✅ Conclusion

Si tous les tests passent:

- ✅ Le gagnant devient RESPONSABLE de SON comité
- ✅ Le gagnant est automatiquement retiré de TOUS les autres comités
- ✅ Plus d'incohérence d'affichage
- ✅ Plus de confusion sur les permissions
- ✅ Respect de la RÈGLE 3: Un responsable = un seul comité

**Le bug est corrigé! 🎉**

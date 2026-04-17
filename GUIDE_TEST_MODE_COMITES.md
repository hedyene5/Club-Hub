# 🧪 Guide de Test: Mode d'Appartenance aux Comités

## 📋 Prérequis

- ✅ User Service démarré (port 8081)
- ✅ Club Service démarré (port 8083)
- ✅ Gateway démarré (port 8084)
- ✅ Frontend démarré (port 4200)
- ✅ MongoDB en cours d'exécution

---

## 🎯 Test 1: Mode MULTIPLE_ALLOWED (Par défaut)

### Étape 1: Vérifier le mode actuel du club

**Ouvrez MongoDB Compass ou le shell MongoDB:**

```javascript
// Connectez-vous à MongoDB
mongo

// Utilisez la base de données
use clubhub

// Trouvez votre club
db.clubs.findOne({ name: "enactus" })
```

**Vérifiez le champ `rules.committeeMembershipMode`:**
- Si absent ou `null` → Mode par défaut = `MULTIPLE_ALLOWED`
- Si `"MULTIPLE_ALLOWED"` → Mode multiple comités
- Si `"SINGLE_ONLY"` → Mode un seul comité

---

### Étape 2: Tester l'assignation multiple (Mode MULTIPLE_ALLOWED)

**Dans l'interface web:**

1. Connectez-vous en tant que **PRESIDENT**
2. Allez sur la page du club "enactus"
3. Cliquez sur "📌 Assigner un membre à un comité"

**Première assignation:**
- Membre: Sélectionnez "membre 1"
- Comité: Sélectionnez "media"
- Rôle: Sélectionnez "📋 Membre du comité"
- Cliquez sur "Assigner"

**Résultat attendu:**
```
✅ Membre assigné au comité
```

**Deuxième assignation (même membre, autre comité):**
- Membre: Sélectionnez "membre 1" (le même)
- Comité: Sélectionnez un autre comité (ex: "technique")
- Rôle: Sélectionnez "📋 Membre du comité"
- Cliquez sur "Assigner"

**Résultat attendu:**
```
✅ Membre assigné au comité
```

**✅ SUCCÈS:** Le membre peut être dans plusieurs comités!

---

## 🔒 Test 2: Mode SINGLE_ONLY

### Étape 1: Changer le mode du club en SINGLE_ONLY

**Option A: Via MongoDB Compass**

1. Ouvrez MongoDB Compass
2. Connectez-vous à `mongodb://localhost:27017`
3. Base de données: `clubhub`
4. Collection: `clubs`
5. Trouvez votre club (ex: "enactus")
6. Cliquez sur "Edit Document"
7. Ajoutez ou modifiez le champ:
   ```json
   "rules": {
     "about": "...",
     "rules": [...],
     "requiresApproval": true,
     "committeeMembershipMode": "SINGLE_ONLY"
   }
   ```
8. Cliquez sur "Update"

**Option B: Via MongoDB Shell**

```javascript
// Connectez-vous à MongoDB
mongo

// Utilisez la base de données
use clubhub

// Mettez à jour le club
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "SINGLE_ONLY" } }
)

// Vérifiez la modification
db.clubs.findOne({ name: "enactus" }, { "rules.committeeMembershipMode": 1 })
```

**Résultat attendu:**
```json
{
  "_id": "...",
  "rules": {
    "committeeMembershipMode": "SINGLE_ONLY"
  }
}
```

---

### Étape 2: Préparer un membre sans comité

**Assurez-vous qu'un membre n'est dans aucun comité:**

**Via MongoDB:**
```javascript
// Vérifier les membres du club
db.clubs.findOne(
  { name: "enactus" },
  { "members": 1 }
)

// Si un membre est déjà dans un comité, le retirer
// (Remplacez les IDs par les vôtres)
db.clubs.updateOne(
  { name: "enactus", "members.userId": "69dd7119dbb981a3a0e802de" },
  { 
    $set: { 
      "members.$.subGroupId": null,
      "members.$.subGroupRole": null
    }
  }
)

// Retirer aussi de la liste memberIds du comité
db.clubs.updateOne(
  { name: "enactus" },
  { 
    $pull: { 
      "subGroups.$[].memberIds": "69dd7119dbb981a3a0e802de"
    }
  }
)
```

**Ou via l'interface:**
1. Allez dans le comité où le membre est présent
2. Cliquez sur "Retirer" à côté du membre

---

### Étape 3: Tester l'assignation en mode SINGLE_ONLY

**Rechargez la page du club dans le navigateur (F5)**

**Première assignation:**
1. Cliquez sur "📌 Assigner un membre à un comité"
2. Membre: Sélectionnez "membre 1"
3. Comité: Sélectionnez "media"
4. Rôle: Sélectionnez "📋 Membre du comité"
5. Cliquez sur "Assigner"

**Résultat attendu:**
```
✅ Membre assigné au comité
```

**Vérifiez que le membre est bien dans le comité "media"**

---

### Étape 4: Tenter une deuxième assignation (doit échouer)

**Deuxième assignation (même membre, autre comité):**
1. Cliquez sur "📌 Assigner un membre à un comité"
2. Membre: Sélectionnez "membre 1" (le même)
3. Comité: Sélectionnez un autre comité (ex: "technique")
4. Rôle: Sélectionnez "📋 Membre du comité"
5. Cliquez sur "Assigner"

**Résultat attendu (ALERTE):**
```
❌ Ce club n'autorise qu'un seul comité par membre.

Le membre est déjà dans le comité "media".

Veuillez d'abord le retirer de ce comité.
```

**✅ SUCCÈS:** Le système empêche l'assignation multiple!

---

### Étape 5: Vérifier les logs du backend

**Dans le terminal du Club Service, vous devriez voir:**

```
=== ASSIGN TO SUBGROUP SERVICE ===
UserId: 69dd7119dbb981a3a0e802de
SubGroupId: technique-id
📋 Mode d'appartenance aux comités: SINGLE_ONLY
❌ Mode SINGLE_ONLY: Le membre est déjà dans le comité 'media'
```

---

### Étape 6: Changer un membre de comité (mode SINGLE_ONLY)

**Pour changer un membre de comité en mode SINGLE_ONLY:**

1. **Retirer du comité actuel:**
   - Allez dans le comité "media"
   - Cliquez sur "Retirer" à côté de "membre 1"
   - Confirmez

2. **Assigner au nouveau comité:**
   - Cliquez sur "📌 Assigner un membre à un comité"
   - Membre: Sélectionnez "membre 1"
   - Comité: Sélectionnez "technique"
   - Rôle: Sélectionnez "📋 Membre du comité"
   - Cliquez sur "Assigner"

**Résultat attendu:**
```
✅ Membre assigné au comité
```

**✅ SUCCÈS:** Le membre est maintenant dans le comité "technique"!

---

## 🔄 Test 3: Retour au Mode MULTIPLE_ALLOWED

### Étape 1: Changer le mode

**Via MongoDB:**
```javascript
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "MULTIPLE_ALLOWED" } }
)
```

### Étape 2: Tester l'assignation multiple

**Rechargez la page (F5)**

1. Assignez "membre 1" au comité "media"
2. Assignez "membre 1" au comité "technique"

**Résultat attendu:**
```
✅ Membre assigné au comité (les deux fois)
```

**✅ SUCCÈS:** Le membre peut à nouveau être dans plusieurs comités!

---

## 📊 Vérification dans MongoDB

### Vérifier le mode du club

```javascript
db.clubs.findOne(
  { name: "enactus" },
  { "rules.committeeMembershipMode": 1 }
)
```

**Résultat:**
```json
{
  "_id": "69dd71081e564f2fc24aafdb",
  "rules": {
    "committeeMembershipMode": "SINGLE_ONLY"  // ou "MULTIPLE_ALLOWED"
  }
}
```

---

### Vérifier les comités d'un membre

```javascript
db.clubs.findOne(
  { name: "enactus" },
  { 
    "members": { 
      $elemMatch: { userId: "69dd7119dbb981a3a0e802de" } 
    },
    "subGroups": 1
  }
)
```

**Résultat (mode SINGLE_ONLY):**
```json
{
  "members": [
    {
      "userId": "69dd7119dbb981a3a0e802de",
      "name": "membre 1",
      "subGroupId": "media-id",  // ✅ Un seul comité
      "subGroupRole": "MEMBRE_COMITE"
    }
  ]
}
```

**Résultat (mode MULTIPLE_ALLOWED):**
```json
{
  "members": [
    {
      "userId": "69dd7119dbb981a3a0e802de",
      "name": "membre 1",
      "subGroupId": "media-id",  // ⚠️ Seulement le dernier comité assigné
      "subGroupRole": "MEMBRE_COMITE"
    }
  ],
  "subGroups": [
    {
      "id": "media-id",
      "name": "media",
      "memberIds": ["69dd7119dbb981a3a0e802de"]  // ✅ Présent
    },
    {
      "id": "technique-id",
      "name": "technique",
      "memberIds": ["69dd7119dbb981a3a0e802de"]  // ✅ Présent aussi
    }
  ]
}
```

---

## 🐛 Dépannage

### Problème 1: Le message d'erreur n'apparaît pas

**Cause:** Le Club Service n'a pas été redémarré

**Solution:**
```bash
cd ClubHub
./mvnw spring-boot:run
```

---

### Problème 2: Le mode ne change pas

**Cause:** Le champ n'est pas correctement mis à jour dans MongoDB

**Solution:**
```javascript
// Vérifier la structure exacte
db.clubs.findOne({ name: "enactus" })

// Mettre à jour avec la bonne structure
db.clubs.updateOne(
  { name: "enactus" },
  { 
    $set: { 
      "rules": {
        "about": "Bienvenue",
        "rules": [],
        "requiresApproval": true,
        "committeeMembershipMode": "SINGLE_ONLY"
      }
    }
  }
)
```

---

### Problème 3: L'assignation fonctionne malgré le mode SINGLE_ONLY

**Cause:** Le frontend n'a pas été rechargé

**Solution:**
1. Rechargez la page (F5)
2. Videz le cache (Ctrl+Shift+R)
3. Vérifiez dans la console du navigateur (F12):
   ```javascript
   console.log(this.club.rules?.committeeMembershipMode)
   ```

---

## ✅ Checklist de Test

### Mode MULTIPLE_ALLOWED
- [ ] Membre peut être assigné au comité "media"
- [ ] Même membre peut être assigné au comité "technique"
- [ ] Membre apparaît dans les deux comités
- [ ] Aucune erreur affichée

### Mode SINGLE_ONLY
- [ ] Mode changé dans MongoDB
- [ ] Page rechargée (F5)
- [ ] Membre assigné au comité "media"
- [ ] Tentative d'assignation au comité "technique" échoue
- [ ] Message d'erreur affiché: "Ce club n'autorise qu'un seul comité..."
- [ ] Logs backend affichent: "Mode SINGLE_ONLY"
- [ ] Après retrait de "media", assignation à "technique" fonctionne

---

## 🎉 Résultat Final

Si tous les tests passent:

✅ Mode MULTIPLE_ALLOWED permet plusieurs comités
✅ Mode SINGLE_ONLY empêche plusieurs comités
✅ Messages d'erreur clairs
✅ Validation frontend et backend
✅ Changement de comité possible après retrait

La fonctionnalité fonctionne correctement! 🚀

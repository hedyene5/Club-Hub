# 🧪 Guide de Test Simple - Mode d'Appartenance aux Comités

## 🎯 Ce que vous allez tester

Vous allez tester si un club peut choisir entre:
- **Mode 1**: Un membre peut être dans PLUSIEURS comités à la fois
- **Mode 2**: Un membre peut être dans UN SEUL comité à la fois

---

## ✅ Étape 1: Vérifier que tous les services sont démarrés

```powershell
netstat -ano | findstr ":8081 :8083 :8084 :4200"
```

**Vous devez voir:**
- `8081` → User Service ✅
- `8083` → Club Service ✅
- `8084` → Gateway (si pas démarré, voir ci-dessous)
- `4200` → Frontend (si pas démarré, voir ci-dessous)

### Si Gateway n'est pas démarré:
```powershell
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw spring-boot:run
```

### Si Frontend n'est pas démarré:
```powershell
cd Club-Hub-Voice-Channel-Management/User/Front
npm start
```

---

## 🧪 TEST 1: Mode PLUSIEURS COMITÉS (MULTIPLE_ALLOWED)

### Étape 1.1: Configurer le club en mode "plusieurs comités"

**Ouvrez MongoDB Compass:**
1. Connectez-vous à `mongodb://localhost:27017`
2. Base de données: `clubhub`
3. Collection: `clubs`
4. Trouvez votre club (exemple: "enactus")
5. Cliquez sur le bouton "Edit" (icône crayon)
6. Cherchez la section `rules` et modifiez ou ajoutez:

```json
"rules": {
  "about": "Bienvenue au club",
  "rules": [],
  "requiresApproval": true,
  "committeeMembershipMode": "MULTIPLE_ALLOWED"
}
```

7. Cliquez sur "Update"

**OU via MongoDB Shell:**
```javascript
mongo
use clubhub
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "MULTIPLE_ALLOWED" } }
)
```

### Étape 1.2: Tester dans l'interface web

1. **Ouvrez votre navigateur:** `http://localhost:4200`

2. **Connectez-vous** en tant que PRESIDENT du club

3. **Allez sur la page du club** "enactus"

4. **Préparez un membre sans comité:**
   - Si un membre est déjà dans un comité, cliquez sur "Retirer" pour le retirer d'abord

5. **Première assignation:**
   - Cliquez sur "📌 Assigner un membre à un comité"
   - Sélectionnez un membre (exemple: "membre 1")
   - Sélectionnez le comité "media"
   - Sélectionnez le rôle "📋 Membre du comité"
   - Cliquez sur "Assigner"

   **✅ Résultat attendu:** Message de succès "Membre assigné au comité"

6. **Deuxième assignation (MÊME membre, AUTRE comité):**
   - Cliquez à nouveau sur "📌 Assigner un membre à un comité"
   - Sélectionnez LE MÊME membre (exemple: "membre 1")
   - Sélectionnez un AUTRE comité (exemple: "technique")
   - Sélectionnez le rôle "📋 Membre du comité"
   - Cliquez sur "Assigner"

   **✅ Résultat attendu:** Message de succès "Membre assigné au comité"

7. **Vérifiez:**
   - Le membre "membre 1" devrait apparaître dans les deux comités ("media" ET "technique")

**🎉 TEST RÉUSSI:** Le membre peut être dans plusieurs comités!

---

## 🔒 TEST 2: Mode UN SEUL COMITÉ (SINGLE_ONLY)

### Étape 2.1: Changer le mode du club

**Dans MongoDB Compass:**
1. Retournez dans la collection `clubs`
2. Trouvez votre club "enactus"
3. Cliquez sur "Edit"
4. Modifiez le champ:

```json
"rules": {
  "about": "Bienvenue au club",
  "rules": [],
  "requiresApproval": true,
  "committeeMembershipMode": "SINGLE_ONLY"
}
```

5. Cliquez sur "Update"

**OU via MongoDB Shell:**
```javascript
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "SINGLE_ONLY" } }
)
```

### Étape 2.2: Préparer un membre sans comité

**Important:** Retirez le membre de tous les comités d'abord

**Dans l'interface web:**
1. Allez dans le comité "media"
2. Trouvez "membre 1"
3. Cliquez sur "Retirer"
4. Allez dans le comité "technique"
5. Si "membre 1" y est, cliquez sur "Retirer"

**OU via MongoDB (plus rapide):**
```javascript
// Retirer le membre de tous les comités
db.clubs.updateOne(
  { name: "enactus", "members.userId": "VOTRE_USER_ID" },
  { 
    $set: { 
      "members.$.subGroupId": null,
      "members.$.subGroupRole": null
    }
  }
)

// Retirer aussi de la liste memberIds de tous les comités
db.clubs.updateOne(
  { name: "enactus" },
  { 
    $pull: { 
      "subGroups.$[].memberIds": "VOTRE_USER_ID"
    }
  }
)
```

### Étape 2.3: Tester la restriction

1. **Rechargez la page web** (appuyez sur F5)

2. **Première assignation:**
   - Cliquez sur "📌 Assigner un membre à un comité"
   - Sélectionnez "membre 1"
   - Sélectionnez le comité "media"
   - Sélectionnez le rôle "📋 Membre du comité"
   - Cliquez sur "Assigner"

   **✅ Résultat attendu:** Message de succès "Membre assigné au comité"

3. **Deuxième assignation (doit ÉCHOUER):**
   - Cliquez sur "📌 Assigner un membre à un comité"
   - Sélectionnez LE MÊME "membre 1"
   - Sélectionnez un AUTRE comité "technique"
   - Sélectionnez le rôle "📋 Membre du comité"
   - Cliquez sur "Assigner"

   **❌ Résultat attendu:** Une alerte s'affiche:
   ```
   ❌ Ce club n'autorise qu'un seul comité par membre.
   
   Le membre est déjà dans le comité "media".
   
   Veuillez d'abord le retirer de ce comité.
   ```

**🎉 TEST RÉUSSI:** Le système empêche l'assignation à plusieurs comités!

---

## 🔄 TEST 3: Changer un membre de comité (mode SINGLE_ONLY)

### Étape 3.1: Retirer du comité actuel

1. Allez dans le comité "media"
2. Trouvez "membre 1"
3. Cliquez sur "Retirer"
4. Confirmez

### Étape 3.2: Assigner au nouveau comité

1. Cliquez sur "📌 Assigner un membre à un comité"
2. Sélectionnez "membre 1"
3. Sélectionnez le comité "technique"
4. Sélectionnez le rôle "📋 Membre du comité"
5. Cliquez sur "Assigner"

**✅ Résultat attendu:** Message de succès "Membre assigné au comité"

**🎉 TEST RÉUSSI:** Le membre a changé de comité!

---

## 📊 Vérification dans MongoDB

### Voir le mode actuel du club

```javascript
mongo
use clubhub
db.clubs.findOne(
  { name: "enactus" },
  { "rules.committeeMembershipMode": 1 }
)
```

**Résultat:**
```json
{
  "_id": "...",
  "rules": {
    "committeeMembershipMode": "SINGLE_ONLY"  // ou "MULTIPLE_ALLOWED"
  }
}
```

### Voir les comités d'un membre

```javascript
db.clubs.findOne(
  { name: "enactus" },
  { 
    "members": 1,
    "subGroups.name": 1,
    "subGroups.memberIds": 1
  }
)
```

---

## 🐛 Problèmes Courants

### Problème 1: Le message d'erreur n'apparaît pas

**Solutions:**
1. Rechargez la page (F5)
2. Videz le cache (Ctrl+Shift+R)
3. Vérifiez dans MongoDB que le mode est bien "SINGLE_ONLY"
4. Redémarrez le Club Service

### Problème 2: Le membre n'apparaît pas dans le comité

**Solutions:**
1. Rechargez la page (F5)
2. Vérifiez dans MongoDB que l'assignation a bien été faite
3. Vérifiez les logs du Club Service

### Problème 3: "Port already in use"

**Solution:**
```powershell
# Trouver le processus
netstat -ano | findstr :8081

# Tuer le processus (remplacer PID)
taskkill /F /PID <PID>
```

---

## 📝 Résumé des Résultats Attendus

| Mode | Première Assignation | Deuxième Assignation (même membre) |
|------|---------------------|-----------------------------------|
| **MULTIPLE_ALLOWED** | ✅ Succès | ✅ Succès (membre dans 2 comités) |
| **SINGLE_ONLY** | ✅ Succès | ❌ Erreur (message d'alerte) |

---

## 🎉 Félicitations!

Si tous les tests passent, la fonctionnalité fonctionne correctement:

✅ Mode MULTIPLE_ALLOWED permet plusieurs comités
✅ Mode SINGLE_ONLY empêche plusieurs comités
✅ Messages d'erreur clairs pour l'utilisateur
✅ Possibilité de changer de comité après retrait

La fonctionnalité est prête à être utilisée! 🚀

---

## 📚 Fichiers de Documentation

- `COMMENT_TESTER.md` - Guide de test rapide
- `GUIDE_TEST_MODE_COMITES.md` - Guide de test détaillé
- `CONFIGURATION_COMITES_CLUB.md` - Documentation technique complète

# 🧪 Comment Tester la Fonctionnalité

## ✅ Services Démarrés

- ✅ User Service: Port 8081 (démarré)
- ✅ Club Service: Port 8083 (démarré)
- ⚠️ Gateway: Port 8084 (à vérifier)
- ⚠️ Frontend: Port 4200 (à vérifier)

---

## 🚀 Étapes de Test Rapide

### 1. Vérifier que tous les services sont démarrés

```powershell
# Vérifier les ports
netstat -ano | findstr ":8081 :8083 :8084 :4200"
```

**Résultat attendu:**
```
8081 → User Service
8083 → Club Service
8084 → Gateway
4200 → Frontend
```

---

### 2. Démarrer les services manquants (si nécessaire)

**Gateway:**
```powershell
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw spring-boot:run
```

**Frontend:**
```powershell
cd Club-Hub-Voice-Channel-Management/User/Front
npm start
```

---

### 3. Configurer un club en mode SINGLE_ONLY

**Option 1: Via MongoDB Compass (Recommandé)**

1. Ouvrez MongoDB Compass
2. Connectez-vous à `mongodb://localhost:27017`
3. Base de données: `clubhub`
4. Collection: `clubs`
5. Trouvez votre club (ex: "enactus")
6. Cliquez sur "Edit Document"
7. Modifiez ou ajoutez:
   ```json
   "rules": {
     "about": "...",
     "rules": [...],
     "requiresApproval": true,
     "committeeMembershipMode": "SINGLE_ONLY"
   }
   ```
8. Cliquez sur "Update"

**Option 2: Via MongoDB Shell**

```javascript
// Ouvrir le shell MongoDB
mongo

// Utiliser la base de données
use clubhub

// Mettre à jour le club
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "SINGLE_ONLY" } }
)

// Vérifier
db.clubs.findOne(
  { name: "enactus" },
  { "rules.committeeMembershipMode": 1 }
)
```

---

### 4. Tester dans l'interface web

**A. Ouvrir l'application:**
```
http://localhost:4200
```

**B. Se connecter en tant que PRESIDENT**

**C. Aller sur la page du club "enactus"**

**D. Préparer un membre sans comité:**
- Si un membre est déjà dans un comité, cliquez sur "Retirer" pour le retirer

**E. Première assignation (doit fonctionner):**
1. Cliquez sur "📌 Assigner un membre à un comité"
2. Sélectionnez un membre
3. Sélectionnez le comité "media"
4. Sélectionnez le rôle "📋 Membre du comité"
5. Cliquez sur "Assigner"

**Résultat attendu:**
```
✅ Membre assigné au comité
```

**F. Deuxième assignation (doit échouer):**
1. Cliquez sur "📌 Assigner un membre à un comité"
2. Sélectionnez LE MÊME membre
3. Sélectionnez un AUTRE comité (ex: "technique")
4. Sélectionnez le rôle "📋 Membre du comité"
5. Cliquez sur "Assigner"

**Résultat attendu (ALERTE):**
```
❌ Ce club n'autorise qu'un seul comité par membre.

Le membre est déjà dans le comité "media".

Veuillez d'abord le retirer de ce comité.
```

---

### 5. Vérifier les logs du backend

**Dans le terminal du Club Service, vous devriez voir:**

```
=== ASSIGN TO SUBGROUP SERVICE ===
UserId: 69dd7119dbb981a3a0e802de
SubGroupId: technique-id
📋 Mode d'appartenance aux comités: SINGLE_ONLY
❌ Mode SINGLE_ONLY: Le membre est déjà dans le comité 'media'
```

---

### 6. Tester le mode MULTIPLE_ALLOWED

**A. Changer le mode dans MongoDB:**

```javascript
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "MULTIPLE_ALLOWED" } }
)
```

**B. Recharger la page web (F5)**

**C. Assigner le même membre à plusieurs comités:**
1. Assigner au comité "media" → ✅ Doit fonctionner
2. Assigner au comité "technique" → ✅ Doit fonctionner aussi

---

## 🎯 Résultat Final

Si tout fonctionne correctement:

✅ Mode SINGLE_ONLY empêche l'assignation à plusieurs comités
✅ Message d'erreur clair affiché à l'utilisateur
✅ Mode MULTIPLE_ALLOWED permet plusieurs comités
✅ Logs backend affichent le mode utilisé

---

## 🐛 Problèmes Courants

### Problème 1: "Port 8081 already in use"

**Solution:**
```powershell
# Trouver le processus
netstat -ano | findstr :8081

# Tuer le processus (remplacer PID par le numéro trouvé)
taskkill /F /PID <PID>

# Redémarrer
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw spring-boot:run
```

---

### Problème 2: Le message d'erreur n'apparaît pas

**Causes possibles:**
1. Le Club Service n'a pas été redémarré après les modifications
2. Le mode n'est pas correctement configuré dans MongoDB
3. La page web n'a pas été rechargée (F5)

**Solution:**
1. Redémarrer le Club Service
2. Vérifier dans MongoDB que `committeeMembershipMode` est bien "SINGLE_ONLY"
3. Recharger la page web (Ctrl+Shift+R pour vider le cache)

---

### Problème 3: MongoDB n'est pas démarré

**Solution:**
```powershell
# Vérifier si MongoDB est démarré
netstat -ano | findstr :27017

# Si pas de résultat, démarrer MongoDB
# (La commande dépend de votre installation)
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `GUIDE_TEST_MODE_COMITES.md` - Guide de test complet
- `CONFIGURATION_COMITES_CLUB.md` - Documentation technique

---

## 🎉 Bon Test!

La fonctionnalité est prête à être testée. Suivez les étapes ci-dessus et vous devriez voir la validation fonctionner correctement! 🚀

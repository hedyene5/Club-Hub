# 🚀 Guide de Démarrage Final - Responsable de Comité

## ✅ Fonctionnalités Implémentées

### 1. Changement Automatique du Rôle ✅
Quand un membre devient responsable d'un comité:
- Son rôle dans la base de données change automatiquement
- Format: `"Responsable [Nom du Comité]"`
- Exemple: `"Responsable Marketing"`

### 2. Permissions du Responsable ✅
Le responsable de comité peut:
- ✅ **Assigner des membres à SON comité**
- ✅ **Retirer des membres de SON comité**
- ✅ **Supprimer des membres de SON comité** (du club)

Le responsable NE PEUT PAS:
- ❌ Ajouter des membres au club
- ❌ Modifier les membres
- ❌ Créer/Modifier/Supprimer des comités
- ❌ Gérer d'autres comités
- ❌ Créer des élections

---

## 🚀 Démarrage des Services

### Étape 1: Arrêter Tous les Services Java

```powershell
Get-Process java* | Stop-Process -Force
```

### Étape 2: Démarrer les Services dans l'Ordre

**Terminal 1 - Service User (8081):**
```powershell
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw clean spring-boot:run
```
Attendez: `Started ClubHubApplication in X seconds`

**Terminal 2 - Service Club (8083):**
```powershell
cd ClubHub
./mvnw clean spring-boot:run
```
Attendez: `Started ClubServiceApplication in X seconds`

**Terminal 3 - Gateway (8084):**
```powershell
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw clean spring-boot:run
```
Attendez: `Started GatewayApplication in X seconds`

**Terminal 4 - Frontend (4200):**
```powershell
cd Front
ng serve
```
Attendez: `✔ Compiled successfully.`

---

## 🧪 Test Complet

### Test 1: Nommer un Responsable de Comité

1. **Connectez-vous en tant que PRESIDENT**
2. Allez sur la page du club
3. Cliquez sur "📌 Assigner un membre à un comité"
4. Sélectionnez un membre (ex: Ahmed)
5. Sélectionnez un comité (ex: Marketing)
6. Sélectionnez "Responsable" dans le dropdown "Rôle dans le comité"
7. Cliquez "Assigner"

**Vérifications:**
- ✅ Message: "Membre assigné au comité en tant que Responsable"
- ✅ Badge "👑 Responsable" affiché en violet

**Logs Service Club (8083):**
```
=== ASSIGN TO SUBGROUP SERVICE ===
SubGroupRole: RESPONSABLE
📋 Sous-groupe trouvé: Marketing
👤 Membre trouvé: Ahmed (rôle actuel: MEMBRE_SIMPLE)
📝 Rôle initial sauvegardé: MEMBRE_SIMPLE
✅ Membre assigné avec rôle comité: RESPONSABLE
🔍 Appel du service User pour mettre à jour le rôle...
✅ Rôle mis à jour dans le service User: Responsable Marketing
📡 Réponse: 200 OK
```

**Logs Service User (8081):**
```
🔄 Mise à jour du rôle: MEMBRE_SIMPLE → Responsable Marketing
✅ Rôle mis à jour dans User service
```

### Test 2: Connexion en tant que Responsable

1. **Déconnectez-vous**
2. **Reconnectez-vous** avec le compte d'Ahmed
3. Allez sur la page du club

**Vérifications:**
- ✅ Bouton "📌 Assigner un membre à un comité" visible
- ✅ Colonne "Actions" visible dans SON comité
- ✅ Bouton "Retirer" visible pour les membres de SON comité
- ✅ Bouton 🗑️ visible pour les membres de SON comité
- ❌ Tous les autres boutons cachés

**Console du navigateur (F12):**
```
✅ Responsable de comité détecté: Responsable Marketing
📋 Permissions responsable de comité: Array(9)
  0: "VIEW_MEMBERS"
  1: "VIEW_SUBGROUPS"
  2: "VIEW_ELECTIONS"
  3: "VOTE_ELECTIONS"
  4: "VIEW_EVENTS"
  5: "VIEW_CLUB_INFO"
  6: "JOIN_VOICE_CHANNELS"
  7: "ASSIGN_TO_SUBGROUPS"
  8: "DELETE_MEMBERS"
```

### Test 3: Assigner un Membre à SON Comité

1. **Connecté en tant qu'Ahmed (Responsable Marketing)**
2. Cliquez sur "📌 Assigner un membre à un comité"
3. Sélectionnez un membre (ex: Sara)
4. Le dropdown "Comité" affiche UNIQUEMENT "Marketing (Mon comité)"
5. Le dropdown "Rôle" affiche UNIQUEMENT "Membre"
6. Cliquez "Assigner"

**Vérifications:**
- ✅ Sara est ajoutée au comité Marketing
- ✅ Badge "Membre" affiché en gris

### Test 4: Retirer un Membre de SON Comité

1. **Connecté en tant qu'Ahmed (Responsable Marketing)**
2. Allez dans la liste des membres du comité Marketing
3. Cliquez sur "Retirer" à côté de Sara
4. Confirmez l'action

**Vérifications:**
- ✅ Sara est retirée du comité Marketing
- ✅ Message: "Membre retiré du comité"

### Test 5: Supprimer un Membre de SON Comité

1. **Connecté en tant qu'Ahmed (Responsable Marketing)**
2. Allez dans la liste des membres du club
3. Cliquez sur 🗑️ à côté de Sara (membre de son comité)
4. Confirmez l'action

**Vérifications:**
- ✅ Sara est supprimée du club ET du comité
- ✅ Message: "Membre supprimé"

### Test 6: Tentatives Interdites

**Tentative 1: Assigner à un autre comité**
- ❌ Le dropdown "Comité" n'affiche que "Marketing (Mon comité)"
- ❌ Impossible de sélectionner un autre comité

**Tentative 2: Nommer un responsable**
- ❌ Le dropdown "Rôle" n'affiche que "Membre"
- ❌ Impossible de sélectionner "Responsable"

**Tentative 3: Retirer d'un autre comité**
- ❌ La colonne "Actions" est cachée dans les autres comités
- ❌ Impossible de retirer des membres d'autres comités

**Tentative 4: Supprimer un membre d'un autre comité**
- ❌ Le bouton 🗑️ est caché pour les membres des autres comités
- ❌ Impossible de supprimer des membres d'autres comités

---

## 📊 Vérification dans MongoDB

### Collection `users`

**Avant assignation:**
```json
{
  "_id": "user123",
  "email": "ahmed@test.com",
  "role": "MEMBRE_SIMPLE"
}
```

**Après assignation comme Responsable Marketing:**
```json
{
  "_id": "user123",
  "email": "ahmed@test.com",
  "role": "Responsable Marketing"  // ✅ Changé automatiquement
}
```

### Collection `clubs`

**Dans le tableau `members`:**
```json
{
  "userId": "user123",
  "name": "Ahmed",
  "role": "MEMBRE_SIMPLE",
  "subGroupId": "marketing-id",
  "subGroupRole": "RESPONSABLE",  // ✅ Rôle dans le comité
  "initialRole": "MEMBRE_SIMPLE"  // ✅ Sauvegardé pour restauration
}
```

---

## ❌ Dépannage

### Erreur: Port 8081 déjà utilisé
```
Solution: Arrêtez tous les processus Java
Get-Process java* | Stop-Process -Force
```

### Erreur: Connection refused dans les logs
```
Solution: Le Service User n'est pas démarré
Démarrez d'abord le Service User (8081)
```

### Les permissions ne s'appliquent pas
```
Solution: Vérifiez le rôle dans MongoDB
db.users.findOne({ email: "ahmed@test.com" })
Le rôle doit être "Responsable [Comité]"
```

### Le bouton "Retirer" n'apparaît pas
```
Solution: Vérifiez que vous êtes dans VOTRE comité
Le bouton n'apparaît que dans le comité dont vous êtes responsable
```

---

## 📁 Fichiers Modifiés

1. ✅ `PermissionService.java` - Ajouté DELETE_MEMBERS
2. ✅ `club-detail.component.ts` - Ajouté canRemoveFromSubGroup()
3. ✅ `club-detail.component.html` - Mis à jour les conditions d'affichage

---

## 🎉 Résultat Final

Le responsable de comité a maintenant un rôle complet:
- ✅ Rôle change automatiquement dans la base de données
- ✅ Peut assigner des membres à son comité
- ✅ Peut retirer des membres de son comité
- ✅ Peut supprimer des membres de son comité
- ✅ Toutes les actions limitées à SON comité uniquement
- ✅ Interface adaptée avec boutons conditionnels
- ✅ Validations côté frontend et backend

Tout est prêt pour la production! 🚀

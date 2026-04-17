# 🧪 Guide de Test - Système à 3 Niveaux

## 🚀 Démarrage

```powershell
# 1. Arrêter tous les services
Get-Process java* | Stop-Process -Force

# 2. Service User (8081)
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw clean spring-boot:run

# 3. Service Club (8083)
cd ClubHub
./mvnw clean spring-boot:run

# 4. Gateway (8084)
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw clean spring-boot:run

# 5. Frontend (4200)
cd Front
ng serve
```

---

## 🧪 Test 1: MEMBRE_SIMPLE

### Objectif
Vérifier qu'un membre sans comité a uniquement un accès en lecture seule.

### Étapes
1. Connectez-vous en tant que PRESIDENT
2. Ajoutez un nouveau membre (ex: "Alice")
3. NE PAS l'assigner à un comité
4. Déconnectez-vous
5. Connectez-vous avec le compte d'Alice

### Résultat Attendu
- ❌ Aucun bouton de gestion visible
- ✅ Peut voir les informations du club
- ✅ Peut voir la liste des membres (lecture seule)
- ✅ Peut voir les comités (lecture seule)
- ✅ Peut voir les élections
- ❌ Pas de badge de comité

### Vérification MongoDB
```javascript
db.clubs.findOne({ name: "Mon Club" })
// Dans members, trouver Alice:
{
  "userId": "alice-id",
  "name": "Alice",
  "role": "MEMBRE_SIMPLE",
  "subGroupId": null,  // ✅ Pas de comité
  "subGroupRole": null
}
```

---

## 🧪 Test 2: MEMBRE_COMITE

### Objectif
Vérifier qu'un membre de comité peut participer mais pas gérer.

### Étapes
1. Connectez-vous en tant que PRESIDENT
2. Cliquez "📌 Assigner un membre à un comité"
3. Sélectionnez Alice
4. Sélectionnez un comité (ex: "Marketing")
5. Sélectionnez "Membre du comité"
6. Cliquez "Assigner"
7. Déconnectez-vous
8. Reconnectez-vous avec le compte d'Alice

### Résultat Attendu
- ✅ Badge "📋 Membre du comité" en bleu
- ✅ Voit les membres de son comité
- ❌ Aucun bouton de gestion visible
- ❌ Pas de colonne "Actions" dans le comité
- ❌ Ne peut pas assigner d'autres membres
- ❌ Ne peut pas retirer des membres

### Vérification MongoDB
```javascript
db.clubs.findOne({ name: "Mon Club" })
// Dans members:
{
  "userId": "alice-id",
  "name": "Alice",
  "role": "MEMBRE_SIMPLE",
  "subGroupId": "marketing-id",  // ✅ Assignée au comité
  "subGroupRole": "MEMBRE_COMITE"  // ✅ Membre du comité
}

// Dans subGroups[0] (Marketing):
{
  "id": "marketing-id",
  "name": "Marketing",
  "memberIds": ["alice-id"],
  "memberRoles": {
    "alice-id": "MEMBRE_COMITE"  // ✅ Rôle dans le comité
  }
}
```

---

## 🧪 Test 3: RESPONSABLE

### Objectif
Vérifier qu'un responsable peut gérer SON comité uniquement.

### Étapes
1. Connectez-vous en tant que PRESIDENT
2. Cliquez "📌 Assigner un membre à un comité"
3. Sélectionnez Bob (un autre membre)
4. Sélectionnez le comité "Marketing"
5. Sélectionnez "Responsable du comité"
6. Cliquez "Assigner"
7. Déconnectez-vous
8. Reconnectez-vous avec le compte de Bob

### Résultat Attendu
- ✅ Badge "👑 Responsable" en violet
- ✅ Bouton "📌 Assigner un membre à un comité" visible
- ✅ Colonne "Actions" visible dans SON comité (Marketing)
- ✅ Bouton "Retirer" visible pour les membres de SON comité
- ❌ Colonne "Actions" cachée dans les autres comités
- ❌ Bouton "Ajouter un membre" (au club) caché
- ❌ Bouton "Créer un comité" caché

### Vérification MongoDB
```javascript
// Collection users
db.users.findOne({ email: "bob@test.com" })
{
  "userId": "bob-id",
  "email": "bob@test.com",
  "role": "Responsable Marketing"  // ✅ Rôle changé automatiquement
}

// Collection clubs
db.clubs.findOne({ name: "Mon Club" })
// Dans members:
{
  "userId": "bob-id",
  "name": "Bob",
  "role": "MEMBRE_SIMPLE",
  "initialRole": "MEMBRE_SIMPLE",  // ✅ Sauvegardé
  "subGroupId": "marketing-id",
  "subGroupRole": "RESPONSABLE"
}

// Dans subGroups[0] (Marketing):
{
  "id": "marketing-id",
  "name": "Marketing",
  "memberIds": ["alice-id", "bob-id"],
  "responsableId": "bob-id",  // ✅ Bob est le responsable
  "memberRoles": {
    "alice-id": "MEMBRE_COMITE",
    "bob-id": "RESPONSABLE"
  }
}
```

### Console du navigateur (F12)
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

---

## 🧪 Test 4: Gestion par le Responsable

### Objectif
Vérifier que le responsable peut gérer les membres de SON comité.

### Étapes (Connecté en tant que Bob - Responsable Marketing)

#### 4.1: Assigner un Membre à SON Comité
1. Cliquez "📌 Assigner un membre à un comité"
2. Sélectionnez Charlie (un membre simple)
3. Le dropdown "Comité" affiche UNIQUEMENT "Marketing (Mon comité)"
4. Le dropdown "Rôle" affiche UNIQUEMENT "Membre du comité"
5. Cliquez "Assigner"

**Résultat:**
- ✅ Charlie est ajouté au comité Marketing
- ✅ Badge "📋 Membre du comité" pour Charlie

#### 4.2: Retirer un Membre de SON Comité
1. Allez dans la liste des membres du comité Marketing
2. Cliquez "Retirer" à côté d'Alice
3. Confirmez

**Résultat:**
- ✅ Alice est retirée du comité Marketing
- ✅ Alice reste membre du club
- ✅ Alice redevient MEMBRE_SIMPLE

#### 4.3: Tentative de Gérer un Autre Comité
1. Allez dans la liste des membres du comité "Technique"
2. Vérifiez qu'il n'y a pas de colonne "Actions"

**Résultat:**
- ❌ Aucun bouton visible
- ❌ Ne peut pas gérer le comité Technique

---

## 🧪 Test 5: Transitions de Rôles

### 5.1: MEMBRE_SIMPLE → MEMBRE_COMITE
```
1. Alice est MEMBRE_SIMPLE
2. Le président l'assigne au comité Marketing comme "Membre du comité"
3. ✅ Alice devient MEMBRE_COMITE
4. ✅ Badge "📋 Membre du comité"
```

### 5.2: MEMBRE_COMITE → RESPONSABLE
```
1. Alice est MEMBRE_COMITE du comité Marketing
2. Le président change son rôle en "Responsable du comité"
3. ✅ Alice devient RESPONSABLE
4. ✅ Badge "👑 Responsable"
5. ✅ Rôle dans la base: "Responsable Marketing"
6. ✅ subGroup.responsableId = alice-id
```

### 5.3: RESPONSABLE → MEMBRE_COMITE
```
1. Alice est RESPONSABLE du comité Marketing
2. Le président change son rôle en "Membre du comité"
3. ✅ Alice redevient MEMBRE_COMITE
4. ✅ Badge "📋 Membre du comité"
5. ✅ Rôle restauré dans la base
6. ✅ subGroup.responsableId = null
```

### 5.4: MEMBRE_COMITE → MEMBRE_SIMPLE
```
1. Alice est MEMBRE_COMITE du comité Marketing
2. Le président la retire du comité
3. ✅ Alice redevient MEMBRE_SIMPLE
4. ✅ Pas de badge de comité
5. ✅ subGroupId = null
```

---

## ✅ Checklist de Validation

### Interface MEMBRE_SIMPLE
- ❌ Aucun bouton de gestion
- ✅ Lecture seule
- ❌ Pas de badge de comité

### Interface MEMBRE_COMITE
- ❌ Aucun bouton de gestion
- ✅ Badge "📋 Membre du comité" en bleu
- ✅ Voit les membres de son comité

### Interface RESPONSABLE
- ✅ Badge "👑 Responsable" en violet
- ✅ Bouton "📌 Assigner un membre à un comité"
- ✅ Colonne "Actions" dans SON comité
- ✅ Bouton "Retirer" pour les membres de SON comité
- ❌ Pas de colonne "Actions" dans les autres comités
- ❌ Bouton "Ajouter un membre" (au club) caché
- ❌ Bouton "Créer un comité" caché

### Base de Données
- ✅ subGroupId correctement défini
- ✅ subGroupRole correctement défini
- ✅ subGroup.responsableId correctement défini
- ✅ subGroup.memberRoles correctement défini
- ✅ user.role changé pour les responsables

---

## 📊 Résumé des Tests

| Test | Type | Résultat Attendu |
|------|------|------------------|
| 1 | MEMBRE_SIMPLE | ✅ Lecture seule |
| 2 | MEMBRE_COMITE | ✅ Participation, pas de gestion |
| 3 | RESPONSABLE | ✅ Gestion de SON comité |
| 4.1 | Assigner à son comité | ✅ Membre ajouté |
| 4.2 | Retirer de son comité | ✅ Membre retiré |
| 4.3 | Gérer autre comité | ❌ Impossible |
| 5.1 | Transition SIMPLE → COMITE | ✅ Badge changé |
| 5.2 | Transition COMITE → RESPONSABLE | ✅ Rôle changé |
| 5.3 | Transition RESPONSABLE → COMITE | ✅ Rôle restauré |
| 5.4 | Transition COMITE → SIMPLE | ✅ Comité retiré |

---

## 🎉 Validation Finale

Si tous les tests passent:
- ✅ Les 3 niveaux de membres fonctionnent correctement
- ✅ Les permissions sont bien appliquées
- ✅ L'interface s'adapte selon le niveau
- ✅ Les transitions entre niveaux fonctionnent
- ✅ La base de données est correctement mise à jour

Le système est prêt! 🚀

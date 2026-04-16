# Test Rapide: Assignation Responsable

## 🎯 Test à Faire MAINTENANT

### Étape 1: Redémarrer le Backend

1. Arrêtez le backend Spring Boot (Ctrl+C)
2. Relancez-le:
   ```bash
   cd ClubHub
   mvn spring-boot:run
   ```

### Étape 2: Assigner un Membre comme Responsable

1. Ouvrez le frontend (http://localhost:4200)
2. Connectez-vous en tant que PRESIDENT
3. Allez sur la page du club
4. Cliquez sur "Assigner un membre à un comité"
5. Sélectionnez:
   - Un membre
   - Un comité
   - **Rôle: Responsable** (pas "Membre")
6. Cliquez "Assigner"

### Étape 3: Vérifier les Logs Backend

Dans la console du backend, vous devriez voir:

```
=== ASSIGN TO SUBGROUP ===
ClubId: 69dd71081e564f2fc24aafdb
UserId: 69e00dbebf596604ae458ed9
SubGroupId: [id du comité]
SubGroupRole: RESPONSABLE    ← IMPORTANT: doit être RESPONSABLE

=== ASSIGN TO SUBGROUP SERVICE ===
ClubId: 69dd71081e564f2fc24aafdb
UserId: 69e00dbebf596604ae458ed9
SubGroupId: [id du comité]
SubGroupRole: RESPONSABLE    ← IMPORTANT: doit être RESPONSABLE
📋 Sous-groupe trouvé: [Nom du comité]
👤 Membre trouvé: [Nom] (rôle actuel: [rôle])
📝 Rôle initial sauvegardé: [rôle]
✅ Membre [userId] assigné avec rôle comité: RESPONSABLE
🔍 Recherche de l'utilisateur dans la collection User...
🔄 Mise à jour du rôle dans User: [ancien] → Responsable [Comité]
✅ Rôle mis à jour dans la base User: Responsable [Comité]
✅ Membre ajouté à la liste du sous-groupe
✅ Club sauvegardé
===================================
```

### Étape 4: Vérifier dans MongoDB

```javascript
// 1. Vérifier le rôle dans la collection users
db.users.findOne({ _id: ObjectId("69e00dbebf596604ae458ed9") })

// Résultat attendu:
{
  "_id": ObjectId("69e00dbebf596604ae458ed9"),
  "firstName": "membre",
  "lastName": "4",
  "email": "membre4@en.com",
  "role": "Responsable [Nom du Comité]",  // ← Doit avoir changé
  "customRoleId": "...",
  ...
}

// 2. Vérifier dans la collection clubs
db.clubs.findOne({ _id: ObjectId("69dd71081e564f2fc24aafdb") })

// Chercher dans members:
{
  "userId": "69e00dbebf596604ae458ed9",
  "name": "membre 4",
  "role": "test test",  // ← Peut rester l'ancien rôle
  "initialRole": "test test",  // ← Doit être sauvegardé
  "subGroupId": "[id du comité]",
  "subGroupRole": "RESPONSABLE",  // ← Doit être RESPONSABLE
  "status": "APPROVED"
}
```

### Étape 5: Tester les Permissions

1. Déconnectez-vous
2. Reconnectez-vous avec le compte du membre (membre4@en.com / 123456)
3. Allez sur la page du club
4. Ouvrez la console du navigateur (F12)
5. Cherchez:
   ```
   📡 Chargement des permissions pour: 69e00dbebf596604ae458ed9
   ✅ Permissions chargées: Array(12)
   ```

6. Vérifiez que les permissions incluent:
   - ADD_MEMBERS
   - DELETE_MEMBERS
   - ASSIGN_TO_SUBGROUPS
   - EDIT_SUBGROUPS
   - DELETE_SUBGROUPS

## ❌ Si SubGroupRole = "MEMBRE" dans les logs

Le problème est dans le frontend. Le formulaire envoie "MEMBRE" au lieu de "RESPONSABLE".

**Solution:**

Vérifiez dans `club-detail.component.html` que le select a bien:
```html
<select formControlName="subGroupRole">
  <option value="MEMBRE">Membre</option>
  <option value="RESPONSABLE">Responsable</option>  <!-- ← Majuscules -->
</select>
```

## ❌ Si l'utilisateur n'est pas trouvé

```
❌ Utilisateur non trouvé dans la collection User: [userId]
```

Le userId dans le club ne correspond pas à un userId dans la collection users.

**Solution:**

Vérifiez que le membre a bien été créé dans la collection users:
```javascript
db.users.findOne({ _id: ObjectId("[userId]") })
```

## ❌ Si aucun log n'apparaît

Le backend ne reçoit pas la requête.

**Solution:**

1. Vérifiez que le backend tourne sur le port 8081
2. Vérifiez que le Gateway tourne sur le port 8084
3. Vérifiez dans Network tab (F12) que la requête est bien envoyée

## ✅ Si Tout Fonctionne

Vous devriez voir:
1. ✅ Logs backend complets avec "✅ Rôle mis à jour dans la base User"
2. ✅ Rôle changé dans MongoDB (collection users)
3. ✅ Permissions chargées (12 permissions)
4. ✅ Boutons visibles dans l'interface pour gérer le comité

## 📸 Captures d'Écran à Partager

Si ça ne marche pas, partagez:
1. Screenshot des logs backend (console Spring Boot)
2. Screenshot de la requête HTTP (Network tab, F12)
3. Screenshot du document User dans MongoDB
4. Screenshot du document Club (section members) dans MongoDB
5. Screenshot des permissions dans la console frontend

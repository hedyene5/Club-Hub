# 🧪 Test: Changement Automatique du Rôle lors de l'Assignation

## 🎯 Objectif

Vérifier que quand un membre est assigné comme RESPONSABLE d'un comité:
1. ✅ Son rôle dans la collection `users` est mis à jour automatiquement
2. ✅ Le nouveau rôle est "Responsable [nom du comité]"
3. ✅ L'ancien rôle est sauvegardé dans `initialRole`
4. ✅ L'interface affiche le nouveau rôle
5. ✅ Les permissions sont mises à jour

---

## 📋 Prérequis

### Base de données MongoDB

**Collection `clubs`:**
```json
{
  "_id": "69dd71081e564f2fc24aafdb",
  "name": "enactus",
  "subGroups": [
    {
      "_id": "71b1d6ee-8767-4602-af42-d5bfd961d692",
      "name": "media",
      "memberIds": [],
      "responsableId": null,
      "memberRoles": {}
    }
  ],
  "members": [
    {
      "userId": "69e00dbebf596604ae458ed9",
      "name": "Jean",
      "email": "jean@test.com",
      "role": "MEMBRE_SIMPLE",
      "status": "APPROVED",
      "subGroupId": null,
      "subGroupRole": null,
      "initialRole": null
    }
  ]
}
```

**Collection `users`:**
```json
{
  "_id": "69e00dbebf596604ae458ed9",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@test.com",
  "role": "MEMBRE_SIMPLE",
  "clubId": "69dd71081e564f2fc24aafdb"
}
```

---

## 🔧 Test Étape par Étape

### Étape 1: Vérifier l'état initial

**MongoDB - Collection `users`:**
```bash
db.users.findOne({ _id: "69e00dbebf596604ae458ed9" })
```

**Résultat attendu:**
```json
{
  "_id": "69e00dbebf596604ae458ed9",
  "role": "MEMBRE_SIMPLE"  // ✅ Rôle initial
}
```

---

### Étape 2: Assigner Jean comme Responsable du comité "media"

**Action dans l'interface:**
1. Connectez-vous en tant que PRESIDENT
2. Allez sur la page du club "enactus"
3. Cliquez sur "📌 Assigner un membre à un comité"
4. Sélectionnez:
   - Membre: Jean
   - Comité: media
   - Rôle: 👑 Responsable
5. Cliquez sur "Assigner"

**Requête HTTP envoyée:**
```
PUT http://localhost:8083/api/clubs/69dd71081e564f2fc24aafdb/members/69e00dbebf596604ae458ed9/subgroup/71b1d6ee-8767-4602-af42-d5bfd961d692
Body: { "subGroupRole": "RESPONSABLE" }
```

---

### Étape 3: Vérifier les logs du backend

**Logs attendus dans Club Service (port 8083):**
```
=== ASSIGN TO SUBGROUP SERVICE ===
ClubId: 69dd71081e564f2fc24aafdb
UserId: 69e00dbebf596604ae458ed9
SubGroupId: 71b1d6ee-8767-4602-af42-d5bfd961d692
SubGroupRole: RESPONSABLE
📋 Sous-groupe trouvé: media
👤 Membre trouvé: Jean (rôle actuel: MEMBRE_SIMPLE)
📝 Rôle initial sauvegardé: MEMBRE_SIMPLE
✅ Membre 69e00dbebf596604ae458ed9 assigné avec rôle comité: RESPONSABLE
✅ Membre ajouté à la liste du sous-groupe
✅ Rôle du membre mis à jour dans memberRoles: RESPONSABLE
✅ ResponsableId mis à jour: 69e00dbebf596604ae458ed9
🔍 Appel du service User pour mettre à jour le rôle...
✅ Rôle mis à jour dans le service User: Responsable media
📡 Réponse: 200 OK
✅ Club sauvegardé
```

**Logs attendus dans User Service (port 8081):**
```
🔄 Mise à jour du rôle: MEMBRE_SIMPLE → Responsable media
✅ Rôle mis à jour dans User service
```

---

### Étape 4: Vérifier la base de données après l'assignation

**MongoDB - Collection `clubs`:**
```bash
db.clubs.findOne({ _id: "69dd71081e564f2fc24aafdb" })
```

**Résultat attendu:**
```json
{
  "_id": "69dd71081e564f2fc24aafdb",
  "name": "enactus",
  "subGroups": [
    {
      "_id": "71b1d6ee-8767-4602-af42-d5bfd961d692",
      "name": "media",
      "memberIds": ["69e00dbebf596604ae458ed9"],  // ✅ Jean ajouté
      "responsableId": "69e00dbebf596604ae458ed9",  // ✅ Jean est responsable
      "memberRoles": {
        "69e00dbebf596604ae458ed9": "RESPONSABLE"  // ✅ Rôle enregistré
      }
    }
  ],
  "members": [
    {
      "userId": "69e00dbebf596604ae458ed9",
      "name": "Jean",
      "role": "MEMBRE_SIMPLE",  // ⚠️ Rôle dans le club (pas changé)
      "subGroupId": "71b1d6ee-8767-4602-af42-d5bfd961d692",  // ✅ Assigné au comité
      "subGroupRole": "RESPONSABLE",  // ✅ Rôle dans le comité
      "initialRole": "MEMBRE_SIMPLE"  // ✅ Rôle initial sauvegardé
    }
  ]
}
```

**MongoDB - Collection `users`:**
```bash
db.users.findOne({ _id: "69e00dbebf596604ae458ed9" })
```

**Résultat attendu:**
```json
{
  "_id": "69e00dbebf596604ae458ed9",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@test.com",
  "role": "Responsable media",  // ✅ CHANGÉ AUTOMATIQUEMENT!
  "clubId": "69dd71081e564f2fc24aafdb"
}
```

---

### Étape 5: Vérifier l'interface

**Déconnectez-vous et reconnectez-vous avec Jean:**

1. Email: jean@test.com
2. Mot de passe: [son mot de passe]

**Console du navigateur (F12):**
```
🔍 Vérification du statut de responsable pour userId: 69e00dbebf596604ae458ed9
✅ Statut de responsable: { 
  isResponsable: true, 
  subGroupId: "71b1d6ee-8767-4602-af42-d5bfd961d692", 
  subGroupName: "media" 
}
📡 Chargement des permissions pour: 69e00dbebf596604ae458ed9
✅ DÉTECTION DYNAMIQUE: Responsable de comité détecté
📋 Permissions finales: ["VIEW_MEMBERS", "VIEW_SUBGROUPS", "ASSIGN_TO_SUBGROUPS", ...]
```

**Interface - Page du club:**
```
Comité: media
┌─────────────────────────────────────────────────────────────┐
│ 👤 Jean                                                     │
│ Rôle dans le club: MEMBRE_SIMPLE                           │
│ Rôle dans le comité: 👑 Responsable                        │
│                                                             │
│ Actions visibles:                                           │
│ ✅ Bouton "📌 Assigner un membre à un comité"              │
│ ✅ Bouton "Retirer" pour les membres du comité media       │
│ ✅ Dropdown de rôle pour les membres du comité media       │
└─────────────────────────────────────────────────────────────┘

Comité: technique
┌─────────────────────────────────────────────────────────────┐
│ ❌ Aucun bouton de gestion visible                          │
└─────────────────────────────────────────────────────────────┘

Niveau club:
❌ Bouton "Ajouter un membre" caché
❌ Bouton "Créer un comité" caché
❌ Bouton "Nouvelle élection" caché
```

**Interface - Profil de Jean:**
```
Nom: Jean Dupont
Email: jean@test.com
Rôle: Responsable media  // ✅ Affiché dynamiquement
```

---

## 🔄 Test de Restauration du Rôle

### Étape 6: Retirer Jean du comité

**Action dans l'interface:**
1. Connectez-vous en tant que PRESIDENT
2. Allez sur la page du club "enactus"
3. Dans le comité "media", cliquez sur "Retirer" à côté de Jean

**Requête HTTP envoyée:**
```
DELETE http://localhost:8083/api/clubs/69dd71081e564f2fc24aafdb/subgroups/71b1d6ee-8767-4602-af42-d5bfd961d692/members/69e00dbebf596604ae458ed9
```

---

### Étape 7: Vérifier les logs

**Logs attendus dans Club Service:**
```
🔄 Restauration du rôle initial: MEMBRE_SIMPLE
✅ Rôle restauré dans le service User
```

**Logs attendus dans User Service:**
```
🔄 Mise à jour du rôle: Responsable media → MEMBRE_SIMPLE
✅ Rôle mis à jour dans User service
```

---

### Étape 8: Vérifier la base de données après le retrait

**MongoDB - Collection `users`:**
```bash
db.users.findOne({ _id: "69e00dbebf596604ae458ed9" })
```

**Résultat attendu:**
```json
{
  "_id": "69e00dbebf596604ae458ed9",
  "role": "MEMBRE_SIMPLE"  // ✅ RESTAURÉ AUTOMATIQUEMENT!
}
```

**MongoDB - Collection `clubs`:**
```json
{
  "members": [
    {
      "userId": "69e00dbebf596604ae458ed9",
      "subGroupId": null,  // ✅ Retiré du comité
      "subGroupRole": null,  // ✅ Rôle comité supprimé
      "initialRole": null  // ✅ Rôle initial supprimé
    }
  ],
  "subGroups": [
    {
      "name": "media",
      "memberIds": [],  // ✅ Jean retiré
      "responsableId": null  // ✅ Plus de responsable
    }
  ]
}
```

---

## 🐛 Dépannage

### Problème 1: Le rôle n'est pas mis à jour dans `users`

**Symptôme:**
```json
// Collection users
{ "role": "MEMBRE_SIMPLE" }  // ❌ Pas changé
```

**Causes possibles:**
1. ❌ User Service n'est pas démarré (port 8081)
2. ❌ L'URL du User Service est incorrecte
3. ❌ L'endpoint `/api/users/{userId}/role` n'existe pas

**Solution:**
```bash
# Vérifier que User Service est démarré
curl http://localhost:8081/api/users/69e00dbebf596604ae458ed9

# Vérifier les logs du Club Service
# Chercher: "❌ Erreur lors de la mise à jour du rôle dans User service"
```

---

### Problème 2: Erreur 404 lors de l'appel REST

**Logs:**
```
❌ Erreur lors de la mise à jour du rôle dans User service: 404 Not Found
```

**Cause:**
L'URL est incorrecte. Doit être: `http://localhost:8081/api/users/{userId}/role`

**Solution:**
Vérifier dans `ClubService.java`:
```java
private String userServiceUrl = "http://localhost:8081/api/users";  // ✅ Avec /api
```

---

### Problème 3: Les permissions ne sont pas mises à jour

**Symptôme:**
Jean ne voit pas les boutons de gestion du comité.

**Solution:**
1. Déconnectez-vous
2. Reconnectez-vous avec Jean
3. Le `PermissionService` rechargera les permissions
4. La détection dynamique détectera qu'il est responsable

---

## ✅ Checklist de Validation

- [ ] User Service démarré sur port 8081
- [ ] Club Service démarré sur port 8083
- [ ] Gateway démarré sur port 8084
- [ ] Frontend démarré sur port 4200
- [ ] Jean existe dans la collection `users`
- [ ] Jean existe dans la collection `clubs.members`
- [ ] Comité "media" existe dans `clubs.subGroups`
- [ ] Assignation réussie (logs "✅ Rôle mis à jour dans le service User")
- [ ] Rôle changé dans `users` collection
- [ ] Jean voit les boutons de gestion du comité "media"
- [ ] Jean ne voit PAS les boutons pour le comité "technique"
- [ ] Retrait réussi (logs "✅ Rôle restauré dans User service")
- [ ] Rôle restauré dans `users` collection

---

## 🎉 Résultat Attendu

Après avoir suivi tous les tests:

1. ✅ Quand Jean est assigné comme RESPONSABLE du comité "media"
   - Son rôle dans `users` devient "Responsable media"
   - Il obtient les permissions de responsable
   - Il voit les boutons de gestion du comité "media"

2. ✅ Quand Jean est retiré du comité "media"
   - Son rôle dans `users` redevient "MEMBRE_SIMPLE"
   - Il perd les permissions de responsable
   - Il ne voit plus les boutons de gestion

3. ✅ L'interface affiche toujours le rôle correct
   - Détection dynamique via `subGroup.responsableId`
   - Affichage du rôle "Responsable media"
   - Permissions mises à jour en temps réel

Le système fonctionne correctement! 🚀

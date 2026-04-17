# 🔍 Guide de Débogage: Changement de Rôle

## ✅ Ce qui fonctionne

J'ai testé l'endpoint User Service et il fonctionne parfaitement:

```powershell
# Test réussi
PUT http://localhost:8081/api/users/69e00dbebf596604ae458ed9/role
Body: {"role": "Responsable media"}
Response: 200 OK
Résultat: Le rôle a été changé dans la base de données ✅
```

## 🐛 Le Problème

Le Club Service n'appelle PAS cet endpoint quand vous assignez un membre comme RESPONSABLE.

---

## 🔧 Étapes de Débogage

### Étape 1: Redémarrer le Club Service

**IMPORTANT:** J'ai ajouté des logs supplémentaires dans `ClubService.java`. Vous devez redémarrer le Club Service pour que les changements prennent effet.

```bash
# Arrêtez le Club Service (Ctrl+C dans le terminal)
# Puis redémarrez:
cd ClubHub
mvn spring-boot:run
```

---

### Étape 2: Faire une assignation

1. Connectez-vous en tant que PRESIDENT
2. Allez sur la page du club "enactus"
3. Cliquez sur "📌 Assigner un membre à un comité"
4. Sélectionnez:
   - Membre: membre 4 (ou n'importe quel membre)
   - Comité: media
   - Rôle: **👑 Responsable** (IMPORTANT!)
5. Cliquez sur "Assigner"

---

### Étape 3: Regarder les logs du Club Service

**Logs attendus si tout fonctionne:**

```
=== ASSIGN TO SUBGROUP SERVICE ===
ClubId: 69dd71081e564f2fc24aafdb
UserId: 69e00dbebf596604ae458ed9
SubGroupId: 71b1d6ee-8767-4602-af42-d5bfd961d692
SubGroupRole: RESPONSABLE
📋 Sous-groupe trouvé: media
👤 Membre trouvé: membre 4 (rôle actuel: test test)
📝 Rôle initial sauvegardé: test test
✅ Membre 69e00dbebf596604ae458ed9 assigné avec rôle comité: RESPONSABLE
✅ Membre ajouté à la liste du sous-groupe
✅ Rôle du membre mis à jour dans memberRoles: RESPONSABLE
✅ ResponsableId mis à jour: 69e00dbebf596604ae458ed9
🔍 Appel du service User pour mettre à jour le rôle...
📋 SubGroupRole reçu: 'RESPONSABLE'
📋 Comparaison: subGroupRole.equals("RESPONSABLE") = true
📡 URL complète: http://localhost:8081/api/users/69e00dbebf596604ae458ed9/role
📦 Nouveau rôle: Responsable media
📦 UserId: 69e00dbebf596604ae458ed9
📤 Envoi de la requête PUT...
✅ Rôle mis à jour dans le service User: Responsable media
📡 Réponse: 200 OK
📄 Body: {"id":"69e00dbebf596604ae458ed9","role":"Responsable media",...}
✅ Club sauvegardé
```

**❌ Si vous voyez:**
```
⚠️ SubGroupRole n'est PAS 'RESPONSABLE', c'est: 'MEMBRE_COMITE'
```
→ Vous avez sélectionné "Membre du comité" au lieu de "Responsable"

**❌ Si vous ne voyez AUCUN log "🔍 Appel du service User":**
→ Le code n'entre pas dans le bloc `if (subGroupRole.equals("RESPONSABLE"))`
→ Vérifiez que vous avez bien sélectionné "👑 Responsable" dans le formulaire

---

### Étape 4: Vérifier le formulaire d'assignation

**Dans le frontend, vérifiez que le formulaire envoie bien "RESPONSABLE":**

Ouvrez la console du navigateur (F12) et tapez:

```javascript
// Vérifier la valeur du formulaire
console.log(this.assignForm.value);
```

**Résultat attendu:**
```javascript
{
  userId: "69e00dbebf596604ae458ed9",
  subGroupId: "71b1d6ee-8767-4602-af42-d5bfd961d692",
  subGroupRole: "RESPONSABLE"  // ✅ Doit être "RESPONSABLE" en majuscules
}
```

**❌ Si vous voyez:**
```javascript
{
  subGroupRole: "Responsable"  // ❌ Avec majuscule au début
}
```
→ Le problème est dans le formulaire HTML

---

### Étape 5: Vérifier le HTML du formulaire

**Fichier:** `Front/src/app/pages/clubs/club-detail/club-detail.component.html`

Cherchez le formulaire d'assignation:

```html
<select formControlName="subGroupRole">
  <option value="MEMBRE_COMITE">📋 Membre du comité</option>
  <option value="RESPONSABLE">👑 Responsable</option>  <!-- ✅ Doit être "RESPONSABLE" -->
</select>
```

**❌ INCORRECT:**
```html
<option value="Responsable">👑 Responsable</option>  <!-- ❌ Avec majuscule -->
```

---

### Étape 6: Vérifier la requête HTTP

**Ouvrez les DevTools du navigateur (F12) → Onglet Network**

1. Faites l'assignation
2. Cherchez la requête `PUT /api/clubs/.../members/.../subgroup/...`
3. Cliquez dessus
4. Regardez l'onglet "Payload" ou "Request"

**Payload attendu:**
```json
{
  "subGroupRole": "RESPONSABLE"
}
```

**❌ Si vous voyez:**
```json
{
  "subGroupRole": "MEMBRE_COMITE"
}
```
→ Vous avez sélectionné le mauvais rôle dans le formulaire

---

## 🎯 Scénarios Possibles

### Scénario 1: Tout fonctionne ✅

**Logs:**
```
✅ Rôle mis à jour dans le service User: Responsable media
📡 Réponse: 200 OK
```

**MongoDB:**
```javascript
db.users.findOne({ _id: "69e00dbebf596604ae458ed9" })
// { "role": "Responsable media" }  ✅
```

**Action:** Rien à faire, tout fonctionne!

---

### Scénario 2: Mauvais rôle sélectionné ❌

**Logs:**
```
⚠️ SubGroupRole n'est PAS 'RESPONSABLE', c'est: 'MEMBRE_COMITE'
```

**Cause:** Vous avez sélectionné "📋 Membre du comité" au lieu de "👑 Responsable"

**Solution:** Refaites l'assignation en sélectionnant "👑 Responsable"

---

### Scénario 3: Aucun log d'appel REST ❌

**Logs:**
```
✅ ResponsableId mis à jour: 69e00dbebf596604ae458ed9
✅ Club sauvegardé
(Pas de log "🔍 Appel du service User")
```

**Cause:** Le Club Service n'a pas été redémarré après les modifications

**Solution:** Redémarrez le Club Service

---

### Scénario 4: Erreur lors de l'appel REST ❌

**Logs:**
```
❌ Erreur lors de la mise à jour du rôle dans User service: Connection refused
```

**Cause:** User Service n'est pas démarré

**Solution:**
```bash
cd Club-Hub-Voice-Channel-Management/User/ClubHub
mvn spring-boot:run
```

---

### Scénario 5: Erreur 404 ❌

**Logs:**
```
❌ Erreur: 404 Not Found
```

**Cause:** L'URL est incorrecte

**Solution:** Vérifiez dans `ClubService.java`:
```java
private String userServiceUrl = "http://localhost:8081/api/users";  // ✅ Avec /api
```

---

## 📋 Checklist Complète

- [ ] User Service démarré (port 8081)
- [ ] Club Service démarré (port 8083) **APRÈS les modifications**
- [ ] Gateway démarré (port 8084)
- [ ] Frontend démarré (port 4200)
- [ ] Formulaire HTML a `value="RESPONSABLE"` (pas "Responsable")
- [ ] Sélection de "👑 Responsable" dans le formulaire (pas "📋 Membre du comité")
- [ ] Logs du Club Service affichent "🔍 Appel du service User"
- [ ] Logs du Club Service affichent "✅ Rôle mis à jour"
- [ ] MongoDB users collection mise à jour

---

## 🧪 Test Manuel Rapide

**Si vous voulez tester sans passer par l'interface:**

```powershell
# 1. Tester l'endpoint directement
$userId = "69e00dbebf596604ae458ed9"
$url = "http://localhost:8081/api/users/$userId/role"
$body = @{ role = "Responsable media" } | ConvertTo-Json

Invoke-WebRequest -Uri $url -Method PUT -Body $body -ContentType "application/json" -UseBasicParsing

# 2. Vérifier le résultat
Invoke-WebRequest -Uri "http://localhost:8081/api/users/$userId" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Résultat attendu:**
```json
{
  "id": "69e00dbebf596604ae458ed9",
  "role": "Responsable media"  // ✅ Changé
}
```

---

## 🎉 Résultat Final

Une fois que tout fonctionne:

1. ✅ Assignez un membre comme RESPONSABLE
2. ✅ Logs affichent "✅ Rôle mis à jour dans le service User"
3. ✅ MongoDB users: `{ "role": "Responsable media" }`
4. ✅ Déconnectez-vous et reconnectez-vous avec ce membre
5. ✅ Il voit les boutons de gestion de SON comité
6. ✅ Il ne voit PAS les boutons pour les autres comités

Le système fonctionne! 🚀

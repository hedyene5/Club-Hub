# 🧪 Test de la Logique Correcte

## 🚀 Démarrage

### 1. Redémarrer les services

```powershell
# Club Service
cd ClubHub
./mvnw spring-boot:run

# Frontend (dans un autre terminal)
cd Club-Hub-Voice-Channel-Management/User/Front
npm start
```

---

## ✅ Test 1: Mode SINGLE_ONLY

### Configuration
```javascript
// Dans MongoDB
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "SINGLE_ONLY" } }
)
```

### Test A: Un membre, un seul comité
```
1. Ouvrir http://localhost:4200
2. Aller sur le club "enactus"
3. Assigner "Alice" au comité "Event" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

4. Essayer d'assigner "Alice" au comité "Media" (MEMBRE_COMITE)
   → ❌ Doit afficher:
   "Ce club n'autorise qu'un seul comité par membre.
    Le membre est déjà dans le comité 'Event'."
```

### Test B: Même règle pour les responsables
```
1. Assigner "Bob" au comité "Media" (RESPONSABLE)
   → ✅ Doit fonctionner

2. Essayer d'assigner "Bob" au comité "Technique" (MEMBRE_COMITE)
   → ❌ Doit afficher la même erreur
```

### Test C: Changer de comité
```
1. Retirer "Alice" du comité "Event"
   → ✅ Doit fonctionner

2. Assigner "Alice" au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner maintenant
```

---

## ✅ Test 2: Mode MULTIPLE_ALLOWED - Membre de plusieurs comités

### Configuration
```javascript
// Dans MongoDB
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "MULTIPLE_ALLOWED" } }
)
```

### Test A: Membre dans plusieurs comités
```
1. Recharger la page (F5)
2. Assigner "Charlie" au comité "Event" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

3. Assigner "Charlie" au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

4. Assigner "Charlie" au comité "Technique" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

5. Vérifier: Charlie apparaît dans les 3 comités
```

---

## ✅ Test 3: Mode MULTIPLE_ALLOWED - Responsable + Membre

### Test A: Responsable d'un comité + membre d'autres
```
1. Assigner "David" au comité "Event" (RESPONSABLE)
   → ✅ Doit fonctionner

2. Assigner "David" au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

3. Assigner "David" au comité "Technique" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

4. Vérifier:
   - David est RESPONSABLE de "Event"
   - David est MEMBRE_COMITE de "Media"
   - David est MEMBRE_COMITE de "Technique"
```

---

## ✅ Test 4: Mode MULTIPLE_ALLOWED - Double responsabilité INTERDITE

### Test A: Tentative de double responsabilité
```
1. Assigner "Eve" au comité "Event" (RESPONSABLE)
   → ✅ Doit fonctionner

2. Essayer d'assigner "Eve" au comité "Media" (RESPONSABLE)
   → ❌ Doit afficher:
   "Un membre ne peut être RESPONSABLE que d'UN SEUL comité.
    Ce membre est déjà responsable du comité 'Event'.
    Il peut rejoindre ce comité en tant que MEMBRE_COMITE."
```

### Test B: Solution - Membre au lieu de responsable
```
1. Assigner "Eve" au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

2. Vérifier:
   - Eve est RESPONSABLE de "Event"
   - Eve est MEMBRE_COMITE de "Media"
```

---

## 📊 Checklist de Validation

### Mode SINGLE_ONLY
- [ ] Un membre ne peut être que dans un seul comité
- [ ] Erreur claire si tentative d'assignation à un 2ème comité
- [ ] Peut changer de comité après retrait
- [ ] Règle s'applique aux RESPONSABLES aussi

### Mode MULTIPLE_ALLOWED
- [ ] Un membre peut être dans plusieurs comités
- [ ] Un membre peut être RESPONSABLE d'un seul comité
- [ ] Un membre peut être MEMBRE de plusieurs comités
- [ ] Erreur claire si tentative de double responsabilité
- [ ] Responsable + Membre fonctionne correctement

---

## 🎨 Messages d'Erreur Attendus

### SINGLE_ONLY
```
❌ Ce club n'autorise qu'un seul comité par membre.

Le membre est déjà dans le comité "Event".

Veuillez d'abord le retirer de ce comité.
```

### MULTIPLE_ALLOWED - Double responsabilité
```
❌ Un membre ne peut être RESPONSABLE que d'UN SEUL comité.

Ce membre est déjà responsable du comité "Event".

Il peut rejoindre ce comité en tant que MEMBRE_COMITE.
```

---

## 🐛 Vérification dans MongoDB

### Voir les comités d'un membre

```javascript
db.clubs.findOne(
  { name: "enactus" },
  { 
    "members": { 
      $elemMatch: { name: "Charlie" } 
    },
    "subGroups": 1
  }
)
```

### Voir les responsables de chaque comité

```javascript
db.clubs.findOne(
  { name: "enactus" },
  { 
    "subGroups.name": 1,
    "subGroups.responsableId": 1
  }
)
```

---

## ✅ Résultat Attendu

Si tous les tests passent:

1. ✅ Mode SINGLE_ONLY empêche plusieurs comités
2. ✅ Mode MULTIPLE_ALLOWED permet plusieurs comités
3. ✅ Mode MULTIPLE_ALLOWED empêche double responsabilité
4. ✅ Messages d'erreur clairs et explicites
5. ✅ Validation frontend ET backend

---

## 🎉 Félicitations!

La logique est correctement implémentée et testée! 🚀

Consultez `LOGIQUE_CORRECTE_COMITES.md` pour la documentation complète.

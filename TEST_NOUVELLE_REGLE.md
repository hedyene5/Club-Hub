# 🧪 Test de la Nouvelle Règle

## 🎯 Règle à Tester

**Mode MULTIPLE_ALLOWED:** Un RESPONSABLE de comité ne peut être MEMBRE d'aucun autre comité.

---

## ✅ Services Démarrés

- ✅ User Service: Port 8081
- ✅ Club Service: Port 8083 (redémarré avec la nouvelle règle)
- ⚠️ Frontend: À redémarrer pour appliquer les changements

---

## 🚀 Démarrage

### Redémarrer le Frontend

```powershell
cd Club-Hub-Voice-Channel-Management/User/Front
npm start
```

---

## 🧪 Test 1: Responsable ne peut pas être membre d'un autre comité

### Configuration
```javascript
// Dans MongoDB
db.clubs.updateOne(
  { name: "enactus" },
  { $set: { "rules.committeeMembershipMode": "MULTIPLE_ALLOWED" } }
)
```

### Étapes
```
1. Ouvrir http://localhost:4200
2. Aller sur le club "enactus"
3. Recharger la page (F5)

4. Assigner "Alice" au comité "Event" (RESPONSABLE)
   → ✅ Doit fonctionner

5. Essayer d'assigner "Alice" au comité "Media" (MEMBRE_COMITE)
   → ❌ Doit afficher:
   "Un RESPONSABLE de comité ne peut être MEMBRE d'aucun autre comité.
    Ce membre est responsable du comité 'Event'.
    Un responsable reste uniquement responsable de son comité."
```

---

## 🧪 Test 2: Membre ne peut pas devenir responsable s'il est dans d'autres comités

### Étapes
```
1. Assigner "Bob" au comité "Event" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

2. Assigner "Bob" au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

3. Essayer d'assigner "Bob" au comité "Technique" (RESPONSABLE)
   → ❌ Doit afficher:
   "Ce membre est déjà membre du comité 'Event'.
    Pour devenir RESPONSABLE d'un comité, il doit d'abord quitter tous les autres comités."
```

---

## 🧪 Test 3: Membre de plusieurs comités (sans être responsable)

### Étapes
```
1. Assigner "Charlie" au comité "Event" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

2. Assigner "Charlie" au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

3. Assigner "Charlie" au comité "Technique" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

4. Vérifier: Charlie apparaît dans les 3 comités
```

---

## 🧪 Test 4: Membre devient responsable après avoir quitté les autres comités

### Étapes
```
1. Bob est MEMBRE de "Event" et "Media"

2. Retirer Bob du comité "Event"
   → ✅ Doit fonctionner

3. Retirer Bob du comité "Media"
   → ✅ Doit fonctionner

4. Assigner Bob au comité "Technique" (RESPONSABLE)
   → ✅ Doit fonctionner maintenant

5. Vérifier: Bob est uniquement RESPONSABLE de "Technique"
```

---

## 📊 Tableau Récapitulatif

| Scénario | Résultat Attendu |
|----------|------------------|
| Responsable → Membre autre comité | ❌ Erreur |
| Membre plusieurs comités → Responsable | ❌ Erreur |
| Membre plusieurs comités (sans responsable) | ✅ OK |
| Membre quitte tous → Responsable | ✅ OK |
| Responsable d'un seul comité | ✅ OK |

---

## 🎨 Messages d'Erreur Attendus

### Responsable essaie de rejoindre un autre comité
```
❌ Un RESPONSABLE de comité ne peut être MEMBRE d'aucun autre comité.

Ce membre est responsable du comité "Event".

Un responsable reste uniquement responsable de son comité.
```

### Membre essaie de devenir responsable
```
❌ Ce membre est déjà membre du comité "Event".

Pour devenir RESPONSABLE d'un comité, il doit d'abord quitter tous les autres comités.
```

---

## ✅ Checklist de Validation

- [ ] Responsable ne peut pas être membre d'un autre comité
- [ ] Membre de plusieurs comités ne peut pas devenir responsable
- [ ] Membre peut être dans plusieurs comités (sans être responsable)
- [ ] Membre peut devenir responsable après avoir quitté tous les comités
- [ ] Messages d'erreur clairs et explicites

---

## 🐛 Vérification dans MongoDB

### Voir les comités d'un membre

```javascript
db.clubs.findOne(
  { name: "enactus" },
  { 
    "members": { 
      $elemMatch: { name: "Alice" } 
    },
    "subGroups": 1
  }
)
```

### Voir les responsables

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

## 🎉 Résultat Attendu

Si tous les tests passent:

1. ✅ Un RESPONSABLE reste uniquement responsable de son comité
2. ✅ Un RESPONSABLE ne peut PAS être membre d'autres comités
3. ✅ Un membre ne peut devenir RESPONSABLE que s'il n'est dans aucun autre comité
4. ✅ Un membre peut être dans plusieurs comités (sans être responsable)
5. ✅ Messages d'erreur clairs

---

## 📚 Documentation

- `NOUVELLE_REGLE_RESPONSABLE.md` - Documentation complète de la nouvelle règle
- `LOGIQUE_CORRECTE_COMITES.md` - Documentation de toutes les règles
- `TEST_LOGIQUE_CORRECTE.md` - Tests de toutes les règles

---

## 🚀 Prochaines Étapes

1. Redémarrer le Frontend
2. Tester les 4 scénarios ci-dessus
3. Vérifier les messages d'erreur

La nouvelle règle est maintenant implémentée! 🎉

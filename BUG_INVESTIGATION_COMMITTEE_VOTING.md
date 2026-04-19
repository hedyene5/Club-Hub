# 🔍 Investigation - Bug Vote Entre Comités

## 🐛 Bug Rapporté

**Symptôme:** En mode COMMITTEE_MEMBERS_ONLY, un membre d'un comité peut voter pour un AUTRE comité.

**Exemple:**
- Alice est membre du comité Event
- Alice peut voter pour le responsable Media ❌ (ne devrait pas être possible)

---

## 🔍 Analyse du Code Actuel

### Validation dans `castVote()`

```java
if (votingMode == VotingMode.COMMITTEE_MEMBERS_ONLY) {
    // Vérifier que le voteur est membre du comité pour lequel il vote
    boolean isInSubGroup = isVoterInSubGroup(club, vote.getVoterId(), subGroupId);
    if (!isInSubGroup) {
        throw new RuntimeException("Vous ne pouvez voter que pour votre propre comité...");
    }
}
```

### Méthode `isVoterInSubGroup()`

```java
private boolean isVoterInSubGroup(Club club, String voterId, String subGroupId) {
    return club.getSubGroups().stream()
            .filter(sg -> sg.getId().equals(subGroupId))
            .anyMatch(sg -> sg.getMemberIds() != null && sg.getMemberIds().contains(voterId));
}
```

### Logique

1. Le candidat a un `subGroupTarget` (ex: "Media")
2. On trouve le `subGroupId` correspondant
3. On vérifie si `voterId` est dans `subGroup.memberIds` de ce comité
4. Si NON → Erreur (ne peut pas voter)
5. Si OUI → Vote autorisé

---

## 🧪 Test Théorique

### Scénario

**Club:**
- Comité Event (id: "sg-event")
  - memberIds: ["alice", "bob"]
- Comité Media (id: "sg-media")
  - memberIds: ["charlie", "david"]

**Élection:**
- Mode: COMMITTEE_MEMBERS_ONLY
- Candidats:
  - Bob pour Event
  - Charlie pour Media

**Test 1: Alice vote pour Bob (Event)**
```
voterId = "alice"
candidateId = "bob"
subGroupTarget = "Event"
subGroupId = "sg-event"

isVoterInSubGroup(club, "alice", "sg-event")
→ sg-event.memberIds.contains("alice") → true ✅
→ Vote autorisé ✅
```

**Test 2: Alice vote pour Charlie (Media)**
```
voterId = "alice"
candidateId = "charlie"
subGroupTarget = "Media"
subGroupId = "sg-media"

isVoterInSubGroup(club, "alice", "sg-media")
→ sg-media.memberIds.contains("alice") → false ❌
→ Erreur: "Vous ne pouvez voter que pour votre propre comité..." ✅
```

---

## 🤔 Pourquoi le Bug Pourrait Se Produire ?

### Hypothèse 1: Problème de Données

**Possibilité:** Alice est dans les `memberIds` des DEUX comités

```json
{
  "subGroups": [
    {
      "id": "sg-event",
      "name": "Event",
      "memberIds": ["alice", "bob"]
    },
    {
      "id": "sg-media",
      "name": "Media",
      "memberIds": ["alice", "charlie", "david"]  // ← Alice est aussi ici !
    }
  ]
}
```

**Résultat:** Alice peut voter pour Event ET Media car elle est membre des deux.

**Solution:** C'est le comportement CORRECT si Alice est vraiment membre des deux comités !

---

### Hypothèse 2: Frontend Ne Filtre Pas

**Possibilité:** Le frontend affiche TOUS les comités au lieu de filtrer

**Frontend devrait:**
1. Appeler `GET /api/elections/{id}/available-committees/{userId}`
2. Afficher UNIQUEMENT les comités où `canVote = true`

**Si le frontend affiche tous les comités:**
- Alice voit Event (son comité) ✅
- Alice voit Media (pas son comité) ❌
- Alice essaie de voter pour Media
- Backend bloque avec erreur ✅

**Résultat:** Le backend fonctionne, mais l'UX est mauvaise.

---

### Hypothèse 3: SubGroupId Incorrect

**Possibilité:** Le `subGroupId` n'est pas correctement défini dans le vote

**Code actuel:**
```java
String subGroupId = findSubGroupId(club, subGroupTarget);
vote.setSubGroupId(subGroupId);
```

**Si `findSubGroupId()` retourne le mauvais ID:**
- Le vote serait enregistré pour le mauvais comité
- La validation serait faite sur le mauvais comité

---

## 🔧 Tests à Effectuer

### Test 1: Vérifier les Données

**Requête:**
```
GET /api/clubs/{clubId}
```

**Vérifier:**
- Chaque membre est-il dans les `memberIds` du bon comité ?
- Y a-t-il des membres dans plusieurs comités (si MULTIPLE_ALLOWED) ?

---

### Test 2: Tester le Vote Backend Directement

**Requête:**
```
POST /api/elections/{electionId}/vote
{
  "voterId": "alice",
  "candidateId": "charlie",  // Candidat du comité Media
  "subGroupId": null  // Sera défini par le backend
}
```

**Résultat attendu:**
- Si Alice n'est PAS membre de Media → Erreur ✅
- Si Alice EST membre de Media → Vote accepté ✅

---

### Test 3: Tester l'API Available Committees

**Requête:**
```
GET /api/elections/{electionId}/available-committees/alice
```

**Résultat attendu:**
```json
{
  "votingMode": "COMMITTEE_MEMBERS_ONLY",
  "canVote": true,
  "availableCommittees": [
    {
      "committeeName": "Event",
      "canVote": true,
      "reason": "Vous pouvez voter (membre du comité)"
    },
    {
      "committeeName": "Media",
      "canVote": false,
      "reason": "Vous devez être membre de ce comité"
    }
  ]
}
```

---

## 📝 Prochaines Étapes

1. **Vérifier les données du club** - S'assurer que les `memberIds` sont corrects
2. **Tester le vote backend** - Essayer de voter pour un autre comité via API
3. **Vérifier le frontend** - S'assurer qu'il utilise `available-committees`
4. **Logs backend** - Regarder les logs lors d'un vote problématique

---

## 🎯 Conclusion Préliminaire

Le code backend semble correct. Le bug pourrait être :
1. **Données incorrectes** - Membre dans plusieurs comités
2. **Frontend** - N'utilise pas l'API de filtrage
3. **Autre** - À investiguer avec des tests réels


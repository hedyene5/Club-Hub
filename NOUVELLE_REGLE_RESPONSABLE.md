# 🆕 Nouvelle Règle: Responsable Exclusif

## 🎯 Règle Ajoutée

En mode **MULTIPLE_ALLOWED**, une nouvelle règle a été ajoutée:

**Un RESPONSABLE de comité ne peut être MEMBRE d'AUCUN autre comité.**

Un responsable reste uniquement responsable de son comité.

---

## 📋 Règles Complètes - Mode MULTIPLE_ALLOWED

### Règle 1: Plusieurs comités autorisés
✅ Un membre peut être dans plusieurs comités

### Règle 2: Un seul comité en tant que responsable
❌ Un membre ne peut être RESPONSABLE que d'UN SEUL comité

### Règle 3: Responsable exclusif (NOUVELLE)
❌ Un RESPONSABLE ne peut être MEMBRE d'aucun autre comité

---

## 🎨 Exemples

### ✅ AUTORISÉ - Membre de plusieurs comités

```
Alice → Comité "Event" (MEMBRE_COMITE)
Alice → Comité "Media" (MEMBRE_COMITE)
Alice → Comité "Technique" (MEMBRE_COMITE)
```

### ✅ AUTORISÉ - Responsable d'un seul comité

```
Bob → Comité "Event" (RESPONSABLE)
```

### ❌ INTERDIT - Responsable + Membre

```
Charlie → Comité "Event" (RESPONSABLE)
Charlie → Comité "Media" (MEMBRE_COMITE)  ❌ IMPOSSIBLE
```

**Message d'erreur:**
```
❌ Un RESPONSABLE de comité ne peut être MEMBRE d'aucun autre comité.

Ce membre est responsable du comité "Event".

Un responsable reste uniquement responsable de son comité.
```

### ❌ INTERDIT - Membre puis Responsable

```
David → Comité "Media" (MEMBRE_COMITE)
David → Comité "Event" (RESPONSABLE)  ❌ IMPOSSIBLE
```

**Message d'erreur:**
```
❌ Ce membre est déjà membre du comité "Media".

Pour devenir RESPONSABLE d'un comité, il doit d'abord quitter tous les autres comités.
```

---

## 🔄 Scénarios Détaillés

### Scénario 1: Membre devient Responsable

```
1. Alice est MEMBRE du comité "Event"
2. Alice est MEMBRE du comité "Media"
3. On essaie de faire Alice RESPONSABLE du comité "Technique"
4. ❌ Erreur: Alice doit d'abord quitter "Event" et "Media"
5. Retirer Alice de "Event"
6. Retirer Alice de "Media"
7. Assigner Alice comme RESPONSABLE de "Technique"
8. ✅ Succès: Alice est maintenant RESPONSABLE de "Technique" uniquement
```

### Scénario 2: Responsable essaie de rejoindre un autre comité

```
1. Bob est RESPONSABLE du comité "Event"
2. On essaie d'assigner Bob au comité "Media" comme MEMBRE
3. ❌ Erreur: Un responsable ne peut pas être membre d'autres comités
4. Bob reste uniquement RESPONSABLE de "Event"
```

### Scénario 3: Membre de plusieurs comités (OK)

```
1. Charlie est MEMBRE du comité "Event"
2. Charlie rejoint le comité "Media" comme MEMBRE
3. Charlie rejoint le comité "Technique" comme MEMBRE
4. ✅ Succès: Charlie est membre de 3 comités
```

---

## 🧪 Tests à Effectuer

### Test 1: Responsable ne peut pas être membre

```
1. Configurer le club en mode MULTIPLE_ALLOWED
2. Assigner Alice au comité "Event" (RESPONSABLE)
   → ✅ Doit fonctionner

3. Essayer d'assigner Alice au comité "Media" (MEMBRE_COMITE)
   → ❌ Doit afficher:
   "Un RESPONSABLE de comité ne peut être MEMBRE d'aucun autre comité.
    Ce membre est responsable du comité 'Event'."
```

### Test 2: Membre ne peut pas devenir responsable s'il est dans d'autres comités

```
1. Assigner Bob au comité "Event" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

2. Assigner Bob au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

3. Essayer d'assigner Bob au comité "Technique" (RESPONSABLE)
   → ❌ Doit afficher:
   "Ce membre est déjà membre du comité 'Event'.
    Pour devenir RESPONSABLE, il doit d'abord quitter tous les autres comités."
```

### Test 3: Membre de plusieurs comités (sans être responsable)

```
1. Assigner Charlie au comité "Event" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

2. Assigner Charlie au comité "Media" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

3. Assigner Charlie au comité "Technique" (MEMBRE_COMITE)
   → ✅ Doit fonctionner

4. Vérifier: Charlie est membre de 3 comités
```

---

## 📊 Tableau Récapitulatif

| Rôle | Peut être dans plusieurs comités | Exemple |
|------|-----------------------------------|---------|
| **MEMBRE_COMITE** | ✅ Oui | Alice: Event + Media + Technique |
| **RESPONSABLE** | ❌ Non (uniquement son comité) | Bob: Event uniquement |

---

## 🎨 Messages d'Erreur

### Responsable essaie de rejoindre un autre comité

```
❌ Un RESPONSABLE de comité ne peut être MEMBRE d'aucun autre comité.

Ce membre est responsable du comité "Event".

Un responsable reste uniquement responsable de son comité.
```

### Membre essaie de devenir responsable

```
❌ Ce membre est déjà membre du comité "Media".

Pour devenir RESPONSABLE d'un comité, il doit d'abord quitter tous les autres comités.
```

---

## 🔧 Implémentation

### Backend (ClubService.java)

**RÈGLE 3 ajoutée:**
```java
// ✅ RÈGLE 3: Mode MULTIPLE_ALLOWED - Un RESPONSABLE ne peut être MEMBRE d'aucun autre comité
if (mode == CommitteeMembershipMode.MULTIPLE_ALLOWED) {
    // Vérifier si le membre est déjà responsable d'un comité
    boolean isResponsableOfAnotherCommittee = club.getSubGroups().stream()
            .anyMatch(sg -> !sg.getId().equals(subGroupId) && userId.equals(sg.getResponsableId()));
    
    if (isResponsableOfAnotherCommittee) {
        throw new RuntimeException("Un RESPONSABLE de comité ne peut être MEMBRE d'aucun autre comité...");
    }
    
    // Vérifier si on essaie de rendre responsable quelqu'un qui est déjà membre d'autres comités
    if (subGroupRole.equals("RESPONSABLE") && member.getSubGroupId() != null && !member.getSubGroupId().equals(subGroupId)) {
        throw new RuntimeException("Ce membre est déjà membre d'un autre comité...");
    }
}
```

### Frontend (club-detail.component.ts)

**RÈGLE 3 ajoutée:**
```typescript
// ✅ RÈGLE 3: Mode MULTIPLE_ALLOWED - Un RESPONSABLE ne peut être MEMBRE d'aucun autre comité
if (mode === 'MULTIPLE_ALLOWED') {
  const isResponsableOfAnotherCommittee = this.club.subGroups.some(sg => 
    sg.id !== subGroupId && sg.responsableId === userId
  );
  
  if (isResponsableOfAnotherCommittee) {
    alert('❌ Un RESPONSABLE de comité ne peut être MEMBRE d\'aucun autre comité...');
    return;
  }
  
  if (subGroupRole === 'RESPONSABLE') {
    const member = this.club.members.find(m => m.userId === userId);
    if (member && member.subGroupId && member.subGroupId !== subGroupId) {
      alert('❌ Ce membre est déjà membre d\'un autre comité...');
      return;
    }
  }
}
```

---

## 📝 Fichiers Modifiés

### Backend
- `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`
  - Ajout de la RÈGLE 3

### Frontend
- `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`
  - Ajout de la RÈGLE 3
- `Front/src/app/pages/clubs/club-form/club-form.component.ts`
  - Mise à jour de la description
- `Front/src/app/pages/clubs/club-detail/club-detail.component.html`
  - Mise à jour de l'affichage

---

## ✅ Résumé

La nouvelle règle est maintenant implémentée:

1. ✅ Un RESPONSABLE reste uniquement responsable de son comité
2. ✅ Un RESPONSABLE ne peut PAS être membre d'autres comités
3. ✅ Un membre ne peut devenir RESPONSABLE que s'il n'est dans aucun autre comité
4. ✅ Validation backend ET frontend
5. ✅ Messages d'erreur clairs

---

## 🚀 Prochaines Étapes

1. Redémarrer le Club Service
2. Redémarrer le Frontend
3. Tester les 3 scénarios ci-dessus
4. Vérifier les messages d'erreur

La règle est maintenant complète! 🎉

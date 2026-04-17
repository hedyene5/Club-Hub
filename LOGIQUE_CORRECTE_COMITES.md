# ✅ Logique Correcte - Gestion des Comités

## 🎯 Règles Implémentées

---

## 📋 Mode SINGLE_ONLY (Un seul comité par membre)

### Règle Principale
**Un membre ne peut être que dans UN SEUL comité, peu importe son rôle**

### Exemples

✅ **AUTORISÉ:**
```
Alice → Comité "Event" (MEMBRE_COMITE)
Alice → Comité "Media" (IMPOSSIBLE - déjà dans Event)
```

✅ **AUTORISÉ:**
```
Bob → Comité "Media" (RESPONSABLE)
Bob → Comité "Technique" (IMPOSSIBLE - déjà dans Media)
```

### Pour Changer de Comité
```
1. Retirer Alice du comité "Event"
2. Assigner Alice au comité "Media"
```

### Validation Backend
```java
if (mode == CommitteeMembershipMode.SINGLE_ONLY) {
    if (member.getSubGroupId() != null && !member.getSubGroupId().equals(subGroupId)) {
        throw new RuntimeException("Ce club n'autorise qu'un seul comité par membre...");
    }
}
```

### Validation Frontend
```typescript
if (mode === 'SINGLE_ONLY') {
  const member = this.club.members.find(m => m.userId === userId);
  if (member && member.subGroupId && member.subGroupId !== subGroupId) {
    alert('❌ Ce club n'autorise qu'un seul comité par membre...');
    return;
  }
}
```

---

## 📋 Mode MULTIPLE_ALLOWED (Plusieurs comités possibles)

### Règles Principales

1. **Un membre peut être dans plusieurs comités**
2. **MAIS: Un membre ne peut être RESPONSABLE que d'UN SEUL comité**
3. **Ajouter à un comité ne modifie PAS son rôle dans les autres comités**

### Exemples

✅ **AUTORISÉ:**
```
Alice → Comité "Event" (RESPONSABLE)
Alice → Comité "Media" (MEMBRE_COMITE)  ✅ OK
Alice → Comité "Technique" (MEMBRE_COMITE)  ✅ OK
```

❌ **INTERDIT:**
```
Bob → Comité "Event" (RESPONSABLE)
Bob → Comité "Media" (RESPONSABLE)  ❌ IMPOSSIBLE
```

✅ **SOLUTION:**
```
Bob → Comité "Event" (RESPONSABLE)
Bob → Comité "Media" (MEMBRE_COMITE)  ✅ OK
```

### Scénarios Détaillés

#### Scénario 1: Responsable + Membre
```
1. Alice est RESPONSABLE du comité "Event"
2. Alice rejoint le comité "Media" comme MEMBRE_COMITE
3. ✅ Résultat:
   - Alice reste RESPONSABLE de "Event"
   - Alice est MEMBRE_COMITE de "Media"
```

#### Scénario 2: Tentative de double responsabilité
```
1. Bob est RESPONSABLE du comité "Event"
2. Bob essaie de devenir RESPONSABLE du comité "Media"
3. ❌ Erreur: "Un membre ne peut être RESPONSABLE que d'UN SEUL comité"
4. 💡 Solution: Bob peut rejoindre "Media" comme MEMBRE_COMITE
```

#### Scénario 3: Membre de plusieurs comités
```
1. Charlie est MEMBRE_COMITE du comité "Event"
2. Charlie rejoint le comité "Media" comme MEMBRE_COMITE
3. Charlie rejoint le comité "Technique" comme MEMBRE_COMITE
4. ✅ Résultat: Charlie est membre de 3 comités
```

### Validation Backend
```java
// RÈGLE 2: Mode MULTIPLE_ALLOWED - Un membre peut être RESPONSABLE d'UN SEUL comité
if (mode == CommitteeMembershipMode.MULTIPLE_ALLOWED && subGroupRole.equals("RESPONSABLE")) {
    boolean isAlreadyResponsable = club.getSubGroups().stream()
            .anyMatch(sg -> !sg.getId().equals(subGroupId) && userId.equals(sg.getResponsableId()));
    
    if (isAlreadyResponsable) {
        throw new RuntimeException("Un membre ne peut être RESPONSABLE que d'UN SEUL comité...");
    }
}
```

### Validation Frontend
```typescript
// RÈGLE 2: Mode MULTIPLE_ALLOWED - Un membre peut être RESPONSABLE d'UN SEUL comité
if (mode === 'MULTIPLE_ALLOWED' && subGroupRole === 'RESPONSABLE') {
  const isAlreadyResponsable = this.club.subGroups.some(sg => 
    sg.id !== subGroupId && sg.responsableId === userId
  );
  
  if (isAlreadyResponsable) {
    alert('❌ Un membre ne peut être RESPONSABLE que d\'UN SEUL comité...');
    return;
  }
}
```

---

## 🧪 Tests à Effectuer

### Test 1: Mode SINGLE_ONLY

```
1. Créer un club avec mode "SINGLE_ONLY"
2. Assigner Alice au comité "Event" → ✅
3. Essayer d'assigner Alice au comité "Media" → ❌ Erreur
4. Retirer Alice du comité "Event"
5. Assigner Alice au comité "Media" → ✅
```

### Test 2: Mode MULTIPLE_ALLOWED - Membre de plusieurs comités

```
1. Créer un club avec mode "MULTIPLE_ALLOWED"
2. Assigner Bob au comité "Event" (MEMBRE_COMITE) → ✅
3. Assigner Bob au comité "Media" (MEMBRE_COMITE) → ✅
4. Assigner Bob au comité "Technique" (MEMBRE_COMITE) → ✅
5. Vérifier: Bob est dans 3 comités
```

### Test 3: Mode MULTIPLE_ALLOWED - Responsable + Membre

```
1. Créer un club avec mode "MULTIPLE_ALLOWED"
2. Assigner Charlie au comité "Event" (RESPONSABLE) → ✅
3. Assigner Charlie au comité "Media" (MEMBRE_COMITE) → ✅
4. Vérifier:
   - Charlie est RESPONSABLE de "Event"
   - Charlie est MEMBRE_COMITE de "Media"
```

### Test 4: Mode MULTIPLE_ALLOWED - Double responsabilité interdite

```
1. Créer un club avec mode "MULTIPLE_ALLOWED"
2. Assigner David au comité "Event" (RESPONSABLE) → ✅
3. Essayer d'assigner David au comité "Media" (RESPONSABLE) → ❌ Erreur
4. Assigner David au comité "Media" (MEMBRE_COMITE) → ✅
```

---

## 📊 Tableau Récapitulatif

| Mode | Plusieurs Comités | Plusieurs Responsabilités | Exemple |
|------|-------------------|---------------------------|---------|
| **SINGLE_ONLY** | ❌ Non | ❌ Non | Alice dans "Event" uniquement |
| **MULTIPLE_ALLOWED** | ✅ Oui | ❌ Non | Bob RESPONSABLE "Event" + MEMBRE "Media" |

---

## 🎨 Messages d'Erreur

### Mode SINGLE_ONLY
```
❌ Ce club n'autorise qu'un seul comité par membre.

Le membre est déjà dans le comité "Event".

Veuillez d'abord le retirer de ce comité.
```

### Mode MULTIPLE_ALLOWED - Double responsabilité
```
❌ Un membre ne peut être RESPONSABLE que d'UN SEUL comité.

Ce membre est déjà responsable du comité "Event".

Il peut rejoindre ce comité en tant que MEMBRE_COMITE.
```

---

## 🔄 Flux de Validation

### Backend (ClubService.java)

```
1. Récupérer le mode du club (SINGLE_ONLY ou MULTIPLE_ALLOWED)
2. Trouver le membre
3. SI mode == SINGLE_ONLY:
   - Vérifier si membre.subGroupId != null ET != subGroupId
   - Si oui → Erreur
4. SI mode == MULTIPLE_ALLOWED ET subGroupRole == "RESPONSABLE":
   - Vérifier si membre est déjà responsable d'un autre comité
   - Si oui → Erreur
5. Continuer l'assignation
```

### Frontend (club-detail.component.ts)

```
1. Récupérer le mode du club
2. SI mode == 'SINGLE_ONLY':
   - Vérifier si membre est déjà dans un autre comité
   - Si oui → Alert + return
3. SI mode == 'MULTIPLE_ALLOWED' ET subGroupRole == 'RESPONSABLE':
   - Vérifier si membre est déjà responsable d'un autre comité
   - Si oui → Alert + return
4. Appeler le backend
```

---

## ✅ Résultat Final

Les règles sont maintenant correctement implémentées:

1. ✅ **SINGLE_ONLY**: Un membre = un seul comité (peu importe le rôle)
2. ✅ **MULTIPLE_ALLOWED**: Un membre = plusieurs comités MAIS un seul en tant que RESPONSABLE
3. ✅ Validation backend ET frontend
4. ✅ Messages d'erreur clairs
5. ✅ Interface utilisateur mise à jour avec descriptions correctes

---

## 📚 Fichiers Modifiés

### Backend
- `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`
  - Ajout de la validation pour SINGLE_ONLY
  - Ajout de la validation pour MULTIPLE_ALLOWED (responsable unique)

### Frontend
- `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`
  - Ajout de la validation pour SINGLE_ONLY
  - Ajout de la validation pour MULTIPLE_ALLOWED (responsable unique)
- `Front/src/app/pages/clubs/club-form/club-form.component.ts`
  - Mise à jour des descriptions
- `Front/src/app/pages/clubs/club-detail/club-detail.component.html`
  - Mise à jour de l'affichage de la règle

---

## 🎉 Prochaines Étapes

1. Redémarrez le Club Service
2. Redémarrez le Frontend
3. Testez les 4 scénarios ci-dessus
4. Vérifiez que les messages d'erreur s'affichent correctement

La logique est maintenant complète et correcte! 🚀

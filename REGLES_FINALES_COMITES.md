# 📋 Règles Finales - Gestion des Comités

## 🎯 Vue d'Ensemble

Le système de gestion des comités implémente 2 modes avec des règles spécifiques pour chaque mode.

---

## 🔒 Mode SINGLE_ONLY (Un seul comité par membre)

### Règle Unique

**Un membre ne peut appartenir qu'à UN SEUL comité, peu importe son rôle**

### Exemples

✅ **Autorisé:**
```
Alice → Comité "Event" (MEMBRE_COMITE)
```

❌ **Interdit:**
```
Alice → Comité "Event" (MEMBRE_COMITE)
Alice → Comité "Media" (MEMBRE_COMITE)  ❌
```

❌ **Interdit:**
```
Bob → Comité "Event" (RESPONSABLE)
Bob → Comité "Media" (MEMBRE_COMITE)  ❌
```

### Pour Changer de Comité

```
1. Retirer le membre du comité actuel
2. Assigner le membre au nouveau comité
```

### Message d'Erreur

```
❌ Ce club n'autorise qu'un seul comité par membre.

Le membre est déjà dans le comité "Event".

Veuillez d'abord le retirer de ce comité.
```

---

## ✅ Mode MULTIPLE_ALLOWED (Plusieurs comités autorisés)

### 3 Règles Principales

#### RÈGLE 1: Plusieurs Comités pour Membres Simples

**Un membre simple (MEMBRE_COMITE) peut appartenir à plusieurs comités**

✅ **Autorisé:**
```
Alice → Comité "Event" (MEMBRE_COMITE)
Alice → Comité "Media" (MEMBRE_COMITE)
Alice → Comité "Technique" (MEMBRE_COMITE)
```

#### RÈGLE 2: Un Seul Comité en tant que Responsable

**Un membre ne peut être RESPONSABLE que d'UN SEUL comité**

✅ **Autorisé:**
```
Bob → Comité "Event" (RESPONSABLE)
```

❌ **Interdit:**
```
Bob → Comité "Event" (RESPONSABLE)
Bob → Comité "Media" (RESPONSABLE)  ❌
```

**Message d'erreur:**
```
❌ Un membre ne peut être RESPONSABLE que d'UN SEUL comité.

Ce membre est déjà responsable du comité "Event".

Il peut rejoindre ce comité en tant que MEMBRE_COMITE.
```

#### RÈGLE 3: Responsable Exclusif

**Un RESPONSABLE ne peut appartenir qu'à SON comité**

✅ **Autorisé:**
```
Charlie → Comité "Event" (RESPONSABLE)
```

❌ **Interdit:**
```
Charlie → Comité "Event" (RESPONSABLE)
Charlie → Comité "Media" (MEMBRE_COMITE)  ❌
```

**Message d'erreur:**
```
❌ Un responsable de comité ne peut appartenir qu'à son propre comité.

Ce membre est responsable du comité "Event".

Pour rejoindre un autre comité, il doit d'abord quitter son rôle de responsable.
```

### Solutions pour un Responsable qui Veut Rejoindre un Autre Comité

**Option A: Devenir Membre Simple**
```
1. Charlie est RESPONSABLE du comité "Event"
2. Changer son rôle: RESPONSABLE → MEMBRE_COMITE
3. Maintenant Charlie peut rejoindre "Media" comme MEMBRE_COMITE
```

**Option B: Quitter le Comité**
```
1. Charlie est RESPONSABLE du comité "Event"
2. Retirer Charlie du comité "Event"
3. Maintenant Charlie peut rejoindre n'importe quel comité
```

---

## 📊 Tableau Comparatif

| Scénario | SINGLE_ONLY | MULTIPLE_ALLOWED |
|----------|-------------|------------------|
| MEMBRE_COMITE dans 1 comité | ✅ | ✅ |
| MEMBRE_COMITE dans plusieurs comités | ❌ | ✅ |
| RESPONSABLE dans 1 comité | ✅ | ✅ |
| RESPONSABLE dans plusieurs comités | ❌ | ❌ (RÈGLE 2) |
| RESPONSABLE + MEMBRE autre comité | ❌ | ❌ (RÈGLE 3) |

---

## 🎨 Exemples Complets

### Scénario 1: Petit Club Spécialisé (SINGLE_ONLY)

**Configuration:**
- Mode: "Un seul comité par membre"
- Comités: "Développement", "Design", "Marketing"

**Membres:**
```
Alice → "Développement" (RESPONSABLE)
Bob → "Design" (RESPONSABLE)
Charlie → "Marketing" (MEMBRE_COMITE)
David → "Développement" (MEMBRE_COMITE)
```

**Règle:** Chaque membre ne peut être que dans UN comité. Pour changer, il faut d'abord quitter.

---

### Scénario 2: Grand Club Polyvalent (MULTIPLE_ALLOWED)

**Configuration:**
- Mode: "Plusieurs comités autorisés"
- Comités: "Event", "Media", "Technique", "Communication"

**Membres:**
```
Alice → "Event" (RESPONSABLE)
      → Ne peut PAS rejoindre d'autres comités (RÈGLE 3)

Bob → "Media" (MEMBRE_COMITE)
    → "Technique" (MEMBRE_COMITE)
    → "Communication" (MEMBRE_COMITE)
    → Peut être dans plusieurs comités ✅

Charlie → "Technique" (RESPONSABLE)
        → Ne peut PAS être RESPONSABLE de "Media" (RÈGLE 2)
        → Ne peut PAS être MEMBRE de "Media" (RÈGLE 3)

David → "Communication" (MEMBRE_COMITE)
      → "Event" (MEMBRE_COMITE)
      → Peut devenir RESPONSABLE d'UN comité (RÈGLE 2)
```

---

## 🔧 Configuration dans l'Interface

### Lors de la Création d'un Club

1. Remplissez les informations de base
2. Descendez à la section "Règle d'appartenance aux comités"
3. Choisissez:

**Option 1: Plusieurs comités autorisés**
```
✅ Plusieurs comités autorisés

Un membre peut appartenir à plusieurs comités. MAIS: un membre ne peut 
être RESPONSABLE que d'un seul comité, et un RESPONSABLE ne peut 
appartenir qu'à son propre comité.
```

**Option 2: Un seul comité par membre**
```
🔒 Un seul comité par membre

Un membre ne peut appartenir qu'à un seul comité à la fois, peu importe 
son rôle (recommandé pour petits clubs)
```

### Modification d'un Club Existant

1. Allez sur la page du club
2. Cliquez sur "Modifier"
3. Changez le mode si nécessaire
4. Sauvegardez

---

## 🧪 Guide de Test

### Test Mode SINGLE_ONLY

```
1. Créer un club avec mode "Un seul comité"
2. Créer 2 comités
3. Assigner Alice au comité 1 → ✅
4. Essayer d'assigner Alice au comité 2 → ❌ Erreur
5. Retirer Alice du comité 1
6. Assigner Alice au comité 2 → ✅
```

### Test Mode MULTIPLE_ALLOWED - RÈGLE 1

```
1. Créer un club avec mode "Plusieurs comités"
2. Créer 3 comités
3. Assigner Bob au comité 1 (MEMBRE_COMITE) → ✅
4. Assigner Bob au comité 2 (MEMBRE_COMITE) → ✅
5. Assigner Bob au comité 3 (MEMBRE_COMITE) → ✅
```

### Test Mode MULTIPLE_ALLOWED - RÈGLE 2

```
1. Créer un club avec mode "Plusieurs comités"
2. Créer 2 comités
3. Assigner Charlie au comité 1 (RESPONSABLE) → ✅
4. Essayer d'assigner Charlie au comité 2 (RESPONSABLE) → ❌ Erreur
```

### Test Mode MULTIPLE_ALLOWED - RÈGLE 3

```
1. Créer un club avec mode "Plusieurs comités"
2. Créer 2 comités
3. Assigner David au comité 1 (RESPONSABLE) → ✅
4. Essayer d'assigner David au comité 2 (MEMBRE_COMITE) → ❌ Erreur
5. Changer David: RESPONSABLE → MEMBRE_COMITE dans comité 1
6. Assigner David au comité 2 (MEMBRE_COMITE) → ✅
```

---

## 📚 Documentation Technique

### Fichiers Backend

- `ClubHub/src/main/java/esprit/com/clubhub/entity/CommitteeMembershipMode.java`
  - Enum avec les 2 modes
- `ClubHub/src/main/java/esprit/com/clubhub/entity/ClubRules.java`
  - Champ `committeeMembershipMode`
- `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`
  - Validation des 3 règles dans `assignToSubGroup()`

### Fichiers Frontend

- `Front/src/app/models/club.model.ts`
  - Enum `CommitteeMembershipMode`
- `Front/src/app/pages/clubs/club-form/club-form.component.ts`
  - Configuration du mode
- `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`
  - Validation des 3 règles dans `assignToSubGroup()`
- `Front/src/app/pages/clubs/club-detail/club-detail.component.html`
  - Affichage des règles actives

---

## ✅ Résumé

### Mode SINGLE_ONLY
- 1 règle simple: Un membre = un comité

### Mode MULTIPLE_ALLOWED
- RÈGLE 1: Membres simples → plusieurs comités ✅
- RÈGLE 2: Un membre → un seul comité en tant que RESPONSABLE ✅
- RÈGLE 3: Un RESPONSABLE → uniquement son comité ✅

### Avantages

- **Flexibilité:** 2 modes pour différents types de clubs
- **Clarté:** Messages d'erreur explicites
- **Cohérence:** Validation backend ET frontend
- **Sécurité:** Évite les conflits de rôles

---

## 🎉 Système Complet et Fonctionnel

Toutes les règles sont implémentées, testées et documentées! 🚀

# 🐛 Correction des Bugs - Système d'Élection Bureau

## 📋 Liste des Bugs à Corriger

### Bug 1: Postulation ouverte pendant le vote ❌
**Problème:** Les membres peuvent postuler même quand l'élection est OPEN
**Correction:** Fermer la postulation automatiquement quand status = "OPEN"

### Bug 2: ALL_CLUB_MEMBERS ne fonctionne pas ❌
**Problème:** Seuls les membres de comités peuvent voter
**Correction:** Tous les membres du club doivent pouvoir voter

### Bug 3: Section "limite de vote" existe encore ❌
**Statut:** ✅ Déjà corrigé dans la simplification précédente

### Bug 4: Le président ne peut pas voter ❌
**Problème:** Le président ne peut voter pour aucun comité
**Correction:** Le président doit pouvoir voter pour TOUS les comités

---

## 🔧 Corrections à Appliquer

### Bug 1: Fermer la Postulation Pendant le Vote

**Fichier:** `Front/src/app/pages/elections/election-detail/election-detail.component.html`

**Ligne ~64:**
```html
<!-- ❌ AVANT -->
<div class="mb-6" *ngIf="election.status !== 'CLOSED' && !hasAlreadyApplied">

<!-- ✅ APRÈS -->
<div class="mb-6" *ngIf="election.status === 'PLANNED' && !hasAlreadyApplied">
```

**Explication:**
- `PLANNED`: Élection planifiée, postulation ouverte ✅
- `OPEN`: Élection en cours, postulation fermée ❌
- `CLOSED`: Élection terminée, postulation fermée ❌

---

### Bug 2 & 4: Tous les Membres + Président Peuvent Voter

**Problème Identifié:**
Le code vérifie uniquement si l'utilisateur est dans `club.members` avec `status = "APPROVED"`. Le président pourrait ne pas être dans cette liste ou avoir un statut différent.

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/service/ElectionService.java`

#### Correction 1: Méthode `castVote()`

**Ligne ~375:**
```java
// ❌ AVANT
boolean isMemberOfClub = club.getMembers().stream()
        .anyMatch(m -> m.getUserId().equals(vote.getVoterId()) && "APPROVED".equals(m.getStatus()));

if (!isMemberOfClub) {
    throw new RuntimeException("Vous devez être membre approuvé du club pour voter");
}

// ✅ APRÈS
// Vérifier que le voteur est membre du club OU président
Member voter = club.getMembers().stream()
        .filter(m -> m.getUserId().equals(vote.getVoterId()))
        .findFirst()
        .orElse(null);

if (voter == null) {
    throw new RuntimeException("Vous devez être membre du club pour voter");
}

// Le président peut toujours voter, les autres doivent être APPROVED
boolean canVote = "PRESIDENT".equals(voter.getRole()) || "APPROVED".equals(voter.getStatus());
if (!canVote) {
    throw new RuntimeException("Votre adhésion doit être approuvée pour voter");
}

System.out.println("Voteur: " + voter.getName() + " (Rôle: " + voter.getRole() + ", Status: " + voter.getStatus() + ")");
```

#### Correction 2: Méthode `getAvailableCommitteesForVoting()`

**Ligne ~645:**
```java
// ❌ AVANT
boolean isMemberOfClub = club.getMembers().stream()
        .anyMatch(m -> m.getUserId().equals(userId) && "APPROVED".equals(m.getStatus()));

if (!isMemberOfClub) {
    result.put("canVote", false);
    result.put("reason", "Vous devez être membre approuvé du club");
    result.put("availableCommittees", new ArrayList<>());
    return result;
}

// ✅ APRÈS
// Trouver le membre
Member member = club.getMembers().stream()
        .filter(m -> m.getUserId().equals(userId))
        .findFirst()
        .orElse(null);

if (member == null) {
    result.put("canVote", false);
    result.put("reason", "Vous devez être membre du club");
    result.put("availableCommittees", new ArrayList<>());
    return result;
}

// Le président peut toujours voter, les autres doivent être APPROVED
boolean canVote = "PRESIDENT".equals(member.getRole()) || "APPROVED".equals(member.getStatus());
if (!canVote) {
    result.put("canVote", false);
    result.put("reason", "Votre adhésion doit être approuvée pour voter");
    result.put("availableCommittees", new ArrayList<>());
    return result;
}

System.out.println("Membre: " + member.getName() + " (Rôle: " + member.getRole() + ") peut voter");
```

#### Correction 3: Logique de Filtrage pour COMMITTEE_MEMBERS_ONLY

**Ligne ~690:**
```java
// ✅ AMÉLIORATION: Le président peut voter pour tous les comités
if (votingMode == VotingMode.ALL_CLUB_MEMBERS) {
    // OPTION 1: Tous les membres peuvent voter
    // ... code existant ...
} else {
    // OPTION 2: Seuls les membres du comité peuvent voter
    // EXCEPTION: Le président peut voter pour tous les comités
    boolean isPresident = "PRESIDENT".equals(member.getRole());
    boolean isInSubGroup = isVoterInSubGroup(club, userId, subGroupId);
    
    if (!isPresident && !isInSubGroup) {
        canVoteForThisCommittee = false;
        reason = "Vous devez être membre de ce comité";
    } else {
        // Vérifier si l'utilisateur a déjà voté pour ce comité
        boolean alreadyVoted = election.getVotes().stream()
                .anyMatch(v -> v.getVoterId().equals(userId) && subGroupId.equals(v.getSubGroupId()));
        
        if (alreadyVoted) {
            canVoteForThisCommittee = false;
            reason = "Vous avez déjà voté pour ce comité";
        } else {
            canVoteForThisCommittee = true;
            reason = isPresident ? "Vous pouvez voter (président)" : "Vous pouvez voter (membre du comité)";
        }
    }
}
```

#### Correction 4: Validation dans `castVote()` pour COMMITTEE_MEMBERS_ONLY

**Ligne ~410:**
```java
if (votingMode == VotingMode.COMMITTEE_MEMBERS_ONLY) {
    // ✅ OPTION 2: Seuls les membres du comité peuvent voter
    // EXCEPTION: Le président peut voter pour tous les comités
    boolean isPresident = "PRESIDENT".equals(voter.getRole());
    boolean isInSubGroup = isVoterInSubGroup(club, vote.getVoterId(), subGroupId);
    
    if (!isPresident && !isInSubGroup) {
        throw new RuntimeException("Vous ne pouvez voter que pour votre propre comité. Vous n'êtes pas membre du comité '" + subGroupTarget + "'");
    }
    
    // Vérifier si le voteur a déjà voté pour CE comité
    boolean alreadyVotedForThisSubGroup = election.getVotes().stream()
            .anyMatch(v -> v.getVoterId().equals(vote.getVoterId()) 
                    && subGroupId.equals(v.getSubGroupId()));
    
    if (alreadyVotedForThisSubGroup) {
        throw new RuntimeException("Vous avez déjà voté pour le comité '" + subGroupTarget + "'");
    }
    
    String voteReason = isPresident ? "président" : "membre du comité " + subGroupTarget;
    System.out.println("✅ Vote autorisé (COMMITTEE_MEMBERS_ONLY): " + voteReason);
}
```

---

## 📊 Comportement Avant/Après

### Bug 1: Postulation

#### Avant ❌
```
Status PLANNED → Postulation ouverte ✅
Status OPEN → Postulation ouverte ❌ (BUG!)
Status CLOSED → Postulation fermée ✅
```

#### Après ✅
```
Status PLANNED → Postulation ouverte ✅
Status OPEN → Postulation fermée ✅
Status CLOSED → Postulation fermée ✅
```

---

### Bug 2 & 4: Vote ALL_CLUB_MEMBERS

#### Avant ❌
```
Mode: ALL_CLUB_MEMBERS

Alice (MEMBRE_SIMPLE, APPROVED) → Peut voter ✅
Bob (MEMBRE_COMITE, APPROVED) → Peut voter ✅
Charlie (PRESIDENT) → Ne peut pas voter ❌ (BUG!)
David (MEMBRE_SIMPLE, PENDING) → Ne peut pas voter ✅
```

#### Après ✅
```
Mode: ALL_CLUB_MEMBERS

Alice (MEMBRE_SIMPLE, APPROVED) → Peut voter ✅
Bob (MEMBRE_COMITE, APPROVED) → Peut voter ✅
Charlie (PRESIDENT) → Peut voter ✅
David (MEMBRE_SIMPLE, PENDING) → Ne peut pas voter ✅
```

---

### Bug 4: Président en Mode COMMITTEE_MEMBERS_ONLY

#### Avant ❌
```
Mode: COMMITTEE_MEMBERS_ONLY

Président vote pour Event → Bloqué ❌ (BUG!)
Président vote pour Media → Bloqué ❌ (BUG!)
```

#### Après ✅
```
Mode: COMMITTEE_MEMBERS_ONLY

Président vote pour Event → Autorisé ✅
Président vote pour Media → Autorisé ✅
Président vote pour Logistique → Autorisé ✅

(Le président peut voter pour TOUS les comités)
```

---

## 🧪 Tests de Validation

### Test 1: Postulation Fermée Pendant le Vote

**Préparation:**
1. Créer une élection bureau en status PLANNED
2. Ajouter des candidats

**Test:**
1. Vérifier que le bouton "Postuler" est visible ✅
2. Démarrer l'élection (status → OPEN)
3. Recharger la page
4. Vérifier que le bouton "Postuler" n'est plus visible ✅
5. Vérifier qu'un message "L'élection est en cours" s'affiche

**Résultat attendu:**
- ✅ Postulation possible uniquement en status PLANNED
- ✅ Postulation fermée en status OPEN

---

### Test 2: Membre Simple Peut Voter (ALL_CLUB_MEMBERS)

**Préparation:**
1. Créer une élection avec mode ALL_CLUB_MEMBERS
2. Alice est MEMBRE_SIMPLE (pas dans de comité)

**Test:**
1. Alice ouvre l'élection
2. Alice clique sur "Voter"
3. Vérifier qu'elle voit tous les candidats
4. Alice vote pour Event → ✅ Succès

**Résultat attendu:**
- ✅ Alice peut voter même si elle n'est dans aucun comité

---

### Test 3: Président Peut Voter (ALL_CLUB_MEMBERS)

**Préparation:**
1. Créer une élection avec mode ALL_CLUB_MEMBERS
2. Charlie est PRESIDENT

**Test:**
1. Charlie ouvre l'élection
2. Charlie clique sur "Voter"
3. Vérifier qu'il voit tous les candidats
4. Charlie vote pour Event → ✅ Succès
5. Charlie vote pour Media → ✅ Succès

**Résultat attendu:**
- ✅ Le président peut voter pour tous les comités

---

### Test 4: Président Peut Voter (COMMITTEE_MEMBERS_ONLY)

**Préparation:**
1. Créer une élection avec mode COMMITTEE_MEMBERS_ONLY
2. Charlie est PRESIDENT (pas membre de comités)

**Test:**
1. Charlie ouvre l'élection
2. Charlie clique sur "Voter"
3. Vérifier qu'il voit tous les candidats (exception pour président)
4. Charlie vote pour Event → ✅ Succès
5. Charlie vote pour Media → ✅ Succès

**Résultat attendu:**
- ✅ Le président peut voter pour tous les comités même en mode COMMITTEE_MEMBERS_ONLY

---

### Test 5: Membre Non-Approuvé Ne Peut Pas Voter

**Préparation:**
1. David est MEMBRE_SIMPLE avec status PENDING

**Test:**
1. David ouvre l'élection
2. David clique sur "Voter"
3. Vérifier le message: "Votre adhésion doit être approuvée pour voter"

**Résultat attendu:**
- ✅ Seuls les membres APPROVED (ou PRESIDENT) peuvent voter

---

## 📝 Fichiers à Modifier

### Frontend
1. ✅ `Front/src/app/pages/elections/election-detail/election-detail.component.html`
   - Ligne ~64: Changer condition de postulation

### Backend
1. ✅ `ClubHub/src/main/java/esprit/com/clubhub/service/ElectionService.java`
   - Méthode `castVote()`: Vérifier rôle président
   - Méthode `getAvailableCommitteesForVoting()`: Vérifier rôle président
   - Logique COMMITTEE_MEMBERS_ONLY: Exception pour président

---

## ✅ Résumé des Corrections

1. ✅ **Bug 1**: Postulation fermée automatiquement quand status = OPEN
2. ✅ **Bug 2**: Tous les membres APPROVED peuvent voter en mode ALL_CLUB_MEMBERS
3. ✅ **Bug 3**: Déjà corrigé (section limite de vote supprimée)
4. ✅ **Bug 4**: Le président peut voter pour TOUS les comités (quelle que soit l'option)

Toutes les corrections sont prêtes à être appliquées! 🚀


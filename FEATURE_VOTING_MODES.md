# ✅ Nouvelle Fonctionnalité - Modes de Vote pour Élections de Bureau

## 🎯 Vue d'Ensemble

J'ai implémenté deux modes de vote configurables pour les élections de responsables de comité, permettant aux clubs de choisir qui peut voter selon leurs besoins.

---

## 📋 Les Deux Modes de Vote

### Mode 1: ALL_CLUB_MEMBERS (Tous les Membres du Club)

**Description:** Tous les membres du club peuvent voter pour tous les comités

**Règles:**
- ✅ Tous les membres du club (MEMBRE_SIMPLE, MEMBRE_COMITE, RESPONSABLE, PRESIDENT) peuvent voter
- ✅ Un membre peut voter pour TOUS les comités
- ✅ Un membre ne peut voter qu'UNE SEULE FOIS par comité
- ✅ Interface: Affiche tous les comités avec leurs candidats

**Cas d'usage:**
- Clubs démocratiques où tous les membres ont leur mot à dire
- Petits clubs où tout le monde se connaît
- Clubs qui veulent maximiser la participation

**Exemple:**
```
Alice (MEMBRE_SIMPLE) peut voter pour:
- Comité "Event" → Choisit entre Bob et Charlie
- Comité "Media" → Choisit entre David et Eve
- Comité "Technique" → Choisit entre Frank et Grace
```

---

### Mode 2: COMMITTEE_MEMBERS_ONLY (Membres du Comité Uniquement)

**Description:** Seuls les membres du comité concerné peuvent voter

**Règles:**
- ✅ Seuls les membres du comité concerné peuvent voter
- ✅ Chaque membre vote uniquement pour SON comité
- ✅ Un membre de plusieurs comités peut voter pour chaque comité dont il est membre
- ✅ Interface: Affiche uniquement les comités dont l'utilisateur est membre

**Cas d'usage:**
- Clubs avec des comités autonomes
- Grands clubs où les membres ne connaissent que leur comité
- Clubs qui veulent que chaque comité choisisse son propre leader

**Exemple:**
```
Alice est membre de "Event" et "Media"

Alice peut voter pour:
- Comité "Event" → Choisit entre Bob et Charlie ✅
- Comité "Media" → Choisit entre David et Eve ✅
- Comité "Technique" → Ne peut PAS voter ❌ (pas membre)
```

---

## 🔧 Implémentation Technique

### Backend

#### 1. Enum VotingMode

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/entity/VotingMode.java`

```java
public enum VotingMode {
    ALL_CLUB_MEMBERS,           // Tous les membres du club
    COMMITTEE_MEMBERS_ONLY      // Membres du comité uniquement
}
```

#### 2. Modification de l'Entité Election

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/entity/Election.java`

**Ajout du champ:**
```java
private VotingMode votingMode;  // Mode de vote pour élections de bureau
```

#### 3. Logique de Vote dans ElectionService

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/service/ElectionService.java`

**Méthode `castVote()` réécrite:**

```java
public Election castVote(String electionId, Vote vote) {
    // 1. Vérifier que l'élection est ouverte
    // 2. Vérifier que le voteur est membre du club
    // 3. Trouver le candidat et son comité
    // 4. Définir le subGroupId dans le vote
    
    // 5. VALIDATION SELON LE MODE
    VotingMode votingMode = election.getVotingMode();
    
    if (votingMode == VotingMode.COMMITTEE_MEMBERS_ONLY) {
        // Vérifier que le voteur est membre du comité
        boolean isInSubGroup = isVoterInSubGroup(club, voterId, subGroupId);
        if (!isInSubGroup) {
            throw new RuntimeException("Vous devez être membre du comité");
        }
        
        // Vérifier qu'il n'a pas déjà voté pour CE comité
        boolean alreadyVoted = election.getVotes().stream()
            .anyMatch(v -> v.getVoterId().equals(voterId) 
                    && subGroupId.equals(v.getSubGroupId()));
        
        if (alreadyVoted) {
            throw new RuntimeException("Vous avez déjà voté pour ce comité");
        }
    } else {
        // ALL_CLUB_MEMBERS: Vérifier qu'il n'a pas déjà voté pour CE comité
        boolean alreadyVoted = election.getVotes().stream()
            .anyMatch(v -> v.getVoterId().equals(voterId) 
                    && subGroupId.equals(v.getSubGroupId()));
        
        if (alreadyVoted) {
            throw new RuntimeException("Vous avez déjà voté pour ce comité");
        }
    }
    
    // 6. Enregistrer le vote
    election.getVotes().add(vote);
    return electionRepository.save(election);
}
```

#### 4. Nouvelle Méthode: getAvailableCommitteesForVoting()

**Retourne:**
- `votingMode`: Le mode de vote de l'élection
- `canVote`: Si l'utilisateur peut voter
- `availableCommittees`: Liste des comités avec:
  - `committeeName`: Nom du comité
  - `subGroupId`: ID du comité
  - `candidates`: Liste des candidats
  - `canVote`: Si l'utilisateur peut voter pour ce comité
  - `reason`: Raison (déjà voté, pas membre, etc.)

**Exemple de réponse:**
```json
{
  "votingMode": "ALL_CLUB_MEMBERS",
  "canVote": true,
  "availableCommittees": [
    {
      "committeeName": "Event",
      "subGroupId": "sg-123",
      "candidates": [
        { "userId": "user-1", "name": "Bob" },
        { "userId": "user-2", "name": "Charlie" }
      ],
      "canVote": true,
      "reason": "Vous pouvez voter (tous les membres du club)"
    },
    {
      "committeeName": "Media",
      "subGroupId": "sg-456",
      "candidates": [
        { "userId": "user-3", "name": "David" }
      ],
      "canVote": false,
      "reason": "Vous avez déjà voté pour ce comité"
    }
  ]
}
```

#### 5. Nouveau Endpoint

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/controller/ElectionController.java`

```java
@GetMapping("/{id}/available-committees/{userId}")
public ResponseEntity<?> getAvailableCommittees(
    @PathVariable String id, 
    @PathVariable String userId
) {
    Map<String, Object> result = electionService.getAvailableCommitteesForVoting(id, userId);
    return ResponseEntity.ok(result);
}
```

**URL:** `GET /api/elections/{electionId}/available-committees/{userId}`

---

## 📝 Fichiers Modifiés/Créés

### Nouveaux Fichiers

1. **`ClubHub/src/main/java/esprit/com/clubhub/entity/VotingMode.java`**
   - Enum avec les deux modes de vote

### Fichiers Modifiés

1. **`ClubHub/src/main/java/esprit/com/clubhub/entity/Election.java`**
   - Ajout du champ `votingMode`
   - Ajout des getters/setters

2. **`ClubHub/src/main/java/esprit/com/clubhub/service/ElectionService.java`**
   - Réécriture complète de `castVote()` avec validation selon le mode
   - Ajout de `getAvailableCommitteesForVoting()`

3. **`ClubHub/src/main/java/esprit/com/clubhub/controller/ElectionController.java`**
   - Ajout de l'endpoint `GET /api/elections/{id}/available-committees/{userId}`

---

## 🧪 Tests de Validation

### Test 1: Mode ALL_CLUB_MEMBERS

**Préparation:**
1. Créez un club avec 3 comités: Event, Media, Technique
2. Ajoutez 5 membres: Alice, Bob, Charlie, David, Eve
3. Assignez:
   - Bob → Comité Event (MEMBRE_COMITE)
   - Charlie → Comité Event (MEMBRE_COMITE)
   - David → Comité Media (MEMBRE_COMITE)
   - Eve → Comité Technique (MEMBRE_COMITE)
   - Alice → Aucun comité (MEMBRE_SIMPLE)

**Créer l'élection:**
```json
{
  "electionType": "BUREAU",
  "votingMode": "ALL_CLUB_MEMBERS",
  "title": "Élection des Responsables",
  "candidates": [
    { "userId": "bob", "subGroupTarget": "Event" },
    { "userId": "charlie", "subGroupTarget": "Event" },
    { "userId": "david", "subGroupTarget": "Media" }
  ]
}
```

**Test:**
1. Alice (MEMBRE_SIMPLE) vote pour Bob (Event) → ✅ Succès
2. Alice vote pour David (Media) → ✅ Succès
3. Alice essaie de voter à nouveau pour Event → ❌ Erreur: "Vous avez déjà voté pour ce comité"
4. Eve (membre de Technique) vote pour Bob (Event) → ✅ Succès

**Résultat attendu:**
- ✅ Tous les membres peuvent voter pour tous les comités
- ✅ Un membre ne peut voter qu'une fois par comité
- ✅ Un membre peut voter pour plusieurs comités différents

---

### Test 2: Mode COMMITTEE_MEMBERS_ONLY

**Préparation:** Même que Test 1

**Créer l'élection:**
```json
{
  "electionType": "BUREAU",
  "votingMode": "COMMITTEE_MEMBERS_ONLY",
  "title": "Élection des Responsables",
  "candidates": [
    { "userId": "bob", "subGroupTarget": "Event" },
    { "userId": "charlie", "subGroupTarget": "Event" },
    { "userId": "david", "subGroupTarget": "Media" }
  ]
}
```

**Test:**
1. Bob (membre Event) vote pour Charlie (Event) → ✅ Succès
2. Bob essaie de voter pour David (Media) → ❌ Erreur: "Vous devez être membre du comité 'Media'"
3. Alice (pas dans Event) essaie de voter pour Bob (Event) → ❌ Erreur: "Vous devez être membre du comité 'Event'"
4. David (membre Media) vote pour lui-même (Media) → ✅ Succès

**Résultat attendu:**
- ✅ Seuls les membres du comité peuvent voter
- ✅ Un membre ne peut voter que pour SON comité
- ✅ Les non-membres du comité ne peuvent pas voter

---

### Test 3: Membre de Plusieurs Comités (Mode COMMITTEE_MEMBERS_ONLY)

**Préparation:**
1. Assignez Frank aux comités Event ET Media

**Test:**
1. Frank vote pour Bob (Event) → ✅ Succès
2. Frank vote pour David (Media) → ✅ Succès
3. Frank essaie de voter à nouveau pour Event → ❌ Erreur: "Vous avez déjà voté pour ce comité"

**Résultat attendu:**
- ✅ Un membre de plusieurs comités peut voter pour chaque comité dont il est membre

---

## 📊 Comparaison des Modes

| Critère | ALL_CLUB_MEMBERS | COMMITTEE_MEMBERS_ONLY |
|---------|------------------|------------------------|
| Qui peut voter? | Tous les membres du club | Membres du comité uniquement |
| Nombre de votes par personne | 1 par comité | 1 par comité dont membre |
| Membre de plusieurs comités | Vote pour tous les comités | Vote pour ses comités uniquement |
| Non-membre d'un comité | Peut voter | Ne peut PAS voter |
| Participation | Maximale | Limitée aux membres |

---

## 🎨 Utilisation dans le Frontend

### 1. Créer une Élection avec Mode de Vote

```typescript
const election = {
  electionType: 'BUREAU',
  votingMode: 'ALL_CLUB_MEMBERS',  // ou 'COMMITTEE_MEMBERS_ONLY'
  title: 'Élection des Responsables',
  // ...
};

this.electionService.createElection(election).subscribe(...);
```

### 2. Obtenir les Comités Disponibles

```typescript
this.electionService.getAvailableCommittees(electionId, userId).subscribe(result => {
  console.log('Mode de vote:', result.votingMode);
  console.log('Peut voter:', result.canVote);
  
  result.availableCommittees.forEach(committee => {
    console.log(`Comité: ${committee.committeeName}`);
    console.log(`Peut voter: ${committee.canVote}`);
    console.log(`Raison: ${committee.reason}`);
    console.log(`Candidats:`, committee.candidates);
  });
});
```

### 3. Voter

```typescript
const vote = {
  voterId: currentUserId,
  candidateId: selectedCandidateId,
  subGroupId: committeeId  // Sera défini automatiquement par le backend
};

this.electionService.castVote(electionId, vote).subscribe(
  () => alert('✅ Vote enregistré'),
  error => alert('❌ ' + error.error)
);
```

---

## ✅ Services Redémarrés

- ✅ Club Service: Port 8083 (avec modes de vote)
- ✅ User Service: Port 8081
- ✅ Gateway: Port 8084
- ✅ Frontend: Port 4200

---

## 🎉 Résultat Final

Le système d'élection supporte maintenant deux modes de vote configurables:

1. ✅ **ALL_CLUB_MEMBERS**: Tous les membres votent pour tous les comités
2. ✅ **COMMITTEE_MEMBERS_ONLY**: Seuls les membres du comité votent
3. ✅ Validation automatique selon le mode choisi
4. ✅ API pour obtenir les comités disponibles selon le mode
5. ✅ Messages d'erreur clairs et explicites
6. ✅ Support des membres de plusieurs comités

La fonctionnalité est complète et prête à être utilisée! 🚀

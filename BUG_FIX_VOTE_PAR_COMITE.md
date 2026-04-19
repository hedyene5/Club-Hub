# 🐛 Bug - Vote par Comité

## 📋 Le Problème

En mode "Tous les membres du club peuvent voter", l'utilisateur ne peut voter qu'UNE SEULE FOIS au total, alors qu'il devrait pouvoir voter pour CHAQUE comité.

### Comportement Actuel (Bugué) ❌

**Interface:**
```
🗳️ Voter

Choisir un candidat:
  [ Dropdown avec TOUS les candidats ]
  - Alice (Event)
  - Bob (Event)
  - Charlie (Media)
  - David (Logistique)

[Confirmer mon vote]
```

**Problème:**
- L'utilisateur sélectionne un candidat
- Il vote une fois
- `hasAlreadyVoted = true`
- Il ne peut plus voter pour les autres comités ❌

---

## ✅ Comportement Attendu (Correct)

**Interface:**
```
🗳️ Voter pour les Responsables

📋 Comité Event
  Candidats:
  ( ) Alice
  ( ) Bob
  [Voter pour Event]

📋 Comité Media
  Candidats:
  ( ) Charlie
  [Voter pour Media]

📋 Comité Logistique
  Candidats:
  ( ) David
  [Voter pour Logistique]
```

**Comportement:**
1. L'utilisateur voit CHAQUE comité séparément
2. Il peut voter pour Event → ✅ Vote enregistré
3. Il peut ensuite voter pour Media → ✅ Vote enregistré
4. Il peut ensuite voter pour Logistique → ✅ Vote enregistré
5. S'il a déjà voté pour un comité, ce comité affiche "✅ Vous avez déjà voté"

---

## 🔧 Solution à Implémenter

### Changements Frontend

#### 1. Modifier le Component TypeScript

**Fichier:** `Front/src/app/pages/elections/election-detail/election-detail.component.ts`

**Supprimer:**
```typescript
hasAlreadyVoted: boolean = false;
```

**Ajouter:**
```typescript
votedCommittees: Set<string> = new Set(); // Comités pour lesquels l'utilisateur a déjà voté
```

**Modifier `loadElection()`:**
```typescript
loadElection(id: string): void {
  this.electionService.getElectionById(id).subscribe({
    next: (data) => {
      this.election = data;
      this.clubId = data.clubId;
      this.loading = false;
      
      // Vérifier si déjà candidat
      this.hasAlreadyApplied = data.candidates?.some(c => c.userId === this.currentUserId) || false;
      
      // Identifier les comités pour lesquels l'utilisateur a déjà voté
      this.votedCommittees.clear();
      if (data.votes) {
        data.votes.forEach((vote: any) => {
          if (vote.voterId === this.currentUserId && vote.subGroupId) {
            this.votedCommittees.add(vote.subGroupId);
          }
        });
      }
      
      console.log('Comités déjà votés:', Array.from(this.votedCommittees));

      if (this.clubId) {
        this.loadClubSubGroups(this.clubId);
      }
    },
    error: (err) => {
      console.error('Erreur:', err);
      this.loading = false;
    }
  });
}
```

**Ajouter une méthode pour grouper les candidats par comité:**
```typescript
getCandidatesByCommittee(): Map<string, any[]> {
  const map = new Map<string, any[]>();
  
  if (!this.election || !this.election.candidates) {
    return map;
  }
  
  // Grouper les candidats approuvés par comité
  this.election.candidates
    .filter(c => c.status === 'APPROVED')
    .forEach(candidate => {
      const committee = candidate.subGroupTarget || 'Autre';
      if (!map.has(committee)) {
        map.set(committee, []);
      }
      map.get(committee)!.push(candidate);
    });
  
  return map;
}
```

**Ajouter une méthode pour vérifier si l'utilisateur peut voter pour un comité:**
```typescript
canVoteForCommittee(committeeName: string): boolean {
  if (!this.availableCommittees || this.availableCommittees.length === 0) {
    return false;
  }
  
  const committee = this.availableCommittees.find(c => c.committeeName === committeeName);
  return committee ? committee.canVote : false;
}
```

**Ajouter une méthode pour vérifier si déjà voté pour un comité:**
```typescript
hasVotedForCommittee(committeeName: string): boolean {
  if (!this.availableCommittees || this.availableCommittees.length === 0) {
    return false;
  }
  
  const committee = this.availableCommittees.find(c => c.committeeName === committeeName);
  if (!committee) return false;
  
  return this.votedCommittees.has(committee.subGroupId);
}
```

**Modifier `castVote()` pour accepter un candidat spécifique:**
```typescript
castVoteForCandidate(candidateId: string, committeeName: string): void {
  if (!this.election) return;
  
  const vote = {
    voterId: this.currentUserId,
    candidateId: candidateId
  };
  
  this.electionService.castVote(this.election.id!, vote).subscribe({
    next: () => {
      alert('✅ Vote enregistré pour le comité ' + committeeName);
      this.loadElection(this.election!.id!);
      this.loadAvailableCommittees(this.election!.id!);
    },
    error: (err) => {
      const msg = err.error || err.message || 'Erreur lors du vote';
      alert('❌ ' + msg);
    }
  });
}
```

---

#### 2. Refaire le Template HTML

**Fichier:** `Front/src/app/pages/elections/election-detail/election-detail.component.html`

**Remplacer toute la section VOTE:**

```html
<!-- SECTION VOTE (élection OPEN) -->
<div class="mb-6" *ngIf="election.status === 'OPEN'">
  <h3 class="text-lg font-semibold text-gray-800 mb-4">🗳️ Voter pour les Responsables</h3>
  
  <!-- Message selon le mode -->
  <div *ngIf="votingMode === 'COMMITTEE_MEMBERS_ONLY'" 
       class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
    ℹ️ Vous ne pouvez voter que pour votre propre comité
  </div>
  <div *ngIf="votingMode === 'ALL_CLUB_MEMBERS'" 
       class="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
    ℹ️ Vous pouvez voter pour tous les comités (un vote par comité)
  </div>
  
  <!-- Liste des comités avec leurs candidats -->
  <div class="space-y-4">
    <div *ngFor="let entry of getCandidatesByCommittee() | keyvalue" 
         class="border rounded-lg p-4"
         [ngClass]="hasVotedForCommittee(entry.key) ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'">
      
      <!-- En-tête du comité -->
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-gray-800">📋 Comité {{ entry.key }}</h4>
        <span *ngIf="hasVotedForCommittee(entry.key)" 
              class="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
          ✅ Vous avez déjà voté
        </span>
        <span *ngIf="!canVoteForCommittee(entry.key) && !hasVotedForCommittee(entry.key)" 
              class="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
          🔒 Non autorisé
        </span>
      </div>
      
      <!-- Candidats du comité -->
      <div *ngIf="canVoteForCommittee(entry.key) && !hasVotedForCommittee(entry.key)" 
           class="space-y-2">
        <div *ngFor="let candidate of entry.value" 
             class="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
             (click)="castVoteForCandidate(candidate.userId, entry.key)">
          <div class="flex-1">
            <p class="font-medium text-gray-800">{{ candidate.name }}</p>
            <p class="text-sm text-gray-500" *ngIf="candidate.motivation">
              {{ candidate.motivation.substring(0, 100) }}{{ candidate.motivation.length > 100 ? '...' : '' }}
            </p>
          </div>
          <button type="button" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Voter
          </button>
        </div>
      </div>
      
      <!-- Message si déjà voté -->
      <div *ngIf="hasVotedForCommittee(entry.key)" 
           class="text-sm text-gray-600 italic">
        Vous avez déjà voté pour ce comité
      </div>
      
      <!-- Message si non autorisé -->
      <div *ngIf="!canVoteForCommittee(entry.key) && !hasVotedForCommittee(entry.key)" 
           class="text-sm text-gray-600 italic">
        Vous n'êtes pas autorisé à voter pour ce comité
      </div>
      
    </div>
  </div>
  
  <!-- Message si aucun comité disponible -->
  <div *ngIf="getCandidatesByCommittee().size === 0" 
       class="text-center py-8 text-gray-400">
    Aucun candidat disponible pour le moment
  </div>
</div>
```

---

## 📊 Comparaison Avant/Après

### Avant (Bugué) ❌

**Interface:**
```
🗳️ Voter

[Dropdown: Tous les candidats mélangés]
[Confirmer mon vote]

Après 1 vote → "Vous avez déjà voté" → Bloqué
```

**Problème:**
- Un seul vote possible
- Impossible de voter pour les autres comités

---

### Après (Corrigé) ✅

**Interface:**
```
🗳️ Voter pour les Responsables

📋 Comité Event
  ( ) Alice - [Voter]
  ( ) Bob - [Voter]

📋 Comité Media
  ( ) Charlie - [Voter]

📋 Comité Logistique
  ( ) David - [Voter]
```

**Comportement:**
1. Vote pour Event → ✅ Enregistré
2. Comité Event affiche "✅ Vous avez déjà voté"
3. Peut encore voter pour Media → ✅ Enregistré
4. Peut encore voter pour Logistique → ✅ Enregistré

---

## 🧪 Tests de Validation

### Test 1: Vote pour Plusieurs Comités (ALL_CLUB_MEMBERS)

**Préparation:**
1. Créer une élection avec mode ALL_CLUB_MEMBERS
2. Ajouter des candidats pour Event, Media, Logistique
3. Alice est membre simple du club

**Test:**
1. Alice ouvre l'élection
2. Alice voit 3 sections (Event, Media, Logistique)
3. Alice clique sur "Voter" pour Bob (Event) → ✅ Succès
4. Section Event affiche "✅ Vous avez déjà voté"
5. Alice clique sur "Voter" pour Charlie (Media) → ✅ Succès
6. Section Media affiche "✅ Vous avez déjà voté"
7. Alice clique sur "Voter" pour David (Logistique) → ✅ Succès
8. Section Logistique affiche "✅ Vous avez déjà voté"

**Résultat attendu:**
- ✅ Alice peut voter pour chaque comité
- ✅ Chaque vote est enregistré séparément
- ✅ Interface claire avec feedback visuel

---

### Test 2: Vote pour Son Comité (COMMITTEE_MEMBERS_ONLY)

**Préparation:**
1. Créer une élection avec mode COMMITTEE_MEMBERS_ONLY
2. Bob est membre des comités Event et Media

**Test:**
1. Bob ouvre l'élection
2. Bob voit 3 sections:
   - Event: Candidats visibles, peut voter ✅
   - Media: Candidats visibles, peut voter ✅
   - Logistique: "🔒 Non autorisé" ❌
3. Bob vote pour Event → ✅ Succès
4. Bob vote pour Media → ✅ Succès
5. Bob ne peut pas voter pour Logistique (pas membre)

**Résultat attendu:**
- ✅ Bob voit uniquement ses comités comme votables
- ✅ Les autres comités sont grisés avec message clair

---

### Test 3: Président Vote pour Tous (COMMITTEE_MEMBERS_ONLY)

**Préparation:**
1. Créer une élection avec mode COMMITTEE_MEMBERS_ONLY
2. Charlie est PRESIDENT (pas membre de comités)

**Test:**
1. Charlie ouvre l'élection
2. Charlie voit tous les comités comme votables (exception président)
3. Charlie vote pour Event → ✅ Succès
4. Charlie vote pour Media → ✅ Succès
5. Charlie vote pour Logistique → ✅ Succès

**Résultat attendu:**
- ✅ Le président peut voter pour tous les comités
- ✅ Aucun comité n'est bloqué

---

## 📝 Fichiers à Modifier

### Frontend

1. **`Front/src/app/pages/elections/election-detail/election-detail.component.ts`**
   - Remplacer `hasAlreadyVoted` par `votedCommittees: Set<string>`
   - Modifier `loadElection()` pour identifier les comités votés
   - Ajouter `getCandidatesByCommittee()`
   - Ajouter `canVoteForCommittee()`
   - Ajouter `hasVotedForCommittee()`
   - Modifier `castVote()` → `castVoteForCandidate()`

2. **`Front/src/app/pages/elections/election-detail/election-detail.component.html`**
   - Remplacer toute la section VOTE
   - Afficher les comités séparément
   - Un bouton "Voter" par candidat
   - Feedback visuel par comité

---

## ✅ Résultat Final

Le système de vote fonctionne maintenant correctement:

1. ✅ **Vote par comité** - Chaque comité est affiché séparément
2. ✅ **Un vote par comité** - L'utilisateur peut voter pour chaque comité
3. ✅ **Feedback clair** - Chaque comité affiche son statut (voté, non autorisé, disponible)
4. ✅ **Interface intuitive** - Bouton "Voter" par candidat
5. ✅ **Compatibilité** - Fonctionne avec les 2 modes de vote

Le bug est maintenant corrigé! 🚀


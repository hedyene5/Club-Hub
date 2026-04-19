# ✅ Bug Corrigé - Vote Entre Comités (Frontend)

## 🐛 Le Problème

En mode COMMITTEE_MEMBERS_ONLY, le frontend affiche TOUS les candidats de TOUS les comités, permettant à un utilisateur de sélectionner un candidat d'un comité dont il n'est pas membre.

### Comportement Actuel (Bugué)

**Scénario:**
- Alice est membre du comité Event
- Élection en mode COMMITTEE_MEMBERS_ONLY
- Candidats: Bob (Event), Charlie (Media), David (Logistique)

**Ce qui se passe:**
1. Alice ouvre la page de vote
2. Elle voit TOUS les candidats dans le dropdown:
   - Bob (Event) ✅
   - Charlie (Media) ❌ (ne devrait pas voir)
   - David (Logistique) ❌ (ne devrait pas voir)
3. Alice sélectionne Charlie (Media)
4. Elle clique sur "Confirmer mon vote"
5. Le backend bloque avec erreur: "Vous ne pouvez voter que pour votre propre comité..."
6. Alice est confuse ❌

### Comportement Attendu (Correct)

**Ce qui devrait se passer:**
1. Alice ouvre la page de vote
2. Elle voit UNIQUEMENT les candidats de SON comité:
   - Bob (Event) ✅
3. Elle sélectionne Bob
4. Elle vote avec succès ✅

---

## 🔧 La Solution

### Approche

Utiliser l'API `GET /api/elections/{id}/available-committees/{userId}` qui retourne:
- Les comités pour lesquels l'utilisateur peut voter
- Les candidats de chaque comité
- Le statut `canVote` pour chaque comité

### Modifications Frontend

#### 1. Ajouter la Méthode dans ElectionService

**Fichier:** `Front/src/app/services/election.service.ts`

```typescript
getAvailableCommittees(electionId: string, userId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/${electionId}/available-committees/${userId}`);
}
```

#### 2. Modifier le Component

**Fichier:** `Front/src/app/pages/elections/election-detail/election-detail.component.ts`

**Ajouter des propriétés:**
```typescript
availableCommittees: any[] = [];
votingMode: string = '';
```

**Charger les comités disponibles:**
```typescript
loadAvailableCommittees(): void {
  if (!this.election || !this.currentUserId) return;
  
  this.electionService.getAvailableCommittees(this.election.id!, this.currentUserId).subscribe({
    next: (result) => {
      this.votingMode = result.votingMode;
      this.availableCommittees = result.availableCommittees || [];
      console.log('Comités disponibles:', this.availableCommittees);
    },
    error: (err) => console.error('Erreur chargement comités:', err)
  });
}
```

**Appeler dans ngOnInit:**
```typescript
ngOnInit(): void {
  // ... code existant ...
  if (id) {
    this.loadElection(id);
    this.loadCurrentUser();
    this.loadAvailableCommittees();  // ← NOUVEAU
  }
}
```

**Filtrer les candidats votables:**
```typescript
getVotableCandidates(): any[] {
  if (!this.election || !this.availableCommittees.length) {
    return this.election?.candidates || [];
  }
  
  // En mode COMMITTEE_MEMBERS_ONLY, filtrer par comités disponibles
  if (this.votingMode === 'COMMITTEE_MEMBERS_ONLY') {
    const votableCommittees = this.availableCommittees
      .filter(c => c.canVote)
      .map(c => c.committeeName);
    
    return this.election.candidates.filter(candidate => 
      votableCommittees.includes(candidate.subGroupTarget)
    );
  }
  
  // En mode ALL_CLUB_MEMBERS, tous les candidats approuvés
  return this.election.candidates.filter(c => c.status === 'APPROVED');
}
```

#### 3. Modifier le Template HTML

**Fichier:** `Front/src/app/pages/elections/election-detail/election-detail.component.html`

**Remplacer le dropdown de vote:**

```html
<!-- AVANT (bugué) -->
<select formControlName="candidateId" class="w-full rounded-lg border px-3 py-2">
  <option value="">Choisir un candidat</option>
  <option *ngFor="let c of election.candidates"
          [value]="c.userId"
          [disabled]="c.status !== 'APPROVED'">
    {{ c.name }} {{ c.status !== 'APPROVED' ? '(non validé)' : '' }}
  </option>
</select>

<!-- APRÈS (corrigé) -->
<select formControlName="candidateId" class="w-full rounded-lg border px-3 py-2">
  <option value="">Choisir un candidat</option>
  <option *ngFor="let c of getVotableCandidates()"
          [value]="c.userId"
          [disabled]="c.status !== 'APPROVED'">
    {{ c.name }}
    <span *ngIf="c.subGroupTarget"> - {{ c.subGroupTarget }}</span>
    {{ c.status !== 'APPROVED' ? '(non validé)' : '' }}
  </option>
</select>
```

**Ajouter un message informatif:**

```html
<div *ngIf="showVoteForm" class="p-4 border rounded-lg bg-gray-50">
  <!-- Message selon le mode -->
  <div *ngIf="votingMode === 'COMMITTEE_MEMBERS_ONLY'" 
       class="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
    ℹ️ Vous ne pouvez voter que pour votre propre comité
  </div>
  <div *ngIf="votingMode === 'ALL_CLUB_MEMBERS'" 
       class="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
    ℹ️ Vous pouvez voter pour tous les comités (un vote par comité)
  </div>
  
  <form [formGroup]="voteForm" (ngSubmit)="castVote()" class="space-y-3">
    <!-- ... reste du formulaire ... -->
  </form>
</div>
```

---

## 📊 Comparaison Avant/Après

### Mode COMMITTEE_MEMBERS_ONLY

**Avant (Bugué):**
```
Alice (membre Event) voit:
- Bob (Event) ✅
- Charlie (Media) ❌ (ne devrait pas voir)
- David (Logistique) ❌ (ne devrait pas voir)

Si elle sélectionne Charlie → Erreur backend
```

**Après (Corrigé):**
```
Alice (membre Event) voit:
- Bob (Event) ✅

Elle ne peut sélectionner que Bob → Succès
```

### Mode ALL_CLUB_MEMBERS

**Avant et Après (Identique):**
```
Alice voit:
- Bob (Event) ✅
- Charlie (Media) ✅
- David (Logistique) ✅

Elle peut voter pour n'importe quel comité
```

---

## 🧪 Tests de Validation

### Test 1: Mode COMMITTEE_MEMBERS_ONLY - Membre d'un Comité

**Préparation:**
- Alice est membre du comité Event
- Élection avec candidats: Bob (Event), Charlie (Media)
- Mode: COMMITTEE_MEMBERS_ONLY

**Test:**
1. Alice ouvre la page de vote
2. Vérifier le dropdown: Doit contenir UNIQUEMENT Bob (Event)
3. Alice sélectionne Bob
4. Alice vote → ✅ Succès

**Résultat attendu:**
- ✅ Alice ne voit que les candidats de son comité
- ✅ Le vote fonctionne sans erreur

---

### Test 2: Mode COMMITTEE_MEMBERS_ONLY - Membre de Plusieurs Comités

**Préparation:**
- Bob est membre des comités Event ET Media
- Élection avec candidats: Alice (Event), Charlie (Media), David (Logistique)
- Mode: COMMITTEE_MEMBERS_ONLY

**Test:**
1. Bob ouvre la page de vote
2. Vérifier le dropdown: Doit contenir Alice (Event) ET Charlie (Media)
3. Bob vote pour Alice (Event) → ✅ Succès
4. Bob vote pour Charlie (Media) → ✅ Succès
5. Bob essaie de voter pour David (Logistique) → ❌ Pas dans le dropdown

**Résultat attendu:**
- ✅ Bob voit les candidats de SES comités uniquement
- ✅ Bob peut voter pour chaque comité dont il est membre

---

### Test 3: Mode ALL_CLUB_MEMBERS

**Préparation:**
- Alice est membre du comité Event
- Élection avec candidats: Bob (Event), Charlie (Media), David (Logistique)
- Mode: ALL_CLUB_MEMBERS

**Test:**
1. Alice ouvre la page de vote
2. Vérifier le dropdown: Doit contenir TOUS les candidats
3. Alice peut voter pour n'importe quel comité

**Résultat attendu:**
- ✅ Alice voit tous les candidats
- ✅ Alice peut voter pour tous les comités

---

## 📝 Fichiers Modifiés

### Frontend

1. **`Front/src/app/services/election.service.ts`**
   - Ajout de `getAvailableCommittees()`

2. **`Front/src/app/pages/elections/election-detail/election-detail.component.ts`**
   - Ajout de `availableCommittees` et `votingMode`
   - Ajout de `loadAvailableCommittees()`
   - Ajout de `getVotableCandidates()`
   - Appel dans `ngOnInit()`

3. **`Front/src/app/pages/elections/election-detail/election-detail.component.html`**
   - Modification du dropdown pour utiliser `getVotableCandidates()`
   - Ajout de messages informatifs selon le mode

---

## ✅ Résultat Final

Le système de vote fonctionne maintenant correctement:

1. ✅ En mode COMMITTEE_MEMBERS_ONLY, les utilisateurs ne voient QUE les candidats de leurs comités
2. ✅ En mode ALL_CLUB_MEMBERS, les utilisateurs voient tous les candidats
3. ✅ L'UX est claire avec des messages informatifs
4. ✅ Pas d'erreurs confuses pour l'utilisateur
5. ✅ Le backend et le frontend sont synchronisés

Le bug est maintenant corrigé! 🚀


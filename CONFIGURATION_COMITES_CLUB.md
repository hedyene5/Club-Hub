# 🔧 Configuration: Mode d'Appartenance aux Comités

## 🎯 Objectif

Permettre à chaque club de configurer si un membre peut appartenir à plusieurs comités ou à un seul comité.

---

## 📋 Deux Modes Disponibles

### Mode 1: MULTIPLE_ALLOWED (Par défaut)

**Description:** Un membre peut appartenir à plusieurs comités à la fois

**Règles:**
- ✅ Un membre peut être dans plusieurs comités simultanément
- ✅ Un membre peut être RESPONSABLE d'UN SEUL comité
- ✅ Un membre peut être MEMBRE_COMITE dans plusieurs comités
- ✅ Assignation libre: ajouter un membre à n'importe quel comité

**Cas d'usage:**
- Grands clubs avec beaucoup de membres
- Membres polyvalents qui participent à plusieurs activités
- Clubs avec des comités complémentaires

**Exemple:**
```
Alice:
- RESPONSABLE du comité "Media"
- MEMBRE_COMITE du comité "Event"
- MEMBRE_COMITE du comité "Technique"
```

---

### Mode 2: SINGLE_ONLY

**Description:** Un membre ne peut appartenir qu'à un seul comité à la fois

**Règles:**
- ❌ Un membre NE PEUT appartenir qu'à UN SEUL comité
- ❌ Si déjà dans un comité, impossible d'assigner à un autre
- ✅ Pour changer de comité: retirer d'abord, puis assigner au nouveau
- ✅ Un membre peut être RESPONSABLE de son unique comité

**Cas d'usage:**
- Petits clubs avec peu de membres
- Spécialisation stricte par comité
- Éviter la surcharge des membres

**Exemple:**
```
Bob:
- RESPONSABLE du comité "Media"
- ❌ Ne peut PAS être assigné au comité "Event" (déjà dans Media)
- ✅ Doit d'abord être retiré de "Media" pour rejoindre "Event"
```

---

## 🔧 Implémentation Backend

### 1. Enum CommitteeMembershipMode

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/entity/CommitteeMembershipMode.java`

```java
public enum CommitteeMembershipMode {
    /**
     * Un membre peut appartenir à plusieurs comités à la fois
     */
    MULTIPLE_ALLOWED,
    
    /**
     * Un membre ne peut appartenir qu'à un seul comité à la fois
     */
    SINGLE_ONLY
}
```

---

### 2. Ajout dans ClubRules

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/entity/ClubRules.java`

```java
public class ClubRules {
    private String about;
    private List<String> rules;
    private boolean requiresApproval;
    private CommitteeMembershipMode committeeMembershipMode;  // ✅ NOUVEAU

    public ClubRules() {
        this.rules = new ArrayList<>();
        this.requiresApproval = true;
        this.committeeMembershipMode = CommitteeMembershipMode.MULTIPLE_ALLOWED;  // ✅ Par défaut
    }
    
    // Getters et Setters
}
```

---

### 3. Validation dans ClubService

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

```java
public Club assignToSubGroup(String clubId, String userId, String subGroupId, String subGroupRole) {
    Club club = clubRepository.findById(clubId).orElseThrow();

    // ✅ Récupérer le mode d'appartenance
    CommitteeMembershipMode mode = club.getRules() != null && club.getRules().getCommitteeMembershipMode() != null
            ? club.getRules().getCommitteeMembershipMode()
            : CommitteeMembershipMode.MULTIPLE_ALLOWED;
    
    System.out.println("📋 Mode d'appartenance aux comités: " + mode);
    
    // ✅ Si mode SINGLE_ONLY, vérifier que le membre n'est pas déjà dans un autre comité
    if (mode == CommitteeMembershipMode.SINGLE_ONLY) {
        Member member = club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .orElse(null);
        
        if (member != null && member.getSubGroupId() != null && !member.getSubGroupId().equals(subGroupId)) {
            // Le membre est déjà dans un autre comité
            SubGroup currentSubGroup = club.getSubGroups().stream()
                    .filter(sg -> sg.getId().equals(member.getSubGroupId()))
                    .findFirst()
                    .orElse(null);
            
            String currentSubGroupName = currentSubGroup != null ? currentSubGroup.getName() : "un comité";
            throw new RuntimeException("Ce club n'autorise qu'un seul comité par membre. Le membre est déjà dans le comité '" + currentSubGroupName + "'. Veuillez d'abord le retirer de ce comité.");
        }
    }
    
    // Continuer l'assignation...
}
```

---

## 🎨 Implémentation Frontend

### 1. Modèle TypeScript

**Fichier:** `Front/src/app/models/club.model.ts`

```typescript
export enum CommitteeMembershipMode {
  MULTIPLE_ALLOWED = 'MULTIPLE_ALLOWED',
  SINGLE_ONLY = 'SINGLE_ONLY'
}

export interface ClubRules {
  about: string;
  rules: string[];
  requiresApproval: boolean;
  committeeMembershipMode?: CommitteeMembershipMode;  // ✅ NOUVEAU
}
```

---

### 2. Validation dans le Composant

**Fichier:** `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`

```typescript
assignToSubGroup(): void {
  const { userId, subGroupId, subGroupRole } = this.assignForm.value;
  
  // ✅ Vérifier le mode d'appartenance
  const mode = this.club.rules?.committeeMembershipMode || 'MULTIPLE_ALLOWED';
  
  // ✅ Si mode SINGLE_ONLY, vérifier que le membre n'est pas déjà dans un autre comité
  if (mode === 'SINGLE_ONLY') {
    const member = this.club.members.find(m => m.userId === userId);
    if (member && member.subGroupId && member.subGroupId !== subGroupId) {
      const currentSubGroup = this.club.subGroups.find(sg => sg.id === member.subGroupId);
      const currentSubGroupName = currentSubGroup?.name || 'un comité';
      alert(`❌ Ce club n'autorise qu'un seul comité par membre.\n\nLe membre est déjà dans le comité "${currentSubGroupName}".\n\nVeuillez d'abord le retirer de ce comité.`);
      return;
    }
  }
  
  // Continuer l'assignation...
}
```

---

## 🧪 Tests

### Test 1: Mode MULTIPLE_ALLOWED (Par défaut)

**Configuration:**
```json
{
  "rules": {
    "committeeMembershipMode": "MULTIPLE_ALLOWED"
  }
}
```

**Actions:**
1. Assigner Alice au comité "Media" comme RESPONSABLE
2. Assigner Alice au comité "Event" comme MEMBRE_COMITE
3. Assigner Alice au comité "Technique" comme MEMBRE_COMITE

**Résultat attendu:**
```
✅ Alice est RESPONSABLE de "Media"
✅ Alice est MEMBRE_COMITE de "Event"
✅ Alice est MEMBRE_COMITE de "Technique"
```

---

### Test 2: Mode SINGLE_ONLY

**Configuration:**
```json
{
  "rules": {
    "committeeMembershipMode": "SINGLE_ONLY"
  }
}
```

**Actions:**
1. Assigner Bob au comité "Media" comme RESPONSABLE
2. Tenter d'assigner Bob au comité "Event"

**Résultat attendu:**
```
✅ Bob est RESPONSABLE de "Media"
❌ Erreur: "Ce club n'autorise qu'un seul comité par membre. Le membre est déjà dans le comité 'Media'. Veuillez d'abord le retirer de ce comité."
```

**Pour changer Bob de comité:**
1. Retirer Bob du comité "Media"
2. Assigner Bob au comité "Event"

**Résultat:**
```
✅ Bob est maintenant dans le comité "Event"
```

---

## 📊 Configuration dans MongoDB

### Créer un club avec mode MULTIPLE_ALLOWED

```javascript
db.clubs.insertOne({
  name: "Grand Club",
  description: "Club avec plusieurs comités",
  rules: {
    about: "Bienvenue",
    rules: ["Règle 1", "Règle 2"],
    requiresApproval: true,
    committeeMembershipMode: "MULTIPLE_ALLOWED"  // ✅ Plusieurs comités autorisés
  },
  members: [],
  subGroups: []
})
```

---

### Créer un club avec mode SINGLE_ONLY

```javascript
db.clubs.insertOne({
  name: "Petit Club",
  description: "Club avec spécialisation stricte",
  rules: {
    about: "Bienvenue",
    rules: ["Règle 1", "Règle 2"],
    requiresApproval: true,
    committeeMembershipMode: "SINGLE_ONLY"  // ✅ Un seul comité par membre
  },
  members: [],
  subGroups: []
})
```

---

### Modifier le mode d'un club existant

```javascript
// Passer en mode SINGLE_ONLY
db.clubs.updateOne(
  { _id: "votre-club-id" },
  { $set: { "rules.committeeMembershipMode": "SINGLE_ONLY" } }
)

// Passer en mode MULTIPLE_ALLOWED
db.clubs.updateOne(
  { _id: "votre-club-id" },
  { $set: { "rules.committeeMembershipMode": "MULTIPLE_ALLOWED" } }
)
```

---

## 🎨 Interface Utilisateur (À implémenter)

### Page de Configuration du Club

**Ajoutez un sélecteur dans le formulaire de modification du club:**

```html
<div class="form-group">
  <label>Mode d'appartenance aux comités</label>
  <select formControlName="committeeMembershipMode">
    <option value="MULTIPLE_ALLOWED">
      ✅ Plusieurs comités autorisés (recommandé pour grands clubs)
    </option>
    <option value="SINGLE_ONLY">
      🔒 Un seul comité par membre (recommandé pour petits clubs)
    </option>
  </select>
  
  <p class="help-text">
    <strong>Plusieurs comités:</strong> Un membre peut appartenir à plusieurs comités à la fois.<br>
    <strong>Un seul comité:</strong> Un membre ne peut appartenir qu'à un seul comité à la fois.
  </p>
</div>
```

---

## 🔄 Migration des Clubs Existants

**Par défaut, tous les clubs existants seront en mode MULTIPLE_ALLOWED.**

Si un club existant n'a pas de `committeeMembershipMode` défini:
```java
CommitteeMembershipMode mode = club.getRules() != null && club.getRules().getCommitteeMembershipMode() != null
        ? club.getRules().getCommitteeMembershipMode()
        : CommitteeMembershipMode.MULTIPLE_ALLOWED;  // ✅ Valeur par défaut
```

---

## ✅ Avantages

### Pour les Grands Clubs (MULTIPLE_ALLOWED)
- ✅ Flexibilité maximale
- ✅ Membres polyvalents
- ✅ Collaboration inter-comités
- ✅ Pas de restrictions

### Pour les Petits Clubs (SINGLE_ONLY)
- ✅ Spécialisation claire
- ✅ Évite la surcharge des membres
- ✅ Responsabilités bien définies
- ✅ Gestion simplifiée

---

## 🎉 Résumé

La fonctionnalité de configuration du mode d'appartenance aux comités est maintenant implémentée:

1. ✅ Enum `CommitteeMembershipMode` créé
2. ✅ Champ ajouté dans `ClubRules`
3. ✅ Validation backend dans `ClubService`
4. ✅ Validation frontend dans `ClubDetailComponent`
5. ✅ Messages d'erreur clairs pour l'utilisateur
6. ✅ Mode par défaut: `MULTIPLE_ALLOWED`

Chaque club peut maintenant choisir son mode de fonctionnement! 🚀

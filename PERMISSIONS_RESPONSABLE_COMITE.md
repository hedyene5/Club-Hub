# 🔐 Permissions du Responsable de Comité - Version Finale

## ✅ Ce que le Responsable de Comité PEUT faire

### 1. Assigner des Membres à SON Comité
- ✅ Peut voir le bouton "📌 Assigner un membre à un comité"
- ✅ Peut sélectionner n'importe quel membre du club
- ✅ Peut assigner UNIQUEMENT à SON comité (les autres comités ne sont pas visibles)
- ✅ Peut assigner UNIQUEMENT comme "Membre" (pas comme Responsable)

### 2. Permissions de Base (comme un membre simple)
- ✅ VIEW_MEMBERS - Voir les membres
- ✅ VIEW_SUBGROUPS - Voir les comités
- ✅ VIEW_ELECTIONS - Voir les élections
- ✅ VOTE_ELECTIONS - Voter aux élections
- ✅ VIEW_EVENTS - Voir les événements
- ✅ VIEW_CLUB_INFO - Voir les infos du club
- ✅ JOIN_VOICE_CHANNELS - Rejoindre les canaux vocaux

### 3. Permission Spéciale
- ✅ ASSIGN_TO_SUBGROUPS - Assigner des membres à SON comité uniquement

---

## ❌ Ce que le Responsable de Comité NE PEUT PAS faire

### 1. Gestion des Membres du Club
- ❌ Ajouter des membres au club (bouton "Ajouter un membre" caché)
- ❌ Modifier les informations des membres (pas de bouton ✏️)
- ❌ Supprimer des membres du club (pas de bouton 🗑️)
- ❌ Changer le rôle des membres dans le club

### 2. Gestion des Comités
- ❌ Créer de nouveaux comités (bouton "Créer un comité" caché)
- ❌ Modifier les comités (pas de bouton ✏️ sur les comités)
- ❌ Supprimer des comités (pas de bouton 🗑️ sur les comités)
- ❌ Retirer des membres d'un comité (pas de bouton "Retirer")

### 3. Gestion des Élections
- ❌ Créer des élections
- ❌ Modifier des élections
- ❌ Supprimer des élections
- ❌ Démarrer/Terminer des élections

### 4. Assignation Limitée
- ❌ Assigner des membres à d'autres comités (seulement au sien)
- ❌ Nommer d'autres responsables de comité (seulement le président peut)

---

## 🎯 Scénario d'Utilisation

### Exemple: Ahmed est Responsable du Comité Marketing

1. **Ahmed se connecte**
   - Son rôle dans la base de données: `"Responsable Marketing"`
   - Permissions chargées automatiquement

2. **Ahmed va sur la page du club**
   - Il voit tous les membres du club (lecture seule)
   - Il voit tous les comités (lecture seule)
   - Il voit le bouton "📌 Assigner un membre à un comité"

3. **Ahmed clique sur "Assigner un membre"**
   - Il voit la liste de TOUS les membres du club
   - Dans le dropdown "Comité", il voit UNIQUEMENT "Marketing (Mon comité)"
   - Dans le dropdown "Rôle", il voit UNIQUEMENT "Membre"

4. **Ahmed assigne un membre**
   - Sélectionne "Sara" (membre du club)
   - Sélectionne "Marketing (Mon comité)"
   - Sélectionne "Membre"
   - Clique "Assigner"
   - ✅ Sara est maintenant membre du comité Marketing

5. **Ce qu'Ahmed NE PEUT PAS faire**
   - ❌ Assigner Sara au comité "Technique" (pas visible)
   - ❌ Nommer Sara comme "Responsable" (option cachée)
   - ❌ Supprimer Sara du club
   - ❌ Modifier le profil de Sara
   - ❌ Créer un nouveau comité
   - ❌ Modifier le comité Marketing
   - ❌ Retirer Sara du comité Marketing

---

## 🔧 Implémentation Technique

### Backend - PermissionService.java

```java
private List<String> getCommitteeResponsablePermissions() {
    List<String> permissions = new ArrayList<>();
    
    // Permissions de base (comme un membre simple)
    permissions.add("VIEW_MEMBERS");
    permissions.add("VIEW_SUBGROUPS");
    permissions.add("VIEW_ELECTIONS");
    permissions.add("VOTE_ELECTIONS");
    permissions.add("VIEW_EVENTS");
    permissions.add("VIEW_CLUB_INFO");
    permissions.add("JOIN_VOICE_CHANNELS");
    
    // ✅ Permission spéciale: UNIQUEMENT assigner des membres à son comité
    permissions.add("ASSIGN_TO_SUBGROUPS");
    
    return permissions;
}
```

### Frontend - Validation dans assignToSubGroup()

```typescript
assignToSubGroup(): void {
    const { userId, subGroupId, subGroupRole } = this.assignForm.value;
    
    // ✅ VALIDATION: Si l'utilisateur est responsable de comité
    const mySubGroupId = this.getMyResponsibleSubGroupId();
    if (mySubGroupId && !this.isAdmin) {
      // Vérifier qu'il assigne dans SON comité uniquement
      if (subGroupId !== mySubGroupId) {
        alert('❌ Vous ne pouvez assigner des membres que dans votre propre comité');
        return;
      }
      // Les responsables ne peuvent pas créer d'autres responsables
      if (subGroupRole === 'RESPONSABLE') {
        alert('❌ Seul le président peut nommer des responsables de comité');
        return;
      }
    }
    
    // ... reste du code
}
```

### Frontend - Affichage Conditionnel

```html
<!-- Bouton "Ajouter un membre" - CACHÉ pour responsable -->
<button *ngIf="isAdmin || permissionService.hasPermission('ADD_MEMBERS')" 
        (click)="openMemberForm()">
  + Ajouter un membre
</button>

<!-- Bouton "Créer un comité" - CACHÉ pour responsable -->
<button *ngIf="isAdmin || permissionService.hasPermission('CREATE_SUBGROUPS')" 
        (click)="showSubGroupForm = !showSubGroupForm">
  + Créer un comité
</button>

<!-- Bouton "Assigner à un comité" - VISIBLE pour responsable -->
<div *ngIf="isAdmin || permissionService.hasPermission('ASSIGN_TO_SUBGROUPS') || getMyResponsibleSubGroupId()">
  <button (click)="showAssignForm = !showAssignForm">
    📌 Assigner un membre à un comité
  </button>
</div>

<!-- Dropdown comité - Filtré pour responsable -->
<select formControlName="subGroupId">
  <ng-container *ngIf="isAdmin">
    <!-- Admin voit tous les comités -->
    <option *ngFor="let sg of club.subGroups" [value]="sg.id">
      {{ sg.name }}
    </option>
  </ng-container>
  <ng-container *ngIf="!isAdmin && getMyResponsibleSubGroupId()">
    <!-- Responsable voit seulement SON comité -->
    <ng-container *ngFor="let sg of club.subGroups">
      <option [value]="sg.id" *ngIf="sg.id === getMyResponsibleSubGroupId()">
        {{ sg.name }} (Mon comité)
      </option>
    </ng-container>
  </ng-container>
</select>

<!-- Dropdown rôle - Filtré pour responsable -->
<select formControlName="subGroupRole">
  <option value="MEMBRE">Membre</option>
  <option value="RESPONSABLE" *ngIf="isAdmin">Responsable</option>
</select>
```

---

## 📊 Comparaison des Permissions

| Action | Président | RH | Responsable Comité | Membre Simple |
|--------|-----------|----|--------------------|---------------|
| Ajouter membre au club | ✅ | ✅ | ❌ | ❌ |
| Modifier membre | ✅ | ✅ | ❌ | ❌ |
| Supprimer membre | ✅ | ✅ | ❌ | ❌ |
| Créer comité | ✅ | ❌ | ❌ | ❌ |
| Modifier comité | ✅ | ❌ | ❌ | ❌ |
| Supprimer comité | ✅ | ❌ | ❌ | ❌ |
| Assigner à n'importe quel comité | ✅ | ✅ | ❌ | ❌ |
| Assigner à SON comité | ✅ | ✅ | ✅ | ❌ |
| Nommer responsable | ✅ | ❌ | ❌ | ❌ |
| Retirer membre d'un comité | ✅ | ✅ | ❌ | ❌ |
| Créer élection | ✅ | ❌ | ❌ | ❌ |
| Voter aux élections | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Tests à Effectuer

### Test 1: Assignation Réussie
1. Connectez-vous en tant que responsable de comité
2. Cliquez sur "📌 Assigner un membre à un comité"
3. Sélectionnez un membre
4. Vérifiez que seul VOTRE comité est visible
5. Sélectionnez "Membre" (pas "Responsable")
6. Cliquez "Assigner"
7. ✅ Le membre doit être ajouté au comité

### Test 2: Validation - Autre Comité
1. Tentez de modifier le HTML pour voir un autre comité
2. Tentez d'assigner à cet autre comité
3. ❌ Doit afficher: "Vous ne pouvez assigner des membres que dans votre propre comité"

### Test 3: Validation - Nommer Responsable
1. Tentez de modifier le HTML pour voir l'option "Responsable"
2. Tentez d'assigner comme responsable
3. ❌ Doit afficher: "Seul le président peut nommer des responsables de comité"

### Test 4: Boutons Cachés
1. Connectez-vous en tant que responsable
2. Vérifiez que ces boutons sont CACHÉS:
   - ❌ "Ajouter un membre" (au club)
   - ❌ "Créer un comité"
   - ❌ ✏️ sur les membres
   - ❌ 🗑️ sur les membres
   - ❌ ✏️ sur les comités
   - ❌ 🗑️ sur les comités
   - ❌ "Retirer" dans les comités

### Test 5: Bouton Visible
1. Connectez-vous en tant que responsable
2. Vérifiez que ce bouton est VISIBLE:
   - ✅ "📌 Assigner un membre à un comité"

---

## 🎉 Résultat Final

Le responsable de comité a maintenant des permissions très limitées:
- ✅ Il peut UNIQUEMENT ajouter des membres à SON comité
- ❌ Il ne peut PAS modifier, supprimer, ou gérer quoi que ce soit d'autre
- ✅ C'est un rôle de "facilitateur" pour son comité uniquement
- ✅ Toutes les autres actions restent réservées aux administrateurs (Président, RH, etc.)

---

## 📞 Fichiers Modifiés

1. ✅ `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/service/PermissionService.java`
   - Réduit les permissions à ASSIGN_TO_SUBGROUPS uniquement

2. ✅ `Front/src/app/pages/clubs/club-detail/club-detail.component.ts`
   - Mis à jour `canManageSubGroup()` pour retourner false pour responsables
   - Mis à jour `canDeleteMember()` pour retourner false pour responsables
   - Mis à jour validation dans `assignToSubGroup()`

3. ✅ `Front/src/app/pages/clubs/club-detail/club-detail.component.html`
   - Caché tous les boutons sauf "Assigner à un comité"
   - Filtré le dropdown des comités pour montrer seulement le sien
   - Caché l'option "Responsable" dans le dropdown rôle

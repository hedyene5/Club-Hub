# 🔐 Permissions EXACTES du Responsable de Comité

## 📋 Définition

Un **RESPONSABLE** est une personne dont le `userId` correspond au `responsableId` d'UN comité (SubGroup) spécifique.

```typescript
// Identification:
subGroup.responsableId === currentUserId
```

---

## ✅ CE QU'IL PEUT FAIRE (uniquement sur SON comité)

### 1. ASSIGNER des Membres à SON Comité

**Description:**
- Peut prendre n'importe quel membre du club
- Et l'ajouter à son comité
- **Condition:** Le membre doit déjà exister dans le club

**Interface:**
- Bouton "📌 Assigner un membre à un comité" visible
- Dropdown "Membre" → Tous les membres du club
- Dropdown "Comité" → UNIQUEMENT son comité
- Dropdown "Rôle" → MEMBRE_COMITE ou RESPONSABLE

**Implémentation:**
```typescript
canManageSubGroupMembers(subGroupId: string): boolean {
  if (this.isAdmin) return true;
  return this.isResponsibleOf(subGroupId);
}
```

**Exemple:**
```
Bob est Responsable du comité "Marketing"
→ Bob peut assigner Alice au comité Marketing
→ Alice devient MEMBRE_COMITE du comité Marketing
```

---

### 2. RETIRER des Membres de SON Comité

**Description:**
- Peut enlever un membre de son comité
- Le membre redevient MEMBRE_SIMPLE (sans comité)
- Le membre reste dans le club

**Interface:**
- Colonne "Actions" visible dans SON comité
- Bouton "Retirer" visible pour chaque membre

**Implémentation:**
```typescript
canRemoveFromSubGroup(subGroupId: string): boolean {
  if (this.isAdmin) return true;
  return this.isResponsibleOf(subGroupId);
}
```

**Exemple:**
```
Bob est Responsable du comité "Marketing"
Alice est MEMBRE_COMITE du comité Marketing
→ Bob clique "Retirer" à côté d'Alice
→ Alice est retirée du comité Marketing
→ Alice redevient MEMBRE_SIMPLE
→ Alice reste membre du club
```

---

### 3. CHANGER LES RÔLES dans SON Comité

**Description:**
- Peut promouvoir un MEMBRE_COMITE → RESPONSABLE
- Peut rétrograder un RESPONSABLE → MEMBRE_COMITE
- **Condition:** Ne peut pas changer son propre rôle

**Interface:**
- Dropdown de sélection de rôle dans la colonne "Rôle dans le comité"
- Options: "📋 Membre du comité" ou "👑 Responsable"
- Le dropdown est visible UNIQUEMENT pour le responsable de ce comité

**Implémentation:**
```typescript
changeSubGroupRole(subGroupId: string, userId: string, event: any): void {
  // Validation: ne peut pas changer son propre rôle
  if (userId === currentUserId) {
    alert('❌ Vous ne pouvez pas changer votre propre rôle');
    return;
  }
  
  // Validation: doit être SON comité
  if (subGroupId !== mySubGroupId) {
    alert('❌ Vous ne pouvez changer les rôles que dans votre propre comité');
    return;
  }
  
  // Changer le rôle
  this.clubService.assignToSubGroup(clubId, userId, subGroupId, newRole);
}
```

**Exemple 1: Promouvoir**
```
Bob est Responsable du comité "Marketing"
Alice est MEMBRE_COMITE du comité Marketing
→ Bob change le rôle d'Alice en "Responsable"
→ Alice devient RESPONSABLE du comité Marketing
→ Alice obtient les permissions de responsable
→ Le rôle d'Alice dans la base: "Responsable Marketing"
```

**Exemple 2: Rétrograder**
```
Bob est Responsable du comité "Marketing"
Alice est RESPONSABLE du comité Marketing
→ Bob change le rôle d'Alice en "Membre du comité"
→ Alice redevient MEMBRE_COMITE
→ Alice perd les permissions de responsable
→ Le rôle d'Alice est restauré dans la base
```

---

## ❌ CE QU'IL NE PEUT PAS FAIRE

### 1. Assigner à un AUTRE Comité

**Restriction:**
- Ne peut pas assigner un membre à un comité dont il n'est pas responsable

**Interface:**
- Dropdown "Comité" affiche UNIQUEMENT son comité

**Validation:**
```typescript
if (subGroupId !== mySubGroupId) {
  alert('❌ Vous ne pouvez assigner des membres que dans votre propre comité');
  return;
}
```

---

### 2. Retirer d'un AUTRE Comité

**Restriction:**
- Ne peut pas retirer un membre d'un comité dont il n'est pas responsable

**Interface:**
- Colonne "Actions" cachée dans les autres comités

**Validation:**
```typescript
if (subGroupId !== mySubGroupId) {
  alert('❌ Vous ne pouvez retirer des membres que de votre propre comité');
  return;
}
```

---

### 3. Créer un Nouveau Comité

**Restriction:**
- Seul le PRESIDENT peut créer des comités

**Interface:**
- Bouton "Créer un comité" caché

**Condition:**
```html
<button *ngIf="isAdmin || permissionService.hasPermission('CREATE_SUBGROUPS')">
  + Créer un comité
</button>
```

---

### 4. Supprimer un Comité

**Restriction:**
- Seul le PRESIDENT peut supprimer des comités

**Interface:**
- Bouton 🗑️ sur les comités caché

**Condition:**
```html
<button *ngIf="isAdmin || permissionService.hasPermission('DELETE_SUBGROUPS')">
  🗑️
</button>
```

---

### 5. Ajouter un Nouveau Membre au Club

**Restriction:**
- Seul le PRESIDENT peut ajouter des membres au club

**Interface:**
- Bouton "Ajouter un membre" (au club) caché

**Condition:**
```html
<button *ngIf="isAdmin || permissionService.hasPermission('ADD_MEMBERS')">
  + Ajouter un membre
</button>
```

---

### 6. Supprimer un Membre du Club

**Restriction:**
- Seul le PRESIDENT peut supprimer des membres du club

**Interface:**
- Boutons 🗑️ sur les membres du club cachés

**Implémentation:**
```typescript
canDeleteMember(memberId: string): boolean {
  return this.isAdmin || this.permissionService.hasPermission('DELETE_MEMBERS');
}
```

---

### 7. Modifier les Infos d'un Autre Comité

**Restriction:**
- Ne peut pas modifier le nom ou la description d'un autre comité

**Interface:**
- Boutons ✏️ sur les autres comités cachés

**Condition:**
```html
<button *ngIf="isAdmin || permissionService.hasPermission('EDIT_SUBGROUPS')">
  ✏️
</button>
```

---

### 8. Créer des Élections

**Restriction:**
- Seul le PRESIDENT peut créer des élections

**Interface:**
- Bouton "Nouvelle élection" caché

**Condition:**
```html
<a *ngIf="isAdmin || permissionService.hasPermission('CREATE_ELECTIONS')">
  + Nouvelle élection
</a>
```

---

### 9. Changer Son Propre Rôle

**Restriction:**
- Ne peut pas se retirer lui-même comme responsable
- Ne peut pas changer son propre rôle dans le comité

**Validation:**
```typescript
if (userId === currentUserId) {
  alert('❌ Vous ne pouvez pas changer votre propre rôle');
  return;
}
```

---

## 📊 Tableau Récapitulatif

| Action | Responsable | PRESIDENT |
|--------|-------------|-----------|
| Assigner à SON comité | ✅ | ✅ |
| Retirer de SON comité | ✅ | ✅ |
| Changer rôle dans SON comité | ✅ | ✅ |
| Assigner à un autre comité | ❌ | ✅ |
| Retirer d'un autre comité | ❌ | ✅ |
| Créer un comité | ❌ | ✅ |
| Supprimer un comité | ❌ | ✅ |
| Ajouter membre au club | ❌ | ✅ |
| Supprimer membre du club | ❌ | ✅ |
| Modifier infos d'un comité | ❌ | ✅ |
| Créer des élections | ❌ | ✅ |
| Changer son propre rôle | ❌ | ✅ |

---

## 🔧 Implémentation Technique

### Backend - SubGroup.java
```java
public class SubGroup {
    private String responsableId;  // ✅ ID du responsable
    private Map<String, String> memberRoles;  // ✅ userId -> rôle
}
```

### Backend - ClubService.java
```java
public Club assignToSubGroup(String clubId, String userId, String subGroupId, String subGroupRole) {
    // Mettre à jour le membre
    member.setSubGroupRole(subGroupRole);
    
    // Mettre à jour le sous-groupe
    subGroup.getMemberRoles().put(userId, subGroupRole);
    
    // Si RESPONSABLE, mettre à jour responsableId
    if (subGroupRole.equals("RESPONSABLE")) {
        subGroup.setResponsableId(userId);
        updateUserRole(userId, "Responsable " + subGroup.getName());
    }
    
    return clubRepository.save(club);
}
```

### Frontend - Méthodes de Vérification
```typescript
// Vérifier si l'utilisateur est responsable d'un comité
isResponsibleOf(subGroupId: string): boolean {
  const subGroup = this.club.subGroups.find(sg => sg.id === subGroupId);
  const currentUserId = this.authService.getCurrentUser()?.userId;
  return subGroup?.responsableId === currentUserId;
}

// Vérifier si peut gérer les membres d'un comité
canManageSubGroupMembers(subGroupId: string): boolean {
  if (this.isAdmin) return true;
  return this.isResponsibleOf(subGroupId);
}

// Vérifier si peut retirer des membres d'un comité
canRemoveFromSubGroup(subGroupId: string): boolean {
  if (this.isAdmin) return true;
  return this.isResponsibleOf(subGroupId);
}
```

---

## 🧪 Tests de Validation

### Test 1: Assigner à SON Comité ✅
```
1. Connecté en tant que responsable du comité "Marketing"
2. Cliquer "📌 Assigner un membre à un comité"
3. Sélectionner un membre
4. Dropdown "Comité" affiche UNIQUEMENT "Marketing (Mon comité)"
5. Sélectionner "Membre du comité"
6. Cliquer "Assigner"
7. ✅ Le membre est ajouté au comité Marketing
```

### Test 2: Retirer de SON Comité ✅
```
1. Connecté en tant que responsable du comité "Marketing"
2. Aller dans la liste des membres du comité Marketing
3. Cliquer "Retirer" à côté d'un membre
4. ✅ Le membre est retiré du comité
5. ✅ Le membre reste dans le club
```

### Test 3: Changer Rôle dans SON Comité ✅
```
1. Connecté en tant que responsable du comité "Marketing"
2. Aller dans la liste des membres du comité Marketing
3. Changer le rôle d'un membre via le dropdown
4. ✅ Le rôle est changé
5. ✅ Les permissions sont mises à jour
```

### Test 4: Tentative d'Assigner à un Autre Comité ❌
```
1. Connecté en tant que responsable du comité "Marketing"
2. Cliquer "📌 Assigner un membre à un comité"
3. ❌ Dropdown "Comité" n'affiche que "Marketing (Mon comité)"
4. ❌ Impossible de sélectionner un autre comité
```

### Test 5: Tentative de Créer un Comité ❌
```
1. Connecté en tant que responsable
2. ❌ Bouton "Créer un comité" caché
3. ❌ Impossible de créer un comité
```

### Test 6: Tentative de Changer Son Propre Rôle ❌
```
1. Connecté en tant que responsable du comité "Marketing"
2. Aller dans la liste des membres du comité Marketing
3. ❌ Le dropdown de rôle n'apparaît pas pour soi-même
4. ❌ Impossible de changer son propre rôle
```

---

## 🎉 Résumé

Le responsable de comité a des permissions TRÈS LIMITÉES:
- ✅ Peut gérer UNIQUEMENT son comité
- ✅ Peut assigner, retirer et changer les rôles dans son comité
- ❌ Ne peut RIEN faire au niveau du club
- ❌ Ne peut RIEN faire sur les autres comités

C'est un rôle de "gestionnaire de comité" avec des permissions bien définies et sécurisées!

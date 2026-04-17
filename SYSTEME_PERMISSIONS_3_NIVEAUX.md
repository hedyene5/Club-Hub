# 🔐 Système de Permissions à 3 Niveaux

## 📋 Vue d'Ensemble

Le système gère 3 types de membres avec des permissions différentes:

1. **MEMBRE_SIMPLE** - Membre de base (lecture seule)
2. **MEMBRE_COMITE** - Membre actif d'un comité (participation)
3. **RESPONSABLE** - Chef d'un comité (gestion)

---

## 1️⃣ MEMBRE_SIMPLE (Membre de Base)

### Caractéristiques:
- ❌ N'appartient à AUCUN comité
- ✅ Peut consulter le club
- ✅ Peut voir les événements
- ✅ Peut voter aux élections
- ✅ Peut être candidat

### Permissions:
```typescript
- VIEW_MEMBERS
- VIEW_SUBGROUPS
- VIEW_ELECTIONS
- VOTE_ELECTIONS
- VIEW_EVENTS
- VIEW_CLUB_INFO
- JOIN_VOICE_CHANNELS
```

### Interface:
- Lecture seule
- Aucun bouton de gestion visible
- Peut voir les informations du club
- Peut participer aux élections

### Identification:
```typescript
// Un membre est MEMBRE_SIMPLE si:
member.subGroupId === null
// OU
member.subGroupRole === undefined
```

---

## 2️⃣ MEMBRE_COMITE (Membre Actif)

### Caractéristiques:
- ✅ Appartient à UN ou plusieurs comités
- ✅ Participe aux réunions du comité
- ✅ Aide à organiser les événements du comité
- ✅ Peut voir les membres de son comité
- ❌ NE PEUT PAS gérer le comité
- ❌ NE PEUT PAS ajouter/supprimer des membres
- ❌ NE PEUT PAS changer les rôles

### Permissions:
```typescript
// Mêmes permissions que MEMBRE_SIMPLE
- VIEW_MEMBERS
- VIEW_SUBGROUPS
- VIEW_ELECTIONS
- VOTE_ELECTIONS
- VIEW_EVENTS
- VIEW_CLUB_INFO
- JOIN_VOICE_CHANNELS
```

### Interface:
- Lecture seule
- Voit son comité avec un badge "📋 Membre du comité"
- Aucun bouton de gestion visible
- Peut participer aux activités du comité

### Identification:
```typescript
// Un membre est MEMBRE_COMITE si:
member.subGroupId !== null
member.subGroupRole === 'MEMBRE_COMITE'

// OU dans SubGroup:
subGroup.memberRoles[userId] === 'MEMBRE_COMITE'
```

---

## 3️⃣ RESPONSABLE (Chef de Comité)

### Caractéristiques:
- ✅ Est membre actif d'UN comité (celui qu'il gère)
- ✅ Peut AJOUTER des membres à son comité
- ✅ Peut RETIRER des membres de son comité
- ✅ Peut changer le rôle d'un membre (MEMBRE_COMITE ↔ RESPONSABLE)
- ✅ Peut voir toutes les actions de son comité
- ❌ NE PEUT PAS toucher aux autres comités
- ❌ NE PEUT PAS ajouter/supprimer des membres du club
- ❌ NE PEUT PAS créer/supprimer des comités

### Permissions:
```typescript
// Permissions de base + gestion de SON comité
- VIEW_MEMBERS
- VIEW_SUBGROUPS
- VIEW_ELECTIONS
- VOTE_ELECTIONS
- VIEW_EVENTS
- VIEW_CLUB_INFO
- JOIN_VOICE_CHANNELS
- ASSIGN_TO_SUBGROUPS  // ✅ Peut assigner à SON comité
```

### Interface:
- Badge "👑 Responsable" en violet
- Bouton "📌 Assigner un membre à un comité" visible
- Colonne "Actions" visible dans SON comité
- Bouton "Retirer" visible pour les membres de SON comité
- Peut changer le rôle des membres de SON comité
- Tous les autres boutons cachés

### Identification:
```typescript
// Un membre est RESPONSABLE si:
member.subGroupId !== null
member.subGroupRole === 'RESPONSABLE'

// OU dans SubGroup:
subGroup.responsableId === userId
subGroup.memberRoles[userId] === 'RESPONSABLE'

// OU dans User:
user.role === 'Responsable [Nom du Comité]'
```

---

## 🔄 Transitions entre les Niveaux

### MEMBRE_SIMPLE → MEMBRE_COMITE
```typescript
// Quand un membre rejoint un comité:
1. Assigner le membre au comité
2. Définir subGroupRole = 'MEMBRE_COMITE'
3. Ajouter userId à subGroup.memberIds
4. Ajouter à subGroup.memberRoles[userId] = 'MEMBRE_COMITE'
```

### MEMBRE_COMITE → RESPONSABLE
```typescript
// Quand un membre devient responsable:
1. Définir subGroupRole = 'RESPONSABLE'
2. Définir subGroup.responsableId = userId
3. Mettre à jour subGroup.memberRoles[userId] = 'RESPONSABLE'
4. Mettre à jour user.role = 'Responsable [Nom du Comité]'
5. Sauvegarder initialRole pour restauration future
```

### RESPONSABLE → MEMBRE_COMITE
```typescript
// Quand un responsable redevient membre:
1. Définir subGroupRole = 'MEMBRE_COMITE'
2. Retirer subGroup.responsableId
3. Mettre à jour subGroup.memberRoles[userId] = 'MEMBRE_COMITE'
4. Restaurer user.role = initialRole
```

### MEMBRE_COMITE → MEMBRE_SIMPLE
```typescript
// Quand un membre quitte le comité:
1. Définir subGroupId = null
2. Définir subGroupRole = null
3. Retirer userId de subGroup.memberIds
4. Retirer de subGroup.memberRoles
```

---

## 🎯 Règles Métier

### Règle 1: Un seul responsable par comité
```typescript
// Avant d'assigner un nouveau responsable:
if (subGroupRole === 'RESPONSABLE') {
  // Vérifier qu'il n'y a pas déjà un responsable
  if (subGroup.responsableId && subGroup.responsableId !== userId) {
    throw new Error('Ce comité a déjà un responsable');
  }
}
```

### Règle 2: Le responsable ne peut gérer que SON comité
```typescript
canManageSubGroupMembers(subGroupId: string): boolean {
  if (this.isAdmin) return true;
  
  const subGroup = this.club.subGroups.find(sg => sg.id === subGroupId);
  const currentUserId = this.authService.getCurrentUser()?.userId;
  
  return subGroup?.responsableId === currentUserId;
}
```

### Règle 3: Seul le PRESIDENT peut nommer des responsables
```typescript
// Dans le formulaire d'assignation:
<option value="RESPONSABLE" *ngIf="isAdmin">Responsable du comité</option>

// Les responsables ne voient que:
<option value="MEMBRE_COMITE">Membre du comité</option>
```

### Règle 4: Le responsable ne peut pas se retirer lui-même
```typescript
canRemoveFromSubGroup(subGroupId: string, userId: string): boolean {
  const currentUserId = this.authService.getCurrentUser()?.userId;
  
  // Ne peut pas se retirer soi-même
  if (userId === currentUserId) return false;
  
  return this.canManageSubGroupMembers(subGroupId);
}
```

---

## 📊 Tableau Comparatif des Permissions

| Action | MEMBRE_SIMPLE | MEMBRE_COMITE | RESPONSABLE | PRESIDENT |
|--------|---------------|---------------|-------------|-----------|
| Voir le club | ✅ | ✅ | ✅ | ✅ |
| Voir les événements | ✅ | ✅ | ✅ | ✅ |
| Voter aux élections | ✅ | ✅ | ✅ | ✅ |
| Être candidat | ✅ | ✅ | ✅ | ✅ |
| Voir son comité | ❌ | ✅ | ✅ | ✅ |
| Participer aux réunions | ❌ | ✅ | ✅ | ✅ |
| Ajouter membre au comité | ❌ | ❌ | ✅ (son comité) | ✅ |
| Retirer membre du comité | ❌ | ❌ | ✅ (son comité) | ✅ |
| Changer rôle dans comité | ❌ | ❌ | ✅ (son comité) | ✅ |
| Ajouter membre au club | ❌ | ❌ | ❌ | ✅ |
| Supprimer membre du club | ❌ | ❌ | ❌ | ✅ |
| Créer comité | ❌ | ❌ | ❌ | ✅ |
| Supprimer comité | ❌ | ❌ | ❌ | ✅ |
| Créer élection | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 Implémentation Technique

### Backend - SubGroup.java
```java
public class SubGroup {
    private String id;
    private String name;
    private String description;
    private List<String> memberIds;
    private String responsableId;  // ✅ ID du responsable
    private Map<String, String> memberRoles;  // ✅ userId -> rôle
}
```

### Backend - ClubService.java
```java
public Club assignToSubGroup(String clubId, String userId, String subGroupId, String subGroupRole) {
    // 1. Mettre à jour le membre
    member.setSubGroupId(subGroupId);
    member.setSubGroupRole(subGroupRole);
    
    // 2. Mettre à jour le sous-groupe
    subGroup.getMemberIds().add(userId);
    subGroup.getMemberRoles().put(userId, subGroupRole);
    
    // 3. Si RESPONSABLE, mettre à jour responsableId
    if (subGroupRole.equals("RESPONSABLE")) {
        subGroup.setResponsableId(userId);
        // Mettre à jour le rôle dans User service
        updateUserRole(userId, "Responsable " + subGroup.getName());
    }
    
    return clubRepository.save(club);
}
```

### Frontend - club-detail.component.ts
```typescript
// Vérifier si l'utilisateur est responsable
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
```

---

## 🧪 Tests à Effectuer

### Test 1: MEMBRE_SIMPLE
```
1. Créer un membre sans l'assigner à un comité
2. Vérifier qu'il ne voit aucun bouton de gestion
3. Vérifier qu'il peut voir les informations du club
4. Vérifier qu'il peut voter aux élections
```

### Test 2: MEMBRE_COMITE
```
1. Assigner un membre à un comité avec rôle "MEMBRE_COMITE"
2. Vérifier le badge "📋 Membre du comité"
3. Vérifier qu'il ne voit aucun bouton de gestion
4. Vérifier qu'il voit les membres de son comité
```

### Test 3: RESPONSABLE
```
1. Assigner un membre comme RESPONSABLE d'un comité
2. Vérifier le badge "👑 Responsable"
3. Vérifier le rôle dans la base: "Responsable [Comité]"
4. Vérifier qu'il voit le bouton "Assigner un membre"
5. Vérifier qu'il peut retirer des membres de SON comité
6. Vérifier qu'il ne peut PAS gérer d'autres comités
```

### Test 4: Transitions
```
1. MEMBRE_SIMPLE → MEMBRE_COMITE: Assigner à un comité
2. MEMBRE_COMITE → RESPONSABLE: Promouvoir en responsable
3. RESPONSABLE → MEMBRE_COMITE: Rétrograder
4. MEMBRE_COMITE → MEMBRE_SIMPLE: Retirer du comité
```

---

## 📁 Fichiers Modifiés

1. ✅ `SubGroup.java` - Ajouté responsableId et memberRoles
2. ✅ `ClubService.java` - Mis à jour assignToSubGroup()
3. ✅ `club.model.ts` - Ajouté responsableId et memberRoles
4. ✅ `club-detail.component.ts` - Ajouté méthodes de vérification
5. ✅ `club-detail.component.html` - Mis à jour les rôles et badges

---

## 🎉 Résultat Final

Le système gère maintenant 3 niveaux de membres avec des permissions claires:
- ✅ MEMBRE_SIMPLE: Lecture seule
- ✅ MEMBRE_COMITE: Participation active
- ✅ RESPONSABLE: Gestion de SON comité uniquement

Chaque niveau a des permissions bien définies et l'interface s'adapte automatiquement!

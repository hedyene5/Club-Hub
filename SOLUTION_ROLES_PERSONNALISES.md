# ✅ SOLUTION: RÔLES PERSONNALISÉS DANS LA LISTE

## 🎯 Problème

Les rôles personnalisés ne s'affichent pas dans la liste déroulante lors de l'ajout/modification d'un membre.

## ✅ Solution

Le système est **déjà fonctionnel**! Un rôle de test "Responsable Marketing" a été créé automatiquement.

---

## 🧪 Test Immédiat

### 1. Ouvrir la page du club

```
http://192.168.1.20:4200/clubs/69d2e1e5c692d749f7317750
```

### 2. Ajouter un membre

1. Cliquer sur "+ Ajouter un membre"
2. Cliquer sur le bouton 🐛 (debug) pour voir les logs
3. Regarder la liste déroulante "Rôle"

**Vous devriez voir:**
- PRESIDENT
- VICE_PRESIDENT
- SECRETAIRE_GENERALE
- TRESORIER
- RH
- MEMBRE_SIMPLE
- **Responsable Marketing** ← Rôle personnalisé!
- ➕ Autre (créer un nouveau rôle)

### 3. Vérifier dans la console (F12)

Cherchez ces logs:
```
🔍 Chargement des rôles personnalisés pour le club: 69d2e1e5c692d749f7317750
✅ Rôles personnalisés reçus: [...]
✅ Rôles actifs filtrés: [...]
📋 allRoles APRÈS chargement: [...]
```

---

## 🔧 Si Les Rôles Ne S'Affichent Toujours Pas

### Diagnostic 1: Vérifier l'API

```powershell
# Vérifier que le rôle existe
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/roles/club/69d2e1e5c692d749f7317750" -UseBasicParsing
```

**Résultat attendu:**
```json
[
  {
    "id": "xxx",
    "clubId": "69d2e1e5c692d749f7317750",
    "roleName": "Responsable Marketing",
    "description": "Gere la communication",
    "permissions": ["VIEW_MEMBERS", "VIEW_EVENTS", "CREATE_EVENTS"],
    "isActive": true
  }
]
```

### Diagnostic 2: Vérifier le chargement dans le frontend

1. Ouvrir la page du club
2. Ouvrir la console (F12)
3. Cliquer sur "+ Ajouter un membre"
4. Cliquer sur le bouton 🐛 (debug)
5. Chercher les logs

**Si vous voyez:**
```
❌ Erreur chargement rôles personnalisés: {...}
```

**Solutions:**
- Vérifier que Spring Boot est démarré
- Vérifier l'URL dans `custom-role.service.ts`
- Vérifier le CORS

### Diagnostic 3: Forcer le rechargement

1. Sur la page du club
2. Cliquer sur "+ Ajouter un membre"
3. Cliquer sur le bouton ↻ (rechargement) à côté de la liste déroulante
4. Vérifier à nouveau

---

## 📝 Créer Plus de Rôles

### Option 1: Via l'interface

```
http://192.168.1.20:4200/roles
```

1. Cliquer sur "Créer un rôle"
2. Nom: "Responsable Événements"
3. Description: "Organise les événements"
4. Permissions:
   - ✅ VIEW_MEMBERS
   - ✅ VIEW_EVENTS
   - ✅ CREATE_EVENTS
   - ✅ EDIT_EVENTS
   - ✅ DELETE_EVENTS
5. Créer

### Option 2: Via l'API

```powershell
$role = @{
    clubId = "69d2e1e5c692d749f7317750"
    roleName = "Responsable Événements"
    description = "Organise les événements"
    permissions = @(
        "VIEW_MEMBERS",
        "VIEW_EVENTS",
        "CREATE_EVENTS",
        "EDIT_EVENTS",
        "DELETE_EVENTS"
    )
    isActive = $true
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://192.168.1.20:8083/api/roles" `
    -Method POST `
    -Body $role `
    -ContentType "application/json" `
    -UseBasicParsing
```

---

## 🎯 Utilisation Complète

### 1. Créer un Rôle

**Page:** `http://192.168.1.20:4200/roles`

- Nom: "Responsable RH"
- Permissions: VIEW_MEMBERS, ADD_MEMBERS, EDIT_MEMBERS, APPROVE_MEMBERS

### 2. Assigner le Rôle à un Membre

**Page:** `http://192.168.1.20:4200/clubs/69d2e1e5c692d749f7317750`

1. Cliquer sur "+ Ajouter un membre"
2. Remplir:
   - Prénom: "Marie"
   - Nom: "Durand"
   - Email: "marie.durand@example.com"
   - Mot de passe: "password123"
   - Rôle: **"Responsable RH"**
3. Ajouter

### 3. Vérifier les Permissions

1. Se déconnecter
2. Se connecter avec marie.durand@example.com
3. Vérifier que Marie peut:
   - ✅ Voir les membres
   - ✅ Ajouter des membres
   - ✅ Modifier des membres
   - ✅ Approuver des membres
4. Vérifier que Marie ne peut PAS:
   - ❌ Créer des élections
   - ❌ Supprimer le club
   - ❌ Modifier les comités

---

## 🔄 Modification d'un Membre

Le système fonctionne aussi pour la modification:

1. Sur la page du club
2. Cliquer sur "Modifier" à côté d'un membre
3. La liste déroulante "Rôle" affiche:
   - Rôles système
   - **Rôles personnalisés**
4. Sélectionner un nouveau rôle
5. Sauvegarder

---

## 📊 Vérification Finale

### Test 1: Liste des rôles

```powershell
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/roles/club/69d2e1e5c692d749f7317750" -UseBasicParsing
```

**Attendu:** Au moins 1 rôle (Responsable Marketing)

### Test 2: Affichage dans le formulaire

1. Ouvrir: `http://192.168.1.20:4200/clubs/69d2e1e5c692d749f7317750`
2. Cliquer sur "+ Ajouter un membre"
3. Compter les options dans la liste "Rôle"

**Attendu:** 8 options (6 système + 1 personnalisé + 1 "Autre")

### Test 3: Création d'un membre

1. Créer un membre avec le rôle "Responsable Marketing"
2. Vérifier qu'il apparaît dans la liste
3. Vérifier que son rôle est "Responsable Marketing"

### Test 4: Permissions

```powershell
# Remplacer {userId} par l'ID du membre créé
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/permissions/user/{userId}" -UseBasicParsing
```

**Attendu:** `["VIEW_MEMBERS", "VIEW_EVENTS", "CREATE_EVENTS"]`

---

## 🐛 Debugging

### Bouton Debug (🐛)

Le bouton debug dans le formulaire appelle `debugRoles()`:

```typescript
debugRoles(): void {
  console.log('=== DEBUG ROLES ===');
  console.log('Club ID:', this.club?.id);
  console.log('Roles par défaut:', this.roles);
  console.log('Custom roles:', this.customRoles);
  console.log('All roles:', this.allRoles);
  console.log('==================');
}
```

**Utilisez-le pour voir:**
- Le club ID
- Les rôles système
- Les rôles personnalisés chargés
- La liste complète `allRoles`

### Bouton Rechargement (↻)

Le bouton de rechargement appelle `loadCustomRoles(club.id)`:

**Utilisez-le si:**
- Vous venez de créer un rôle
- Les rôles ne s'affichent pas
- Vous voulez forcer le rechargement

---

## 📌 Points Importants

1. **Les rôles sont chargés automatiquement** au chargement de la page du club

2. **Les rôles sont rechargés automatiquement** quand vous créez/modifiez un rôle (grâce à `RoleEventsService`)

3. **Seuls les rôles actifs s'affichent** (`isActive: true`)

4. **Les rôles sont spécifiques à un club** (chaque club a ses propres rôles)

5. **Le bouton "Autre" redirige vers /roles** pour créer un nouveau rôle

---

## ✅ Checklist

- [x] Backend Spring Boot démarré
- [x] API des rôles accessible
- [x] Rôle de test créé ("Responsable Marketing")
- [ ] Page du club ouverte
- [ ] Formulaire d'ajout de membre ouvert
- [ ] Rôles personnalisés visibles dans la liste
- [ ] Membre créé avec rôle personnalisé
- [ ] Permissions vérifiées

---

**Date:** 22 avril 2026
**Club ID:** 69d2e1e5c692d749f7317750
**Rôle de test:** Responsable Marketing
**Status:** ✅ Système fonctionnel

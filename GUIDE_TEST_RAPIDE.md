# 🚀 Guide de Test Rapide - Configuration des Comités

## ✅ Tous les Services sont Actifs

- ✅ User Service: http://localhost:8081
- ✅ Club Service: http://localhost:8083
- ✅ Gateway: http://localhost:8084
- ✅ Frontend: http://localhost:4200

---

## 🎯 Test en 3 Minutes

### Étape 1: Accéder à l'Application

1. Ouvrez votre navigateur
2. Allez sur: **http://localhost:4200**
3. Connectez-vous avec un compte PRESIDENT

---

### Étape 2: Créer un Club avec Configuration

1. Cliquez sur **"Créer un club"**
2. Remplissez les informations de base (nom, description, etc.)
3. **Descendez jusqu'à la section "Règle d'appartenance aux comités"**
4. Vous verrez 2 options:

```
○ Un membre peut appartenir à plusieurs comités
   Les membres peuvent rejoindre autant de comités qu'ils le souhaitent,
   mais ne peuvent être responsables que d'un seul comité.

○ Un membre ne peut appartenir qu'à un seul comité
   Chaque membre ne peut être assigné qu'à un seul comité à la fois.
```

5. **Choisissez une option** (par exemple: "plusieurs comités")
6. Cliquez sur **"Créer"**

---

### Étape 3: Voir la Configuration Active

1. Allez sur la page de détails du club que vous venez de créer
2. **Vous verrez une section colorée** qui affiche la règle active:

```
┌─────────────────────────────────────────────────┐
│ 📋 Règle d'appartenance aux comités             │
│                                                  │
│ Un membre peut appartenir à plusieurs comités   │
│ (mais ne peut être responsable que d'un seul)   │
│                                                  │
│ [Modifier]                                       │
└─────────────────────────────────────────────────┘
```

3. Cliquez sur **"Modifier"** pour changer la règle si nécessaire

---

### Étape 4: Tester les Règles

#### Test A: Mode "Plusieurs Comités"

1. Créez 2 comités: "Event" et "Media"
2. Ajoutez un membre "Alice"
3. Assignez Alice au comité "Event" comme **RESPONSABLE** → ✅
4. Assignez Alice au comité "Media" comme **MEMBRE_COMITE** → ✅
5. Essayez d'assigner Alice au comité "Media" comme **RESPONSABLE** → ❌ Erreur!

**Message attendu:**
```
❌ Un membre ne peut être RESPONSABLE que d'UN SEUL comité.

Ce membre est déjà responsable du comité "Event".

Il peut rejoindre ce comité en tant que MEMBRE_COMITE.
```

#### Test B: Mode "Un Seul Comité"

1. Modifiez le club pour choisir "Un seul comité"
2. Créez 2 comités: "Event" et "Media"
3. Ajoutez un membre "Bob"
4. Assignez Bob au comité "Event" → ✅
5. Essayez d'assigner Bob au comité "Media" → ❌ Erreur!

**Message attendu:**
```
❌ Ce club n'autorise qu'un seul comité par membre.

Le membre est déjà dans le comité "Event".

Veuillez d'abord le retirer de ce comité.
```

---

## 🎨 Où Trouver la Configuration?

### 1. Lors de la Création d'un Club
- Formulaire de création → Section "Règle d'appartenance aux comités"

### 2. Lors de la Modification d'un Club
- Page du club → Bouton "Modifier" → Section "Règle d'appartenance aux comités"

### 3. Affichage sur la Page du Club
- Page du club → Section colorée en haut avec la règle active

---

## 📊 Tableau Récapitulatif

| Mode | Plusieurs Comités | Plusieurs Responsabilités | Exemple |
|------|-------------------|---------------------------|---------|
| **Plusieurs comités** | ✅ Oui | ❌ Non | Alice: RESPONSABLE "Event" + MEMBRE "Media" |
| **Un seul comité** | ❌ Non | ❌ Non | Bob: MEMBRE "Event" uniquement |

---

## 🔍 Vérification Rapide

Pour vérifier que la configuration est bien enregistrée:

```powershell
.\check-mongodb.ps1
```

Ou dans MongoDB Compass, cherchez dans la collection `clubs`:

```json
{
  "name": "Nom du Club",
  "rules": {
    "committeeMembershipMode": "MULTIPLE_ALLOWED"  // ou "SINGLE_ONLY"
  }
}
```

---

## ✅ C'est Tout!

La fonctionnalité est maintenant complète et testable. Vous pouvez:

1. ✅ Créer des clubs avec différentes règles
2. ✅ Modifier les règles des clubs existants
3. ✅ Voir la règle active sur la page du club
4. ✅ Le système valide automatiquement les assignations

**Bon test! 🎉**

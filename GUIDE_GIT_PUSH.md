# 🚀 Guide Complet - Pusher votre Projet sur Git

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir:
- ✅ Git installé sur votre machine
- ✅ Un compte GitHub/GitLab/Bitbucket
- ✅ Un repository créé (ou vous allez en créer un)

---

## 🎯 Méthode 1: Premier Push (Nouveau Repository)

### Étape 1: Vérifier si Git est initialisé

Ouvrez un terminal dans le dossier de votre projet:

```bash
cd C:\Users\souha\Desktop\PI2\Club-Hub-Voice-Channel-Management
git status
```

**Si vous voyez une erreur "not a git repository"**, initialisez Git:

```bash
git init
```

---

### Étape 2: Créer un fichier .gitignore

Créez un fichier `.gitignore` à la racine pour ignorer les fichiers inutiles:

```bash
# Créer le fichier .gitignore
echo "# Fichiers à ignorer" > .gitignore
```

Ajoutez ce contenu dans `.gitignore`:

```
# Node modules
**/node_modules/
**/dist/
**/.angular/

# Java/Maven
**/target/
**/.mvn/
**/mvnw
**/mvnw.cmd

# IDE
**/.idea/
**/.vscode/
**/.claude/
*.iml

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# Fichiers temporaires
*.tmp
*.bak
```

---

### Étape 3: Ajouter tous les fichiers

```bash
# Ajouter tous les fichiers
git add .

# Vérifier ce qui va être commité
git status
```

---

### Étape 4: Faire le premier commit

```bash
git commit -m "Initial commit - Système de gestion de club avec permissions personnalisées"
```

---

### Étape 5: Créer un repository sur GitHub

1. Allez sur https://github.com
2. Cliquez sur "New repository"
3. Nom: `Club-Hub-Voice-Channel-Management`
4. Description: `Système de gestion de club avec rôles et permissions personnalisées`
5. **NE COCHEZ PAS** "Initialize with README"
6. Cliquez "Create repository"

---

### Étape 6: Lier votre projet au repository distant

Copiez l'URL de votre repository (ex: `https://github.com/votre-username/Club-Hub-Voice-Channel-Management.git`)

```bash
# Ajouter le remote
git remote add origin https://github.com/VOTRE-USERNAME/Club-Hub-Voice-Channel-Management.git

# Vérifier
git remote -v
```

---

### Étape 7: Pusher vers GitHub

```bash
# Renommer la branche en main (si nécessaire)
git branch -M main

# Pusher
git push -u origin main
```

**Si demandé**, entrez vos identifiants GitHub.

---

## 🔄 Méthode 2: Push de Modifications (Repository Existant)

Si vous avez déjà un repository et voulez pusher des modifications:

### Étape 1: Vérifier les modifications

```bash
git status
```

---

### Étape 2: Ajouter les fichiers modifiés

```bash
# Ajouter tous les fichiers modifiés
git add .

# OU ajouter des fichiers spécifiques
git add Front/src/app/services/permission.service.ts
git add Front/src/app/pages/clubs/club-detail/club-detail.component.ts
```

---

### Étape 3: Commiter les modifications

```bash
git commit -m "✨ Ajout système de permissions en temps réel

- Permissions rechargées automatiquement lors du login/logout
- Permissions appliquées aux sous-groupes et élections
- Correction du timing des permissions
- Ajout de RoleEventsService pour notifications
"
```

---

### Étape 4: Pusher

```bash
git push
```

---

## 🐛 Résolution des Problèmes Courants

### Problème 1: "Permission denied (publickey)"

**Solution**: Configurer l'authentification

**Option A: HTTPS (Recommandé pour débutants)**

```bash
# Utiliser HTTPS au lieu de SSH
git remote set-url origin https://github.com/VOTRE-USERNAME/REPO.git
```

Lors du push, entrez:
- Username: votre email GitHub
- Password: votre Personal Access Token (pas votre mot de passe!)

**Créer un Personal Access Token**:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Cochez: `repo` (Full control of private repositories)
4. Copiez le token et utilisez-le comme mot de passe

---

### Problème 2: "Updates were rejected"

**Cause**: Le repository distant a des commits que vous n'avez pas localement.

**Solution**:

```bash
# Récupérer les modifications distantes
git pull origin main --rebase

# Puis pusher
git push
```

---

### Problème 3: "Large files detected"

**Cause**: Fichiers trop gros (node_modules, target, etc.)

**Solution**:

```bash
# Supprimer les fichiers du cache Git
git rm -r --cached node_modules
git rm -r --cached target

# Ajouter au .gitignore
echo "node_modules/" >> .gitignore
echo "target/" >> .gitignore

# Commiter
git commit -m "Remove large files"
git push
```

---

### Problème 4: "fatal: not a git repository"

**Solution**:

```bash
# Initialiser Git
git init

# Ajouter le remote
git remote add origin https://github.com/VOTRE-USERNAME/REPO.git

# Continuer avec les étapes normales
```

---

## 📝 Bonnes Pratiques

### 1. Messages de Commit Clairs

```bash
# ✅ Bon
git commit -m "✨ Ajout système de permissions personnalisées"
git commit -m "🐛 Correction rechargement permissions au login"
git commit -m "📝 Mise à jour documentation"

# ❌ Mauvais
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
```

### Emojis Utiles:
- ✨ `:sparkles:` - Nouvelle fonctionnalité
- 🐛 `:bug:` - Correction de bug
- 📝 `:memo:` - Documentation
- 🎨 `:art:` - Amélioration du code
- ⚡ `:zap:` - Performance
- 🔒 `:lock:` - Sécurité

---

### 2. Commits Fréquents

```bash
# Commiter après chaque fonctionnalité
git add .
git commit -m "✨ Ajout permission ASSIGN_TO_SUBGROUPS"

# Puis continuer à travailler
# ...

# Commiter à nouveau
git add .
git commit -m "🐛 Correction affichage boutons selon permissions"
```

---

### 3. Vérifier Avant de Pusher

```bash
# Voir les fichiers modifiés
git status

# Voir les différences
git diff

# Voir l'historique
git log --oneline
```

---

## 🔐 Configuration Git (Première Fois)

Si c'est votre première fois avec Git:

```bash
# Configurer votre nom
git config --global user.name "Votre Nom"

# Configurer votre email
git config --global user.email "votre.email@example.com"

# Vérifier
git config --list
```

---

## 📊 Commandes Git Utiles

```bash
# Voir l'état
git status

# Voir l'historique
git log --oneline --graph

# Voir les branches
git branch

# Créer une nouvelle branche
git checkout -b feature/nouvelle-fonctionnalite

# Changer de branche
git checkout main

# Annuler les modifications non commitées
git checkout -- fichier.txt

# Annuler le dernier commit (garder les modifications)
git reset --soft HEAD~1

# Voir les remotes
git remote -v
```

---

## 🎯 Workflow Recommandé

```bash
# 1. Vérifier l'état
git status

# 2. Ajouter les fichiers
git add .

# 3. Commiter
git commit -m "✨ Description de vos modifications"

# 4. Récupérer les modifications distantes (si travail en équipe)
git pull origin main

# 5. Pusher
git push origin main
```

---

## 📞 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. Copiez le message d'erreur complet
2. Vérifiez dans ce guide si le problème est listé
3. Cherchez l'erreur sur Google: "git [votre erreur]"
4. Demandez de l'aide en partageant:
   - La commande que vous avez tapée
   - Le message d'erreur complet
   - Le résultat de `git status`

---

## ✅ Checklist Avant de Pusher

- [ ] Tous les fichiers sensibles sont dans `.gitignore`
- [ ] Pas de mots de passe ou clés API dans le code
- [ ] Le code compile sans erreurs
- [ ] Les tests passent (si vous en avez)
- [ ] Le message de commit est clair
- [ ] Vous avez vérifié avec `git status`

---

## 🎉 Félicitations!

Une fois pushé, votre code sera visible sur GitHub/GitLab!

Vous pouvez:
- Partager le lien avec votre équipe
- Cloner le projet sur d'autres machines
- Collaborer avec d'autres développeurs
- Garder un historique de vos modifications

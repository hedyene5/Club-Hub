# 🤖 Guide de Test - Génération IA dans les Candidatures

## ✅ Ce qui a été fait

1. **Service Angular créé** : `Front/src/app/services/ai-generation.service.ts`
   - Appelle l'API Spring Boot sur le port 8084
   - Méthode `generateMotivationLetter()` pour générer le contenu

2. **Composant mis à jour** : `election-detail.component.ts`
   - Nouveau champ `userIdeas` dans le formulaire
   - Méthode `generateWithAI()` pour appeler le service
   - Gestion des états de chargement et erreurs

3. **Interface améliorée** : `election-detail.component.html`
   - Section bleue "Génération automatique avec IA"
   - Champ textarea "Parlez-nous de vous / vos idées"
   - Bouton "🤖 Générer avec IA" avec animation de chargement
   - Messages d'aide pour indiquer que les champs sont modifiables

## 🚀 Comment tester

### 1. Démarrer les services IA

```powershell
# Démarrer tous les services (Python + Spring Boot)
.\DEMARRER_TOUT.ps1
```

Attendez que les services soient prêts :
- Python Flask : http://localhost:5000
- Spring Boot AI : http://192.168.1.20:8084

### 2. Accéder au formulaire de candidature

1. Ouvrez votre navigateur : http://192.168.1.20:4200
2. Connectez-vous avec un compte membre (pas président)
3. Allez dans un club
4. Cliquez sur "Élections" dans le menu
5. Sélectionnez une élection avec le statut "PLANNED"
6. Cliquez sur le bouton "➕ Postuler"

### 3. Utiliser la génération IA

1. **Remplissez vos informations de base** (nom, email sont pré-remplis)
2. **Sélectionnez votre comité** (si élection de bureau)
3. **Dans la section bleue "Génération automatique avec IA"** :
   - Écrivez vos idées dans le champ "Parlez-nous de vous / vos idées"
   - Exemple : "Je suis passionné par l'organisation d'événements, j'ai 2 ans d'expérience en communication digitale et je veux améliorer la visibilité du club"
4. **Cliquez sur "🤖 Générer avec IA"**
5. **Attendez quelques secondes** (animation de chargement)
6. **Les champs se remplissent automatiquement** :
   - Lettre de motivation
   - Programme
   - Compétences
7. **Modifiez si nécessaire** (les champs restent éditables)
8. **Cochez la case** "Je certifie remplir toutes les conditions"
9. **Cliquez sur "📤 Soumettre"**

## 🎯 Résultat attendu

### Avant génération IA
```
Parlez-nous de vous : "Je suis passionné par l'organisation..."
Lettre de motivation : [vide]
Programme : [vide]
Compétences : [vide]
```

### Après génération IA
```
Parlez-nous de vous : "Je suis passionné par l'organisation..."
Lettre de motivation : "Madame, Monsieur, Je me permets de vous adresser..."
Programme : "1. Améliorer la visibilité du club sur les réseaux sociaux..."
Compétences : "organisation, communication, leadership, gestion de projet"
```

## ⚠️ Dépannage

### Erreur "Vérifiez que le service IA est démarré"
- Vérifiez que `DEMARRER_TOUT.ps1` a bien démarré les services
- Testez manuellement : http://localhost:5000/health
- Testez le backend : http://192.168.1.20:8084/api/ai/health

### Le bouton est grisé
- Assurez-vous d'avoir écrit quelque chose dans "Parlez-nous de vous"
- Le champ ne doit pas être vide

### Les champs ne se remplissent pas
- Ouvrez la console du navigateur (F12)
- Vérifiez les erreurs réseau
- Vérifiez que le backend Spring Boot tourne sur le port 8084

## 📝 Notes importantes

1. **Les champs restent modifiables** : Après la génération, vous pouvez modifier le texte généré
2. **Le champ "userIdeas" n'est pas envoyé** : Il sert uniquement pour la génération IA
3. **Génération rapide** : Le modèle GPT-2 génère en 2-5 secondes
4. **100% local** : Aucune API externe n'est appelée

## 🔗 Endpoints utilisés

- **Frontend → Backend Spring Boot** : `POST http://192.168.1.20:8084/api/ai/generate/motivation-letter`
- **Backend Spring Boot → Python Flask** : `POST http://localhost:5000/generate`

## ✨ Fonctionnalités

- ✅ Génération automatique de lettre de motivation
- ✅ Génération automatique de programme
- ✅ Génération automatique de compétences
- ✅ Modification manuelle après génération
- ✅ Animation de chargement
- ✅ Gestion des erreurs
- ✅ Interface intuitive avec section bleue dédiée

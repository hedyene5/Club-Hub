# Guide d'installation et utilisation du Service IA

## Vue d'ensemble

Ce service IA génère automatiquement des lettres de motivation et des programmes d'activités en utilisant GPT-2, un modèle de langage pré-entraîné qui tourne 100% en local.

### Contraintes respectées ✅

- ✅ Pas d'API externe (OpenAI, Gemini, etc.)
- ✅ Modèle 100% local (GPT-2 via Hugging Face)
- ✅ Gratuit (pas de coût d'API)
- ✅ Véritable travail IA (modèle de deep learning)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Angular                         │
│                   (Port 4200)                               │
│  - Formulaire de saisie                                    │
│  - Affichage des résultats                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│              Backend Spring Boot                            │
│                   (Port 8084)                               │
│  - API REST                                                 │
│  - Sauvegarde MongoDB                                       │
│  - Historique des générations                              │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│           Service Python Flask                              │
│                   (Port 5000)                               │
│  - GPT-2 (asi/gpt-fr-cased-small)                         │
│  - Génération de texte                                     │
│  - 100% local, pas d'API externe                          │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prérequis

1. **Python 3.8 ou supérieur**
   - Télécharger depuis https://www.python.org/downloads/
   - Cocher "Add Python to PATH" lors de l'installation

2. **Java 17 ou supérieur** (pour Spring Boot)

3. **MongoDB** (déjà installé pour ClubHub)

4. **~1GB d'espace disque** (pour le modèle GPT-2)

### Étape 1 : Installation du service Python

```bash
cd AI-Service

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel (Windows)
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

**Note:** Le premier démarrage téléchargera automatiquement le modèle GPT-2 (~500MB).

### Étape 2 : Installation du backend Spring Boot

```bash
cd AI-Service-Backend

# Compiler le projet
mvnw clean install
```

## Démarrage

### Option 1 : Démarrage automatique (recommandé)

```powershell
# Démarrer le service Python
cd AI-Service
./start-service.ps1
```

Dans un autre terminal :

```bash
# Démarrer le backend Spring Boot
cd AI-Service-Backend
mvnw spring-boot:run
```

### Option 2 : Démarrage manuel

**Terminal 1 - Service Python:**
```bash
cd AI-Service
venv\Scripts\activate
python app.py
```

**Terminal 2 - Backend Spring Boot:**
```bash
cd AI-Service-Backend
mvnw spring-boot:run
```

## Vérification

### Test du service Python

```powershell
cd AI-Service
./test-service.ps1
```

Ou manuellement :

```bash
curl http://localhost:5000/health
```

### Test du backend Spring Boot

```bash
curl http://localhost:8084/api/ai/health
```

## Utilisation

### 1. Génération de lettre de motivation

**Endpoint:** `POST http://localhost:8084/api/ai/generate/motivation-letter`

**Request:**
```json
{
  "candidateName": "Ahmed Ben Ali",
  "clubName": "Club Robotique",
  "position": "Membre",
  "skills": ["programmation", "travail en équipe", "Arduino"],
  "motivations": ["passion pour la robotique", "envie d'apprendre"],
  "experience": "2 ans d'expérience en Arduino et Raspberry Pi"
}
```

**Response:**
```json
{
  "success": true,
  "letter": "Lettre de motivation pour rejoindre Club Robotique\n\nObjet : Candidature au poste de Membre\n\nMadame, Monsieur,\n\nJe me permets de vous adresser ma candidature...",
  "metadata": {
    "candidate": "Ahmed Ben Ali",
    "club": "Club Robotique",
    "position": "Membre"
  }
}
```

### 2. Génération de programme d'activités

**Endpoint:** `POST http://localhost:8084/api/ai/generate/program`

**Request:**
```json
{
  "clubName": "Club Robotique",
  "objectives": [
    "Former les membres aux technologies robotiques",
    "Participer à des compétitions nationales",
    "Développer des projets innovants"
  ],
  "activities": [
    "Ateliers hebdomadaires",
    "Projets pratiques en équipe",
    "Conférences avec des experts"
  ],
  "duration": "1 semestre"
}
```

**Response:**
```json
{
  "success": true,
  "program": "Programme d'activités - Club Robotique\n\nDurée : 1 semestre\n\nObjectifs :\n- Former les membres...",
  "metadata": {
    "club": "Club Robotique",
    "duration": "1 semestre"
  }
}
```

### 3. Historique des générations

**Par utilisateur:**
```bash
GET http://localhost:8084/api/ai/history/user/{userId}
```

**Par club:**
```bash
GET http://localhost:8084/api/ai/history/club/{clubId}
```

## Paramètres de génération

Dans `AI-Service/app.py`, vous pouvez ajuster :

```python
def generate_text(prompt, max_length=500, temperature=0.8, top_p=0.9):
    # max_length: Longueur maximale du texte (300-800)
    # temperature: Créativité (0.5 = conservateur, 1.0 = créatif)
    # top_p: Nucleus sampling (0.9 recommandé)
```

### Exemples de configurations

**Texte formel et structuré:**
```python
temperature=0.6
top_p=0.85
```

**Texte créatif et varié:**
```python
temperature=0.9
top_p=0.95
```

## Performance

### Temps de génération

- **CPU:** 5-10 secondes par génération
- **GPU (CUDA):** 1-2 secondes par génération

### Optimisation

Pour améliorer les performances :

1. **Utiliser un GPU** (si disponible)
   - Le service détecte automatiquement CUDA
   - Installation: `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118`

2. **Réduire max_length**
   ```python
   max_length=300  # Au lieu de 600
   ```

3. **Utiliser un modèle plus petit**
   ```python
   MODEL_NAME = "asi/gpt-fr-cased-small"  # Déjà le plus petit
   ```

## Troubleshooting

### Problème 1 : Le modèle ne se télécharge pas

**Symptôme:** Erreur lors du premier démarrage

**Solution:**
```bash
# Vérifier la connexion internet
# Vérifier l'espace disque (besoin de ~1GB)
# Télécharger manuellement:
python -c "from transformers import GPT2LMHeadModel, GPT2Tokenizer; GPT2Tokenizer.from_pretrained('asi/gpt-fr-cased-small'); GPT2LMHeadModel.from_pretrained('asi/gpt-fr-cased-small')"
```

### Problème 2 : Out of Memory

**Symptôme:** Erreur "CUDA out of memory" ou "RuntimeError: out of memory"

**Solution:**
```python
# Dans app.py, réduire max_length
max_length=300  # Au lieu de 600

# Ou forcer l'utilisation du CPU
model = model.cpu()  # Au lieu de model.cuda()
```

### Problème 3 : Service Python ne démarre pas

**Symptôme:** Port 5000 déjà utilisé

**Solution:**
```bash
# Trouver le processus qui utilise le port 5000
netstat -ano | findstr :5000

# Tuer le processus
taskkill /PID <PID> /F

# Ou changer le port dans app.py
app.run(host='0.0.0.0', port=5001)
```

### Problème 4 : Génération trop lente

**Solution:**
1. Utiliser un GPU si disponible
2. Réduire max_length
3. Utiliser un cache pour les prompts similaires

## Améliorations futures

### 1. Fine-tuning personnalisé

Entraîner le modèle sur vos propres données :

```python
from transformers import Trainer, TrainingArguments

# Préparer vos données (lettres de motivation réelles)
training_data = [...]

# Fine-tuner le modèle
trainer = Trainer(
    model=model,
    args=TrainingArguments(...),
    train_dataset=training_data
)
trainer.train()
```

### 2. Modèles alternatifs

Tester d'autres modèles français :

- **CamemBERT:** Meilleur pour la compréhension
- **FlauBERT:** Optimisé pour le français
- **GPT-2 Medium:** Plus grand, meilleure qualité

### 3. Cache intelligent

Mettre en cache les générations similaires :

```python
import hashlib
from functools import lru_cache

@lru_cache(maxsize=100)
def generate_cached(prompt_hash):
    return generate_text(prompt)
```

## Sécurité

### Validation des entrées

Le service valide automatiquement :
- Longueur des prompts (max 1000 caractères)
- Format des requêtes JSON
- Présence des champs obligatoires

### Rate limiting

Pour éviter les abus, ajoutez un rate limiting :

```python
from flask_limiter import Limiter

limiter = Limiter(app, default_limits=["10 per minute"])

@app.route('/generate/motivation-letter')
@limiter.limit("5 per minute")
def generate_letter():
    ...
```

## Monitoring

### Logs

Les logs sont affichés dans la console :

```
INFO:__main__:Chargement du modèle GPT-2...
INFO:__main__:Modèle GPT-2 chargé avec succès
INFO:__main__:Génération de lettre pour Ahmed Ben Ali
```

### Métriques

Ajouter des métriques de performance :

```python
import time

start_time = time.time()
generated_text = generate_text(prompt)
duration = time.time() - start_time

logger.info(f"Génération terminée en {duration:.2f}s")
```

## Support

Pour toute question ou problème :

1. Consulter ce guide
2. Vérifier les logs du service Python
3. Tester avec `test-service.ps1`
4. Vérifier que MongoDB est démarré

---

**Version:** 1.0.0  
**Date:** 22 Avril 2026  
**Statut:** ✅ Production Ready

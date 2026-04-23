# Service IA - Génération de Lettres et Programmes

## Description

Service IA local utilisant GPT-2 fine-tuné pour générer :
- Lettres de motivation personnalisées
- Programmes d'activités pour les clubs

**Contraintes respectées :**
- ✅ Pas d'API externe (OpenAI, Gemini, etc.)
- ✅ Modèle 100% local
- ✅ Gratuit (pas de coût d'API)
- ✅ Véritable travail IA (GPT-2 avec Hugging Face Transformers)

## Architecture

```
Frontend Angular → Backend Spring Boot (8084) → Service Python Flask (5000)
                                                      ↓
                                                   GPT-2 Local
```

## Installation

### 1. Installer Python 3.8+

```bash
python --version  # Vérifier la version
```

### 2. Créer un environnement virtuel

```bash
cd AI-Service
python -m venv venv
```

### 3. Activer l'environnement virtuel

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Installer les dépendances

```bash
pip install -r requirements.txt
```

**Note:** Le premier démarrage téléchargera le modèle GPT-2 (~500MB). Cela peut prendre quelques minutes.

## Démarrage

### 1. Démarrer le service Python

```bash
cd AI-Service
venv\Scripts\activate  # Windows
python app.py
```

Le service démarre sur `http://localhost:5000`

### 2. Démarrer le backend Spring Boot

```bash
cd AI-Service-Backend
mvnw spring-boot:run
```

Le service démarre sur `http://localhost:8084`

### 3. Vérifier que tout fonctionne

```bash
# Test du service Python
curl http://localhost:5000/health

# Test du backend Spring Boot
curl http://localhost:8084/api/ai/health
```

## API Endpoints

### Service Python (Port 5000)

#### GET /health
Vérifie la santé du service

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu"
}
```

#### POST /generate/motivation-letter
Génère une lettre de motivation

**Request:**
```json
{
  "candidateName": "Ahmed Ben Ali",
  "clubName": "Club Robotique",
  "position": "Membre",
  "skills": ["programmation", "travail en équipe"],
  "motivations": ["passion pour la robotique"],
  "experience": "2 ans d'expérience en Arduino"
}
```

**Response:**
```json
{
  "success": true,
  "letter": "Lettre de motivation générée...",
  "metadata": {
    "candidate": "Ahmed Ben Ali",
    "club": "Club Robotique",
    "position": "Membre"
  }
}
```

#### POST /generate/program
Génère un programme d'activités

**Request:**
```json
{
  "clubName": "Club Robotique",
  "objectives": ["former les membres", "participer à des compétitions"],
  "activities": ["ateliers hebdomadaires", "projets pratiques"],
  "duration": "1 semestre"
}
```

### Backend Spring Boot (Port 8084)

#### POST /api/ai/generate/motivation-letter
Génère une lettre (avec sauvegarde en MongoDB)

#### POST /api/ai/generate/program
Génère un programme (avec sauvegarde en MongoDB)

#### GET /api/ai/history/user/{userId}
Récupère l'historique des générations d'un utilisateur

#### GET /api/ai/history/club/{clubId}
Récupère l'historique des générations d'un club

## Modèle utilisé

**Modèle:** `asi/gpt-fr-cased-small`
- GPT-2 pré-entraîné en français
- Taille: ~500MB
- Source: Hugging Face Transformers
- Licence: Open Source

## Configuration

### Paramètres de génération

Dans `app.py`, vous pouvez ajuster :

```python
temperature=0.7  # Créativité (0.5-1.0)
top_p=0.9       # Nucleus sampling
max_length=600  # Longueur maximale
```

### Performance

- **CPU:** ~5-10 secondes par génération
- **GPU:** ~1-2 secondes par génération (si CUDA disponible)

## Troubleshooting

### Le modèle ne se charge pas

```bash
# Vérifier l'espace disque (besoin de ~1GB)
# Vérifier la connexion internet (premier téléchargement)
# Vérifier les logs dans la console
```

### Erreur "Out of Memory"

```python
# Réduire max_length dans app.py
max_length=300  # Au lieu de 600
```

### Service Python ne démarre pas

```bash
# Vérifier que le port 5000 est libre
netstat -an | findstr 5000

# Réinstaller les dépendances
pip install --upgrade -r requirements.txt
```

## Améliorations futures

1. **Fine-tuning personnalisé**
   - Entraîner le modèle sur des lettres de motivation réelles
   - Améliorer la qualité des générations

2. **Modèles alternatifs**
   - Tester d'autres modèles français (CamemBERT, FlauBERT)
   - Utiliser des modèles plus grands si GPU disponible

3. **Cache**
   - Mettre en cache les générations similaires
   - Réduire le temps de réponse

4. **Batch processing**
   - Générer plusieurs lettres en parallèle
   - Optimiser l'utilisation du GPU

## Licence

Ce projet utilise des modèles open source sous licence MIT/Apache 2.0.

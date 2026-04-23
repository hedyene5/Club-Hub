# 🚀 Guide de démarrage SIMPLE du Service IA

## Étape 1 : Vérifier Python

Ouvre PowerShell et tape :

```powershell
python --version
```

Tu dois voir quelque chose comme : `Python 3.8.x` ou `Python 3.9.x` ou plus récent.

❌ **Si tu vois une erreur** : Python n'est pas installé correctement.
- Télécharge Python depuis : https://www.python.org/downloads/
- ⚠️ IMPORTANT : Coche "Add Python to PATH" pendant l'installation

## Étape 2 : Installer les dépendances Python

### 2.1 Ouvre PowerShell dans le dossier AI-Service

```powershell
cd C:\Users\souha\Desktop\PI2\AI-Service
```

### 2.2 Crée un environnement virtuel

```powershell
python -m venv venv
```

Attends quelques secondes... Un dossier `venv` va apparaître.

### 2.3 Active l'environnement virtuel

```powershell
venv\Scripts\activate
```

Tu verras `(venv)` apparaître au début de ta ligne de commande. C'est bon signe ! ✅

### 2.4 Installe les dépendances

```powershell
pip install -r requirements.txt
```

⏳ **Cela va prendre 5-10 minutes** (téléchargement de ~500MB).

Tu verras plein de lignes défiler. C'est normal ! Attends que ça se termine.

## Étape 3 : Démarrer le service Python

Dans le même PowerShell (avec `(venv)` visible) :

```powershell
python app.py
```

Tu verras :

```
INFO:__main__:Chargement du modèle GPT-2...
INFO:__main__:Modèle GPT-2 chargé avec succès
 * Running on http://0.0.0.0:5000
```

✅ **C'est bon !** Le service Python est démarré.

⚠️ **NE FERME PAS CETTE FENÊTRE** - Laisse-la ouverte en arrière-plan.

## Étape 4 : Démarrer le backend Spring Boot

### 4.1 Ouvre un NOUVEAU PowerShell

### 4.2 Va dans le dossier AI-Service-Backend

```powershell
cd C:\Users\souha\Desktop\PI2\AI-Service-Backend
```

### 4.3 Démarre Spring Boot

```powershell
mvnw spring-boot:run
```

⏳ Attends 30-60 secondes...

Tu verras :

```
Started AiServiceApplication in X.XXX seconds
```

✅ **C'est bon !** Le backend est démarré.

## Étape 5 : Tester que tout fonctionne

### 5.1 Ouvre un TROISIÈME PowerShell

### 5.2 Teste le service Python

```powershell
curl http://localhost:5000/health
```

Tu dois voir :

```json
{"status":"healthy","model_loaded":true,"device":"cpu"}
```

### 5.3 Teste le backend Spring Boot

```powershell
curl http://localhost:8084/api/ai/health
```

Tu dois voir :

```json
{"status":"healthy","model_loaded":true,"device":"cpu"}
```

## ✅ Résumé : Tu dois avoir 3 fenêtres ouvertes

```
┌─────────────────────────────────────────┐
│  PowerShell 1 : Service Python          │
│  Port 5000                              │
│  (venv) python app.py                   │
│  ⚠️ NE PAS FERMER                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  PowerShell 2 : Backend Spring Boot     │
│  Port 8084                              │
│  mvnw spring-boot:run                   │
│  ⚠️ NE PAS FERMER                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  PowerShell 3 : Tests                   │
│  Pour tester les services               │
│  ✅ Peut être fermé                     │
└─────────────────────────────────────────┘
```

## 🎯 Maintenant tu peux utiliser le service !

### Exemple : Générer une lettre de motivation

Crée un fichier `test-lettre.json` :

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

Puis dans PowerShell :

```powershell
curl -X POST http://localhost:8084/api/ai/generate/motivation-letter -H "Content-Type: application/json" -d "@test-lettre.json"
```

Tu verras la lettre générée ! 🎉

## ❌ Problèmes courants

### Problème 1 : "python n'est pas reconnu"

**Solution :** Python n'est pas dans le PATH.
- Réinstalle Python
- Coche "Add Python to PATH"

### Problème 2 : "Port 5000 déjà utilisé"

**Solution :** Un autre programme utilise le port 5000.

```powershell
# Trouve le processus
netstat -ano | findstr :5000

# Tue le processus (remplace <PID> par le numéro)
taskkill /PID <PID> /F
```

### Problème 3 : "mvnw n'est pas reconnu"

**Solution :** Tu n'es pas dans le bon dossier.

```powershell
cd C:\Users\souha\Desktop\PI2\AI-Service-Backend
```

### Problème 4 : Téléchargement très lent

**Solution :** Le modèle GPT-2 fait ~500MB.
- Sois patient (5-10 minutes)
- Vérifie ta connexion internet

## 🔄 Pour arrêter les services

Dans chaque PowerShell, appuie sur `Ctrl + C`

## 📝 Notes importantes

1. **Premier démarrage = long** (~10 minutes pour tout télécharger)
2. **Démarrages suivants = rapides** (~30 secondes)
3. **Garde les 2 PowerShell ouverts** pendant que tu utilises le service
4. **MongoDB doit être démarré** (normalement déjà le cas pour ClubHub)

---

**Besoin d'aide ?** Relis ce guide étape par étape ! 📖

# 🚀 Démarrage Manuel du Service IA

## Problème rencontré
Le frontend Angular appelle `http://192.168.1.20:8084/api/ai/generate/motivation-letter` mais reçoit une erreur 404 car le backend Spring Boot n'est pas démarré.

## Architecture
```
Frontend Angular (port 4200)
    ↓
Backend Spring Boot (port 8084) ← MANQUANT
    ↓
Service Python Flask (port 5000) ← OK
```

## ✅ Solution : Démarrer le backend Spring Boot

### Option 1 : Script automatique (recommandé)

```powershell
# Dans le dossier AI-Service-Backend
cd AI-Service-Backend
.\start-backend.ps1
```

### Option 2 : Commande Maven directe

```powershell
# Dans le dossier AI-Service-Backend
cd AI-Service-Backend
mvn spring-boot:run
```

### Option 3 : Avec le script global (si corrigé)

```powershell
# À la racine du projet
.\DEMARRER_TOUT.ps1
```

## 📋 Ordre de démarrage complet

### 1. Démarrer MongoDB (si pas déjà fait)
```powershell
# Vérifier si MongoDB tourne
Test-NetConnection -ComputerName localhost -Port 27017

# Si non, démarrer MongoDB (selon votre installation)
# Windows Service : net start MongoDB
# Ou lancer mongod.exe manuellement
```

### 2. Démarrer le service Python (port 5000)
```powershell
cd AI-Service
.\start-service.ps1
```

Attendez le message : `✅ Service IA démarré sur http://localhost:5000`

### 3. Démarrer le backend Spring Boot (port 8084)
```powershell
cd AI-Service-Backend
.\start-backend.ps1
```

Attendez le message : `Started AiServiceApplication in X seconds`

### 4. Vérifier que tout fonctionne

**Test Python :**
```powershell
curl http://localhost:5000/health
# Réponse attendue : {"status":"healthy","model":"asi/gpt-fr-cased-small"}
```

**Test Spring Boot :**
```powershell
curl http://192.168.1.20:8084/api/ai/health
# Réponse attendue : {"status":"healthy","pythonService":"connected"}
```

**Test Frontend :**
1. Ouvrez http://192.168.1.20:4200
2. Allez dans une élection
3. Cliquez sur "Postuler"
4. Remplissez "Parlez-nous de vous"
5. Cliquez sur "🤖 Générer avec IA"

## ⚠️ Prérequis

### Maven
Si Maven n'est pas installé :
1. Téléchargez : https://maven.apache.org/download.cgi
2. Extrayez dans `C:\Program Files\Apache\maven`
3. Ajoutez au PATH : `C:\Program Files\Apache\maven\bin`
4. Vérifiez : `mvn --version`

### Java 17
Si Java 17 n'est pas installé :
1. Téléchargez : https://adoptium.net/
2. Installez Java 17 (LTS)
3. Vérifiez : `java -version`

### Python
Si Python n'est pas installé :
1. Téléchargez : https://www.python.org/downloads/
2. Cochez "Add Python to PATH"
3. Vérifiez : `python --version`

## 🔍 Dépannage

### Erreur : "mvn n'est pas reconnu"
Maven n'est pas installé ou pas dans le PATH. Installez Maven (voir Prérequis).

### Erreur : "Port 8084 already in use"
Un autre processus utilise le port 8084.
```powershell
# Trouver le processus
netstat -ano | findstr :8084

# Tuer le processus (remplacez PID par le numéro trouvé)
taskkill /PID <PID> /F
```

### Erreur : "Cannot connect to MongoDB"
MongoDB n'est pas démarré. Le service fonctionnera mais ne sauvegardera pas l'historique.

### Erreur 404 sur /api/ai/generate/motivation-letter
Le backend Spring Boot n'est pas démarré. Suivez l'étape 3 ci-dessus.

### Le bouton "Générer avec IA" reste grisé
Vous devez d'abord écrire quelque chose dans le champ "Parlez-nous de vous / vos idées".

## 📊 Ports utilisés

| Service | Port | URL |
|---------|------|-----|
| Frontend Angular | 4200 | http://192.168.1.20:4200 |
| User Service | 8081 | http://192.168.1.20:8081 |
| Club Service | 8083 | http://192.168.1.20:8083 |
| AI Backend Spring | 8084 | http://192.168.1.20:8084 |
| AI Python Flask | 5000 | http://localhost:5000 |
| MongoDB | 27017 | mongodb://localhost:27017 |

## 🛑 Arrêter les services

### Arrêter tout automatiquement
```powershell
.\ARRETER_TOUT.ps1
```

### Arrêter manuellement
- **Python** : Fermez la fenêtre PowerShell ou `Ctrl+C`
- **Spring Boot** : Fermez la fenêtre PowerShell ou `Ctrl+C`

## ✨ Test complet

Une fois tous les services démarrés :

```powershell
# Test Python
curl http://localhost:5000/health

# Test Spring Boot
curl http://192.168.1.20:8084/api/ai/health

# Test génération (avec PowerShell)
$body = @{
    candidateName = "Test User"
    clubName = "Test Club"
    position = "Membre"
    userIdeas = "Je suis passionné par l'organisation d'événements"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.20:8084/api/ai/generate/motivation-letter" -Method Post -Body $body -ContentType "application/json"
```

Si tout fonctionne, vous devriez recevoir une réponse avec `motivationLetter`, `program`, et `skills`.

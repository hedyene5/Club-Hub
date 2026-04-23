# ✅ Changement de Port - AI Service Backend

## Problème
Le port 8084 était déjà utilisé par le Gateway de l'application ClubHub.

## Solution
Le AI Service Backend utilise maintenant le port **8085** au lieu de 8084.

## Fichiers modifiés

### 1. Backend Spring Boot
- **AI-Service-Backend/src/main/resources/application.properties**
  - `server.port=8085` (au lieu de 8084)

### 2. Frontend Angular
- **Front/src/app/services/ai-generation.service.ts**
  - `apiUrl = 'http://192.168.1.20:8085/api/ai'` (au lieu de 8084)

### 3. Scripts PowerShell
- **AI-Service-Backend/start-backend.ps1**
  - Port : 8085
- **DEMARRER_TOUT.ps1**
  - Test-Port 8085
  - Test health sur port 8085

### 4. Documentation
- **GUIDE_VISUEL_IA.txt**
- Tous les guides mentionnent maintenant le port 8085

## Architecture mise à jour

```
Frontend Angular (4200)
    ↓
Backend Spring Boot AI (8085) ← NOUVEAU PORT
    ↓
Service Python Flask (5000)
```

## Ports utilisés dans ClubHub

| Service | Port | Description |
|---------|------|-------------|
| Frontend Angular | 4200 | Interface utilisateur |
| User Service | 8081 | Gestion des utilisateurs |
| Club Service | 8083 | Gestion des clubs |
| Gateway | 8084 | API Gateway (déjà utilisé) |
| AI Service Backend | 8085 | Service IA (nouveau) |
| AI Service Python | 5000 | Modèle GPT-2 |
| MongoDB | 27017 | Base de données |

## Commandes de test

### Test du backend AI Service
```powershell
curl http://192.168.1.20:8085/api/ai/health
```

Réponse attendue :
```json
{
  "status": "healthy",
  "pythonService": "connected"
}
```

### Test complet
```powershell
# 1. Démarrer Python
cd AI-Service
.\start-service.ps1

# 2. Démarrer Spring Boot (port 8085)
cd AI-Service-Backend
.\start-backend.ps1

# 3. Tester
curl http://localhost:5000/health
curl http://192.168.1.20:8085/api/ai/health
```

## Aucune action requise

Tous les fichiers ont été mis à jour automatiquement. Vous pouvez maintenant démarrer le service sans conflit de port.

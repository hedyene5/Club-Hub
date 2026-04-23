# 🏗️ Architecture ClubHub - Ports et Services

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND ANGULAR                         │
│              http://192.168.1.20:4200                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ User Service │    │ Club Service │    │   Gateway    │
│   Port 8081  │    │   Port 8083  │    │   Port 8084  │
└──────────────┘    └──────────────┘    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ AI Backend   │
                    │   Port 8085  │ ← NOUVEAU
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ AI Python    │
                    │   Port 5000  │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    │  Port 27017  │
                    └──────────────┘
```

## Ports utilisés

| Port | Service | Description | Technologie |
|------|---------|-------------|-------------|
| 4200 | Frontend | Interface utilisateur | Angular |
| 8081 | User Service | Gestion utilisateurs, authentification | Spring Boot |
| 8083 | Club Service | Gestion clubs, élections | Spring Boot |
| 8084 | Gateway | API Gateway, routage | Spring Cloud Gateway |
| 8085 | AI Backend | Service IA intermédiaire | Spring Boot + WebFlux |
| 5000 | AI Python | Modèle GPT-2, génération texte | Flask + Transformers |
| 27017 | MongoDB | Base de données | MongoDB |

## Flux de données - Génération IA

### 1. Candidature avec IA

```
User (Browser)
    │
    │ 1. Remplit "Parlez-nous de vous"
    │ 2. Clique "🤖 Générer avec IA"
    ▼
Frontend Angular (4200)
    │
    │ POST /api/ai/generate/motivation-letter
    │ Body: { candidateName, clubName, position, userIdeas }
    ▼
AI Backend Spring Boot (8085)
    │
    │ POST /generate/motivation-letter
    │ Body: { candidateName, clubName, position, userIdeas }
    ▼
AI Python Flask (5000)
    │
    │ Charge modèle GPT-2 (asi/gpt-fr-cased-small)
    │ Génère texte basé sur userIdeas
    ▼
Retour JSON
    │
    │ { motivationLetter, program, skills }
    ▼
AI Backend (8085)
    │
    │ Sauvegarde dans MongoDB (historique)
    │ Retourne au frontend
    ▼
Frontend Angular (4200)
    │
    │ Auto-remplit les champs :
    │ - Lettre de motivation
    │ - Programme
    │ - Compétences
    ▼
User peut modifier et soumettre
```

## Bases de données MongoDB

### Database: clubhub

**Collections:**
- `users` - Utilisateurs
- `clubs` - Clubs
- `elections` - Élections
- `generatedContents` - Historique IA (nouveau)

### Database: User

**Collections:**
- `users` - Données utilisateurs
- `permissions` - Permissions
- `roles` - Rôles personnalisés

## Configuration réseau

### IP locale
```
192.168.1.20
```

### Accès externe
- Frontend: `http://192.168.1.20:4200`
- User API: `http://192.168.1.20:8081`
- Club API: `http://192.168.1.20:8083`
- Gateway: `http://192.168.1.20:8084`
- AI API: `http://192.168.1.20:8085`

### Accès local uniquement
- Python AI: `http://localhost:5000` (non exposé au réseau)
- MongoDB: `mongodb://localhost:27017`

## Sécurité

### CORS
Tous les backends Spring Boot autorisent :
- `http://192.168.1.20:4200`
- `http://localhost:4200`

### Authentification
- JWT tokens gérés par User Service (8081)
- Tokens validés par Gateway (8084)

## Démarrage des services

### Ordre recommandé

1. **MongoDB** (doit être déjà démarré)
   ```powershell
   # Vérifier : Test-NetConnection -Port 27017
   ```

2. **User Service** (8081)
   ```powershell
   cd Club-Hub-Voice-Channel-Management/User/ClubHub
   mvn spring-boot:run
   ```

3. **Club Service** (8083)
   ```powershell
   cd Club-Hub-Voice-Channel-Management/Back/InstantVoiceManagment
   mvn spring-boot:run
   ```

4. **Gateway** (8084)
   ```powershell
   cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
   mvn spring-boot:run
   ```

5. **AI Python Service** (5000)
   ```powershell
   cd AI-Service
   .\start-service.ps1
   ```

6. **AI Backend Service** (8085)
   ```powershell
   cd AI-Service-Backend
   .\start-backend.ps1
   ```

7. **Frontend Angular** (4200)
   ```powershell
   cd Front
   npm start
   ```

## Tests de santé

```powershell
# User Service
curl http://192.168.1.20:8081/actuator/health

# Club Service
curl http://192.168.1.20:8083/actuator/health

# Gateway
curl http://192.168.1.20:8084/actuator/health

# AI Backend
curl http://192.168.1.20:8085/api/ai/health

# AI Python
curl http://localhost:5000/health

# MongoDB
mongo --eval "db.adminCommand('ping')"
```

## Dépannage

### Port déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr :PORT

# Tuer le processus
taskkill /PID <PID> /F
```

### Service ne démarre pas
1. Vérifier les logs dans la console
2. Vérifier que MongoDB est démarré
3. Vérifier que le port n'est pas utilisé
4. Vérifier les dépendances (Maven, Python, etc.)

## Ressources

- **Modèle IA**: asi/gpt-fr-cased-small (GPT-2 français)
- **Taille modèle**: ~500MB (téléchargé au premier démarrage)
- **Temps génération**: 2-5 secondes
- **100% local**: Aucune API externe

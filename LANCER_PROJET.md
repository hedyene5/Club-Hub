# 🚀 Guide Complet - Lancer le Projet Club Hub

## 📋 Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé:

- ✅ **Java 17** ou supérieur
- ✅ **Maven** (ou utilisez le wrapper mvnw inclus)
- ✅ **Node.js 18+** et **npm**
- ✅ **MongoDB** (en cours d'exécution sur port 27017)
- ✅ **Angular CLI** (`npm install -g @angular/cli`)

---

## 🏗️ Architecture du Projet

```
Club-Hub-Voice-Channel-Management/
├── Gateway/Gateway/          → Port 8084 (API Gateway)
├── User/ClubHub/            → Port 8081 (User Service)
├── Back/InstantVoiceManagment/ → Port 8082 (Voice Service)
└── User/Front/              → Port 4200 (Angular Frontend)
```

---

## 🎯 Méthode 1: Lancement Automatique (Recommandé)

### Étape 1: Démarrer MongoDB

**Windows**:
```bash
# Si MongoDB est installé comme service
net start MongoDB

# OU si vous l'avez installé manuellement
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

**Vérifier que MongoDB fonctionne**:
```bash
# Ouvrir MongoDB Compass ou taper:
mongosh
```

---

### Étape 2: Lancer les Services Backend (3 terminaux)

#### Terminal 1: Gateway (Port 8084)

```bash
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw spring-boot:run
```

**Attendez le message**: `Started GatewayApplication in X.XXX seconds`

---

#### Terminal 2: User Service (Port 8081)

```bash
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw spring-boot:run
```

**Attendez le message**: `Started ClubHubApplication in X.XXX seconds`

---

#### Terminal 3: InstantVoice Service (Port 8082)

```bash
cd Club-Hub-Voice-Channel-Management/Back/InstantVoiceManagment
./mvnw spring-boot:run
```

**Attendez le message**: `Started InstantVoiceManagmentApplication in X.XXX seconds`

---

### Étape 3: Lancer le Frontend Angular

#### Terminal 4: Frontend (Port 4200)

```bash
cd Club-Hub-Voice-Channel-Management/User/Front

# Installer les dépendances (première fois seulement)
npm install

# Lancer le serveur de développement
ng serve
```

**OU**:
```bash
npm start
```

**Attendez le message**: `Angular Live Development Server is listening on localhost:4200`

---

### Étape 4: Ouvrir l'Application

Ouvrez votre navigateur et allez sur:
```
http://localhost:4200
```

---

## 🎯 Méthode 2: Scripts de Lancement

Je vais créer des scripts pour automatiser le lancement.

### Script Windows (PowerShell)

Créez un fichier `start-all.bat`:

```batch
@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              LANCEMENT DU PROJET CLUB HUB                     ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/5] Vérification de MongoDB...
mongosh --eval "db.version()" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MongoDB n'est pas démarré!
    echo    Démarrez MongoDB et réessayez.
    pause
    exit /b 1
)
echo ✅ MongoDB est actif

echo.
echo [2/5] Démarrage du Gateway (Port 8084)...
start "Gateway" cmd /k "cd Gateway\Gateway && mvnw spring-boot:run"
timeout /t 5 >nul

echo.
echo [3/5] Démarrage du User Service (Port 8081)...
start "User Service" cmd /k "cd User\ClubHub && mvnw spring-boot:run"
timeout /t 5 >nul

echo.
echo [4/5] Démarrage de l'InstantVoice Service (Port 8082)...
start "InstantVoice" cmd /k "cd Back\InstantVoiceManagment && mvnw spring-boot:run"
timeout /t 5 >nul

echo.
echo [5/5] Démarrage du Frontend Angular (Port 4200)...
start "Frontend" cmd /k "cd User\Front && npm start"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              ✅ TOUS LES SERVICES SONT EN COURS DE DÉMARRAGE  ║
echo ║                                                                ║
echo ║  Attendez 30-60 secondes que tous les services démarrent      ║
echo ║  Puis ouvrez: http://localhost:4200                           ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
pause
```

---

## 🔍 Vérification que Tout Fonctionne

### 1. Vérifier les Services Backend

Ouvrez votre navigateur et testez:

- **Gateway**: http://localhost:8084
- **User Service**: http://localhost:8081
- **InstantVoice Service**: http://localhost:8082

### 2. Vérifier MongoDB

```bash
mongosh
use User
db.users.find().pretty()
```

### 3. Vérifier le Frontend

Ouvrez: http://localhost:4200

Vous devriez voir la page de connexion.

---

## ❌ Résolution des Problèmes

### Problème 1: Port déjà utilisé

**Symptôme**: `Port 8081 is already in use`

**Solution**:

**Windows**:
```bash
# Trouver le processus
netstat -ano | findstr :8081

# Tuer le processus (remplacez PID)
taskkill /PID <PID> /F
```

---

### Problème 2: MongoDB ne démarre pas

**Solution**:

```bash
# Vérifier le service
net start MongoDB

# OU démarrer manuellement
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

---

### Problème 3: "Cannot find module" (Frontend)

**Solution**:

```bash
cd User/Front
rm -rf node_modules package-lock.json
npm install
```

---

### Problème 4: Erreur de compilation Java

**Solution**:

```bash
cd User/ClubHub
./mvnw clean install
./mvnw spring-boot:run
```

---

### Problème 5: CORS Error

**Symptôme**: Erreur CORS dans la console du navigateur

**Solution**: Vérifiez que le Gateway est bien démarré sur le port 8084.

---

## 📊 Ordre de Démarrage Recommandé

1. **MongoDB** (doit être démarré en premier)
2. **Gateway** (Port 8084)
3. **User Service** (Port 8081)
4. **InstantVoice Service** (Port 8082)
5. **Frontend** (Port 4200)

---

## 🛑 Arrêter le Projet

### Méthode 1: Ctrl+C dans chaque terminal

Allez dans chaque terminal et appuyez sur `Ctrl+C`

### Méthode 2: Script d'arrêt

**Windows**:
```bash
# Tuer tous les processus Java
taskkill /F /IM java.exe

# Tuer le serveur Angular
taskkill /F /IM node.exe
```

---

## 🔄 Redémarrage Rapide

Si vous avez déjà lancé le projet une fois:

```bash
# Terminal 1: Gateway
cd Gateway/Gateway && ./mvnw spring-boot:run

# Terminal 2: User Service
cd User/ClubHub && ./mvnw spring-boot:run

# Terminal 3: InstantVoice
cd Back/InstantVoiceManagment && ./mvnw spring-boot:run

# Terminal 4: Frontend
cd User/Front && npm start
```

---

## 📝 Logs et Debugging

### Voir les logs d'un service

Les logs s'affichent directement dans le terminal.

### Augmenter le niveau de log

Modifiez `application.properties`:

```properties
logging.level.root=DEBUG
logging.level.esprit.com=DEBUG
```

---

## 🎯 Accès à l'Application

Une fois tout démarré:

1. **Frontend**: http://localhost:4200
2. **API Gateway**: http://localhost:8084
3. **MongoDB Compass**: mongodb://localhost:27017

### Comptes de Test

**Président**:
- Email: (votre email président)
- Password: (votre mot de passe)

**Membre avec rôle personnalisé**:
- Email: chef@test.com
- Password: test123

---

## 🚀 Mode Production

Pour déployer en production:

### Backend

```bash
# Compiler les JARs
cd User/ClubHub
./mvnw clean package

# Exécuter
java -jar target/clubhub-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
cd User/Front
ng build --configuration production

# Les fichiers sont dans dist/
```

---

## 📞 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. Vérifiez que tous les prérequis sont installés
2. Vérifiez que MongoDB est démarré
3. Vérifiez que les ports ne sont pas utilisés
4. Consultez les logs dans les terminaux
5. Vérifiez la console du navigateur (F12)

---

## ✅ Checklist de Démarrage

- [ ] MongoDB est démarré
- [ ] Gateway démarre sur port 8084
- [ ] User Service démarre sur port 8081
- [ ] InstantVoice démarre sur port 8082
- [ ] Frontend démarre sur port 4200
- [ ] Aucune erreur dans les logs
- [ ] http://localhost:4200 s'ouvre correctement
- [ ] Vous pouvez vous connecter

---

## 🎉 Félicitations!

Votre projet Club Hub est maintenant lancé et prêt à l'emploi!

Fonctionnalités disponibles:
- ✅ Système d'authentification
- ✅ Gestion des clubs
- ✅ Gestion des membres
- ✅ Rôles personnalisés avec permissions
- ✅ Sous-groupes
- ✅ Élections
- ✅ Permissions en temps réel

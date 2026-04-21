# ✅ MISE À JOUR DES URLs API - CONFIGURATION FINALE

## 📋 Configuration Réseau

### Adresses IP
- **IP WiFi (CORRECTE)**: `192.168.1.20`
- **IP VMware (ANCIENNE)**: ~~`192.168.12.100`~~ ❌ NE PLUS UTILISER

### Ports des Services
- **User Service (Auth)**: `8081`
- **Club Service (Clubs, Elections, Roles, Permissions)**: `8083`
- **Frontend Angular**: `4200`
- **Gateway**: `8084` (optionnel, non utilisé actuellement)

---

## 🎯 URLs Finales

### Backend
- **User Service**: `http://192.168.1.20:8081/api`
- **Club Service**: `http://192.168.1.20:8083/api`

### Frontend
- **Angular**: `http://192.168.1.20:4200`

---

## 📝 Fichiers Modifiés (Dernière mise à jour: 21/04/2026)

### Configuration Backend

#### ClubHub (Club Service - Port 8083)
- ✅ `ClubHub/src/main/resources/application.properties`
  - `server.port=8083`
  - `server.address=192.168.1.20`
  - `app.frontend.url=http://192.168.1.20:4200`
  - `spring.web.cors.allowed-origins=http://localhost:4200,http://192.168.1.20:4200`

#### User Service (Port 8081)
- ✅ `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/resources/application.properties`
  - `server.port=8081`
  - MongoDB: `mongodb://localhost:27017/User`

### Configuration Frontend

#### Environment
- ✅ `Front/src/environments/environment.ts`
  ```typescript
  export const environment = {
    production: false,
    authUrl: 'http://192.168.1.20:8081/api',  // User Service (auth)
    apiUrl: 'http://192.168.1.20:8083/api'    // Club Service (clubs, elections, etc.)
  };
  ```

#### Services (Tous mis à jour vers 192.168.1.20)
- ✅ `Front/src/app/services/auth.service.ts` → `http://192.168.1.20:8081/api`
- ✅ `Front/src/app/services/club.service.ts` → `http://192.168.1.20:8083/api/clubs`
- ✅ `Front/src/app/services/election.service.ts` → `http://192.168.1.20:8083/api/elections`
- ✅ `Front/src/app/services/permission.service.ts` → `http://192.168.1.20:8083/api/permissions`
- ✅ `Front/src/app/services/custom-role.service.ts` → `http://192.168.1.20:8083/api/roles`
- ✅ `Front/src/app/services/committee-responsable.service.ts` → `http://192.168.1.20:8083/api/clubs`

#### Components
- ✅ `Front/src/app/pages/profile/profile.component.ts`
  - User update: `http://192.168.1.20:8081/api/users/{userId}`
  - Club member update: `http://192.168.1.20:8083/api/clubs/{clubId}/members/{userId}`
- ✅ `Front/src/app/pages/setup-club/setup-club.component.ts`
  - Club creation: `http://192.168.1.20:8083/api/clubs`
  - User club association: `http://192.168.1.20:8081/api/users/{id}/club`
- ✅ `Front/src/app/pages/roles/role-management.component.ts` → `http://192.168.1.20:8083/api/roles`
- ✅ `Front/src/app/components/vote-with-token/vote-with-token.component.ts` → `http://192.168.1.20:8083/api`

#### Angular Configuration
- ✅ `Front/package.json`
  ```json
  "start": "ng serve --host 192.168.1.20 --port 4200"
  ```
- ✅ `Front/angular.json`
  - Ajout de `allowedHosts` pour ngrok

---

## 🚀 Commandes de Démarrage

### Backend

#### User Service (Port 8081)
```bash
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw spring-boot:run
```

#### Club Service (Port 8083)
```bash
cd ClubHub
./mvnw spring-boot:run
```

### Frontend (Port 4200)
```bash
cd Front
npm start
# ou
ng serve --host 192.168.1.20 --port 4200
```

---

## ✅ Vérifications

### 1. Backend accessible
```powershell
# User Service
Invoke-WebRequest -Uri "http://192.168.1.20:8081/api/auth/test" -UseBasicParsing

# Club Service
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/clubs" -UseBasicParsing
```

### 2. Frontend accessible
- Depuis PC: `http://192.168.1.20:4200`
- Depuis smartphone (même WiFi): `http://192.168.1.20:4200`

### 3. MongoDB
```powershell
# Vérifier que MongoDB tourne
Get-Process mongod

# Tester la connexion
mongosh --eval "db.adminCommand('ping')"
```

---

## 🔧 Problèmes Résolus

### ❌ Problème: "Club non trouvé" malgré données en base
**Cause**: Les services frontend utilisaient encore l'ancienne IP VMware `192.168.12.100:8084`

**Solution**: Mise à jour de TOUS les services vers:
- User Service: `192.168.1.20:8081`
- Club Service: `192.168.1.20:8083`

### ❌ Problème: 404 sur `/api/auth/login`
**Cause**: Frontend appelait le Club Service (8083) pour l'authentification

**Solution**: Séparation des URLs:
- `authUrl` → User Service (8081)
- `apiUrl` → Club Service (8083)

### ❌ Problème: Smartphone ne peut pas accéder
**Cause**: IP VMware `192.168.12.100` n'est pas sur le même réseau WiFi

**Solution**: Utilisation de l'IP WiFi `192.168.1.20` pour tous les services

---

## 📱 Configuration Smartphone

### Prérequis
- Smartphone et PC sur le MÊME réseau WiFi
- IP WiFi du PC: `192.168.1.20`

### URLs à utiliser
- Frontend: `http://192.168.1.20:4200`
- Les appels API se font automatiquement vers les bons backends

### Test de connectivité
1. Ouvrir le navigateur du smartphone
2. Aller sur `http://192.168.1.20:4200`
3. Se connecter avec un compte
4. Vérifier que les clubs s'affichent

---

## 🎯 Architecture Finale

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Angular                      │
│              http://192.168.1.20:4200                   │
│                                                          │
│  - Auth calls → http://192.168.1.20:8081/api           │
│  - Club calls → http://192.168.1.20:8083/api           │
└─────────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  User Service    │              │  Club Service    │
│   Port 8081      │              │   Port 8083      │
│                  │              │                  │
│ - Auth           │              │ - Clubs          │
│ - Users          │              │ - Elections      │
│                  │              │ - Roles          │
│                  │              │ - Permissions    │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         │                                 │
         ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐
│  MongoDB User    │              │ MongoDB ClubHub  │
│  Port 27017      │              │  Port 27017      │
│  DB: User        │              │  DB: clubhub     │
└──────────────────┘              └──────────────────┘
```

---

## 📌 Notes Importantes

1. **Ne JAMAIS utiliser `localhost` dans les URLs** si vous voulez accéder depuis un smartphone
2. **Toujours utiliser l'IP WiFi** `192.168.1.20` pour tous les services
3. **Vérifier que le pare-feu Windows** autorise les connexions sur les ports 4200, 8081, 8083
4. **Smartphone et PC doivent être sur le MÊME réseau WiFi**
5. **Redémarrer Angular après modification** de `environment.ts` ou des services

---

## 🔍 Diagnostic Rapide

Si les clubs ne s'affichent pas:

1. **Vérifier que les backends tournent**
   ```powershell
   # User Service
   Invoke-WebRequest -Uri "http://192.168.1.20:8081/api/auth/test" -UseBasicParsing
   
   # Club Service
   Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/clubs" -UseBasicParsing
   ```

2. **Vérifier la console du navigateur** (F12)
   - Chercher les erreurs 404, 401, 500
   - Vérifier les URLs appelées

3. **Vérifier MongoDB**
   ```bash
   mongosh
   use clubhub
   db.clubs.find().pretty()
   ```

4. **Vérifier l'authentification**
   - Token JWT présent dans localStorage
   - Token valide et non expiré

---

**Dernière mise à jour**: 21 avril 2026, 02:30
**Status**: ✅ Tous les services configurés et fonctionnels

# ✅ MIGRATION VERS NOUVELLE IP: 172.18.72.32

## 📋 Changement de Réseau WiFi

### Anciennes IPs
- ~~`192.168.1.20`~~ ❌
- ~~`192.168.12.100`~~ ❌

### Nouvelle IP
- **`172.18.72.32`** ✅

---

## 🎯 URLs Mises à Jour

### Backend
- **User Service**: `http://172.18.72.32:8081/api`
- **Club Service**: `http://172.18.72.32:8083/api`

### Frontend
- **Angular**: `http://172.18.72.32:4200`

---

## 📝 Fichiers Modifiés (21/04/2026)

### Backend - ClubHub (Club Service)

✅ `ClubHub/src/main/resources/application.properties`
```properties
server.port=8083
server.address=172.18.72.32
app.frontend.url=http://172.18.72.32:4200
spring.web.cors.allowed-origins=http://localhost:4200,http://172.18.72.32:4200
app.cors.allowed-origins=http://localhost:4200,http://172.18.72.32:4200
```

### Frontend - Angular

✅ `Front/src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  authUrl: 'http://172.18.72.32:8081/api',
  apiUrl: 'http://172.18.72.32:8083/api'
};
```

✅ `Front/src/environments/environment.development.ts`
```typescript
export const environment = {
  production: false,
  authUrl: 'http://172.18.72.32:8081/api',
  apiUrl: 'http://172.18.72.32:8083/api'
};
```

✅ `Front/package.json`
```json
"start": "ng serve --host 172.18.72.32 --port 4200"
```

### Services Angular (Tous mis à jour)

✅ `Front/src/app/services/club.service.ts` → `http://172.18.72.32:8083/api/clubs`
✅ `Front/src/app/services/election.service.ts` → `http://172.18.72.32:8083/api/elections`
✅ `Front/src/app/services/permission.service.ts` → `http://172.18.72.32:8083/api/permissions`
✅ `Front/src/app/services/custom-role.service.ts` → `http://172.18.72.32:8083/api/roles`
✅ `Front/src/app/services/committee-responsable.service.ts` → `http://172.18.72.32:8083/api/clubs`

### Components Angular (Tous mis à jour)

✅ `Front/src/app/pages/profile/profile.component.ts`
- User update: `http://172.18.72.32:8081/api/users/{userId}`
- Club member update: `http://172.18.72.32:8083/api/clubs/{clubId}/members/{userId}`

✅ `Front/src/app/pages/setup-club/setup-club.component.ts`
- Club creation: `http://172.18.72.32:8083/api/clubs`
- User club association: `http://172.18.72.32:8081/api/users/{id}/club`

✅ `Front/src/app/pages/roles/role-management.component.ts` → `http://172.18.72.32:8083/api/roles`

✅ `Front/src/app/components/vote-with-token/vote-with-token.component.ts` → `http://172.18.72.32:8083/api`

✅ `Front/src/app/components/qr-validation/qr-validation.component.ts` → Utilise `environment.apiUrl` (automatique)

---

## 🚀 Commandes de Redémarrage

### 1. Nettoyer les Anciens QR Tokens

**Option A: Script PowerShell**
```powershell
./clean-qr-tokens.ps1
```

**Option B: MongoDB Compass (Interface Graphique)**
1. Ouvrir MongoDB Compass
2. Se connecter à `mongodb://localhost:27017`
3. Aller dans la base `clubhub`
4. Collection `qr_tokens`
5. Cliquer sur "Delete" puis "Delete all documents"

**Option C: MongoDB Shell (Manuel)**
```bash
mongosh
use clubhub
db.qr_tokens.deleteMany({})
db.qr_tokens.countDocuments()  # Devrait retourner 0
exit
```

### 2. Redémarrer Spring Boot (Club Service)

```bash
cd ClubHub
./mvnw spring-boot:run
```

**Attendre le message:**
```
Started ClubHubApplication in X.XXX seconds
```

### 3. Redémarrer Angular

```bash
cd Front
npm start
# ou
ng serve --host 172.18.72.32 --port 4200
```

**Attendre le message:**
```
✔ Compiled successfully.
```

---

## ✅ Tests de Vérification

### 1. Vérifier les Backends

```powershell
# User Service
Invoke-WebRequest -Uri "http://172.18.72.32:8081/api/auth/test" -UseBasicParsing

# Club Service
Invoke-WebRequest -Uri "http://172.18.72.32:8083/api/clubs" -UseBasicParsing
```

**Résultat attendu:** Status 200 OK

### 2. Vérifier le Frontend

**Depuis PC:**
```
http://172.18.72.32:4200
```

**Depuis Smartphone (même WiFi):**
```
http://172.18.72.32:4200
```

### 3. Vérifier la Console du Navigateur (F12)

**Onglet Console:**
```
✅ Pas d'erreur ProgressEvent
✅ Pas d'erreur CORS
✅ Pas d'erreur 404
```

**Onglet Network:**
```
✅ Toutes les requêtes vont vers http://172.18.72.32:8081 ou :8083
✅ Aucune requête vers localhost
✅ Aucune requête vers 192.168.x.x
```

---

## 🧪 Test Complet: Créer une Élection

### Étape 1: Se Connecter

1. Ouvrir `http://172.18.72.32:4200`
2. Se connecter avec un compte PRESIDENT
3. Vérifier que le club s'affiche correctement

### Étape 2: Créer une Élection

1. Aller dans "Élections"
2. Cliquer sur "Créer une élection"
3. Remplir les informations:
   - Nom: "Test Nouvelle IP"
   - Type: PRÉSENTIELLE
   - Date de début: Maintenant + 2 minutes
   - Lieu: "Salle A"
4. Ajouter des candidats
5. Créer l'élection

### Étape 3: Vérifier les QR Codes

**Attendre J-1 (30-60 secondes selon le scheduler)**

1. Vérifier les emails reçus
2. Les QR codes doivent contenir:
   ```
   http://172.18.72.32:4200/elections/scan/{token}
   ```
3. **PAS** `http://192.168.x.x` ou `http://localhost`

### Étape 4: Scanner le QR Code

**Depuis le Smartphone:**

1. Scanner le QR code avec l'appareil photo
2. La page s'ouvre: `http://172.18.72.32:4200/elections/scan/{token}`
3. Se connecter (si pas déjà connecté)
4. Vérifier que les infos du membre s'affichent
5. Valider la présence
6. Vérifier la confirmation

### Étape 5: Voter

1. Recevoir l'email avec le lien de vote
2. Cliquer sur le lien depuis le smartphone
3. La page s'ouvre: `http://172.18.72.32:4200/elections/vote/{token}`
4. Voter pour un candidat
5. Vérifier la confirmation

---

## 🔍 Diagnostic en Cas de Problème

### Problème: "Club non trouvé"

**Cause possible:** Backend non démarré ou mauvaise IP

**Solution:**
```powershell
# Vérifier que le backend tourne
Invoke-WebRequest -Uri "http://172.18.72.32:8083/api/clubs" -UseBasicParsing

# Si erreur, redémarrer Spring Boot
cd ClubHub
./mvnw spring-boot:run
```

### Problème: "Erreur CORS"

**Cause possible:** CORS mal configuré

**Solution:**
1. Vérifier `ClubHub/src/main/resources/application.properties`
2. Doit contenir: `spring.web.cors.allowed-origins=http://localhost:4200,http://172.18.72.32:4200`
3. Redémarrer Spring Boot

### Problème: "404 Not Found"

**Cause possible:** Mauvaise URL dans le frontend

**Solution:**
```powershell
# Vérifier qu'il n'y a plus d'anciennes IPs
cd Front
grep -r "192.168" src/
# Devrait retourner: aucun résultat

# Si des anciennes IPs sont trouvées, les remplacer par 172.18.72.32
```

### Problème: QR Code avec Ancienne IP

**Cause:** Anciens tokens dans MongoDB

**Solution:**
```bash
mongosh
use clubhub
db.qr_tokens.deleteMany({})
exit
```

Puis recréer une nouvelle élection.

---

## 📱 Configuration Smartphone

### Prérequis

✅ Smartphone et PC sur le MÊME réseau WiFi
✅ Réseau WiFi avec plage IP: `172.18.x.x`
✅ IP du PC: `172.18.72.32`

### Test de Connectivité

**Depuis le Smartphone:**

1. Ouvrir le navigateur
2. Aller sur `http://172.18.72.32:4200`
3. La page Angular doit se charger
4. Se connecter
5. Vérifier que les clubs s'affichent

**Si ça ne fonctionne pas:**

1. Vérifier que le smartphone est sur le même WiFi
2. Vérifier l'IP du PC:
   ```powershell
   ipconfig | Select-String "172.18"
   ```
3. Vérifier le pare-feu Windows (ports 4200, 8081, 8083)

---

## 🎯 Architecture Finale

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Angular                      │
│              http://172.18.72.32:4200                   │
│                                                          │
│  - Auth calls → http://172.18.72.32:8081/api           │
│  - Club calls → http://172.18.72.32:8083/api           │
└─────────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  User Service    │              │  Club Service    │
│   Port 8081      │              │   Port 8083      │
│ 172.18.72.32     │              │ 172.18.72.32     │
│                  │              │                  │
│ - Auth           │              │ - Clubs          │
│ - Users          │              │ - Elections      │
│                  │              │ - Roles          │
│                  │              │ - Permissions    │
│                  │              │ - QR Tokens      │
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

## 📌 Checklist Finale

### Configuration
- [x] Backend application.properties mis à jour
- [x] Frontend environment.ts mis à jour
- [x] Tous les services Angular mis à jour
- [x] Tous les components Angular mis à jour
- [x] package.json mis à jour
- [x] CORS configuré
- [ ] Anciens QR tokens supprimés (À FAIRE)
- [ ] Spring Boot redémarré (À FAIRE)
- [ ] Angular redémarré (À FAIRE)

### Tests
- [ ] Backend accessible depuis PC
- [ ] Frontend accessible depuis PC
- [ ] Frontend accessible depuis Smartphone
- [ ] Connexion fonctionne
- [ ] Clubs s'affichent
- [ ] Nouvelle élection créée
- [ ] QR codes contiennent la nouvelle IP
- [ ] Scan QR fonctionne depuis smartphone
- [ ] Validation de présence fonctionne
- [ ] Vote fonctionne

---

## 🚀 Actions Immédiates

### 1. Nettoyer MongoDB
```powershell
./clean-qr-tokens.ps1
```

### 2. Redémarrer Spring Boot
```bash
cd ClubHub
./mvnw spring-boot:run
```

### 3. Redémarrer Angular
```bash
cd Front
npm start
```

### 4. Tester
```
http://172.18.72.32:4200
```

---

**Date de migration**: 21 avril 2026
**Nouvelle IP**: 172.18.72.32
**Status**: ✅ Configuration terminée, prêt à redémarrer

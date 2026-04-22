# ✅ CORRECTION IP - 192.168.1.20

## 🔴 Problème Rencontré

```
java.net.BindException: Cannot assign requested address: bind
```

**Cause:** L'IP `172.18.72.32` configurée dans `application.properties` n'existe plus sur votre réseau.

---

## ✅ Solution Appliquée

### Backend - application.properties

**Changement 1: Server Address**
```properties
# AVANT
server.address=172.18.72.32

# APRÈS
server.address=0.0.0.0  # Écoute sur toutes les interfaces
```

**Changement 2: CORS et Frontend URL**
```properties
# AVANT
spring.web.cors.allowed-origins=http://localhost:4200,http://172.18.72.32:4200
app.frontend.url=http://172.18.72.32:4200

# APRÈS
spring.web.cors.allowed-origins=http://localhost:4200,http://192.168.1.20:4200
app.frontend.url=http://192.168.1.20:4200
```

### Frontend - Tous les fichiers mis à jour

✅ `Front/src/environments/environment.ts`
✅ `Front/src/environments/environment.development.ts`
✅ `Front/package.json`
✅ `Front/src/app/services/club.service.ts`
✅ `Front/src/app/services/election.service.ts`
✅ `Front/src/app/services/permission.service.ts`
✅ `Front/src/app/services/custom-role.service.ts`
✅ `Front/src/app/services/committee-responsable.service.ts`
✅ `Front/src/app/pages/profile/profile.component.ts`
✅ `Front/src/app/pages/setup-club/setup-club.component.ts`
✅ `Front/src/app/pages/roles/role-management.component.ts`
✅ `Front/src/app/components/vote-with-token/vote-with-token.component.ts`

**Toutes les occurrences de `172.18.72.32` ont été remplacées par `192.168.1.20`**

---

## 🚀 Redémarrage

### 1. Redémarrer Spring Boot

```bash
cd ClubHub
./mvnw spring-boot:run
```

**Attendre le message:**
```
Started ClubHubApplication in X.XXX seconds
```

### 2. Redémarrer Angular

```bash
cd Front
npm start
```

**Attendre le message:**
```
✔ Compiled successfully.
```

---

## 🧪 Tests

### Test 1: Backend accessible

```powershell
# Club Service
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/clubs" -UseBasicParsing

# Permissions
Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/roles/permissions" -UseBasicParsing
```

### Test 2: Frontend accessible

**PC:**
```
http://192.168.1.20:4200
```

**Smartphone (même WiFi):**
```
http://192.168.1.20:4200
```

### Test 3: Gestion des rôles

```
http://192.168.1.20:4200/roles
```

1. Cliquer sur "Créer un rôle"
2. Vérifier que les 35 permissions s'affichent
3. Créer un rôle de test
4. Vérifier qu'il apparaît dans la liste

---

## 📌 IPs Détectées sur Votre PC

```
192.168.52.1    (VMware)
192.168.11.100  (?)
192.168.12.100  (VMware)
192.168.1.20    (WiFi) ✅ UTILISÉE
169.254.101.141 (Autoconfiguration)
```

**IP WiFi utilisée:** `192.168.1.20`

---

## 🔍 Pourquoi `server.address=0.0.0.0` ?

`0.0.0.0` signifie "écouter sur toutes les interfaces réseau". Cela permet à Spring Boot de:
- Accepter les connexions depuis `localhost`
- Accepter les connexions depuis `192.168.1.20`
- Accepter les connexions depuis n'importe quelle autre IP du PC

**Avantage:** Si votre IP change, le backend continuera de fonctionner sans modification.

---

## ⚠️ Si Votre IP Change Encore

### Option 1: Utiliser localhost (développement local uniquement)

**Backend:**
```properties
server.address=0.0.0.0
app.frontend.url=http://localhost:4200
spring.web.cors.allowed-origins=http://localhost:4200
```

**Frontend:**
```typescript
authUrl: 'http://localhost:8081/api'
apiUrl: 'http://localhost:8083/api'
```

**Limitation:** Ne fonctionne pas depuis un smartphone

### Option 2: Script de détection automatique

Créer un script PowerShell qui détecte l'IP WiFi et met à jour automatiquement tous les fichiers.

### Option 3: Variables d'environnement

Utiliser des variables d'environnement pour l'IP au lieu de la coder en dur.

---

## 📋 Checklist

- [x] Backend `application.properties` mis à jour
- [x] Frontend `environment.ts` mis à jour
- [x] Tous les services Angular mis à jour
- [x] `package.json` mis à jour
- [ ] Spring Boot redémarré (À FAIRE)
- [ ] Angular redémarré (À FAIRE)
- [ ] Tests effectués

---

**Date:** 22 avril 2026
**IP actuelle:** 192.168.1.20
**Status:** ✅ Configuration corrigée, prêt à redémarrer

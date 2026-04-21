# 🏗️ Architecture des Services ClubHub

## Services Backend

### 1. User Service (Port 8081)
**Responsabilité:** Gestion des utilisateurs et authentification

**Endpoints:**
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/users/me` - Profil utilisateur
- `GET /api/users/{id}` - Détails utilisateur
- `PUT /api/users/{id}` - Mise à jour utilisateur

### 2. Club Service (Port 8083)
**Responsabilité:** Gestion des clubs, élections, QR codes

**Endpoints:**
- `GET /api/clubs` - Liste des clubs
- `POST /api/clubs` - Créer un club
- `GET /api/elections` - Liste des élections
- `POST /api/elections` - Créer une élection
- `GET /api/qr-tokens/{token}` - Valider un QR code
- etc.

### 3. Gateway (Port 8084)
**Responsabilité:** Point d'entrée unique, routage des requêtes

**Routing:**
- `/api/auth/**` → User Service (8081)
- `/api/users/**` → User Service (8081)
- `/api/clubs/**` → Club Service (8083)
- `/api/elections/**` → Club Service (8083)
- `/api/qr-tokens/**` → Club Service (8083)

---

## ❌ Problème Actuel

Le frontend Angular est configuré pour appeler directement le Club Service (8083):

```typescript
// environment.ts
apiUrl: 'http://192.168.1.20:8083/api'
```

**Résultat:**
- ✅ `/api/clubs` fonctionne (Club Service)
- ✅ `/api/elections` fonctionne (Club Service)
- ❌ `/api/auth/login` ne fonctionne PAS (pas dans Club Service)

---

## ✅ Solutions

### Solution 1: Utiliser le Gateway (Recommandé)

**Avantage:** Point d'entrée unique, le Gateway route vers le bon service

**Configuration:**
```typescript
// environment.ts
apiUrl: 'http://192.168.1.20:8084/api'
```

**Prérequis:**
- Gateway doit tourner sur port 8084
- Gateway doit être configuré pour router vers User Service et Club Service

### Solution 2: Appeler Directement les Services

**Avantage:** Pas besoin du Gateway

**Configuration:**
```typescript
// environment.ts
export const environment = {
  production: false,
  userServiceUrl: 'http://192.168.1.20:8081/api',
  clubServiceUrl: 'http://192.168.1.20:8083/api'
};
```

**Modifications nécessaires:**
- AuthService utilise `userServiceUrl`
- Autres services utilisent `clubServiceUrl`

---

## 🚀 Solution Immédiate

### Option A: Utiliser le Gateway (Si disponible)

**1. Vérifier que le Gateway tourne:**
```bash
Test-NetConnection -ComputerName 192.168.1.20 -Port 8084
```

**2. Mettre à jour environment.ts:**
```typescript
apiUrl: 'http://192.168.1.20:8084/api'
```

**3. Redémarrer Angular**

### Option B: Utiliser Deux URLs (Plus Simple)

**1. Mettre à jour environment.ts:**
```typescript
export const environment = {
  production: false,
  authUrl: 'http://192.168.1.20:8081/api',
  apiUrl: 'http://192.168.1.20:8083/api'
};
```

**2. Mettre à jour auth.service.ts:**
```typescript
import { environment } from '../../environments/environment';

private gateway = environment.authUrl.replace('/api', '');
private api = `${this.gateway}/api/auth`;
private usersApi = `${this.gateway}/api/users`;
```

**3. Redémarrer Angular**

---

## 📋 Vérification

### Tester les Services

**User Service (8081):**
```bash
curl http://192.168.1.20:8081/api/users
```

**Club Service (8083):**
```bash
curl http://192.168.1.20:8083/api/clubs
```

**Gateway (8084):**
```bash
curl http://192.168.1.20:8084/api/auth/login
curl http://192.168.1.20:8084/api/clubs
```

---

## 💡 Recommandation

**Utiliser le Gateway (Option A)** si:
- Le Gateway est déjà configuré
- Tu veux un point d'entrée unique
- Tu veux simplifier la configuration frontend

**Utiliser deux URLs (Option B)** si:
- Le Gateway n'est pas configuré
- Tu veux une solution rapide
- Tu veux éviter la complexité du Gateway

---

## 🎯 Action Immédiate

Je recommande **Option B** (deux URLs) car c'est plus simple et direct.

**Fichiers à modifier:**
1. `Front/src/environments/environment.ts`
2. `Front/src/app/services/auth.service.ts`

**Puis redémarrer Angular.**

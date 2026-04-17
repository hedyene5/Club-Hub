# 🔍 Diagnostic: Changement Automatique du Rôle

## 🎯 Objectif

Vérifier que le système change automatiquement le rôle d'un utilisateur dans la collection `users` quand il devient responsable d'un comité.

---

## ✅ Checklist de Configuration

### 1. Services Démarrés

```bash
# User Service (port 8081)
curl http://localhost:8081/api/users/me
# ✅ Doit retourner 401 (non authentifié) ou les infos utilisateur

# Club Service (port 8083)
curl http://localhost:8083/api/clubs
# ✅ Doit retourner la liste des clubs

# Gateway (port 8084)
curl http://localhost:8084/api/clubs
# ✅ Doit retourner la liste des clubs via le gateway
```

---

### 2. Endpoint User Service

**Vérifier que l'endpoint existe:**

```bash
# Fichier: Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/controller/UserController.java

# Chercher:
@PutMapping("/{userId}/role")
public ResponseEntity<User> updateUserRole(...)
```

**✅ Doit exister et accepter:**
```json
{
  "role": "Responsable media"
}
```

---

### 3. URL du User Service dans ClubService

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

```java
private String userServiceUrl = "http://localhost:8081/api/users";  // ✅ Avec /api
```

**❌ INCORRECT:**
```java
private String userServiceUrl = "http://localhost:8081/users";  // ❌ Sans /api
```

---

### 4. RestTemplate Configuré

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/config/AppConfig.java`

```java
@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

**Si le fichier n'existe pas, créez-le!**

---

## 🧪 Test Manuel

### Étape 1: Préparer les données

**MongoDB - Créer un utilisateur de test:**
```javascript
db.users.insertOne({
  _id: "test-user-123",
  firstName: "Test",
  lastName: "User",
  email: "test@test.com",
  password: "$2a$10$...",  // Hash du mot de passe
  role: "MEMBRE_SIMPLE",
  clubId: "votre-club-id",
  phoneNumber: "",
  profilePhoto: "",
  active: true
})
```

**MongoDB - Ajouter l'utilisateur au club:**
```javascript
db.clubs.updateOne(
  { _id: "votre-club-id" },
  {
    $push: {
      members: {
        userId: "test-user-123",
        name: "Test User",
        email: "test@test.com",
        role: "MEMBRE_SIMPLE",
        status: "APPROVED",
        subGroupId: null,
        subGroupRole: null,
        initialRole: null,
        joinedDate: new Date()
      }
    }
  }
)
```

---

### Étape 2: Tester l'assignation via Postman

**Requête:**
```
PUT http://localhost:8083/api/clubs/votre-club-id/members/test-user-123/subgroup/votre-subgroup-id
Content-Type: application/json

{
  "subGroupRole": "RESPONSABLE"
}
```

**Réponse attendue:**
```json
{
  "_id": "votre-club-id",
  "name": "Mon Club",
  "subGroups": [
    {
      "_id": "votre-subgroup-id",
      "name": "media",
      "responsableId": "test-user-123",  // ✅ Mis à jour
      "memberRoles": {
        "test-user-123": "RESPONSABLE"  // ✅ Ajouté
      }
    }
  ]
}
```

---

### Étape 3: Vérifier les logs

**Logs du Club Service (port 8083):**
```
=== ASSIGN TO SUBGROUP SERVICE ===
UserId: test-user-123
SubGroupRole: RESPONSABLE
📋 Sous-groupe trouvé: media
👤 Membre trouvé: Test User (rôle actuel: MEMBRE_SIMPLE)
📝 Rôle initial sauvegardé: MEMBRE_SIMPLE
✅ ResponsableId mis à jour: test-user-123
🔍 Appel du service User pour mettre à jour le rôle...
✅ Rôle mis à jour dans le service User: Responsable media
📡 Réponse: 200 OK
✅ Club sauvegardé
```

**✅ SI VOUS VOYEZ CES LOGS:** Tout fonctionne!

**❌ SI VOUS VOYEZ:**
```
❌ Erreur lors de la mise à jour du rôle dans User service: ...
```
→ Voir la section "Dépannage" ci-dessous

---

### Étape 4: Vérifier la base de données

**MongoDB - Collection `users`:**
```javascript
db.users.findOne({ _id: "test-user-123" })
```

**Résultat attendu:**
```json
{
  "_id": "test-user-123",
  "role": "Responsable media"  // ✅ CHANGÉ!
}
```

**❌ SI LE RÔLE EST TOUJOURS "MEMBRE_SIMPLE":**
→ L'appel REST a échoué, voir "Dépannage"

---

## 🐛 Dépannage

### Erreur 1: "Connection refused" ou "ConnectException"

**Logs:**
```
❌ Erreur: Connection refused: connect
```

**Cause:** User Service n'est pas démarré

**Solution:**
```bash
cd Club-Hub-Voice-Channel-Management/User/ClubHub
mvn spring-boot:run
```

---

### Erreur 2: "404 Not Found"

**Logs:**
```
❌ Erreur: 404 Not Found
```

**Cause 1:** URL incorrecte dans ClubService

**Solution:**
```java
// ClubService.java
private String userServiceUrl = "http://localhost:8081/api/users";  // ✅ Avec /api
```

**Cause 2:** Endpoint n'existe pas dans UserController

**Solution:** Vérifier que UserController a:
```java
@PutMapping("/{userId}/role")
public ResponseEntity<User> updateUserRole(@PathVariable String userId, @RequestBody Map<String, String> roleUpdate) {
    // ...
}
```

---

### Erreur 3: "No bean of type RestTemplate"

**Logs:**
```
❌ Erreur: No qualifying bean of type 'org.springframework.web.client.RestTemplate'
```

**Cause:** RestTemplate n'est pas configuré

**Solution:** Créer `AppConfig.java`:
```java
package esprit.com.clubhub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

---

### Erreur 4: Le rôle est changé mais les permissions ne sont pas mises à jour

**Symptôme:** 
- Rôle dans `users` = "Responsable media" ✅
- Mais l'utilisateur ne voit pas les boutons de gestion ❌

**Cause:** Le frontend n'a pas rechargé les permissions

**Solution:**
1. Déconnectez-vous
2. Reconnectez-vous
3. Les permissions seront rechargées automatiquement

**OU** dans le code, après l'assignation:
```typescript
this.permissionService.loadUserPermissions();
this.committeeResponsableService.loadResponsableStatus();
```

---

## 📊 Tableau de Diagnostic

| Vérification | Commande | Résultat Attendu |
|--------------|----------|------------------|
| User Service démarré | `curl http://localhost:8081/api/users/me` | 401 ou données utilisateur |
| Club Service démarré | `curl http://localhost:8083/api/clubs` | Liste des clubs |
| Endpoint existe | Chercher `@PutMapping("/{userId}/role")` | Trouvé dans UserController |
| URL correcte | Vérifier `userServiceUrl` | `http://localhost:8081/api/users` |
| RestTemplate configuré | Chercher `@Bean RestTemplate` | Trouvé dans AppConfig |
| Assignation réussie | Logs Club Service | "✅ Rôle mis à jour dans le service User" |
| Rôle changé | `db.users.findOne(...)` | `role: "Responsable media"` |
| Permissions mises à jour | Console navigateur | "✅ DÉTECTION DYNAMIQUE" |

---

## 🎯 Test Rapide

**Commande unique pour tout tester:**

```bash
# 1. Vérifier que les services sont démarrés
curl -s http://localhost:8081/api/users/me && echo "✅ User Service OK" || echo "❌ User Service KO"
curl -s http://localhost:8083/api/clubs && echo "✅ Club Service OK" || echo "❌ Club Service KO"

# 2. Tester l'assignation (remplacer les IDs)
curl -X PUT http://localhost:8083/api/clubs/CLUB_ID/members/USER_ID/subgroup/SUBGROUP_ID \
  -H "Content-Type: application/json" \
  -d '{"subGroupRole":"RESPONSABLE"}'

# 3. Vérifier le rôle dans MongoDB
mongo
use clubhub
db.users.findOne({ _id: "USER_ID" })
```

---

## ✅ Résultat Final

Si tout fonctionne correctement:

1. ✅ Logs Club Service: "✅ Rôle mis à jour dans le service User: Responsable media"
2. ✅ Logs User Service: "🔄 Mise à jour du rôle: MEMBRE_SIMPLE → Responsable media"
3. ✅ MongoDB `users`: `{ "role": "Responsable media" }`
4. ✅ MongoDB `clubs`: `{ "responsableId": "user-id" }`
5. ✅ Interface: Boutons de gestion visibles pour le comité
6. ✅ Permissions: `["ASSIGN_TO_SUBGROUPS", ...]`

Le système change automatiquement le rôle! 🚀

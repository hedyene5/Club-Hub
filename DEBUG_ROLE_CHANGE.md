# 🐛 Debug: Pourquoi le rôle ne change pas dans la base de données

## 🔍 Étapes de Diagnostic

### 1. Vérifier que les services sont démarrés

```bash
# User Service (port 8081)
netstat -ano | findstr :8081
# ✅ Résultat: LISTENING 3688

# Club Service (port 8083)
netstat -ano | findstr :8083
# ✅ Doit afficher LISTENING
```

---

### 2. Activer les logs détaillés

**Fichier:** `ClubHub/src/main/resources/application.properties`

Ajoutez:
```properties
# Logs détaillés
logging.level.esprit.com.clubhub=DEBUG
logging.level.org.springframework.web.client.RestTemplate=DEBUG
```

**Redémarrez le Club Service** après cette modification.

---

### 3. Tester l'assignation et vérifier les logs

**Action:** Assignez un membre comme RESPONSABLE d'un comité

**Logs attendus dans Club Service:**
```
=== ASSIGN TO SUBGROUP SERVICE ===
UserId: 69e00dbebf596604ae458ed9
SubGroupRole: RESPONSABLE
📋 Sous-groupe trouvé: media
👤 Membre trouvé: Jean (rôle actuel: MEMBRE_SIMPLE)
📝 Rôle initial sauvegardé: MEMBRE_SIMPLE
✅ ResponsableId mis à jour: 69e00dbebf596604ae458ed9
🔍 Appel du service User pour mettre à jour le rôle...
✅ Rôle mis à jour dans le service User: Responsable media
📡 Réponse: 200 OK
```

**❌ Si vous voyez:**
```
❌ Erreur lors de la mise à jour du rôle dans User service: ...
```

→ Passez à l'étape 4

---

### 4. Tester l'endpoint User Service manuellement

**Ouvrez Postman ou utilisez curl:**

```bash
# Récupérer l'utilisateur actuel
curl http://localhost:8081/api/users/69e00dbebf596604ae458ed9

# Résultat attendu:
{
  "_id": "69e00dbebf596604ae458ed9",
  "firstName": "Jean",
  "role": "MEMBRE_SIMPLE"
}

# Tester la mise à jour du rôle
curl -X PUT http://localhost:8081/api/users/69e00dbebf596604ae458ed9/role \
  -H "Content-Type: application/json" \
  -d '{"role":"Responsable media"}'

# Résultat attendu:
{
  "_id": "69e00dbebf596604ae458ed9",
  "role": "Responsable media"  // ✅ Changé
}

# Vérifier dans MongoDB
mongo
use clubhub
db.users.findOne({ _id: "69e00dbebf596604ae458ed9" })
```

**✅ Si ça fonctionne manuellement:**
→ Le problème est dans l'appel REST du Club Service

**❌ Si ça ne fonctionne pas:**
→ Le problème est dans le UserController

---

### 5. Vérifier l'URL dans ClubService

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

```java
private String userServiceUrl = "http://localhost:8081/api/users";  // ✅ Doit avoir /api
```

**❌ INCORRECT:**
```java
private String userServiceUrl = "http://localhost:8081/users";  // ❌ Sans /api
```

---

### 6. Vérifier que RestTemplate est injecté

**Fichier:** `ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`

```java
@Service
public class ClubService {

    @Autowired
    private ClubRepository clubRepository;
    
    @Autowired
    private RestTemplate restTemplate;  // ✅ Doit être présent
    
    private String userServiceUrl = "http://localhost:8081/api/users";
```

---

### 7. Ajouter des logs supplémentaires

**Modifiez temporairement ClubService.assignToSubGroup():**

```java
// ✅ Si RESPONSABLE, mettre à jour aussi dans le service User via REST API
if (subGroupRole.equals("RESPONSABLE")) {
    System.out.println("🔍 Appel du service User pour mettre à jour le rôle...");
    try {
        String newRole = "Responsable " + subGroup.getName();
        String url = userServiceUrl + "/" + userId + "/role";
        
        System.out.println("📡 URL complète: " + url);  // ✅ AJOUT
        System.out.println("📦 Nouveau rôle: " + newRole);  // ✅ AJOUT
        
        Map<String, String> roleUpdate = new HashMap<>();
        roleUpdate.put("role", newRole);
        
        HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
        
        System.out.println("📤 Envoi de la requête...");  // ✅ AJOUT
        
        ResponseEntity<String> response = restTemplate.exchange(
            url,
            HttpMethod.PUT,
            request,
            String.class
        );
        
        System.out.println("✅ Rôle mis à jour dans le service User: " + newRole);
        System.out.println("📡 Réponse: " + response.getStatusCode());
        System.out.println("📄 Body: " + response.getBody());  // ✅ AJOUT
    } catch (Exception e) {
        System.err.println("❌ Erreur lors de la mise à jour du rôle dans User service: " + e.getMessage());
        e.printStackTrace();  // ✅ AJOUT pour voir la stack trace complète
    }
}
```

---

### 8. Vérifier le UserController

**Fichier:** `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/controller/UserController.java`

Vérifiez que l'endpoint existe:

```java
@PutMapping("/{userId}/role")
public ResponseEntity<User> updateUserRole(
        @PathVariable String userId,
        @RequestBody Map<String, String> roleUpdate) {
    
    try {
        System.out.println("=== UPDATE USER ROLE ===");  // ✅ AJOUT
        System.out.println("UserId: " + userId);  // ✅ AJOUT
        System.out.println("New role: " + roleUpdate.get("role"));  // ✅ AJOUT
        
        User user = userService.getUserById(userId);
        
        String newRole = roleUpdate.get("role");
        System.out.println("🔄 Mise à jour du rôle: " + user.getRole() + " → " + newRole);
        
        user.setRole(newRole);
        User savedUser = userService.updateUser(userId, user);
        
        System.out.println("✅ Rôle mis à jour dans User service");
        return ResponseEntity.ok(savedUser);
    } catch (Exception e) {
        System.err.println("❌ Erreur: " + e.getMessage());
        e.printStackTrace();  // ✅ AJOUT
        return ResponseEntity.badRequest().build();
    }
}
```

---

### 9. Vérifier le UserService.updateUser()

**Fichier:** `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/service/UserService.java`

```java
public User updateUser(String id, User updatedUser) {
    User user = userRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    
    System.out.println("=== UPDATE USER ===");  // ✅ AJOUT
    System.out.println("User ID: " + id);  // ✅ AJOUT
    System.out.println("Old role: " + user.getRole());  // ✅ AJOUT
    System.out.println("New role: " + updatedUser.getRole());  // ✅ AJOUT
    
    // Mettre à jour les champs
    if (updatedUser.getFirstName() != null) user.setFirstName(updatedUser.getFirstName());
    if (updatedUser.getLastName() != null) user.setLastName(updatedUser.getLastName());
    if (updatedUser.getEmail() != null) user.setEmail(updatedUser.getEmail());
    if (updatedUser.getPhoneNumber() != null) user.setPhoneNumber(updatedUser.getPhoneNumber());
    if (updatedUser.getRole() != null) user.setRole(updatedUser.getRole());  // ✅ Important
    if (updatedUser.getClubId() != null) user.setClubId(updatedUser.getClubId());
    if (updatedUser.getProfilePhoto() != null) user.setProfilePhoto(updatedUser.getProfilePhoto());
    
    User saved = userRepo.save(user);
    System.out.println("✅ User sauvegardé avec rôle: " + saved.getRole());  // ✅ AJOUT
    
    return saved;
}
```

---

## 🧪 Test Complet avec Logs

### Étape 1: Redémarrer les services avec logs

1. Arrêtez Club Service et User Service
2. Ajoutez les logs supplémentaires (étapes 7, 8, 9)
3. Redémarrez User Service (port 8081)
4. Redémarrez Club Service (port 8083)

### Étape 2: Faire l'assignation

1. Connectez-vous en tant que PRESIDENT
2. Assignez un membre comme RESPONSABLE d'un comité
3. Regardez les logs dans les deux consoles

### Étape 3: Analyser les logs

**Logs Club Service (port 8083):**
```
=== ASSIGN TO SUBGROUP SERVICE ===
🔍 Appel du service User pour mettre à jour le rôle...
📡 URL complète: http://localhost:8081/api/users/69e00dbebf596604ae458ed9/role
📦 Nouveau rôle: Responsable media
📤 Envoi de la requête...
✅ Rôle mis à jour dans le service User: Responsable media
📡 Réponse: 200 OK
📄 Body: {"_id":"69e00dbebf596604ae458ed9","role":"Responsable media",...}
```

**Logs User Service (port 8081):**
```
=== UPDATE USER ROLE ===
UserId: 69e00dbebf596604ae458ed9
New role: Responsable media
🔄 Mise à jour du rôle: MEMBRE_SIMPLE → Responsable media
=== UPDATE USER ===
User ID: 69e00dbebf596604ae458ed9
Old role: MEMBRE_SIMPLE
New role: Responsable media
✅ User sauvegardé avec rôle: Responsable media
✅ Rôle mis à jour dans User service
```

### Étape 4: Vérifier MongoDB

```javascript
mongo
use clubhub
db.users.findOne({ _id: "69e00dbebf596604ae458ed9" })
```

**Résultat attendu:**
```json
{
  "_id": "69e00dbebf596604ae458ed9",
  "role": "Responsable media"  // ✅ Doit être changé
}
```

---

## 🔧 Solutions aux Problèmes Courants

### Problème 1: Aucun log "🔍 Appel du service User"

**Cause:** Le code n'entre pas dans le bloc `if (subGroupRole.equals("RESPONSABLE"))`

**Solution:** Vérifiez que vous envoyez bien `"RESPONSABLE"` et pas `"Responsable"` ou autre chose

---

### Problème 2: Erreur "Connection refused"

**Cause:** User Service n'est pas démarré

**Solution:**
```bash
cd Club-Hub-Voice-Channel-Management/User/ClubHub
mvn spring-boot:run
```

---

### Problème 3: Erreur "404 Not Found"

**Cause:** L'URL est incorrecte ou l'endpoint n'existe pas

**Solution:** Vérifiez:
1. URL dans ClubService: `http://localhost:8081/api/users`
2. Endpoint dans UserController: `@PutMapping("/{userId}/role")`

---

### Problème 4: Logs OK mais MongoDB pas mis à jour

**Cause:** Le `userRepo.save()` ne sauvegarde pas

**Solution:** Vérifiez que `UserService.updateUser()` appelle bien `userRepo.save(user)`

---

### Problème 5: RestTemplate null

**Cause:** RestTemplate n'est pas injecté

**Solution:** Vérifiez `AppConfig.java`:
```java
@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

---

## 📋 Checklist Finale

- [ ] User Service démarré (port 8081)
- [ ] Club Service démarré (port 8083)
- [ ] URL correcte: `http://localhost:8081/api/users`
- [ ] RestTemplate configuré dans AppConfig
- [ ] Endpoint `PUT /{userId}/role` existe dans UserController
- [ ] Logs ajoutés dans ClubService.assignToSubGroup()
- [ ] Logs ajoutés dans UserController.updateUserRole()
- [ ] Logs ajoutés dans UserService.updateUser()
- [ ] Test manuel avec curl fonctionne
- [ ] Assignation via interface génère les logs
- [ ] MongoDB mis à jour après assignation

---

## 🎯 Commande de Test Rapide

```bash
# Test direct de l'endpoint
curl -X PUT http://localhost:8081/api/users/VOTRE_USER_ID/role \
  -H "Content-Type: application/json" \
  -d '{"role":"Responsable media"}'

# Vérifier dans MongoDB
mongo clubhub --eval 'db.users.findOne({ _id: "VOTRE_USER_ID" })'
```

Si cette commande fonctionne, le problème est dans l'appel REST du Club Service.
Si elle ne fonctionne pas, le problème est dans le UserController ou UserService.

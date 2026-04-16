# Instructions Finales - Responsable de Comité

## 🎯 Situation Actuelle

Vous avez DEUX projets Spring Boot:
1. **Service User** (port 8081) - Dans `Club-Hub-Voice-Channel-Management/User/ClubHub/`
2. **Service Club** (port 8083) - Dans `ClubHub/`

J'ai modifié le **Service Club** pour qu'il communique avec le **Service User** via REST API (architecture microservices).

## ⚠️ Problème Actuel

Le port 8081 est déjà utilisé par une instance du Service User qui tourne.

## 🔧 Solution: Redémarrer les Services

### Étape 1: Arrêter Tous les Services

1. Ouvrez le Gestionnaire des tâches (Ctrl+Shift+Esc)
2. Cherchez les processus "java.exe" ou "javaw.exe"
3. Arrêtez-les tous

OU utilisez PowerShell:
```powershell
# Trouver les processus Java
Get-Process java* | Stop-Process -Force
```

### Étape 2: Démarrer le Service User (Port 8081)

```powershell
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw spring-boot:run
```

**Attendez** que vous voyiez:
```
Started ClubHubApplication in X seconds
```

### Étape 3: Démarrer le Service Club (Port 8083)

Ouvrez un NOUVEAU terminal PowerShell:
```powershell
cd ClubHub
./mvnw spring-boot:run
```

**Attendez** que vous voyiez:
```
Started ClubServiceApplication in X seconds
```

### Étape 4: Démarrer le Gateway (Port 8084)

Ouvrez un NOUVEAU terminal PowerShell:
```powershell
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw spring-boot:run
```

### Étape 5: Démarrer le Frontend (Port 4200)

Ouvrez un NOUVEAU terminal PowerShell:
```powershell
cd Front
ng serve
```

## 📋 Modifications Effectuées

### 1. Service Club (`ClubHub/src/main/java/esprit/com/clubhub/service/ClubService.java`)

✅ Utilise maintenant REST API pour communiquer avec le Service User:

```java
// Quand on assigne comme RESPONSABLE
String url = userServiceUrl + "/" + userId + "/role";
Map<String, String> roleUpdate = new HashMap<>();
roleUpdate.put("role", "Responsable " + subGroup.getName());
restTemplate.exchange(url, HttpMethod.PUT, ...);
```

### 2. Service User (Déjà Modifié)

✅ `PermissionService.java` détecte les responsables de comité:
```java
if (user.getRole() != null && user.getRole().startsWith("Responsable ")) {
    permissions.addAll(getCommitteeResponsablePermissions());
}
```

✅ Permissions spéciales pour responsables:
- ADD_MEMBERS
- DELETE_MEMBERS
- ASSIGN_TO_SUBGROUPS
- EDIT_SUBGROUPS
- DELETE_SUBGROUPS

### 3. Endpoint Manquant dans UserController

⚠️ **IL FAUT AJOUTER** un endpoint dans le Service User pour mettre à jour le rôle:

**Fichier**: `Club-Hub-Voice-Channel-Management/User/ClubHub/src/main/java/esprit/com/clubhub/controller/UserController.java`

Ajoutez cette méthode:

```java
@PutMapping("/{userId}/role")
public ResponseEntity<User> updateUserRole(
    @PathVariable String userId,
    @RequestBody Map<String, String> roleUpdate) {
    
    try {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        String newRole = roleUpdate.get("role");
        System.out.println("🔄 Mise à jour du rôle: " + user.getRole() + " → " + newRole);
        
        user.setRole(newRole);
        User savedUser = userRepo.save(user);
        
        System.out.println("✅ Rôle mis à jour dans User service");
        return ResponseEntity.ok(savedUser);
    } catch (Exception e) {
        System.err.println("❌ Erreur: " + e.getMessage());
        return ResponseEntity.badRequest().build();
    }
}
```

## 🧪 Test Complet

### 1. Assigner un Membre comme Responsable

1. Connectez-vous en tant que PRESIDENT
2. Allez sur la page du club
3. Cliquez "Assigner un membre à un comité"
4. Sélectionnez:
   - Un membre
   - Un comité (ex: "Marketing")
   - **Rôle: Responsable**
5. Cliquez "Assigner"

### 2. Vérifier les Logs

**Dans le terminal du Service Club (port 8083):**
```
=== ASSIGN TO SUBGROUP SERVICE ===
SubGroupRole: RESPONSABLE
📋 Sous-groupe trouvé: Marketing
👤 Membre trouvé: Ahmed (rôle actuel: MEMBRE_SIMPLE)
📝 Rôle initial sauvegardé: MEMBRE_SIMPLE
✅ Membre assigné avec rôle comité: RESPONSABLE
🔍 Appel du service User pour mettre à jour le rôle...
✅ Rôle mis à jour dans le service User: Responsable Marketing
📡 Réponse: 200 OK
```

**Dans le terminal du Service User (port 8081):**
```
🔄 Mise à jour du rôle: MEMBRE_SIMPLE → Responsable Marketing
✅ Rôle mis à jour dans User service
```

### 3. Vérifier dans MongoDB

```javascript
// Collection users
db.users.findOne({ email: "ahmed@test.com" })
// Doit avoir: role: "Responsable Marketing"

// Collection clubs
db.clubs.findOne({ name: "Mon Club" })
// Dans members, vérifier:
// - initialRole: "MEMBRE_SIMPLE"
// - subGroupRole: "RESPONSABLE"
```

### 4. Tester les Permissions

1. Déconnectez-vous
2. Reconnectez-vous avec le compte d'Ahmed
3. Allez sur la page du club
4. Vérifiez dans la console:
   ```
   ✅ Permissions chargées: Array(12)
   ```
5. Vérifiez que les boutons apparaissent pour gérer SON comité

## ❌ Si Ça Ne Marche Pas

### Erreur: "Port 8081 already in use"
→ Arrêtez tous les processus Java et redémarrez

### Erreur: "Connection refused" dans les logs du Service Club
→ Le Service User n'est pas démarré ou ne tourne pas sur le port 8081

### Erreur: 404 Not Found pour PUT /users/{userId}/role
→ L'endpoint n'existe pas encore dans UserController, ajoutez-le (voir ci-dessus)

### Les permissions ne s'appliquent pas
→ Vérifiez que le rôle dans MongoDB est bien "Responsable [Comité]"
→ Vérifiez les logs du Service User pour voir si les permissions sont chargées

## 📞 Prochaines Étapes

1. ✅ Arrêter tous les services
2. ✅ Ajouter l'endpoint `PUT /users/{userId}/role` dans UserController
3. ✅ Redémarrer tous les services dans l'ordre (User → Club → Gateway → Frontend)
4. ✅ Tester l'assignation d'un responsable
5. ✅ Vérifier les logs et la base de données
6. ✅ Tester les permissions

## 🎉 Résultat Final Attendu

- ✅ Rôle mis à jour dans la base de données User
- ✅ Permissions appliquées automatiquement
- ✅ Responsable peut gérer SON comité uniquement
- ✅ Rôle restauré automatiquement quand retiré du comité
- ✅ Architecture microservices respectée (communication via REST API)

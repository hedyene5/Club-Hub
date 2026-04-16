# 🚀 Guide de Démarrage des Services

## ⚠️ IMPORTANT: Ordre de Démarrage

Les services doivent être démarrés dans cet ordre précis:

1. **Service User** (port 8081)
2. **Service Club** (port 8083)
3. **Gateway** (port 8084)
4. **Frontend** (port 4200)

---

## 📋 Étape 0: Arrêter Tous les Services Java

Avant de commencer, arrêtez tous les processus Java en cours:

```powershell
# Trouver et arrêter tous les processus Java
Get-Process java* | Stop-Process -Force
```

OU utilisez le Gestionnaire des tâches (Ctrl+Shift+Esc) et arrêtez tous les processus "java.exe".

---

## 1️⃣ Service User (Port 8081)

**Terminal 1:**
```powershell
cd Club-Hub-Voice-Channel-Management/User/ClubHub
./mvnw clean spring-boot:run
```

**Attendez ce message:**
```
Started ClubHubApplication in X.XXX seconds
```

---

## 2️⃣ Service Club (Port 8083)

**Terminal 2 (NOUVEAU terminal):**
```powershell
cd ClubHub
./mvnw clean spring-boot:run
```

**Attendez ce message:**
```
Started ClubServiceApplication in X.XXX seconds
```

---

## 3️⃣ Gateway (Port 8084)

**Terminal 3 (NOUVEAU terminal):**
```powershell
cd Club-Hub-Voice-Channel-Management/Gateway/Gateway
./mvnw clean spring-boot:run
```

**Attendez ce message:**
```
Started GatewayApplication in X.XXX seconds
```

---

## 4️⃣ Frontend Angular (Port 4200)

**Terminal 4 (NOUVEAU terminal):**
```powershell
cd Front
ng serve
```

**Attendez ce message:**
```
✔ Compiled successfully.
```

---

## ✅ Vérification

Une fois tous les services démarrés:

1. Ouvrez votre navigateur: http://localhost:4200
2. Connectez-vous en tant que PRESIDENT
3. Testez l'assignation d'un responsable de comité

---

## 🧪 Test du Responsable de Comité

### 1. Assigner un Membre comme Responsable

1. Connectez-vous en tant que **PRESIDENT**
2. Allez sur la page du club
3. Cliquez sur **"Assigner un membre à un comité"**
4. Sélectionnez:
   - Un membre (ex: Ahmed)
   - Un comité (ex: "Marketing")
   - **Rôle dans le comité: Responsable**
5. Cliquez **"Assigner"**

### 2. Vérifier les Logs

**Terminal du Service Club (port 8083):**
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

**Terminal du Service User (port 8081):**
```
🔄 Mise à jour du rôle: MEMBRE_SIMPLE → Responsable Marketing
✅ Rôle mis à jour dans User service
```

### 3. Tester les Permissions

1. **Déconnectez-vous**
2. **Reconnectez-vous** avec le compte d'Ahmed
3. Allez sur la page du club
4. Vérifiez que vous voyez les boutons pour gérer **UNIQUEMENT** le comité Marketing
5. Vérifiez dans la console du navigateur (F12):
   ```
   ✅ Responsable de comité détecté: Responsable Marketing
   📋 Permissions responsable de comité: Array(12)
   ```

---

## ❌ Dépannage

### Erreur: "Port 8081 already in use"
→ Un service User tourne déjà. Arrêtez tous les processus Java (voir Étape 0)

### Erreur: "Connection refused" dans les logs du Service Club
→ Le Service User n'est pas démarré ou ne tourne pas sur le port 8081

### Les permissions ne s'appliquent pas
→ Vérifiez que le rôle dans MongoDB est bien "Responsable [Nom du Comité]"
→ Vérifiez les logs du Service User pour voir si les permissions sont chargées

### Erreur de compilation
→ Exécutez `./mvnw clean` avant `./mvnw spring-boot:run`

---

## 📊 Architecture

```
Frontend (4200)
    ↓
Gateway (8084)
    ↓
    ├─→ Service User (8081)  [Gestion utilisateurs + permissions]
    └─→ Service Club (8083)  [Gestion clubs + comités]
            ↓
        REST API → Service User (8081)  [Mise à jour des rôles]
```

---

## 🎯 Fonctionnalités Implémentées

✅ Assignation d'un membre comme **Responsable de Comité**
✅ Changement automatique du rôle: `MEMBRE_SIMPLE` → `Responsable [Comité]`
✅ Sauvegarde du rôle initial dans `initialRole`
✅ Permissions spéciales pour le responsable:
   - ADD_MEMBERS (dans son comité)
   - DELETE_MEMBERS (dans son comité)
   - ASSIGN_TO_SUBGROUPS (dans son comité)
   - EDIT_SUBGROUPS (son comité)
   - DELETE_SUBGROUPS (son comité)
✅ Restauration automatique du rôle initial quand retiré du comité
✅ Communication entre services via REST API
✅ Validation: responsable ne peut gérer QUE son comité
✅ Validation: responsable ne peut pas créer d'autres responsables

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez que tous les services sont démarrés dans le bon ordre
2. Vérifiez les logs de chaque service
3. Vérifiez que MongoDB est en cours d'exécution
4. Vérifiez les ports (8081, 8083, 8084, 4200) ne sont pas utilisés par d'autres applications

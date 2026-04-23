# 🔧 Dépannage - Erreur 500 Backend Spring Boot

## Problème
Le service Python répond correctement sur `http://localhost:5000/health`, mais le backend Spring Boot (port 8085) retourne une erreur 500.

## Cause probable
Le backend Spring Boot n'arrive pas à communiquer avec le service Python.

## Solution appliquée

### 1. Correction des endpoints Python
Le service Python a été mis à jour pour correspondre aux attentes du backend :

**Avant :**
- Endpoint : `/generate`
- Format de réponse : `{success, motivationLetter, skills, local, ai_model}`

**Après :**
- Endpoint : `/generate/motivation-letter` ✅
- Endpoint : `/generate/program` ✅
- Format de réponse : `{motivationLetter, program, skills, generatedAt}` ✅

### 2. Redémarrage nécessaire
Après la modification du fichier `AI-Service/app.py`, vous devez redémarrer le service Python.

## Étapes de résolution

### Étape 1 : Arrêter le service Python actuel
Dans la fenêtre PowerShell où tourne Python, appuyez sur `Ctrl+C`

### Étape 2 : Redémarrer le service Python
```powershell
cd AI-Service
.\start-service.ps1
```

### Étape 3 : Tester le service Python
```powershell
cd AI-Service
.\test-endpoints.ps1
```

Résultat attendu :
```
✅ Health check OK
✅ Génération OK
```

### Étape 4 : Tester le backend Spring Boot
```powershell
cd AI-Service-Backend
.\test-backend.ps1
```

Résultat attendu :
```
✅ Health check OK
✅ Génération OK
```

### Étape 5 : Tester dans l'application
1. Ouvrez http://192.168.1.20:4200
2. Allez dans une élection
3. Cliquez sur "Postuler"
4. Remplissez "Parlez-nous de vous"
5. Cliquez sur "🤖 Générer avec IA"

## Tests manuels

### Test Python direct
```powershell
# Health check
curl http://localhost:5000/health

# Génération
$body = @{
    candidateName = "Test"
    clubName = "Club"
    position = "Membre"
    userIdeas = "Je suis passionné par l'organisation"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/generate/motivation-letter" `
                  -Method Post `
                  -Body $body `
                  -ContentType "application/json"
```

### Test Backend Spring Boot
```powershell
# Health check
curl http://192.168.1.20:8085/api/ai/health

# Génération
$body = @{
    candidateName = "Test"
    clubName = "Club"
    position = "Membre"
    userIdeas = "Je suis passionné par l'organisation"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.20:8085/api/ai/generate/motivation-letter?userId=test&clubId=test" `
                  -Method Post `
                  -Body $body `
                  -ContentType "application/json"
```

## Vérifications supplémentaires

### 1. Vérifier que Python écoute sur 0.0.0.0
Dans `AI-Service/app.py`, la dernière ligne doit être :
```python
app.run(host='0.0.0.0', port=5000, debug=True)
```

### 2. Vérifier la configuration Spring Boot
Dans `AI-Service-Backend/src/main/resources/application.properties` :
```properties
ai.service.python.url=http://localhost:5000
```

### 3. Vérifier les logs Spring Boot
Regardez la console où tourne Spring Boot pour voir les erreurs détaillées.

Erreurs courantes :
- `Connection refused` → Python n'est pas démarré
- `404 Not Found` → Endpoint incorrect (corrigé maintenant)
- `Timeout` → Python est trop lent ou bloqué

## Architecture de communication

```
Frontend (4200)
    ↓ POST /api/ai/generate/motivation-letter
Backend Spring Boot (8085)
    ↓ POST /generate/motivation-letter
Service Python (5000)
    ↓ Génère le contenu
    ↓ Retourne JSON
Backend Spring Boot (8085)
    ↓ Sauvegarde dans MongoDB
    ↓ Retourne au frontend
Frontend (4200)
    ↓ Remplit les champs
```

## Fichiers modifiés

- ✅ `AI-Service/app.py` - Endpoints corrigés
- ✅ `AI-Service/test-endpoints.ps1` - Nouveau script de test
- ✅ `AI-Service-Backend/test-backend.ps1` - Nouveau script de test

## Si le problème persiste

### 1. Vérifier les ports
```powershell
# Python doit être sur 5000
netstat -ano | findstr :5000

# Spring Boot doit être sur 8085
netstat -ano | findstr :8085
```

### 2. Vérifier les logs Python
Regardez la console Python pour voir si les requêtes arrivent :
```
INFO:werkzeug:127.0.0.1 - - [date] "POST /generate/motivation-letter HTTP/1.1" 200 -
```

### 3. Vérifier les logs Spring Boot
Regardez la console Spring Boot pour voir les erreurs :
```
ERROR: Failed to connect to Python service
```

### 4. Tester avec curl
```bash
# Test Python
curl -X POST http://localhost:5000/generate/motivation-letter \
  -H "Content-Type: application/json" \
  -d '{"candidateName":"Test","clubName":"Club","position":"Membre","userIdeas":"test"}'

# Test Spring Boot
curl -X POST http://192.168.1.20:8085/api/ai/generate/motivation-letter?userId=test&clubId=test \
  -H "Content-Type: application/json" \
  -d '{"candidateName":"Test","clubName":"Club","position":"Membre","userIdeas":"test"}'
```

## Résumé

1. ✅ Arrêter Python (Ctrl+C)
2. ✅ Redémarrer Python (`.\start-service.ps1`)
3. ✅ Tester Python (`.\test-endpoints.ps1`)
4. ✅ Tester Spring Boot (`.\test-backend.ps1`)
5. ✅ Tester dans l'application

Si tout fonctionne, vous devriez voir les champs se remplir automatiquement !

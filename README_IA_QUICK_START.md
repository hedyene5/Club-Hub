# 🚀 Quick Start - Service IA

## 🎯 Problème actuel
```
❌ Erreur 404 sur http://192.168.1.20:8084/api/ai/generate/motivation-letter
```

## ✅ Solution en 2 étapes

### Étape 1 : Démarrer le service Python
```powershell
cd AI-Service
.\start-service.ps1
```
Attendez : `✅ Service IA démarré sur http://localhost:5000`

### Étape 2 : Démarrer le backend Spring Boot
```powershell
cd AI-Service-Backend
.\start-backend.ps1
```
Attendez : `Started AiServiceApplication in X seconds`

## 🎉 C'est tout !

Maintenant testez dans votre application :
1. http://192.168.1.20:4200
2. Allez dans une élection
3. Cliquez sur "Postuler"
4. Remplissez "Parlez-nous de vous"
5. Cliquez sur "🤖 Générer avec IA"

## ⚠️ Si Maven n'est pas installé

Téléchargez et installez Maven :
- https://maven.apache.org/download.cgi
- Ajoutez au PATH : `C:\Program Files\Apache\maven\bin`
- Vérifiez : `mvn --version`

## 📚 Plus d'infos

- Guide complet : `DEMARRAGE_MANUEL_IA.md`
- Commandes rapides : `COMMANDES_RAPIDES_IA.txt`
- Test du service : `AI-Service\test-service.ps1`

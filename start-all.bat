@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              LANCEMENT DU PROJET CLUB HUB                     ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd Club-Hub-Voice-Channel-Management

echo [1/5] Vérification de MongoDB...
mongosh --eval "db.version()" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MongoDB n'est pas démarré!
    echo.
    echo    Pour démarrer MongoDB:
    echo    - Si service: net start MongoDB
    echo    - Si manuel: "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
    echo.
    pause
    exit /b 1
)
echo ✅ MongoDB est actif
echo.

echo [2/5] Démarrage du Gateway (Port 8084)...
start "Gateway - Port 8084" cmd /k "cd Gateway\Gateway && mvnw spring-boot:run"
timeout /t 5 >nul
echo ✅ Gateway en cours de démarrage...
echo.

echo [3/5] Démarrage du User Service (Port 8081)...
start "User Service - Port 8081" cmd /k "cd User\ClubHub && mvnw spring-boot:run"
timeout /t 5 >nul
echo ✅ User Service en cours de démarrage...
echo.

echo [4/5] Démarrage de l'InstantVoice Service (Port 8082)...
start "InstantVoice - Port 8082" cmd /k "cd Back\InstantVoiceManagment && mvnw spring-boot:run"
timeout /t 5 >nul
echo ✅ InstantVoice Service en cours de démarrage...
echo.

echo [5/5] Démarrage du Frontend Angular (Port 4200)...
start "Frontend Angular - Port 4200" cmd /k "cd User\Front && npm start"
echo ✅ Frontend en cours de démarrage...
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              ✅ TOUS LES SERVICES SONT EN COURS DE DÉMARRAGE  ║
echo ║                                                                ║
echo ║  ⏳ Attendez 30-60 secondes que tous les services démarrent   ║
echo ║                                                                ║
echo ║  📊 Vérifiez les fenêtres ouvertes pour voir les logs        ║
echo ║                                                                ║
echo ║  🌐 Puis ouvrez: http://localhost:4200                        ║
echo ║                                                                ║
echo ║  📋 Services:                                                 ║
echo ║     - Gateway:        http://localhost:8084                   ║
echo ║     - User Service:   http://localhost:8081                   ║
echo ║     - InstantVoice:   http://localhost:8082                   ║
echo ║     - Frontend:       http://localhost:4200                   ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause >nul

start http://localhost:4200

echo.
echo Pour arrêter tous les services, fermez toutes les fenêtres de terminal.
echo.
pause

@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║   CORRECTION DES PERMISSIONS - RÔLES PERSONNALISÉS            ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📋 PROBLÈME:
echo    Les rôles personnalisés existent dans MongoDB (custom_roles)
echo    mais les permissions ne sont PAS appliquées aux utilisateurs.
echo.
echo 🔧 SOLUTION:
echo    Redémarrer le User Service pour charger le nouveau code.
echo.
echo ⚠️  IMPORTANT:
echo    Vous devez d'abord ARRÊTER le User Service en cours!
echo    Allez dans le terminal du User Service et appuyez sur Ctrl+C
echo.
echo Avez-vous arrêté le User Service? (Ctrl+C dans son terminal)
pause

echo.
echo ════════════════════════════════════════════════════════════════
echo   ÉTAPE 1: Vérification des fichiers
echo ════════════════════════════════════════════════════════════════
echo.

cd Club-Hub-Voice-Channel-Management\User\ClubHub

if exist "src\main\java\esprit\com\clubhub\service\PermissionService.java" (
    echo ✅ PermissionService.java existe
) else (
    echo ❌ ERREUR: PermissionService.java manquant!
    pause
    exit /b 1
)

if exist "src\main\java\esprit\com\clubhub\controller\PermissionController.java" (
    echo ✅ PermissionController.java existe
) else (
    echo ❌ ERREUR: PermissionController.java manquant!
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════════
echo   ÉTAPE 2: Nettoyage et recompilation
echo ════════════════════════════════════════════════════════════════
echo.
echo Cela peut prendre 30-60 secondes...
echo.

call mvnw.cmd clean compile

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERREUR lors de la compilation!
    pause
    exit /b 1
)

echo.
echo ✅ Compilation réussie!
echo.

echo ════════════════════════════════════════════════════════════════
echo   ÉTAPE 3: Démarrage du User Service
echo ════════════════════════════════════════════════════════════════
echo.
echo Le service va démarrer...
echo.
echo 🔍 VÉRIFIEZ CES MESSAGES:
echo    - "Started ClubHubApplication in X.XXX seconds"
echo    - "Tomcat started on port 8081"
echo.
echo Si vous voyez ces messages, le service est prêt!
echo.
echo ════════════════════════════════════════════════════════════════
echo.

call mvnw.cmd spring-boot:run

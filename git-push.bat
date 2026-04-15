@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              SCRIPT DE PUSH GIT AUTOMATIQUE                   ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd Club-Hub-Voice-Channel-Management

echo [1/5] Vérification de l'état Git...
git status
echo.

echo [2/5] Ajout de tous les fichiers modifiés...
git add .
echo.

echo [3/5] Entrez votre message de commit:
set /p COMMIT_MSG="Message: "
echo.

if "%COMMIT_MSG%"=="" (
    echo ❌ Message de commit vide! Utilisation d'un message par défaut...
    set COMMIT_MSG=Update: Modifications du système de permissions
)

echo [4/5] Création du commit...
git commit -m "%COMMIT_MSG%"
echo.

echo [5/5] Push vers le repository distant...
git push
echo.

if %ERRORLEVEL% EQU 0 (
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                                                                ║
    echo ║                  ✅ PUSH RÉUSSI!                              ║
    echo ║                                                                ║
    echo ╚════════════════════════════════════════════════════════════════╝
) else (
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                                                                ║
    echo ║                  ❌ ERREUR LORS DU PUSH                       ║
    echo ║                                                                ║
    echo ║  Consultez le fichier GUIDE_GIT_PUSH.md pour résoudre        ║
    echo ║  les problèmes courants.                                      ║
    echo ║                                                                ║
    echo ╚════════════════════════════════════════════════════════════════╝
)

echo.
pause

@echo off
echo ========================================
echo   RECOMPILATION DU USER SERVICE
echo ========================================
echo.
echo Ce script va:
echo 1. Nettoyer les anciens fichiers compiles
echo 2. Recompiler TOUS les fichiers Java
echo 3. Demarrer le User Service
echo.
echo IMPORTANT: Fermez d'abord le User Service en cours (Ctrl+C)
echo.
pause

cd Club-Hub-Voice-Channel-Management\User\ClubHub

echo.
echo [1/3] Nettoyage des fichiers compiles...
call mvnw.cmd clean

echo.
echo [2/3] Compilation de tous les fichiers Java...
call mvnw.cmd compile

echo.
echo [3/3] Demarrage du User Service...
echo.
echo ========================================
echo   VERIFIEZ CES MESSAGES:
echo ========================================
echo - "Started ClubHubApplication in X.XXX seconds"
echo - Port 8081 doit etre actif
echo.
echo Si vous voyez ces messages, le service est pret!
echo.

call mvnw.cmd spring-boot:run

@echo off
echo ========================================
echo   DIAGNOSTIC SYSTEME PERMISSIONS
echo ========================================
echo.

cd Club-Hub-Voice-Channel-Management\User\ClubHub

echo [1] Verification des fichiers sources...
echo.

if exist "src\main\java\esprit\com\clubhub\service\PermissionService.java" (
    echo [OK] PermissionService.java existe
) else (
    echo [ERREUR] PermissionService.java MANQUANT!
)

if exist "src\main\java\esprit\com\clubhub\controller\PermissionController.java" (
    echo [OK] PermissionController.java existe
) else (
    echo [ERREUR] PermissionController.java MANQUANT!
)

echo.
echo [2] Verification des fichiers compiles...
echo.

if exist "target\classes\esprit\com\clubhub\service\PermissionService.class" (
    echo [OK] PermissionService.class compile
) else (
    echo [ERREUR] PermissionService.class NON COMPILE!
    echo         Solution: Executez RECOMPILER_USER_SERVICE.bat
)

if exist "target\classes\esprit\com\clubhub\controller\PermissionController.class" (
    echo [OK] PermissionController.class compile
) else (
    echo [ERREUR] PermissionController.class NON COMPILE!
    echo         Solution: Executez RECOMPILER_USER_SERVICE.bat
)

echo.
echo [3] Verification de la structure...
echo.

dir /b src\main\java\esprit\com\clubhub\service\*.java | find /c ".java" > temp.txt
set /p SERVICE_COUNT=<temp.txt
del temp.txt
echo Services Java trouves: %SERVICE_COUNT%

dir /b src\main\java\esprit\com\clubhub\controller\*.java | find /c ".java" > temp.txt
set /p CONTROLLER_COUNT=<temp.txt
del temp.txt
echo Controllers Java trouves: %CONTROLLER_COUNT%

echo.
echo ========================================
echo   RESUME
echo ========================================
echo.
echo Si vous voyez des [ERREUR] ci-dessus:
echo 1. Arretez le User Service (Ctrl+C)
echo 2. Executez: RECOMPILER_USER_SERVICE.bat
echo.
echo Si tout est [OK]:
echo - Le User Service doit etre redemarre
echo - Les permissions devraient fonctionner
echo.
pause

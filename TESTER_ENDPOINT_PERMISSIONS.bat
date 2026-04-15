@echo off
echo ========================================
echo   TEST ENDPOINT PERMISSIONS
echo ========================================
echo.
echo Ce script va tester si l'endpoint /api/permissions
echo est accessible apres recompilation.
echo.
echo IMPORTANT: Le User Service doit etre en cours d'execution!
echo.
pause

echo.
echo Test de l'endpoint...
echo.

curl -X GET http://localhost:8081/api/permissions/user/test123 -v

echo.
echo.
echo ========================================
echo   INTERPRETATION DES RESULTATS
echo ========================================
echo.
echo Si vous voyez:
echo   - "HTTP/1.1 200 OK" ou un JSON
echo     → ✅ L'endpoint fonctionne!
echo.
echo   - "HTTP/1.1 404 Not Found"
echo     → ❌ L'endpoint n'existe pas
echo     → Solution: Recompilez avec RECOMPILER_USER_SERVICE.bat
echo.
echo   - "Failed to connect" ou "Connection refused"
echo     → ❌ Le User Service n'est pas demarre
echo     → Solution: Demarrez le User Service
echo.
pause

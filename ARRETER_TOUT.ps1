# Script pour arrêter tous les services IA

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║            ARRÊT DES SERVICES IA                           ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red

Write-Host "`nRecherche des processus..." -ForegroundColor Yellow

# Arrêter le service Python (port 5000)
Write-Host "`n[1/2] Arrêt du service Python..." -ForegroundColor Yellow
$pythonProcesses = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($pythonProcesses) {
    foreach ($pid in $pythonProcesses) {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "      ✅ Service Python arrêté (PID: $pid)" -ForegroundColor Green
        } catch {
            Write-Host "      ⚠️  Impossible d'arrêter le processus $pid" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "      ℹ️  Aucun service Python en cours d'exécution" -ForegroundColor Gray
}

# Arrêter le backend Spring Boot (port 8084)
Write-Host "`n[2/2] Arrêt du backend Spring Boot..." -ForegroundColor Yellow
$springProcesses = Get-NetTCPConnection -LocalPort 8084 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($springProcesses) {
    foreach ($pid in $springProcesses) {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "      ✅ Backend Spring Boot arrêté (PID: $pid)" -ForegroundColor Green
        } catch {
            Write-Host "      ⚠️  Impossible d'arrêter le processus $pid" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "      ℹ️  Aucun backend Spring Boot en cours d'exécution" -ForegroundColor Gray
}

Write-Host "`n✅ Tous les services ont été arrêtés" -ForegroundColor Green
Write-Host "`nAppuyez sur une touche pour fermer..." -ForegroundColor White
pause

# Script de vérification des prérequis pour le Service IA

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      VÉRIFICATION DES PRÉREQUIS - SERVICE IA              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$allOk = $true

# Vérifier Python
Write-Host "`n[1/4] Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "      ✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Python n'est pas installé" -ForegroundColor Red
    Write-Host "      → https://www.python.org/downloads/" -ForegroundColor Gray
    $allOk = $false
}

# Vérifier Java
Write-Host "`n[2/4] Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "      ✅ $javaVersion" -ForegroundColor Green
    
    # Vérifier la version
    if ($javaVersion -match "version `"(\d+)") {
        $version = [int]$matches[1]
        if ($version -lt 17) {
            Write-Host "      ⚠️  Java 17+ recommandé (vous avez Java $version)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "      ❌ Java n'est pas installé" -ForegroundColor Red
    Write-Host "      → https://adoptium.net/" -ForegroundColor Gray
    $allOk = $false
}

# Vérifier Maven
Write-Host "`n[3/4] Maven..." -ForegroundColor Yellow
try {
    $mvnVersion = mvn --version 2>&1 | Select-Object -First 1
    Write-Host "      ✅ $mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Maven n'est pas installé" -ForegroundColor Red
    Write-Host "      → https://maven.apache.org/download.cgi" -ForegroundColor Gray
    Write-Host "      → Ajoutez au PATH : C:\Program Files\Apache\maven\bin" -ForegroundColor Gray
    $allOk = $false
}

# Vérifier MongoDB
Write-Host "`n[4/4] MongoDB..." -ForegroundColor Yellow
$mongoTest = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
if ($mongoTest.TcpTestSucceeded) {
    Write-Host "      ✅ MongoDB est démarré (port 27017)" -ForegroundColor Green
} else {
    Write-Host "      ⚠️  MongoDB n'est pas démarré" -ForegroundColor Yellow
    Write-Host "      Le service IA fonctionnera mais ne sauvegardera pas l'historique" -ForegroundColor Gray
}

# Résumé
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($allOk) {
    Write-Host "║                  ✅ TOUT EST PRÊT !                        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host "`nVous pouvez démarrer les services :" -ForegroundColor White
    Write-Host "  .\DEMARRER_TOUT.ps1" -ForegroundColor Gray
    Write-Host "`nOu manuellement :" -ForegroundColor White
    Write-Host "  1. cd AI-Service ; .\start-service.ps1" -ForegroundColor Gray
    Write-Host "  2. cd AI-Service-Backend ; .\start-backend.ps1" -ForegroundColor Gray
} else {
    Write-Host "║              ⚠️  PRÉREQUIS MANQUANTS                      ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host "`nInstallez les outils manquants (marqués ❌ ci-dessus)" -ForegroundColor Yellow
}

Write-Host "`nAppuyez sur une touche pour fermer..." -ForegroundColor White
pause

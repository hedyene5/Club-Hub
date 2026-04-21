# Script pour activer Gmail facilement

Write-Host "📧 Activation de Gmail pour ClubHub" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que credentials.json existe
if (-not (Test-Path "credentials.json")) {
    Write-Host "❌ ERREUR: credentials.json non trouvé" -ForegroundColor Red
    Write-Host ""
    Write-Host "Le fichier credentials.json doit être dans:" -ForegroundColor Yellow
    Write-Host "  $(Get-Location)\credentials.json" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Fichier credentials.json trouvé" -ForegroundColor Green
Write-Host ""

# Vérifier l'email configuré
$appProps = Get-Content "src\main\resources\application.properties" | Select-String "gmail.user.email"
if ($appProps -match "gmail.user.email=(.+)") {
    $email = $matches[1]
    Write-Host "✅ Email configuré: $email" -ForegroundColor Green
} else {
    Write-Host "⚠️ Email non configuré dans application.properties" -ForegroundColor Yellow
}
Write-Host ""

# Vérifier si le port 9999 est libre
$portInUse = Get-NetTCPConnection -LocalPort 9999 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️ Le port 9999 est déjà utilisé" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Voulez-vous tuer le processus qui l'utilise ? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "O" -or $response -eq "o") {
        $pid = $portInUse.OwningProcess
        Stop-Process -Id $pid -Force
        Write-Host "✅ Processus arrêté" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "🚀 Démarrage de l'application..." -ForegroundColor Cyan
Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Attendez que l'URL d'autorisation s'affiche" -ForegroundColor White
Write-Host "2. Un navigateur devrait s'ouvrir automatiquement" -ForegroundColor White
Write-Host "3. Sélectionnez votre compte Gmail: $email" -ForegroundColor White
Write-Host "4. Cliquez sur 'Advanced' → 'Go to ClubHub (unsafe)'" -ForegroundColor White
Write-Host "5. Autorisez les permissions" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour démarrer..." -ForegroundColor Cyan
pause

# Démarrer l'application
./mvnw spring-boot:run

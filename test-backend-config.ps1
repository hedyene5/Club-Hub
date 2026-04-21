# Test rapide de la configuration backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST CONFIGURATION BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier si le backend est en cours d'execution
Write-Host "Verification du backend sur port 8083..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/api/clubs" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK Backend en cours d'execution (port 8083)" -ForegroundColor Green
} catch {
    Write-Host "ERREUR Backend non accessible sur port 8083" -ForegroundColor Red
    Write-Host "Demarrer le backend avec: cd ClubHub && ./mvnw spring-boot:run" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Verifier si le frontend est en cours d'execution
Write-Host "Verification du frontend sur port 4200..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK Frontend en cours d'execution (port 4200)" -ForegroundColor Green
} catch {
    Write-Host "ATTENTION Frontend non accessible sur port 4200" -ForegroundColor Yellow
    Write-Host "Demarrer le frontend avec: cd Front && npm start" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTRUCTIONS POUR TESTER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Creer une nouvelle election:" -ForegroundColor Yellow
Write-Host "   - Type: PRESENTIELLE (IN_PERSON)" -ForegroundColor White
Write-Host "   - Date debut: Maintenant + 2 minutes" -ForegroundColor White
Write-Host ""
Write-Host "2. Attendre 30-60 secondes" -ForegroundColor Yellow
Write-Host "   Le scheduler detectera J-1 automatiquement" -ForegroundColor White
Write-Host ""
Write-Host "3. Verifier les logs backend:" -ForegroundColor Yellow
Write-Host "   Chercher: 'Generation QR Code avec URL'" -ForegroundColor White
Write-Host "   URL doit etre: http://localhost:4200/elections/scan/..." -ForegroundColor White
Write-Host ""
Write-Host "4. Verifier l'email recu" -ForegroundColor Yellow
Write-Host "   Scanner le QR code avec un smartphone" -ForegroundColor White
Write-Host ""

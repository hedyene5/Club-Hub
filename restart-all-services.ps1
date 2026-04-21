Write-Host "========================================" -ForegroundColor Cyan
Write-Host "REDÉMARRAGE COMPLET DES SERVICES" -ForegroundColor Cyan
Write-Host "Nouvelle IP: 172.18.72.32" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérification préalable
Write-Host "1. Vérification de la configuration..." -ForegroundColor Yellow
& .\verify-new-ip.ps1

Write-Host ""
Write-Host "Voulez-vous continuer avec le redémarrage? (O/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -ne "O" -and $response -ne "o") {
    Write-Host "Annulé." -ForegroundColor Red
    exit
}

# 2. Nettoyer les QR tokens
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "2. Nettoyage des QR tokens..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
& .\clean-qr-tokens.ps1

# 3. Instructions pour Spring Boot
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "3. Redémarrage de Spring Boot" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Ouvrez un NOUVEAU terminal PowerShell et exécutez:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   cd ClubHub" -ForegroundColor White
Write-Host "   ./mvnw spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "Attendez le message:" -ForegroundColor Yellow
Write-Host "   'Started ClubHubApplication in X.XXX seconds'" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur Entrée quand Spring Boot est démarré..." -ForegroundColor Yellow
Read-Host

# 4. Instructions pour Angular
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "4. Redémarrage d'Angular" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Ouvrez un AUTRE terminal PowerShell et exécutez:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   cd Front" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "Attendez le message:" -ForegroundColor Yellow
Write-Host "   '✔ Compiled successfully.'" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur Entrée quand Angular est démarré..." -ForegroundColor Yellow
Read-Host

# 5. Vérification finale
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "5. Vérification finale..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 2

try {
    Write-Host "Test User Service (8081)..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "http://172.18.72.32:8081/api/auth/test" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ User Service OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ User Service non accessible" -ForegroundColor Red
}

try {
    Write-Host "Test Club Service (8083)..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "http://172.18.72.32:8083/api/clubs" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Club Service OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Club Service non accessible" -ForegroundColor Red
}

try {
    Write-Host "Test Angular (4200)..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "http://172.18.72.32:4200" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Angular OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Angular non accessible" -ForegroundColor Red
}

# 6. Instructions finales
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS À EFFECTUER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Depuis le PC:" -ForegroundColor Yellow
Write-Host "1. Ouvrir: http://172.18.72.32:4200" -ForegroundColor White
Write-Host "2. Se connecter avec un compte PRESIDENT" -ForegroundColor White
Write-Host "3. Vérifier que les clubs s'affichent" -ForegroundColor White
Write-Host ""

Write-Host "Depuis le Smartphone (même WiFi):" -ForegroundColor Yellow
Write-Host "1. Ouvrir: http://172.18.72.32:4200" -ForegroundColor White
Write-Host "2. Se connecter" -ForegroundColor White
Write-Host "3. Vérifier que tout fonctionne" -ForegroundColor White
Write-Host ""

Write-Host "Créer une nouvelle élection:" -ForegroundColor Yellow
Write-Host "1. Aller dans 'Élections'" -ForegroundColor White
Write-Host "2. Créer une élection PRÉSENTIELLE" -ForegroundColor White
Write-Host "3. Date: maintenant + 2 minutes" -ForegroundColor White
Write-Host "4. Attendre J-1 (30-60 secondes)" -ForegroundColor White
Write-Host "5. Vérifier les emails avec QR codes" -ForegroundColor White
Write-Host "6. Les QR codes doivent contenir: http://172.18.72.32:4200/elections/scan/{token}" -ForegroundColor White
Write-Host "7. Scanner avec le smartphone" -ForegroundColor White
Write-Host "8. Valider la présence" -ForegroundColor White
Write-Host "9. Voter" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ CONFIGURATION TERMINÉE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

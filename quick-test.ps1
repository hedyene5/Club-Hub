Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST RAPIDE - IP 172.18.72.32" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$newIP = "172.18.72.32"
$allOK = $true

# Test User Service
Write-Host "Test User Service (8081)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${newIP}:8081/api/auth/test" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ User Service OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ User Service ERREUR: $_" -ForegroundColor Red
    $allOK = $false
}

# Test Club Service
Write-Host "Test Club Service (8083)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${newIP}:8083/api/clubs" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Club Service OK (Status: $($response.StatusCode))" -ForegroundColor Green
    
    # Afficher le nombre de clubs
    $clubs = ($response.Content | ConvertFrom-Json)
    Write-Host "   📊 Nombre de clubs: $($clubs.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Club Service ERREUR: $_" -ForegroundColor Red
    $allOK = $false
}

# Test Angular
Write-Host "Test Angular (4200)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${newIP}:4200" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Angular OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Angular ERREUR: $_" -ForegroundColor Red
    $allOK = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allOK) {
    Write-Host "✅ TOUS LES SERVICES FONCTIONNENT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir http://172.18.72.32:4200 dans le navigateur" -ForegroundColor White
    Write-Host "2. Se connecter avec un compte" -ForegroundColor White
    Write-Host "3. Créer une nouvelle élection" -ForegroundColor White
    Write-Host "4. Tester les QR codes depuis le smartphone" -ForegroundColor White
} else {
    Write-Host "❌ CERTAINS SERVICES NE FONCTIONNENT PAS" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez que:" -ForegroundColor Yellow
    Write-Host "1. Spring Boot est démarré: cd ClubHub; ./mvnw spring-boot:run" -ForegroundColor White
    Write-Host "2. Angular est démarré: cd Front; npm start" -ForegroundColor White
    Write-Host "3. MongoDB est démarré: Get-Process mongod" -ForegroundColor White
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Script de diagnostic des APIs ClubHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC DES SERVICES CLUBHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Vérifier les ports
Write-Host "1. Vérification des ports..." -ForegroundColor Yellow
$ports = @(8081, 8083, 8084, 27017)
foreach ($port in $ports) {
    $result = netstat -ano | findstr ":$port"
    if ($result) {
        Write-Host "   ✅ Port $port est actif" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Port $port n'est PAS actif" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Tester le Gateway
Write-Host "2. Test du Gateway (8084)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8084/api/clubs/69e552077b71bc483eb89bf8" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Gateway fonctionne (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Gateway ne répond pas: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Lister les élections du club
Write-Host "3. Récupération des élections du club..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8084/api/elections/club/69e552077b71bc483eb89bf8" -Method GET -ErrorAction Stop
    $elections = $response.Content | ConvertFrom-Json
    
    if ($elections.Count -eq 0) {
        Write-Host "   ⚠️  Aucune élection trouvée pour ce club" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ $($elections.Count) élection(s) trouvée(s):" -ForegroundColor Green
        foreach ($election in $elections) {
            Write-Host "      - ID: $($election.id)" -ForegroundColor Cyan
            Write-Host "        Titre: $($election.title)" -ForegroundColor White
            Write-Host "        Status: $($election.status)" -ForegroundColor White
            Write-Host ""
        }
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Tester le service User directement
Write-Host "4. Test du User Service (8081)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/users" -Method GET -ErrorAction Stop
    Write-Host "   ✅ User Service fonctionne (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ User Service ne répond pas: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Tester le service Club directement
Write-Host "5. Test du Club Service (8083)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/api/clubs/69e552077b71bc483eb89bf8" -Method GET -ErrorAction Stop
    $club = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Club Service fonctionne" -ForegroundColor Green
    Write-Host "      Club: $($club.name)" -ForegroundColor Cyan
    Write-Host "      Membres: $($club.members.Count)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Club Service ne répond pas: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC TERMINÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

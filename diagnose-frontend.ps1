# Script de diagnostic du frontend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier environment.ts
Write-Host "1. Verification de environment.ts..." -ForegroundColor Yellow
$envFile = "Front/src/environments/environment.ts"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    Write-Host "Contenu:" -ForegroundColor White
    Write-Host $content -ForegroundColor Gray
    
    if ($content -match "apiUrl:\s*'([^']+)'") {
        $apiUrl = $matches[1]
        Write-Host ""
        Write-Host "API URL detectee: $apiUrl" -ForegroundColor Green
        
        if ($apiUrl -match "192\.168\.1\.20") {
            Write-Host "OK IP WiFi correcte" -ForegroundColor Green
        } else {
            Write-Host "ATTENTION IP incorrecte" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "ERREUR Fichier non trouve" -ForegroundColor Red
}
Write-Host ""

# 2. Verifier auth.service.ts
Write-Host "2. Verification de auth.service.ts..." -ForegroundColor Yellow
$authService = "Front/src/app/services/auth.service.ts"
if (Test-Path $authService) {
    $content = Get-Content $authService -Raw
    if ($content -match "import.*environment") {
        Write-Host "OK Import environment present" -ForegroundColor Green
    } else {
        Write-Host "ERREUR Import environment manquant" -ForegroundColor Red
    }
    
    if ($content -match "environment\.apiUrl") {
        Write-Host "OK Utilise environment.apiUrl" -ForegroundColor Green
    } else {
        Write-Host "ATTENTION N'utilise pas environment.apiUrl" -ForegroundColor Yellow
    }
}
Write-Host ""

# 3. Verifier si Angular tourne
Write-Host "3. Verification du serveur Angular..." -ForegroundColor Yellow
$angularRunning = Test-NetConnection -ComputerName 192.168.1.20 -Port 4200 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($angularRunning) {
    Write-Host "OK Angular tourne sur 192.168.1.20:4200" -ForegroundColor Green
} else {
    Write-Host "ERREUR Angular ne tourne pas" -ForegroundColor Red
    Write-Host "Demarrer avec: cd Front && npm start" -ForegroundColor Yellow
}
Write-Host ""

# 4. Verifier si le backend tourne
Write-Host "4. Verification du backend..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName 192.168.1.20 -Port 8083 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($backendRunning) {
    Write-Host "OK Backend tourne sur 192.168.1.20:8083" -ForegroundColor Green
} else {
    Write-Host "ERREUR Backend ne tourne pas" -ForegroundColor Red
}
Write-Host ""

# 5. Tester l'API
Write-Host "5. Test de l'API backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.1.20:8083/api/clubs" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "OK API accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "OK API accessible (401 = auth requise)" -ForegroundColor Green
    } else {
        Write-Host "ERREUR API non accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RECOMMANDATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $angularRunning) {
    Write-Host "ACTION REQUISE: Demarrer Angular" -ForegroundColor Yellow
    Write-Host "  cd Front" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
}

if ($angularRunning) {
    Write-Host "ACTION REQUISE: Redemarrer Angular pour appliquer les changements" -ForegroundColor Yellow
    Write-Host "  1. Arreter Angular (Ctrl+C dans son terminal)" -ForegroundColor White
    Write-Host "  2. cd Front" -ForegroundColor White
    Write-Host "  3. npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT: Les changements dans environment.ts ne sont appliques qu'au redemarrage!" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Apres redemarrage, tester:" -ForegroundColor Yellow
Write-Host "  http://192.168.1.20:4200" -ForegroundColor White
Write-Host ""

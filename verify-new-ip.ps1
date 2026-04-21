Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VÉRIFICATION NOUVELLE IP: 172.18.72.32" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$newIP = "172.18.72.32"
$errors = @()
$warnings = @()

# 1. Vérifier l'IP du PC
Write-Host "1. Vérification de l'IP du PC..." -ForegroundColor Yellow
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "172.18.*" }).IPAddress

if ($currentIP -eq $newIP) {
    Write-Host "   ✅ IP correcte: $currentIP" -ForegroundColor Green
} elseif ($currentIP) {
    Write-Host "   ⚠️  IP trouvée: $currentIP (attendue: $newIP)" -ForegroundColor Yellow
    $warnings += "IP du PC différente de celle configurée"
} else {
    Write-Host "   ❌ Aucune IP 172.18.x.x trouvée" -ForegroundColor Red
    $errors += "PC pas sur le réseau WiFi 172.18.x.x"
}

# 2. Vérifier environment.ts
Write-Host ""
Write-Host "2. Vérification de environment.ts..." -ForegroundColor Yellow
$envFile = "Front/src/environments/environment.ts"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "172\.18\.72\.32") {
        Write-Host "   ✅ environment.ts contient la nouvelle IP" -ForegroundColor Green
    } else {
        Write-Host "   ❌ environment.ts ne contient pas la nouvelle IP" -ForegroundColor Red
        $errors += "environment.ts pas à jour"
    }
    
    if ($envContent -match "192\.168") {
        Write-Host "   ⚠️  Ancienne IP trouvée dans environment.ts" -ForegroundColor Yellow
        $warnings += "Ancienne IP dans environment.ts"
    }
} else {
    Write-Host "   ❌ Fichier environment.ts introuvable" -ForegroundColor Red
    $errors += "environment.ts introuvable"
}

# 3. Vérifier application.properties
Write-Host ""
Write-Host "3. Vérification de application.properties..." -ForegroundColor Yellow
$propsFile = "ClubHub/src/main/resources/application.properties"
if (Test-Path $propsFile) {
    $propsContent = Get-Content $propsFile -Raw
    if ($propsContent -match "server\.address=172\.18\.72\.32") {
        Write-Host "   ✅ server.address correcte" -ForegroundColor Green
    } else {
        Write-Host "   ❌ server.address pas à jour" -ForegroundColor Red
        $errors += "server.address pas à jour"
    }
    
    if ($propsContent -match "app\.frontend\.url=http://172\.18\.72\.32:4200") {
        Write-Host "   ✅ app.frontend.url correcte" -ForegroundColor Green
    } else {
        Write-Host "   ❌ app.frontend.url pas à jour" -ForegroundColor Red
        $errors += "app.frontend.url pas à jour"
    }
    
    if ($propsContent -match "192\.168") {
        Write-Host "   ⚠️  Ancienne IP trouvée dans application.properties" -ForegroundColor Yellow
        $warnings += "Ancienne IP dans application.properties"
    }
} else {
    Write-Host "   ❌ Fichier application.properties introuvable" -ForegroundColor Red
    $errors += "application.properties introuvable"
}

# 4. Vérifier les services Angular
Write-Host ""
Write-Host "4. Vérification des services Angular..." -ForegroundColor Yellow
$serviceFiles = @(
    "Front/src/app/services/club.service.ts",
    "Front/src/app/services/election.service.ts",
    "Front/src/app/services/permission.service.ts",
    "Front/src/app/services/custom-role.service.ts"
)

$servicesOK = $true
foreach ($file in $serviceFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "192\.168") {
            Write-Host "   ❌ Ancienne IP dans $(Split-Path $file -Leaf)" -ForegroundColor Red
            $errors += "Ancienne IP dans $(Split-Path $file -Leaf)"
            $servicesOK = $false
        }
    }
}

if ($servicesOK) {
    Write-Host "   ✅ Tous les services sont à jour" -ForegroundColor Green
}

# 5. Vérifier package.json
Write-Host ""
Write-Host "5. Vérification de package.json..." -ForegroundColor Yellow
$packageFile = "Front/package.json"
if (Test-Path $packageFile) {
    $packageContent = Get-Content $packageFile -Raw
    if ($packageContent -match "ng serve --host 172\.18\.72\.32") {
        Write-Host "   ✅ Commande start correcte" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Commande start pas à jour" -ForegroundColor Red
        $errors += "package.json start script pas à jour"
    }
} else {
    Write-Host "   ❌ Fichier package.json introuvable" -ForegroundColor Red
    $errors += "package.json introuvable"
}

# 6. Vérifier si les backends tournent
Write-Host ""
Write-Host "6. Vérification des backends..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://${newIP}:8081/api/auth/test" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ User Service (8081) accessible" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  User Service (8081) non accessible" -ForegroundColor Yellow
    $warnings += "User Service pas démarré"
}

try {
    $response = Invoke-WebRequest -Uri "http://${newIP}:8083/api/clubs" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Club Service (8083) accessible" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Club Service (8083) non accessible" -ForegroundColor Yellow
    $warnings += "Club Service pas démarré"
}

# 7. Vérifier si Angular tourne
Write-Host ""
Write-Host "7. Vérification du frontend..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://${newIP}:4200" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Angular (4200) accessible" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Angular (4200) non accessible" -ForegroundColor Yellow
    $warnings += "Angular pas démarré"
}

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ TOUT EST OK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Nettoyer les QR tokens: ./clean-qr-tokens.ps1" -ForegroundColor White
    Write-Host "2. Redémarrer Spring Boot: cd ClubHub; ./mvnw spring-boot:run" -ForegroundColor White
    Write-Host "3. Redémarrer Angular: cd Front; npm start" -ForegroundColor White
    Write-Host "4. Tester: http://172.18.72.32:4200" -ForegroundColor White
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ ERREURS TROUVÉES:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "   - $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  AVERTISSEMENTS:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   - $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "Actions recommandées:" -ForegroundColor Yellow
    if ($errors -contains "PC pas sur le réseau WiFi 172.18.x.x") {
        Write-Host "1. Vérifier la connexion WiFi du PC" -ForegroundColor White
        Write-Host "   ipconfig | Select-String '172.18'" -ForegroundColor Gray
    }
    if ($warnings -contains "User Service pas démarré" -or $warnings -contains "Club Service pas démarré") {
        Write-Host "2. Démarrer les backends Spring Boot" -ForegroundColor White
        Write-Host "   cd ClubHub; ./mvnw spring-boot:run" -ForegroundColor Gray
    }
    if ($warnings -contains "Angular pas démarré") {
        Write-Host "3. Démarrer Angular" -ForegroundColor White
        Write-Host "   cd Front; npm start" -ForegroundColor Gray
    }
}

Write-Host ""

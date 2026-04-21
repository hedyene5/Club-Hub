# Script pour configurer l'application avec l'IP locale
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION IP LOCALE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtenir l'IP locale
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    Write-Host "ERREUR: Impossible de detecter l'IP locale" -ForegroundColor Red
    exit 1
}

Write-Host "IP locale detectee: $ipAddress" -ForegroundColor Green
Write-Host ""

# URLs
$frontendUrl = "http://${ipAddress}:4200"
$backendUrl = "http://${ipAddress}:8084"

Write-Host "URLs configurees:" -ForegroundColor Yellow
Write-Host "  Frontend: $frontendUrl" -ForegroundColor White
Write-Host "  Backend:  $backendUrl" -ForegroundColor White
Write-Host ""

# Mettre à jour application.properties
Write-Host "1. Mise a jour de application.properties..." -ForegroundColor Yellow
$propsFile = "ClubHub/src/main/resources/application.properties"
if (Test-Path $propsFile) {
    $content = Get-Content $propsFile -Raw
    
    # Mettre à jour frontend URL
    $content = $content -replace "app\.frontend\.url\s*=\s*.*", "app.frontend.url=$frontendUrl"
    
    # Mettre à jour CORS
    $corsOrigins = "http://localhost:4200,$frontendUrl"
    $content = $content -replace "spring\.web\.cors\.allowed-origins\s*=\s*.*", "spring.web.cors.allowed-origins=$corsOrigins"
    
    Set-Content -Path $propsFile -Value $content -NoNewline
    Write-Host "   OK application.properties mis a jour" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: application.properties non trouve" -ForegroundColor Red
}
Write-Host ""

# Mettre à jour qr-validation.component.ts
Write-Host "2. Mise a jour de qr-validation.component.ts..." -ForegroundColor Yellow
$qrComponent = "Front/src/app/components/qr-validation/qr-validation.component.ts"
if (Test-Path $qrComponent) {
    $content = Get-Content $qrComponent -Raw
    $content = $content -replace "private apiUrl = 'http://localhost:8084/api/qr-tokens';", "private apiUrl = '$backendUrl/api/qr-tokens';"
    Set-Content -Path $qrComponent -Value $content -NoNewline
    Write-Host "   OK qr-validation.component.ts mis a jour" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: qr-validation.component.ts non trouve" -ForegroundColor Red
}
Write-Host ""

# Mettre à jour vote-with-token.component.ts si existe
Write-Host "3. Mise a jour de vote-with-token.component.ts..." -ForegroundColor Yellow
$voteComponent = "Front/src/app/components/vote-with-token/vote-with-token.component.ts"
if (Test-Path $voteComponent) {
    $content = Get-Content $voteComponent -Raw
    if ($content -match "private apiUrl = 'http://localhost:8084") {
        $content = $content -replace "private apiUrl = 'http://localhost:8084/api", "private apiUrl = '$backendUrl/api"
        Set-Content -Path $voteComponent -Value $content -NoNewline
        Write-Host "   OK vote-with-token.component.ts mis a jour" -ForegroundColor Green
    } else {
        Write-Host "   INFO: Pas de modification necessaire" -ForegroundColor Gray
    }
} else {
    Write-Host "   INFO: Fichier non trouve (optionnel)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROCHAINES ETAPES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Redemarrer le backend:" -ForegroundColor Yellow
Write-Host "   cd ClubHub" -ForegroundColor White
Write-Host "   ./mvnw spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "2. Redemarrer Angular:" -ForegroundColor Yellow
Write-Host "   cd Front" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "3. Acceder depuis le smartphone:" -ForegroundColor Yellow
Write-Host "   Frontend: $frontendUrl" -ForegroundColor White
Write-Host "   (Assure-toi que le smartphone est sur le meme WiFi)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Creer une nouvelle election" -ForegroundColor Yellow
Write-Host "   Les QR codes contiendront: $frontendUrl/elections/scan/..." -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration terminee" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

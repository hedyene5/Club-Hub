# Script de verification du systeme QR Code
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SYSTEME QR CODE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier application.properties
Write-Host "1. Verification de application.properties..." -ForegroundColor Yellow
$propsFile = "ClubHub/src/main/resources/application.properties"
if (Test-Path $propsFile) {
    $content = Get-Content $propsFile -Raw
    if ($content -match "app\.frontend\.url\s*=\s*http://localhost:4200") {
        Write-Host "   OK Frontend URL configuree: http://localhost:4200" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR Frontend URL non trouvee ou incorrecte" -ForegroundColor Red
        Write-Host "   Ajouter: app.frontend.url=http://localhost:4200" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ERREUR Fichier application.properties non trouve" -ForegroundColor Red
}
Write-Host ""

# 2. Verifier QRCodeService
Write-Host "2. Verification de QRCodeService.java..." -ForegroundColor Yellow
$qrService = "ClubHub/src/main/java/esprit/com/clubhub/service/QRCodeService.java"
if (Test-Path $qrService) {
    $content = Get-Content $qrService -Raw
    if ($content -match "@Value.*app\.frontend\.url") {
        Write-Host "   OK QRCodeService utilise app.frontend.url" -ForegroundColor Green
    }
    if ($content -match "generateElectionQRCodeWithUrl") {
        Write-Host "   OK Methode generateElectionQRCodeWithUrl presente" -ForegroundColor Green
    }
    if ($content -match "@PostConstruct") {
        Write-Host "   OK Logging de configuration au demarrage present" -ForegroundColor Green
    }
} else {
    Write-Host "   ERREUR QRCodeService.java non trouve" -ForegroundColor Red
}
Write-Host ""

# 3. Verifier les routes Angular
Write-Host "3. Verification des routes Angular..." -ForegroundColor Yellow
$routes = "Front/src/app/app.routes.ts"
if (Test-Path $routes) {
    $content = Get-Content $routes -Raw
    if ($content -match "elections/scan/:token") {
        Write-Host "   OK Route /elections/scan/:token configuree" -ForegroundColor Green
    }
    if ($content -match "QrValidationComponent") {
        Write-Host "   OK QrValidationComponent importe" -ForegroundColor Green
    }
    if ($content -match "VoteWithTokenComponent") {
        Write-Host "   OK VoteWithTokenComponent importe" -ForegroundColor Green
    }
} else {
    Write-Host "   ERREUR app.routes.ts non trouve" -ForegroundColor Red
}
Write-Host ""

# 4. Verifier les composants Angular
Write-Host "4. Verification des composants Angular..." -ForegroundColor Yellow
$components = @(
    "Front/src/app/components/qr-validation/qr-validation.component.ts",
    "Front/src/app/components/scan-success/scan-success.component.ts",
    "Front/src/app/components/vote-with-token/vote-with-token.component.ts"
)
foreach ($comp in $components) {
    if (Test-Path $comp) {
        $name = Split-Path $comp -Leaf
        Write-Host "   OK $name present" -ForegroundColor Green
    } else {
        $name = Split-Path $comp -Leaf
        Write-Host "   ERREUR $name manquant" -ForegroundColor Red
    }
}
Write-Host ""

# 5. Instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROCHAINES ETAPES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Redemarrer le backend:" -ForegroundColor Yellow
Write-Host "   cd ClubHub" -ForegroundColor White
Write-Host "   ./mvnw spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "2. Verifier les logs au demarrage:" -ForegroundColor Yellow
Write-Host "   Chercher: QRCodeService - Configuration" -ForegroundColor White
Write-Host "            Frontend URL: http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "3. Creer une NOUVELLE election:" -ForegroundColor Yellow
Write-Host "   Les anciennes elections ont des QR codes avec ancienne URL" -ForegroundColor White
Write-Host ""
Write-Host "4. Attendre J-1 ou forcer le scheduler:" -ForegroundColor Yellow
Write-Host "   Le scheduler execute toutes les 30 secondes" -ForegroundColor White
Write-Host "   Creer une election avec startDate = maintenant + 2 minutes" -ForegroundColor White
Write-Host ""
Write-Host "5. Verifier URL dans les logs:" -ForegroundColor Yellow
Write-Host "   Chercher: Generation QR Code avec URL" -ForegroundColor White
Write-Host "            URL: http://localhost:4200/elections/scan/..." -ForegroundColor White
Write-Host ""
Write-Host "6. Tester avec un smartphone:" -ForegroundColor Yellow
Write-Host "   Scanner le QR code recu par email" -ForegroundColor White
Write-Host "   Verifier que le navigateur ouvre http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification terminee" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

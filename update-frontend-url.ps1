# Script pour mettre a jour l'URL frontend dans application.properties
param(
    [Parameter(Mandatory=$true)]
    [string]$NgrokUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MISE A JOUR URL FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Valider l'URL
if ($NgrokUrl -notmatch "^https?://") {
    Write-Host "ERREUR: L'URL doit commencer par http:// ou https://" -ForegroundColor Red
    Write-Host "Exemple: https://abc123.ngrok-free.app" -ForegroundColor Yellow
    exit 1
}

# Enlever le slash final si present
$NgrokUrl = $NgrokUrl.TrimEnd('/')

Write-Host "Nouvelle URL frontend: $NgrokUrl" -ForegroundColor Green
Write-Host ""

# Chemin du fichier
$propsFile = "ClubHub/src/main/resources/application.properties"

if (-not (Test-Path $propsFile)) {
    Write-Host "ERREUR: Fichier application.properties non trouve" -ForegroundColor Red
    exit 1
}

# Lire le contenu
$content = Get-Content $propsFile -Raw

# Remplacer l'URL
$oldPattern = "app\.frontend\.url\s*=\s*.*"
$newValue = "app.frontend.url=$NgrokUrl"

if ($content -match $oldPattern) {
    $content = $content -replace $oldPattern, $newValue
    Set-Content -Path $propsFile -Value $content -NoNewline
    Write-Host "OK URL mise a jour dans application.properties" -ForegroundColor Green
} else {
    # Ajouter la ligne si elle n'existe pas
    $content += "`n`n# URL du frontend (pour les liens dans les emails)`napp.frontend.url=$NgrokUrl"
    Set-Content -Path $propsFile -Value $content -NoNewline
    Write-Host "OK URL ajoutee dans application.properties" -ForegroundColor Green
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
Write-Host "2. Verifier les logs au demarrage:" -ForegroundColor Yellow
Write-Host "   Chercher: Frontend URL: $NgrokUrl" -ForegroundColor White
Write-Host ""
Write-Host "3. Creer une NOUVELLE election" -ForegroundColor Yellow
Write-Host "   Les anciennes elections ont l'ancienne URL" -ForegroundColor White
Write-Host ""
Write-Host "4. Tester avec le smartphone" -ForegroundColor Yellow
Write-Host "   Scanner le QR code recu par email" -ForegroundColor White
Write-Host ""

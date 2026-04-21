Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE DES QR TOKENS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Trouver MongoDB
$mongoPath = $null
$possiblePaths = @(
    "C:\Program Files\MongoDB\Server\*\bin\mongosh.exe",
    "C:\Program Files\MongoDB\Server\*\bin\mongo.exe",
    "$env:LOCALAPPDATA\Programs\mongosh\mongosh.exe"
)

foreach ($path in $possiblePaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $mongoPath = $found.FullName
        Write-Host "✅ MongoDB trouvé: $mongoPath" -ForegroundColor Green
        break
    }
}

if (-not $mongoPath) {
    Write-Host "❌ MongoDB non trouvé automatiquement" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions alternatives:" -ForegroundColor Yellow
    Write-Host "1. Utiliser MongoDB Compass (interface graphique)" -ForegroundColor Yellow
    Write-Host "   - Ouvrir MongoDB Compass" -ForegroundColor Yellow
    Write-Host "   - Se connecter à mongodb://localhost:27017" -ForegroundColor Yellow
    Write-Host "   - Aller dans la base 'clubhub'" -ForegroundColor Yellow
    Write-Host "   - Collection 'qr_tokens'" -ForegroundColor Yellow
    Write-Host "   - Cliquer sur 'Delete' puis 'Delete all documents'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. Ou exécuter manuellement dans MongoDB Shell:" -ForegroundColor Yellow
    Write-Host "   use clubhub" -ForegroundColor White
    Write-Host "   db.qr_tokens.deleteMany({})" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Nettoyer les QR tokens
Write-Host ""
Write-Host "🗑️  Suppression des anciens QR tokens..." -ForegroundColor Yellow

$command = "use clubhub; db.qr_tokens.deleteMany({}); print('✅ QR tokens supprimés'); db.qr_tokens.countDocuments()"

try {
    & $mongoPath --eval $command
    Write-Host ""
    Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du nettoyage: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Redémarrer Spring Boot:" -ForegroundColor Yellow
Write-Host "   cd ClubHub" -ForegroundColor White
Write-Host "   ./mvnw spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "2. Redémarrer Angular:" -ForegroundColor Yellow
Write-Host "   cd Front" -ForegroundColor White
Write-Host "   ng serve --host 172.18.72.32 --port 4200" -ForegroundColor White
Write-Host ""
Write-Host "3. Créer une nouvelle élection pour tester" -ForegroundColor Yellow
Write-Host ""

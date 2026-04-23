# Script de test des endpoints du service Python

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TEST DES ENDPOINTS - SERVICE PYTHON                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 1 : Health check
Write-Host "`n[1/2] Test endpoint /health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    Write-Host "      ✅ Health check OK" -ForegroundColor Green
    Write-Host "      Réponse: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "      ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "      Le service Python n'est pas démarré !" -ForegroundColor Yellow
    pause
    exit 1
}

# Test 2 : Génération de lettre
Write-Host "`n[2/2] Test endpoint /generate/motivation-letter..." -ForegroundColor Yellow
try {
    $body = @{
        candidateName = "Test User"
        clubName = "Test Club"
        position = "Membre"
        userIdeas = "Je suis passionné par l'organisation d'événements et la communication"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/generate/motivation-letter" `
                                  -Method Post `
                                  -Body $body `
                                  -ContentType "application/json"
    
    Write-Host "      ✅ Génération OK" -ForegroundColor Green
    Write-Host "`n      Lettre générée:" -ForegroundColor Cyan
    Write-Host "      $($response.motivationLetter.Substring(0, [Math]::Min(150, $response.motivationLetter.Length)))..." -ForegroundColor Gray
    Write-Host "`n      Programme:" -ForegroundColor Cyan
    Write-Host "      $($response.program.Substring(0, [Math]::Min(100, $response.program.Length)))..." -ForegroundColor Gray
    Write-Host "`n      Compétences: $($response.skills -join ', ')" -ForegroundColor Cyan
    
} catch {
    Write-Host "      ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "      Détails: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ TESTS TERMINÉS                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nAppuyez sur une touche pour fermer..." -ForegroundColor White
pause

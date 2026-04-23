# Script de test du backend Spring Boot AI Service

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TEST BACKEND SPRING BOOT - AI SERVICE             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 1 : Health check
Write-Host "`n[1/2] Test endpoint /api/ai/health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://192.168.1.20:8085/api/ai/health" -Method Get -TimeoutSec 10
    Write-Host "      ✅ Health check OK" -ForegroundColor Green
    Write-Host "      Réponse: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "      ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "      Le backend Spring Boot n'est pas démarré ou ne peut pas joindre Python !" -ForegroundColor Yellow
    
    # Vérifier si Python est accessible
    Write-Host "`n      Vérification du service Python..." -ForegroundColor Yellow
    try {
        $pythonHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
        Write-Host "      ✅ Service Python accessible" -ForegroundColor Green
        Write-Host "      Le problème vient du backend Spring Boot" -ForegroundColor Yellow
    } catch {
        Write-Host "      ❌ Service Python non accessible" -ForegroundColor Red
        Write-Host "      Démarrez d'abord le service Python : cd ..\AI-Service ; .\start-service.ps1" -ForegroundColor Yellow
    }
    
    pause
    exit 1
}

# Test 2 : Génération de lettre
Write-Host "`n[2/2] Test endpoint /api/ai/generate/motivation-letter..." -ForegroundColor Yellow
try {
    $body = @{
        candidateName = "Test User"
        clubName = "Test Club"
        position = "Membre"
        userIdeas = "Je suis passionné par l'organisation d'événements et la communication"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://192.168.1.20:8085/api/ai/generate/motivation-letter?userId=test&clubId=test" `
                                  -Method Post `
                                  -Body $body `
                                  -ContentType "application/json" `
                                  -TimeoutSec 15
    
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
    Write-Host "`n      Vérifiez les logs du backend Spring Boot" -ForegroundColor Yellow
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ TESTS TERMINÉS                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nAppuyez sur une touche pour fermer..." -ForegroundColor White
pause

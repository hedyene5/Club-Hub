# Script de test rapide de la configuration email
# Usage: .\test-email-config.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 DIAGNOSTIC EMAIL - ClubHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le backend est démarré
Write-Host "1️⃣ Vérification du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/email-test/diagnostic" -Method Get
    Write-Host "   ✅ Backend accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend non accessible sur le port 8083" -ForegroundColor Red
    Write-Host "   💡 Démarrez le backend avec: cd ClubHub; ./mvnw spring-boot:run" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Afficher la configuration
Write-Host "2️⃣ Configuration détectée:" -ForegroundColor Yellow
Write-Host "   Host: $($response.configuration.host)" -ForegroundColor White
Write-Host "   Port: $($response.configuration.port)" -ForegroundColor White
Write-Host "   Username: $($response.configuration.username)" -ForegroundColor White
Write-Host "   Configuré: $(if ($response.configuration.configured) { '✅ OUI' } else { '❌ NON' })" -ForegroundColor $(if ($response.configuration.configured) { 'Green' } else { 'Red' })

Write-Host ""

# Afficher les recommandations
Write-Host "3️⃣ Recommandations:" -ForegroundColor Yellow
foreach ($rec in $response.recommendations) {
    if ($rec -like "*CRITIQUE*") {
        Write-Host "   $rec" -ForegroundColor Red
    } elseif ($rec -like "*✅*") {
        Write-Host "   $rec" -ForegroundColor Green
    } else {
        Write-Host "   $rec" -ForegroundColor Yellow
    }
}

Write-Host ""

# Si configuré, proposer un test
if ($response.configuration.configured) {
    Write-Host "4️⃣ Test d'envoi d'email" -ForegroundColor Yellow
    $testEmail = Read-Host "   Entrez votre email pour tester (ou appuyez sur Entrée pour passer)"
    
    if ($testEmail) {
        Write-Host "   📧 Envoi en cours..." -ForegroundColor Cyan
        try {
            $body = @{
                email = $testEmail
            } | ConvertTo-Json
            
            $testResponse = Invoke-RestMethod -Uri "http://localhost:8083/api/email-test/send" `
                -Method Post `
                -Body $body `
                -ContentType "application/json"
            
            if ($testResponse.success) {
                Write-Host "   ✅ $($testResponse.message)" -ForegroundColor Green
                Write-Host "   💡 Vérifiez votre boîte de réception (et les spams)" -ForegroundColor Yellow
            } else {
                Write-Host "   ❌ Erreur: $($testResponse.error)" -ForegroundColor Red
                if ($testResponse.solutions) {
                    Write-Host "   Solutions:" -ForegroundColor Yellow
                    foreach ($sol in $testResponse.solutions) {
                        Write-Host "      $sol" -ForegroundColor White
                    }
                }
            }
        } catch {
            Write-Host "   ❌ Erreur lors du test: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "4️⃣ Configuration requise" -ForegroundColor Red
    Write-Host "   📝 Étapes à suivre:" -ForegroundColor Yellow
    Write-Host "   1. Activez l'authentification à 2 facteurs sur Gmail" -ForegroundColor White
    Write-Host "   2. Générez un mot de passe d'application: https://myaccount.google.com/apppasswords" -ForegroundColor White
    Write-Host "   3. Modifiez ClubHub/src/main/resources/application.properties" -ForegroundColor White
    Write-Host "   4. Redémarrez le backend" -ForegroundColor White
    Write-Host "   5. Relancez ce script" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📚 Documentation complète: DIAGNOSTIC_EMAILS.md" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

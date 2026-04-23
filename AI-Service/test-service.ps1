# Script de test du service IA
Write-Host "=== TEST DU SERVICE IA ===" -ForegroundColor Cyan

$serviceUrl = "http://localhost:5000"

# Test 1: Health check
Write-Host "`n1. Test de santé du service..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$serviceUrl/health" -Method Get
    Write-Host "✅ Service opérationnel" -ForegroundColor Green
    Write-Host "   Modèle chargé: $($health.model_loaded)" -ForegroundColor White
    Write-Host "   Device: $($health.device)" -ForegroundColor White
} catch {
    Write-Host "❌ Service non accessible" -ForegroundColor Red
    Write-Host "   Assurez-vous que le service Python est démarré" -ForegroundColor Yellow
    exit 1
}

# Test 2: Génération de lettre de motivation
Write-Host "`n2. Test de génération de lettre..." -ForegroundColor Yellow
$letterRequest = @{
    candidateName = "Ahmed Ben Ali"
    clubName = "Club Robotique"
    position = "Membre"
    skills = @("programmation", "travail en équipe")
    motivations = @("passion pour la robotique")
    experience = "2 ans d'expérience en Arduino"
} | ConvertTo-Json

try {
    $letter = Invoke-RestMethod -Uri "$serviceUrl/generate/motivation-letter" -Method Post -Body $letterRequest -ContentType "application/json"
    Write-Host "✅ Lettre générée avec succès" -ForegroundColor Green
    Write-Host "`nExtrait de la lettre:" -ForegroundColor Cyan
    Write-Host $letter.letter.Substring(0, [Math]::Min(200, $letter.letter.Length)) -ForegroundColor White
    Write-Host "..." -ForegroundColor White
} catch {
    Write-Host "❌ Erreur lors de la génération" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 3: Génération de programme
Write-Host "`n3. Test de génération de programme..." -ForegroundColor Yellow
$programRequest = @{
    clubName = "Club Robotique"
    objectives = @("former les membres", "participer à des compétitions")
    activities = @("ateliers hebdomadaires", "projets pratiques")
    duration = "1 semestre"
} | ConvertTo-Json

try {
    $program = Invoke-RestMethod -Uri "$serviceUrl/generate/program" -Method Post -Body $programRequest -ContentType "application/json"
    Write-Host "✅ Programme généré avec succès" -ForegroundColor Green
    Write-Host "`nExtrait du programme:" -ForegroundColor Cyan
    Write-Host $program.program.Substring(0, [Math]::Min(200, $program.program.Length)) -ForegroundColor White
    Write-Host "..." -ForegroundColor White
} catch {
    Write-Host "❌ Erreur lors de la génération" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=== FIN DES TESTS ===" -ForegroundColor Cyan

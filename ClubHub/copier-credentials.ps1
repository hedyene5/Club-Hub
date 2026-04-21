# Script PowerShell pour copier credentials.json au bon endroit

Write-Host "📁 Script de copie de credentials.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demander le chemin source
Write-Host "Où se trouve votre fichier credentials.json ?" -ForegroundColor Yellow
Write-Host "Exemples:" -ForegroundColor Gray
Write-Host "  - C:\Users\souha\Downloads\credentials.json" -ForegroundColor Gray
Write-Host "  - C:\Users\souha\Desktop\credentials.json" -ForegroundColor Gray
Write-Host ""

$sourcePath = Read-Host "Chemin complet du fichier"

# Vérifier que le fichier source existe
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ ERREUR: Le fichier n'existe pas: $sourcePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez le chemin et réessayez." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ Fichier source trouvé: $sourcePath" -ForegroundColor Green
Write-Host ""

# Proposer les deux options
Write-Host "Où voulez-vous copier le fichier ?" -ForegroundColor Yellow
Write-Host "  1. ClubHub/credentials.json (RECOMMANDÉ)" -ForegroundColor White
Write-Host "  2. ClubHub/src/main/resources/credentials.json" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix (1 ou 2)"

# Déterminer la destination
$destination = ""
if ($choice -eq "1") {
    $destination = "credentials.json"
} elseif ($choice -eq "2") {
    $destination = "src\main\resources\credentials.json"
} else {
    Write-Host "❌ Choix invalide. Utilisation de l'option 1 par défaut." -ForegroundColor Yellow
    $destination = "credentials.json"
}

# Copier le fichier
try {
    Write-Host ""
    Write-Host "📋 Copie en cours..." -ForegroundColor Cyan
    Copy-Item -Path $sourcePath -Destination $destination -Force
    
    Write-Host "✅ Fichier copié avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Emplacement: $(Resolve-Path $destination)" -ForegroundColor White
    Write-Host ""
    
    # Vérifier le contenu
    Write-Host "🔍 Vérification du contenu..." -ForegroundColor Cyan
    $content = Get-Content $destination -Raw | ConvertFrom-Json
    
    if ($content.installed.client_id) {
        Write-Host "✅ Client ID trouvé: $($content.installed.client_id.Substring(0, 20))..." -ForegroundColor Green
        Write-Host "✅ Le fichier semble valide !" -ForegroundColor Green
    } else {
        Write-Host "⚠️ ATTENTION: Le fichier ne semble pas avoir le bon format" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🚀 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Configurez gmail.user.email dans application.properties" -ForegroundColor White
    Write-Host "  2. Ajoutez-vous comme utilisateur test dans Google Cloud Console" -ForegroundColor White
    Write-Host "  3. Démarrez l'application: ./mvnw spring-boot:run" -ForegroundColor White
    Write-Host "  4. Autorisez l'application dans le navigateur qui s'ouvrira" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ ERREUR lors de la copie: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Configuration terminée !" -ForegroundColor Green
Write-Host ""
pause

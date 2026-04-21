# Script pour demarrer ngrok et exposer le frontend Angular
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE NGROK POUR FRONTEND ANGULAR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Demarrage de ngrok sur le port 4200..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Apres le demarrage de ngrok:" -ForegroundColor Yellow
Write-Host "1. Copier l'URL publique (ex: https://abc123.ngrok.io)" -ForegroundColor White
Write-Host "2. Mettre a jour application.properties avec cette URL" -ForegroundColor White
Write-Host "3. Redemarrer le backend" -ForegroundColor White
Write-Host "4. Creer une NOUVELLE election" -ForegroundColor White
Write-Host ""
Write-Host "Appuyer sur Ctrl+C pour arreter ngrok" -ForegroundColor Yellow
Write-Host ""

# Demarrer ngrok
ngrok http 4200

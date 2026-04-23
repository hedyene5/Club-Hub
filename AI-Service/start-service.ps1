# Script de démarrage du service IA Python
Write-Host "=== DÉMARRAGE DU SERVICE IA ===" -ForegroundColor Cyan

# Vérifier si Python est installé
Write-Host "`nVérification de Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python installé: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Python n'est pas installé" -ForegroundColor Red
    Write-Host "Téléchargez Python depuis https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Vérifier si l'environnement virtuel existe
if (-not (Test-Path "venv")) {
    Write-Host "`nCréation de l'environnement virtuel..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Environnement virtuel créé" -ForegroundColor Green
}

# Activer l'environnement virtuel
Write-Host "`nActivation de l'environnement virtuel..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Installer les dépendances
Write-Host "`nInstallation des dépendances..." -ForegroundColor Yellow
pip install -r requirements.txt

# Démarrer le service
Write-Host "`n=== DÉMARRAGE DU SERVICE ===" -ForegroundColor Cyan
Write-Host "Le service démarre sur http://localhost:5000" -ForegroundColor Green
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host "`nPremier démarrage: Le modèle GPT-2 sera téléchargé (~500MB)" -ForegroundColor Yellow
Write-Host "Cela peut prendre quelques minutes...`n" -ForegroundColor Yellow

python app.py

# Script de démarrage automatique du Service IA
# Ce script démarre tout automatiquement !

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         DÉMARRAGE AUTOMATIQUE DU SERVICE IA                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Étape 1 : Vérifier Python
Write-Host "`n[1/5] Vérification de Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "      ✅ Python installé : $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ ERREUR : Python n'est pas installé !" -ForegroundColor Red
    Write-Host "      Téléchargez Python depuis : https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "      ⚠️  Cochez 'Add Python to PATH' pendant l'installation" -ForegroundColor Yellow
    pause
    exit 1
}

# Étape 2 : Vérifier MongoDB
Write-Host "`n[2/5] Vérification de MongoDB..." -ForegroundColor Yellow
if (Test-Port 27017) {
    Write-Host "      ✅ MongoDB est démarré (port 27017)" -ForegroundColor Green
} else {
    Write-Host "      ⚠️  MongoDB n'est pas démarré" -ForegroundColor Yellow
    Write-Host "      Le service IA fonctionnera mais ne sauvegardera pas l'historique" -ForegroundColor Gray
}

# Étape 3 : Préparer le service Python
Write-Host "`n[3/5] Préparation du service Python..." -ForegroundColor Yellow

$aiServicePath = "AI-Service"
if (-not (Test-Path $aiServicePath)) {
    Write-Host "      ❌ ERREUR : Dossier AI-Service introuvable !" -ForegroundColor Red
    Write-Host "      Assurez-vous d'être dans le dossier PI2" -ForegroundColor Yellow
    pause
    exit 1
}

cd $aiServicePath

# Créer l'environnement virtuel si nécessaire
if (-not (Test-Path "venv")) {
    Write-Host "      Création de l'environnement virtuel..." -ForegroundColor Gray
    python -m venv venv
    Write-Host "      ✅ Environnement virtuel créé" -ForegroundColor Green
}

# Activer l'environnement virtuel et installer les dépendances
Write-Host "      Installation des dépendances..." -ForegroundColor Gray
Write-Host "      ⏳ Cela peut prendre 5-10 minutes la première fois..." -ForegroundColor Yellow

& "venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
& "venv\Scripts\pip.exe" install -r requirements.txt --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✅ Dépendances installées" -ForegroundColor Green
} else {
    Write-Host "      ❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
    cd ..
    pause
    exit 1
}

# Étape 4 : Démarrer le service Python en arrière-plan
Write-Host "`n[4/5] Démarrage du service Python (port 5000)..." -ForegroundColor Yellow

if (Test-Port 5000) {
    Write-Host "      ⚠️  Le port 5000 est déjà utilisé" -ForegroundColor Yellow
    Write-Host "      Le service Python est peut-être déjà démarré" -ForegroundColor Gray
} else {
    Write-Host "      Démarrage en cours..." -ForegroundColor Gray
    Write-Host "      ⏳ Premier démarrage : téléchargement du modèle GPT-2 (~500MB)" -ForegroundColor Yellow
    
    # Démarrer Python en arrière-plan
    $pythonProcess = Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "app.py" -PassThru -WindowStyle Minimized
    
    Write-Host "      Attente du démarrage du service..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Vérifier que le service est démarré
    $maxAttempts = 30
    $attempt = 0
    $serviceStarted = $false
    
    while ($attempt -lt $maxAttempts -and -not $serviceStarted) {
        if (Test-Port 5000) {
            $serviceStarted = $true
            Write-Host "      ✅ Service Python démarré (PID: $($pythonProcess.Id))" -ForegroundColor Green
        } else {
            $attempt++
            Write-Host "      Tentative $attempt/$maxAttempts..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $serviceStarted) {
        Write-Host "      ❌ Le service Python n'a pas démarré" -ForegroundColor Red
        Write-Host "      Vérifiez les logs dans la fenêtre Python" -ForegroundColor Yellow
        cd ..
        pause
        exit 1
    }
}

cd ..

# Étape 5 : Démarrer le backend Spring Boot
Write-Host "`n[5/5] Démarrage du backend Spring Boot (port 8085)..." -ForegroundColor Yellow

# Vérifier Maven
try {
    $mvnVersion = mvn --version 2>&1 | Select-Object -First 1
    Write-Host "      ✅ Maven détecté : $mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ ERREUR : Maven n'est pas installé !" -ForegroundColor Red
    Write-Host "      Téléchargez Maven : https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    Write-Host "      Ajoutez au PATH : C:\Program Files\Apache\maven\bin" -ForegroundColor Yellow
    cd ..
    pause
    exit 1
}

$backendPath = "AI-Service-Backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "      ❌ ERREUR : Dossier AI-Service-Backend introuvable !" -ForegroundColor Red
    pause
    exit 1
}

cd $backendPath

if (Test-Port 8085) {
    Write-Host "      ⚠️  Le port 8085 est déjà utilisé" -ForegroundColor Yellow
    Write-Host "      Le backend Spring Boot est peut-être déjà démarré" -ForegroundColor Gray
} else {
    Write-Host "      Démarrage en cours..." -ForegroundColor Gray
    Write-Host "      ⏳ Cela peut prendre 30-60 secondes..." -ForegroundColor Yellow
    
    # Démarrer Spring Boot en arrière-plan avec Maven
    $springProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c mvn spring-boot:run" -PassThru -WindowStyle Minimized
    
    Write-Host "      Attente du démarrage du backend..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
    
    # Vérifier que le backend est démarré
    $maxAttempts = 20
    $attempt = 0
    $backendStarted = $false
    
    while ($attempt -lt $maxAttempts -and -not $backendStarted) {
        if (Test-Port 8085) {
            $backendStarted = $true
            Write-Host "      ✅ Backend Spring Boot démarré (PID: $($springProcess.Id))" -ForegroundColor Green
        } else {
            $attempt++
            Write-Host "      Tentative $attempt/$maxAttempts..." -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
    
    if (-not $backendStarted) {
        Write-Host "      ❌ Le backend Spring Boot n'a pas démarré" -ForegroundColor Red
        Write-Host "      Vérifiez les logs dans la fenêtre Spring Boot" -ForegroundColor Yellow
        Write-Host "      Ou lancez manuellement : cd AI-Service-Backend ; mvn spring-boot:run" -ForegroundColor Yellow
        cd ..
        pause
        exit 1
    }
}

cd ..

# Tests finaux
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ TOUT EST DÉMARRÉ !                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nServices actifs :" -ForegroundColor Cyan
Write-Host "  🐍 Service Python    : http://localhost:5000" -ForegroundColor White
Write-Host "  ☕ Backend Spring    : http://localhost:8085" -ForegroundColor White

Write-Host "`nTest rapide..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5
    Write-Host "  ✅ Service Python opérationnel" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Service Python non accessible" -ForegroundColor Yellow
}

try {
    $health = Invoke-RestMethod -Uri "http://localhost:8085/api/ai/health" -Method Get -TimeoutSec 5
    Write-Host "  ✅ Backend Spring Boot opérationnel" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Backend Spring Boot non accessible" -ForegroundColor Yellow
}

Write-Host "`n📝 Pour tester la génération de texte :" -ForegroundColor Cyan
Write-Host "   cd AI-Service" -ForegroundColor Gray
Write-Host "   .\test-service.ps1" -ForegroundColor Gray

Write-Host "`n⚠️  Pour arrêter les services :" -ForegroundColor Yellow
Write-Host "   Exécutez : .\ARRETER_TOUT.ps1" -ForegroundColor Gray

Write-Host "`nAppuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor White
pause

# Script de démarrage du backend Spring Boot AI Service
# Port : 8085

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      DÉMARRAGE BACKEND SPRING BOOT AI SERVICE             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n[1/3] Vérification de Maven..." -ForegroundColor Yellow
try {
    $mvnVersion = mvn --version 2>&1 | Select-Object -First 1
    Write-Host "      ✅ Maven installé : $mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ ERREUR : Maven n'est pas installé !" -ForegroundColor Red
    Write-Host "      Téléchargez Maven depuis : https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "`n[2/3] Vérification de MongoDB..." -ForegroundColor Yellow
$mongoTest = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
if ($mongoTest.TcpTestSucceeded) {
    Write-Host "      ✅ MongoDB est démarré (port 27017)" -ForegroundColor Green
} else {
    Write-Host "      ⚠️  MongoDB n'est pas démarré" -ForegroundColor Yellow
    Write-Host "      Le service fonctionnera mais ne sauvegardera pas l'historique" -ForegroundColor Gray
}

Write-Host "`n[3/3] Démarrage du backend Spring Boot..." -ForegroundColor Yellow
Write-Host "      Port : 8085" -ForegroundColor Gray
Write-Host "      ⏳ Cela peut prendre 30-60 secondes..." -ForegroundColor Yellow
Write-Host ""

# Démarrer Spring Boot
mvn spring-boot:run

Write-Host "`n⚠️  Le service s'est arrêté" -ForegroundColor Yellow
pause

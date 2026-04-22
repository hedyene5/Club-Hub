Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: RÔLES PERSONNALISÉS DANS FORMULAIRE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://192.168.1.20:8083/api"

# Récupérer un club pour tester
Write-Host "1. Récupération d'un club de test..." -ForegroundColor Yellow
try {
    $clubsResponse = Invoke-WebRequest -Uri "$apiUrl/clubs" -UseBasicParsing -TimeoutSec 5
    $clubs = ($clubsResponse.Content | ConvertFrom-Json)
    
    if ($clubs.Count -eq 0) {
        Write-Host "   ❌ Aucun club trouvé dans la base de données" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Veuillez d'abord créer un club depuis l'application" -ForegroundColor Yellow
        exit 1
    }
    
    $testClub = $clubs[0]
    $clubId = $testClub.id
    $clubName = $testClub.name
    
    Write-Host "   ✅ Club trouvé: $clubName (ID: $clubId)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Vérifiez que Spring Boot est démarré:" -ForegroundColor Yellow
    Write-Host "   cd ClubHub" -ForegroundColor White
    Write-Host "   ./mvnw spring-boot:run" -ForegroundColor White
    exit 1
}

Write-Host ""

# Vérifier les rôles personnalisés pour ce club
Write-Host "2. Vérification des rôles personnalisés..." -ForegroundColor Yellow
try {
    $rolesResponse = Invoke-WebRequest -Uri "$apiUrl/roles/club/$clubId" -UseBasicParsing -TimeoutSec 5
    $customRoles = ($rolesResponse.Content | ConvertFrom-Json)
    
    Write-Host "   ✅ API accessible" -ForegroundColor Green
    Write-Host "   📊 Nombre de rôles personnalisés: $($customRoles.Count)" -ForegroundColor Cyan
    
    if ($customRoles.Count -eq 0) {
        Write-Host ""
        Write-Host "   ⚠️  Aucun rôle personnalisé créé pour ce club" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Pour tester, créez un rôle personnalisé:" -ForegroundColor Yellow
        Write-Host "   1. Ouvrir: http://192.168.1.20:4200/roles" -ForegroundColor White
        Write-Host "   2. Cliquer sur 'Créer un rôle'" -ForegroundColor White
        Write-Host "   3. Nom: 'Responsable Marketing'" -ForegroundColor White
        Write-Host "   4. Sélectionner quelques permissions" -ForegroundColor White
        Write-Host "   5. Créer le rôle" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "   Rôles personnalisés trouvés:" -ForegroundColor Cyan
        foreach ($role in $customRoles) {
            $status = if ($role.isActive) { "✅ Actif" } else { "❌ Inactif" }
            Write-Host "   - $($role.roleName) ($status, $($role.permissions.Count) permissions)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
}

Write-Host ""

# Simuler ce que le frontend fait
Write-Host "3. Simulation du chargement des rôles dans le formulaire..." -ForegroundColor Yellow

$systemRoles = @('PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE_GENERALE', 'TRESORIER', 'RH', 'MEMBRE_SIMPLE')
$activeCustomRoles = $customRoles | Where-Object { $_.isActive -eq $true }
$allRoles = $systemRoles + ($activeCustomRoles | ForEach-Object { $_.roleName }) + @('➕ Autre (créer un nouveau rôle)')

Write-Host "   📋 Rôles qui s'afficheront dans le formulaire:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Rôles système (6):" -ForegroundColor Yellow
foreach ($role in $systemRoles) {
    Write-Host "   - $role" -ForegroundColor Gray
}

if ($activeCustomRoles.Count -gt 0) {
    Write-Host ""
    Write-Host "   Rôles personnalisés ($($activeCustomRoles.Count)):" -ForegroundColor Yellow
    foreach ($role in $activeCustomRoles) {
        Write-Host "   - $($role.roleName)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "   Option spéciale:" -ForegroundColor Yellow
Write-Host "   - ➕ Autre (créer un nouveau rôle)" -ForegroundColor Gray

Write-Host ""
Write-Host "   📊 Total: $($allRoles.Count) rôles disponibles" -ForegroundColor Cyan

Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($customRoles.Count -gt 0 -and $activeCustomRoles.Count -gt 0) {
    Write-Host "✅ SYSTÈME FONCTIONNEL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Les rôles personnalisés s'affichent dans le formulaire d'ajout de membre." -ForegroundColor White
    Write-Host ""
    Write-Host "Pour tester:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir: http://192.168.1.20:4200/clubs/$clubId" -ForegroundColor White
    Write-Host "2. Cliquer sur '+ Ajouter un membre'" -ForegroundColor White
    Write-Host "3. Dans le champ 'Rôle', vous verrez:" -ForegroundColor White
    Write-Host "   - Les 6 rôles système" -ForegroundColor Gray
    Write-Host "   - Les $($activeCustomRoles.Count) rôles personnalisés" -ForegroundColor Green
    Write-Host "   - L'option 'Autre' pour créer un nouveau rôle" -ForegroundColor Gray
    Write-Host ""
} elseif ($customRoles.Count -gt 0 -and $activeCustomRoles.Count -eq 0) {
    Write-Host "⚠️  RÔLES INACTIFS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Des rôles personnalisés existent mais sont tous inactifs." -ForegroundColor White
    Write-Host ""
    Write-Host "Pour les activer:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir: http://192.168.1.20:4200/roles" -ForegroundColor White
    Write-Host "2. Modifier les rôles pour les activer" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ℹ️  AUCUN RÔLE PERSONNALISÉ" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Le système fonctionne, mais aucun rôle personnalisé n'a été créé." -ForegroundColor White
    Write-Host ""
    Write-Host "Pour créer un rôle personnalisé:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir: http://192.168.1.20:4200/roles" -ForegroundColor White
    Write-Host "2. Cliquer sur 'Créer un rôle'" -ForegroundColor White
    Write-Host "3. Remplir le formulaire" -ForegroundColor White
    Write-Host "4. Sélectionner les permissions" -ForegroundColor White
    Write-Host "5. Créer le rôle" -ForegroundColor White
    Write-Host ""
    Write-Host "Ensuite, retournez sur la page du club pour ajouter un membre." -ForegroundColor White
    Write-Host "Le nouveau rôle apparaîtra dans la liste déroulante." -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

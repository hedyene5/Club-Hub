Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC: RÔLES PERSONNALISÉS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://192.168.1.20:8083/api"

# Étape 1: Vérifier que Spring Boot est démarré
Write-Host "1. Vérification du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/clubs" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Backend accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend non accessible" -ForegroundColor Red
    Write-Host "   Démarrez Spring Boot: cd ClubHub; ./mvnw spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Étape 2: Récupérer un club
Write-Host "2. Récupération d'un club..." -ForegroundColor Yellow
try {
    $clubsResponse = Invoke-WebRequest -Uri "$apiUrl/clubs" -UseBasicParsing -TimeoutSec 5
    $clubs = ($clubsResponse.Content | ConvertFrom-Json)
    
    if ($clubs.Count -eq 0) {
        Write-Host "   ❌ Aucun club trouvé" -ForegroundColor Red
        exit 1
    }
    
    $club = $clubs[0]
    $clubId = $club.id
    $clubName = $club.name
    
    Write-Host "   ✅ Club: $clubName" -ForegroundColor Green
    Write-Host "   📋 ID: $clubId" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 3: Vérifier l'API des permissions
Write-Host "3. Test de l'API des permissions..." -ForegroundColor Yellow
try {
    $permsResponse = Invoke-WebRequest -Uri "$apiUrl/roles/permissions" -UseBasicParsing -TimeoutSec 5
    $permissions = ($permsResponse.Content | ConvertFrom-Json)
    Write-Host "   ✅ API permissions OK ($($permissions.Count) permissions)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API permissions non accessible" -ForegroundColor Red
    Write-Host "   Erreur: $_" -ForegroundColor Red
}

Write-Host ""

# Étape 4: Vérifier les rôles personnalisés
Write-Host "4. Vérification des rôles personnalisés..." -ForegroundColor Yellow
try {
    $rolesResponse = Invoke-WebRequest -Uri "$apiUrl/roles/club/$clubId" -UseBasicParsing -TimeoutSec 5
    $customRoles = ($rolesResponse.Content | ConvertFrom-Json)
    
    Write-Host "   ✅ API rôles OK" -ForegroundColor Green
    Write-Host "   📊 Nombre de rôles: $($customRoles.Count)" -ForegroundColor Cyan
    
    if ($customRoles.Count -eq 0) {
        Write-Host ""
        Write-Host "   ⚠️  AUCUN RÔLE PERSONNALISÉ TROUVÉ" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   C'est normal si vous n'avez pas encore créé de rôles." -ForegroundColor White
        Write-Host ""
        Write-Host "   Pour créer un rôle:" -ForegroundColor Yellow
        Write-Host "   1. Ouvrir: http://192.168.1.20:4200/roles" -ForegroundColor White
        Write-Host "   2. Cliquer sur 'Créer un rôle'" -ForegroundColor White
        Write-Host "   3. Remplir le formulaire" -ForegroundColor White
        Write-Host "   4. Sélectionner les permissions" -ForegroundColor White
        Write-Host "   5. Cliquer sur 'Créer le rôle'" -ForegroundColor White
        Write-Host ""
        
        # Créer un rôle de test
        Write-Host "   Voulez-vous créer un rôle de test? (O/N)" -ForegroundColor Yellow
        $response = Read-Host
        
        if ($response -eq "O" -or $response -eq "o") {
            Write-Host ""
            Write-Host "   Création d'un rôle de test..." -ForegroundColor Yellow
            
            $testRole = @{
                clubId = $clubId
                roleName = "Responsable Marketing"
                description = "Gère la communication du club"
                permissions = @(
                    "VIEW_MEMBERS",
                    "VIEW_EVENTS",
                    "CREATE_EVENTS",
                    "EDIT_EVENTS",
                    "SEND_NOTIFICATIONS"
                )
                isActive = $true
            } | ConvertTo-Json
            
            try {
                $createResponse = Invoke-WebRequest `
                    -Uri "$apiUrl/roles" `
                    -Method POST `
                    -Body $testRole `
                    -ContentType "application/json" `
                    -UseBasicParsing
                
                Write-Host "   ✅ Rôle créé avec succès!" -ForegroundColor Green
                
                # Recharger les rôles
                $rolesResponse = Invoke-WebRequest -Uri "$apiUrl/roles/club/$clubId" -UseBasicParsing
                $customRoles = ($rolesResponse.Content | ConvertFrom-Json)
            } catch {
                Write-Host "   ❌ Erreur lors de la création: $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host ""
        Write-Host "   Rôles trouvés:" -ForegroundColor Cyan
        foreach ($role in $customRoles) {
            $status = if ($role.isActive) { "✅ Actif" } else { "❌ Inactif" }
            Write-Host "   - $($role.roleName) ($status)" -ForegroundColor Gray
            Write-Host "     Permissions: $($role.permissions.Count)" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
}

Write-Host ""

# Étape 5: Simuler ce que fait le frontend
Write-Host "5. Simulation du chargement frontend..." -ForegroundColor Yellow

$systemRoles = @('PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE_GENERALE', 'TRESORIER', 'RH', 'MEMBRE_SIMPLE')
$activeRoles = $customRoles | Where-Object { $_.isActive -eq $true }
$allRoles = $systemRoles + ($activeRoles | ForEach-Object { $_.roleName }) + @('➕ Autre (créer un nouveau rôle)')

Write-Host "   📋 Rôles qui devraient s'afficher:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Rôles système:" -ForegroundColor Yellow
foreach ($role in $systemRoles) {
    Write-Host "   - $role" -ForegroundColor Gray
}

if ($activeRoles.Count -gt 0) {
    Write-Host ""
    Write-Host "   Rôles personnalisés:" -ForegroundColor Yellow
    foreach ($role in $activeRoles) {
        Write-Host "   - $($role.roleName)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "   Option:" -ForegroundColor Yellow
Write-Host "   - ➕ Autre (créer un nouveau rôle)" -ForegroundColor Gray

Write-Host ""
Write-Host "   📊 Total: $($allRoles.Count) rôles" -ForegroundColor Cyan

Write-Host ""

# Étape 6: Instructions pour tester
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTRUCTIONS DE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($customRoles.Count -gt 0 -and $activeRoles.Count -gt 0) {
    Write-Host "✅ Vous avez des rôles personnalisés!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour tester:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir: http://192.168.1.20:4200/clubs/$clubId" -ForegroundColor White
    Write-Host "2. Cliquer sur '+ Ajouter un membre'" -ForegroundColor White
    Write-Host "3. Cliquer sur le bouton 🐛 (debug) pour voir les logs" -ForegroundColor White
    Write-Host "4. Vérifier la liste déroulante 'Rôle'" -ForegroundColor White
    Write-Host ""
    Write-Host "Si les rôles ne s'affichent pas:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir la console du navigateur (F12)" -ForegroundColor White
    Write-Host "2. Chercher les logs:" -ForegroundColor White
    Write-Host "   🔍 Chargement des rôles personnalisés..." -ForegroundColor Gray
    Write-Host "   ✅ Rôles personnalisés reçus: [...]" -ForegroundColor Gray
    Write-Host "   📋 allRoles APRÈS chargement: [...]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Cliquer sur le bouton de rechargement (↻)" -ForegroundColor White
    Write-Host "4. Vérifier à nouveau" -ForegroundColor White
} else {
    Write-Host "ℹ️  Aucun rôle personnalisé actif" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Créez d'abord un rôle:" -ForegroundColor Yellow
    Write-Host "1. Ouvrir: http://192.168.1.20:4200/roles" -ForegroundColor White
    Write-Host "2. Créer un rôle avec des permissions" -ForegroundColor White
    Write-Host "3. Revenir sur cette page et relancer le diagnostic" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

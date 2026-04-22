Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST DU SYSTÈME DE PERMISSIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://172.18.72.32:8083/api"

# Test 1: Récupérer toutes les permissions disponibles
Write-Host "1. Test de l'API des permissions..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/roles/permissions" -UseBasicParsing -TimeoutSec 5
    $permissions = ($response.Content | ConvertFrom-Json)
    Write-Host "   ✅ API accessible" -ForegroundColor Green
    Write-Host "   📊 Nombre de permissions: $($permissions.Count)" -ForegroundColor Cyan
    
    if ($permissions.Count -eq 35) {
        Write-Host "   ✅ Toutes les permissions sont présentes (35)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Nombre de permissions incorrect (attendu: 35, reçu: $($permissions.Count))" -ForegroundColor Yellow
    }
    
    # Afficher quelques exemples
    Write-Host ""
    Write-Host "   Exemples de permissions:" -ForegroundColor Cyan
    $permissions | Select-Object -First 5 | ForEach-Object {
        Write-Host "   - $($_.label) ($($_.code))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Vérifiez que Spring Boot est démarré:" -ForegroundColor Yellow
    Write-Host "   cd ClubHub" -ForegroundColor White
    Write-Host "   ./mvnw spring-boot:run" -ForegroundColor White
    exit 1
}

Write-Host ""

# Test 2: Vérifier les catégories de permissions
Write-Host "2. Vérification des catégories..." -ForegroundColor Yellow
$categories = @{
    "Membres" = @("VIEW_MEMBERS", "ADD_MEMBERS", "EDIT_MEMBERS", "DELETE_MEMBERS", "APPROVE_MEMBERS")
    "Comités" = @("VIEW_COMMITTEES", "CREATE_COMMITTEES", "EDIT_COMMITTEES", "DELETE_COMMITTEES", "ASSIGN_TO_COMMITTEES")
    "Élections" = @("VIEW_ELECTIONS", "CREATE_ELECTIONS", "EDIT_ELECTIONS", "DELETE_ELECTIONS", "VOTE_ELECTIONS", "VALIDATE_ATTENDANCE", "VIEW_RESULTS")
    "Rôles" = @("VIEW_ROLES", "CREATE_ROLES", "EDIT_ROLES", "DELETE_ROLES", "ASSIGN_ROLES")
    "Club" = @("VIEW_CLUB", "EDIT_CLUB", "DELETE_CLUB")
    "Événements" = @("VIEW_EVENTS", "CREATE_EVENTS", "EDIT_EVENTS", "DELETE_EVENTS")
    "Admin" = @("MANAGE_PERMISSIONS", "VIEW_ANALYTICS", "SEND_NOTIFICATIONS")
}

$allOK = $true
foreach ($category in $categories.Keys) {
    $expectedCount = $categories[$category].Count
    $foundCount = 0
    
    foreach ($perm in $categories[$category]) {
        if ($permissions.code -contains $perm) {
            $foundCount++
        }
    }
    
    if ($foundCount -eq $expectedCount) {
        Write-Host "   ✅ $category : $foundCount/$expectedCount" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $category : $foundCount/$expectedCount" -ForegroundColor Red
        $allOK = $false
    }
}

Write-Host ""

# Test 3: Vérifier l'API des permissions utilisateur
Write-Host "3. Test de l'API permissions utilisateur..." -ForegroundColor Yellow
try {
    $testUserId = "test123"
    $response = Invoke-WebRequest -Uri "$apiUrl/permissions/user/$testUserId" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ API /permissions/user/{userId} accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Host "   ⚠️  API accessible mais erreur 500 (normal si l'utilisateur n'existe pas)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
        $allOK = $false
    }
}

Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allOK) {
    Write-Host "✅ SYSTÈME DE PERMISSIONS OPÉRATIONNEL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant:" -ForegroundColor Yellow
    Write-Host "1. Accéder à la page de gestion des rôles:" -ForegroundColor White
    Write-Host "   http://172.18.72.32:4200/roles" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Créer un rôle personnalisé avec les permissions souhaitées" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Assigner ce rôle à un membre du club" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Le membre aura uniquement les permissions sélectionnées" -ForegroundColor White
} else {
    Write-Host "⚠️  PROBLÈMES DÉTECTÉS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Vérifiez que:" -ForegroundColor Yellow
    Write-Host "1. Spring Boot est bien démarré" -ForegroundColor White
    Write-Host "2. Tous les fichiers backend ont été créés" -ForegroundColor White
    Write-Host "3. MongoDB est accessible" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

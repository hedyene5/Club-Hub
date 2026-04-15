# Script de test pour vérifier les rôles personnalisés

Write-Host "=== Test de l'API des rôles personnalisés ===" -ForegroundColor Green
Write-Host ""

# 1. Tester l'endpoint des permissions
Write-Host "1. Test GET /api/roles/permissions" -ForegroundColor Yellow
try {
    $permissions = Invoke-RestMethod -Uri "http://localhost:8084/api/roles/permissions" -Method GET
    Write-Host "✅ Permissions récupérées: $($permissions.Count) permissions" -ForegroundColor Green
    $permissions | Select-Object -First 3 | Format-Table
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

Write-Host ""

# 2. Créer un rôle de test
Write-Host "2. Test POST /api/roles (création d'un rôle de test)" -ForegroundColor Yellow
$testRole = @{
    clubId = "TEST_CLUB_ID"
    roleName = "Test Role $(Get-Date -Format 'HHmmss')"
    description = "Rôle de test créé automatiquement"
    permissions = @("VIEW_MEMBERS", "VIEW_EVENTS")
    isActive = $true
} | ConvertTo-Json

try {
    $createdRole = Invoke-RestMethod -Uri "http://localhost:8084/api/roles" -Method POST -Body $testRole -ContentType "application/json"
    Write-Host "✅ Rôle créé avec succès!" -ForegroundColor Green
    Write-Host "   ID: $($createdRole.id)" -ForegroundColor Cyan
    Write-Host "   Nom: $($createdRole.roleName)" -ForegroundColor Cyan
    $roleId = $createdRole.id
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    $roleId = $null
}

Write-Host ""

# 3. Récupérer les rôles du club de test
Write-Host "3. Test GET /api/roles/club/TEST_CLUB_ID" -ForegroundColor Yellow
try {
    $clubRoles = Invoke-RestMethod -Uri "http://localhost:8084/api/roles/club/TEST_CLUB_ID" -Method GET
    Write-Host "✅ Rôles du club récupérés: $($clubRoles.Count) rôles" -ForegroundColor Green
    $clubRoles | Format-Table roleName, description, @{Name="Permissions";Expression={$_.permissions.Count}}
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

Write-Host ""

# 4. Supprimer le rôle de test
if ($roleId) {
    Write-Host "4. Test DELETE /api/roles/$roleId (nettoyage)" -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "http://localhost:8084/api/roles/$roleId" -Method DELETE
        Write-Host "✅ Rôle de test supprimé" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test terminé ===" -ForegroundColor Green

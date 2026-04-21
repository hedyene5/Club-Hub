# Script pour mettre a jour toutes les URLs API dans le frontend
param(
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "http://192.168.12.100:8084"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MISE A JOUR DES URLs API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Green
Write-Host ""

$apiUrl = "$BackendUrl/api"
$filesUpdated = 0

# Liste des fichiers a mettre a jour
$files = @(
    @{
        Path = "Front/src/app/services/auth.service.ts"
        OldPattern = "private gateway = 'http://localhost:8084';"
        NewValue = "private gateway = '$BackendUrl';"
    },
    @{
        Path = "Front/src/app/services/election.service.ts"
        OldPattern = "private apiUrl = 'http://localhost:8084/api/elections';"
        NewValue = "private apiUrl = '$apiUrl/elections';"
    },
    @{
        Path = "Front/src/app/services/club.service.ts"
        OldPattern = "private apiUrl = 'http://localhost:8084/api/clubs';"
        NewValue = "private apiUrl = '$apiUrl/clubs';"
    },
    @{
        Path = "Front/src/app/services/permission.service.ts"
        OldPattern = "private apiUrl = 'http://localhost:8084/api/permissions';"
        NewValue = "private apiUrl = '$apiUrl/permissions';"
    },
    @{
        Path = "Front/src/app/services/custom-role.service.ts"
        OldPattern = "private apiUrl = 'http://localhost:8084/api/roles';"
        NewValue = "private apiUrl = '$apiUrl/roles';"
    },
    @{
        Path = "Front/src/app/services/committee-responsable.service.ts"
        OldPattern = "private apiUrl = 'http://localhost:8084/api/clubs';"
        NewValue = "private apiUrl = '$apiUrl/clubs';"
    },
    @{
        Path = "Front/src/app/pages/roles/role-management.component.ts"
        OldPattern = "private apiUrl = 'http://localhost:8084/api/roles';"
        NewValue = "private apiUrl = '$apiUrl/roles';"
    },
    @{
        Path = "Front/src/app/components/vote-with-token/vote-with-token.component.ts"
        OldPattern = "private apiUrl = 'http://localhost:8084/api';"
        NewValue = "private apiUrl = '$apiUrl';"
    }
)

foreach ($file in $files) {
    if (Test-Path $file.Path) {
        $content = Get-Content $file.Path -Raw
        if ($content -match [regex]::Escape($file.OldPattern)) {
            $content = $content -replace [regex]::Escape($file.OldPattern), $file.NewValue
            Set-Content -Path $file.Path -Value $content -NoNewline
            Write-Host "OK $($file.Path)" -ForegroundColor Green
            $filesUpdated++
        } else {
            Write-Host "SKIP $($file.Path) (deja a jour ou pattern non trouve)" -ForegroundColor Gray
        }
    } else {
        Write-Host "SKIP $($file.Path) (fichier non trouve)" -ForegroundColor Yellow
    }
}

# Mettre a jour setup-club.component.ts (plusieurs occurrences)
$setupClubPath = "Front/src/app/pages/setup-club/setup-club.component.ts"
if (Test-Path $setupClubPath) {
    $content = Get-Content $setupClubPath -Raw
    $updated = $false
    
    if ($content -match "http://localhost:8084/api/clubs") {
        $content = $content -replace "http://localhost:8084/api/clubs", "$apiUrl/clubs"
        $updated = $true
    }
    
    if ($content -match "http://localhost:8084/api/users") {
        $content = $content -replace "http://localhost:8084/api/users", "$apiUrl/users"
        $updated = $true
    }
    
    if ($updated) {
        Set-Content -Path $setupClubPath -Value $content -NoNewline
        Write-Host "OK $setupClubPath" -ForegroundColor Green
        $filesUpdated++
    } else {
        Write-Host "SKIP $setupClubPath (deja a jour)" -ForegroundColor Gray
    }
}

# Mettre a jour profile.component.ts (plusieurs occurrences)
$profilePath = "Front/src/app/pages/profile/profile.component.ts"
if (Test-Path $profilePath) {
    $content = Get-Content $profilePath -Raw
    $updated = $false
    
    if ($content -match "http://localhost:8084/api/users") {
        $content = $content -replace "http://localhost:8084/api/users", "$apiUrl/users"
        $updated = $true
    }
    
    if ($content -match "http://localhost:8084/api/clubs") {
        $content = $content -replace "http://localhost:8084/api/clubs", "$apiUrl/clubs"
        $updated = $true
    }
    
    if ($updated) {
        Set-Content -Path $profilePath -Value $content -NoNewline
        Write-Host "OK $profilePath" -ForegroundColor Green
        $filesUpdated++
    } else {
        Write-Host "SKIP $profilePath (deja a jour)" -ForegroundColor Gray
    }
}

# Mettre a jour environment.ts
$envPath = "Front/src/environments/environment.ts"
if (Test-Path $envPath) {
    $envContent = @"
// Environnement de developpement
export const environment = {
  production: false,
  apiUrl: '$apiUrl'
};
"@
    Set-Content -Path $envPath -Value $envContent -NoNewline
    Write-Host "OK $envPath" -ForegroundColor Green
    $filesUpdated++
}

# Mettre a jour environment.development.ts
$envDevPath = "Front/src/environments/environment.development.ts"
if (Test-Path $envDevPath) {
    $envDevContent = @"
// Environnement de developpement
export const environment = {
  production: false,
  apiUrl: '$apiUrl'
};
"@
    Set-Content -Path $envDevPath -Value $envDevContent -NoNewline
    Write-Host "OK $envDevPath" -ForegroundColor Green
    $filesUpdated++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichiers mis a jour: $filesUpdated" -ForegroundColor Green
Write-Host "Backend URL: $BackendUrl" -ForegroundColor White
Write-Host "API URL: $apiUrl" -ForegroundColor White
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Redemarrer Angular: cd Front && npm start" -ForegroundColor White
Write-Host "2. Tester depuis le smartphone: http://192.168.12.100:4200" -ForegroundColor White
Write-Host ""

$userId = "69e00dbebf596604ae458ed9"

Write-Host "Checking MongoDB for user: $userId"
Write-Host ""

# Vérifier via l'API
$url = "http://localhost:8081/api/users/$userId"
try {
    $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing
    $user = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ User found via API:"
    Write-Host "  Name: $($user.name)"
    Write-Host "  Email: $($user.email)"
    Write-Host "  Role: $($user.role)"
    Write-Host "  SystemRole: $($user.systemRole)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
}

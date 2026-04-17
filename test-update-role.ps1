$userId = "69e00dbebf596604ae458ed9"
$url = "http://localhost:8081/api/users/$userId/role"
$body = @{
    role = "Responsable media"
} | ConvertTo-Json

Write-Host "Testing role update for user: $userId"
Write-Host "URL: $url"
Write-Host "Body: $body"

try {
    $response = Invoke-WebRequest -Uri $url -Method PUT -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ Success! Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
}

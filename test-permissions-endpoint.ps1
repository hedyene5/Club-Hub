# Script de test pour l'endpoint permissions
Write-Host "=== TEST ENDPOINT PERMISSIONS ===" -ForegroundColor Cyan

$userId = "69e551d348623cdb7cf7cf1b"
$userServiceUrl = "http://192.168.1.20:8081"

Write-Host "`n1. Test User Service (port 8081)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$userServiceUrl/api/permissions/user/$userId" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ ERREUR - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n2. Test si le User Service répond..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "$userServiceUrl/api/users" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ User Service est accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ User Service n'est pas accessible" -ForegroundColor Red
}

Write-Host "`n=== FIN DES TESTS ===" -ForegroundColor Cyan

# Forsion Desktop Startup Script (PowerShell)
# Note: This app now uses the shared Forsion Backend Service
# Make sure the Backend Service is running before starting the frontend

Write-Host "🚀 Starting Forsion Desktop..." -ForegroundColor Cyan
Write-Host ""

# Check if Backend Service is accessible
Write-Host "🔍 Checking Backend Service connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend Service is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend Service is not accessible at http://localhost:3001" -ForegroundColor Yellow
    Write-Host "   Please start the Forsion Backend Service first:" -ForegroundColor Yellow
    Write-Host "   1. Navigate to the server-node directory" -ForegroundColor Yellow
    Write-Host "   2. Run: npm run dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Or update VITE_API_URL in .env.local if using a different URL" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Start frontend
Write-Host ""
Write-Host "🎨 Starting frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ Frontend started!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend Service: http://localhost:3001 (must be running separately)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: The Desktop app now uses the shared Forsion Backend Service." -ForegroundColor Yellow
Write-Host "      The local server/ directory is no longer used." -ForegroundColor Yellow
Write-Host ""
Write-Host "Close the PowerShell window to stop the frontend" -ForegroundColor Yellow






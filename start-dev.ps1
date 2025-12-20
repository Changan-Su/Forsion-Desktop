# Forsion Desktop Startup Script (PowerShell)

Write-Host "🚀 Starting Forsion Desktop..." -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is accessible
try {
    $null = Get-Command mysql -ErrorAction Stop
} catch {
    Write-Host "⚠️  MySQL is not installed or not in PATH" -ForegroundColor Yellow
    Write-Host "   Please install MySQL 8.0+ and ensure it's running" -ForegroundColor Yellow
    exit 1
}

# Start backend server
Write-Host "📦 Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ Services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close the PowerShell windows to stop services" -ForegroundColor Yellow


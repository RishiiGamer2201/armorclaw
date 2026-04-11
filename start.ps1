# ClawShield Finance — OpenClaw Integration Launcher
# Run this to start the full stack: FastAPI + OpenClaw gateway

Write-Host "🦞 Starting ClawShield Finance + OpenClaw..." -ForegroundColor Cyan

# 1. Start FastAPI backend in a new window
Write-Host "`n[1/3] Starting FastAPI backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\seast\VSCODE\claw-shield-finance'; python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 3

# 2. Start React frontend in a new window
Write-Host "[2/3] Starting React frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\seast\VSCODE\claw-shield-finance\frontend'; npm run dev"

Start-Sleep -Seconds 2

# 3. Start OpenClaw gateway in a new window
Write-Host "[3/3] Starting OpenClaw gateway on port 18789..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "openclaw gateway --port 18789 --verbose"

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "  FastAPI backend:  http://localhost:8000/docs"
Write-Host "  React dashboard:  http://localhost:5173"
Write-Host "  OpenClaw Web UI:  http://127.0.0.1:18789"
Write-Host "`nSend a message to your Telegram bot to test ClawShield via OpenClaw 🦞"

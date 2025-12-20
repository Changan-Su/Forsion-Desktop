#!/bin/bash

# Forsion Desktop Startup Script

echo "🚀 Starting Forsion Desktop..."
echo ""

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL is not installed or not in PATH"
    echo "   Please install MySQL 8.0+ and ensure it's running"
    exit 1
fi

# Start backend server
echo "📦 Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started!"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID


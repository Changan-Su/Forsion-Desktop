#!/bin/bash

# Forsion Desktop Startup Script
# Note: This app now uses the shared Forsion Backend Service
# Make sure the Backend Service is running before starting the frontend

echo "🚀 Starting Forsion Desktop..."
echo ""

# Check if Backend Service is accessible
echo "🔍 Checking Backend Service connection..."
if curl -s -f "http://localhost:3001/api/health" > /dev/null 2>&1; then
    echo "✅ Backend Service is running"
else
    echo "⚠️  Backend Service is not accessible at http://localhost:3001"
    echo "   Please start the Forsion Backend Service first:"
    echo "   1. Navigate to the server-node directory"
    echo "   2. Run: npm run dev"
    echo ""
    echo "   Or update VITE_API_URL in .env.local if using a different URL"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start frontend
echo ""
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Frontend started!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend Service: http://localhost:3001 (must be running separately)"
echo ""
echo "Note: The Desktop app now uses the shared Forsion Backend Service."
echo "      The local server/ directory is no longer used."
echo ""
echo "Press Ctrl+C to stop the frontend"
echo ""

# Wait for user interrupt
wait $FRONTEND_PID





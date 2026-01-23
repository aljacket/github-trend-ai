#!/bin/bash

echo "🚀 Starting GitHub AI Trends Development Servers..."
echo ""

# Start backend in background
echo "📦 Starting Mastra backend on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "⚛️  Starting React frontend..."
cd .. && npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT

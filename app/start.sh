#!/bin/bash
# AI R&D Department — 啟動前端+後端
set -e

echo "📦 安裝依賴..."
cd "$(dirname "$0")/backend"  && npm install --silent
cd "$(dirname "$0")/frontend" && npm install --silent

echo "🚀 啟動服務..."
cd "$(dirname "$0")"

# 後台 backend
(cd backend  && npm run dev) &
BACKEND_PID=$!

# 前台 frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "  前端 →  http://localhost:3001"
echo "  後端 →  http://localhost:3002"
echo ""
echo "  按 Ctrl+C 停止"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

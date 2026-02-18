#!/bin/sh

# Start FastAPI backend in background
uvicorn backend.main:app --host 0.0.0.0 --port 8081 &

# Start Next.js frontend (foreground)
cd /app/frontend
HOSTNAME=0.0.0.0 PORT=3000 PYTHON_API_URL=http://localhost:8081 node server.js

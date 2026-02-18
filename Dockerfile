# ── Stage 1: Build Next.js frontend ──────────────────────────
FROM node:20-alpine AS frontend-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY . .

ARG PYTHON_API_URL=http://localhost:8081
ENV NEXT_TELEMETRY_DISABLED=1
ENV PYTHON_API_URL=$PYTHON_API_URL

RUN npm run build

# ── Stage 2: Production image (Python + Node.js) ────────────
FROM python:3.13-slim

WORKDIR /app

# Install Node.js 20 + curl (for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Python backend ──────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/

# ── Next.js standalone build ────────────────────────────────
COPY --from=frontend-build /app/public ./frontend/public
COPY --from=frontend-build /app/.next/standalone ./frontend/
COPY --from=frontend-build /app/.next/static ./frontend/.next/static

# ── Directories & permissions ───────────────────────────────
RUN mkdir -p /app/backend_logs \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

USER appuser

EXPOSE 3000 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8081/health && \
        curl -f http://localhost:3000 || exit 1

CMD ["./start.sh"]

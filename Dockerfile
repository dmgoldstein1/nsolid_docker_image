# Try N-Solid runtime; fall back to official Node LTS if unavailable
FROM nodesource/nsolid:latest AS base

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=prod || npm install --only=prod

# Copy application source
COPY . .

# N-Solid runtime environment variables
ENV NSOLID_COMMAND=nsolid-console:9001
ENV NSOLID_DATA_PATH=/data/nsolid
ENV NODE_ENV=production
ENV PORT=3000

RUN mkdir -p /data/nsolid

EXPOSE 3000

# Health check for the application
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

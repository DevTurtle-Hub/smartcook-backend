# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create logs directory and ensure proper ownership for non-privileged user
RUN mkdir -p /app/logs && chown -R node:node /app

# Security: Run as non-root user
USER node

# Copy production artifacts from builder with correct ownership
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 5000

# Health check to ensure API is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-5000}/api/v1/health || exit 1

CMD ["node", "dist/server.js"]

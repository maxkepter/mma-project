# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace root package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies for the entire workspace
RUN npm ci

# Copy server source
COPY server/ ./server/

# Build the server
WORKDIR /app/server
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy workspace root package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/server/dist ./server/dist

WORKDIR /app/server

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/main"]

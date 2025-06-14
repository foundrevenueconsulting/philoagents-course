# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/lib ./lib

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S colyseus -u 1001

# Change ownership of the app directory
RUN chown -R colyseus:nodejs /app
USER colyseus

# Expose port (Railway will provide PORT env var)
EXPOSE ${PORT:-2567}

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: '0.0.0.0', port: process.env.PORT || 2567, timeout: 2000, path: '/health' }; const request = http.request(options, (res) => { console.log('Health check status:', res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1); }); request.on('error', () => process.exit(1)); request.end();"

# Start the application
CMD ["node", "lib/index.js"]
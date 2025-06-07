FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build)
RUN npm ci

# Copy project files
COPY . .

# Build the application (without logging to avoid external requests)
RUN npm run build-nolog

FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration and health check script
COPY nginx.conf /etc/nginx/nginx.conf
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Add debugging and start nginx with verbose logging
CMD nginx -t && \
    echo "=== Nginx config test passed ===" && \
    echo "=== Files in /usr/share/nginx/html ===" && \
    ls -la /usr/share/nginx/html && \
    echo "=== Starting nginx with debug logging ===" && \
    nginx -g "daemon off; error_log /var/log/nginx/error.log debug;" || \
    (echo "=== Nginx failed to start, showing logs ===" && \
     cat /var/log/nginx/error.log && \
     exit 1)
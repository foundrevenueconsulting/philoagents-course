#!/bin/sh
echo "=== Health Check Start ==="
echo "Container uptime: $(uptime)"
echo "Nginx processes: $(ps aux | grep nginx)"
echo "Port 80 status: $(netstat -ln | grep :80 || echo 'Port 80 not listening')"
echo "Testing local HTTP request:"
curl -f http://localhost:80/ || echo "HTTP request failed"
echo "=== Health Check End ==="
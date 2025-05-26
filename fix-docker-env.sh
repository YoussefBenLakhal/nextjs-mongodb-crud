#!/bin/bash

echo "🔧 Fixing Docker Connection Issues"
echo "=================================="

# Stop all containers
echo "1. Stopping all containers..."
docker-compose down
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove the problematic container
echo "2. Removing old containers..."
docker rm inspiring_panini 2>/dev/null || true
docker rmi your-app-name 2>/dev/null || true

# Build fresh
echo "3. Building fresh container..."
docker-compose build --no-cache

# Start with proper restart policy
echo "4. Starting container with restart policy..."
docker-compose up -d

# Wait for startup
echo "5. Waiting for container to start..."
sleep 10

# Check container status
echo "6. Checking container status..."
docker-compose ps

# Check if container is running
CONTAINER_ID=$(docker-compose ps -q)
if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Container failed to start"
    echo "Logs:"
    docker-compose logs
    exit 1
fi

# Check container logs
echo "7. Container logs:"
docker-compose logs --tail 20

# Test connection
echo "8. Testing connection..."
sleep 5
curl -f http://localhost:3000 && echo "✅ Connection successful!" || echo "❌ Connection failed"

echo ""
echo "🎯 If still not working, try:"
echo "   docker-compose logs -f    (to see live logs)"
echo "   docker-compose restart    (to restart container)"

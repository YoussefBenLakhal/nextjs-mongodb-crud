#!/bin/bash

echo "🧹 Cleaning up Docker resources..."

# Stop all containers
docker-compose down

# Remove unused images and containers
docker system prune -f

echo "✅ Docker cleanup completed!"

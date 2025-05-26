#!/bin/bash

echo "🚀 Starting School Management System with proper MongoDB connection..."

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Remove the old image to force rebuild
echo "Removing old image..."
docker rmi your-app-name 2>/dev/null || true

# Build and start with docker-compose (this ensures env vars are passed correctly)
echo "Building and starting with docker-compose..."
docker-compose up --build

echo "✅ Application should be available at http://localhost:3000"

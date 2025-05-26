#!/bin/bash

echo "📋 Showing Docker container logs..."

# Show logs for the running container
docker-compose logs -f app

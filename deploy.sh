#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment script..."

# 1. Run migrations
# The --force flag is required for production
echo "Running migrations..."
php artisan migrate --force

# 2. (Optional) Clear and cache for speed
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache

# 3. Start Apache
# This is the most important line to keep the container running
echo "Starting Apache..."
exec apache2-foreground

#!/bin/sh
set -e

# Install dependencies if node_modules is empty (first run with named volume)
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "node_modules is empty, running npm install..."
  npm install
fi

# Create uploads directory
mkdir -p /app/uploads
mkdir -p /app/.ebay-session

exec "$@"

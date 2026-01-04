#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "Starting application..."
exec "$@"

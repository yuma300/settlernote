#!/bin/sh

# This script runs as a background process to handle cron jobs

if [ "${BACKUP_ENABLED:-false}" != "true" ]; then
  echo "Backup is not enabled. Set BACKUP_ENABLED=true to enable."
  exit 0
fi

BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"

echo "Starting cron daemon for backups..."
echo "Schedule: ${BACKUP_SCHEDULE}"

# Run backup script on schedule using simple while loop
while true; do
  # Calculate seconds until next scheduled time
  # For simplicity, we'll use a fixed interval approach
  # Default: run once per day (86400 seconds)
  INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"

  echo "[$(date)] Waiting ${INTERVAL_SECONDS} seconds until next backup..."
  sleep "${INTERVAL_SECONDS}"

  echo "[$(date)] Running scheduled backup..."
  /app/scripts/backup.sh
done

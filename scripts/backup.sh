#!/bin/sh
set -e

# Configuration
BACKUP_DIR="/app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="settlernote_backup_${TIMESTAMP}.sql.gz"
DAYS_TO_KEEP=7

# Database credentials from environment
DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-settlernote}"
DB_USER="${MYSQL_USER:-settlernote}"
DB_PASSWORD="${MYSQL_PASSWORD}"

# Google Drive remote name (configured via rclone)
GDRIVE_REMOTE="${GDRIVE_REMOTE:-gdrive}"
GDRIVE_FOLDER="${GDRIVE_FOLDER:-settlernote-backups}"

echo "[$(date)] Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create MySQL dump and compress
echo "[$(date)] Creating database dump..."
mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --skip-ssl \
  "$DB_NAME" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[$(date)] Database dump created: ${BACKUP_FILE}"
  BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
  echo "[$(date)] Backup size: ${BACKUP_SIZE}"
else
  echo "[$(date)] ERROR: Failed to create database dump"
  exit 1
fi

# Upload to Google Drive using rclone
if command -v rclone >/dev/null 2>&1; then
  echo "[$(date)] Uploading to Google Drive..."

  rclone copy \
    "${BACKUP_DIR}/${BACKUP_FILE}" \
    "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/" \
    --config /app/.config/rclone/rclone.conf \
    --progress

  if [ $? -eq 0 ]; then
    echo "[$(date)] Backup uploaded successfully to Google Drive"
  else
    echo "[$(date)] WARNING: Failed to upload to Google Drive"
  fi
else
  echo "[$(date)] WARNING: rclone not found, skipping Google Drive upload"
fi

# Clean up old local backups
echo "[$(date)] Cleaning up old local backups (keeping last ${DAYS_TO_KEEP} days)..."
find "$BACKUP_DIR" -name "settlernote_backup_*.sql.gz" -type f -mtime +${DAYS_TO_KEEP} -delete

# Clean up old Google Drive backups
if command -v rclone >/dev/null 2>&1; then
  echo "[$(date)] Cleaning up old Google Drive backups..."

  # List files older than DAYS_TO_KEEP and delete them
  rclone delete \
    "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/" \
    --min-age ${DAYS_TO_KEEP}d \
    --config /app/.config/rclone/rclone.conf
fi

echo "[$(date)] Backup process completed successfully"
echo "---"

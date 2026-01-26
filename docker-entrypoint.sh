#!/bin/sh
set -e

DB_PATH="/app/data/snippetvault.db"
SCHEMA_PATH="/app/schema.sql"

# Create data directory if it doesn't exist
mkdir -p /app/data/uploads

# Check if database exists and has tables
if [ ! -f "$DB_PATH" ]; then
    echo "[DB] Database not found, creating..."
    sqlite3 "$DB_PATH" < "$SCHEMA_PATH"
    echo "[DB] Database initialized with schema"
else
    # Check if tables exist
    TABLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users';")
    if [ "$TABLE_COUNT" -eq 0 ]; then
        echo "[DB] Database exists but no tables found, initializing schema..."
        sqlite3 "$DB_PATH" < "$SCHEMA_PATH"
        echo "[DB] Schema applied"
    else
        echo "[DB] Database already initialized"
    fi
fi

# Start the application
echo "[APP] Starting SnippetVault..."
exec node build

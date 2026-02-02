#!/bin/sh
set -e

# Create data directory if it doesn't exist
mkdir -p /app/data/uploads

# ============================================
# SECRET_KEY auto-generation
# ============================================
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY_FILE="/app/data/.secret_key"
    if [ -f "$SECRET_KEY_FILE" ]; then
        export SECRET_KEY=$(cat "$SECRET_KEY_FILE")
        echo "[AUTH] SECRET_KEY loaded from $SECRET_KEY_FILE"
    else
        export SECRET_KEY=$(openssl rand -hex 32)
        echo "$SECRET_KEY" > "$SECRET_KEY_FILE"
        chmod 600 "$SECRET_KEY_FILE"
        echo "[AUTH] SECRET_KEY auto-generated and saved to $SECRET_KEY_FILE"
    fi
fi

# ============================================
# ORIGIN configuration
# ============================================
if [ -z "$ORIGIN" ]; then
    export ORIGIN="http://0.0.0.0:3000"
    echo "[APP] ORIGIN not set, using default: $ORIGIN"
else
    echo "[APP] ORIGIN set to: $ORIGIN"
fi

# ============================================
# Default values for optional variables
# ============================================
export UPLOAD_MAX_SIZE="${UPLOAD_MAX_SIZE:-52428800}"
export SHOW_LANDING_PAGE="${SHOW_LANDING_PAGE:-false}"
export AUTO_CREATE_ADMIN="${AUTO_CREATE_ADMIN:-true}"

# ============================================
# Database initialization
# ============================================
DB_PATH="/app/data/snippetvault.db"
SCHEMA_PATH="/app/schema.sql"

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

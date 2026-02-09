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

# ============================================
# Auto-apply Drizzle migrations
# ============================================
MIGRATIONS_DIR="/app/drizzle"

if [ -d "$MIGRATIONS_DIR" ]; then
    # Check if this is a first-time setup of migration tracking
    HAS_TRACKING=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='_drizzle_migrations';")

    # Create tracking table if it doesn't exist
    sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );"

    # Bootstrap: if DB already has tables but no migration tracking,
    # mark the initial schema migration (0000) as applied since schema.sql already covers it
    if [ "$HAS_TRACKING" -eq 0 ]; then
        INITIAL_MIGRATION=$(ls "$MIGRATIONS_DIR"/0000_*.sql 2>/dev/null | head -1)
        if [ -n "$INITIAL_MIGRATION" ]; then
            INIT_NAME=$(basename "$INITIAL_MIGRATION")
            HAS_TABLES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users';")
            if [ "$HAS_TABLES" -gt 0 ]; then
                sqlite3 "$DB_PATH" "INSERT OR IGNORE INTO _drizzle_migrations (migration_name) VALUES ('$INIT_NAME');"
                echo "[MIGRATE] Bootstrap: marked $INIT_NAME as applied (schema.sql)"
            fi
        fi
    fi

    # Collect pending migrations
    PENDING=""
    for f in "$MIGRATIONS_DIR"/*.sql; do
        [ -f "$f" ] || continue
        MIGRATION_NAME=$(basename "$f")
        ALREADY=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM _drizzle_migrations WHERE migration_name='$MIGRATION_NAME';")
        if [ "$ALREADY" -eq 0 ]; then
            PENDING="$PENDING $f"
        fi
    done

    if [ -z "$PENDING" ]; then
        echo "[MIGRATE] Database is up to date"
    else
        # Backup before applying migrations
        BACKUP_PATH="${DB_PATH}.bak-$(date +%Y%m%d-%H%M%S)"
        cp "$DB_PATH" "$BACKUP_PATH"
        echo "[MIGRATE] Backup created: $BACKUP_PATH"

        for f in $PENDING; do
            MIGRATION_NAME=$(basename "$f")
            echo "[MIGRATE] Applying: $MIGRATION_NAME"

            # Replace Drizzle statement breakpoints with newlines, then execute
            sed 's/--> statement-breakpoint//' "$f" | sqlite3 "$DB_PATH"

            if [ $? -eq 0 ]; then
                sqlite3 "$DB_PATH" "INSERT INTO _drizzle_migrations (migration_name) VALUES ('$MIGRATION_NAME');"
                echo "[MIGRATE] Applied: $MIGRATION_NAME"
            else
                echo "[MIGRATE] ERROR applying $MIGRATION_NAME — restoring backup"
                cp "$BACKUP_PATH" "$DB_PATH"
                exit 1
            fi
        done
    fi
fi

# Start the application
echo "[APP] Starting SnippetVault..."
exec node build

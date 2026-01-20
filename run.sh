#!/bin/bash
set -e

# Default values
PORT=${PORT:-9847}
DB_PATH=${DB_PATH:-webhook-tester.db}

# Check if binary exists
if [ ! -f "./webhook-tester" ]; then
    echo "Binary not found. Building first..."
    ./build.sh
fi

echo "Starting Webhook Tester..."
echo "  Port: $PORT"
echo "  Database: $DB_PATH"
echo ""

PORT=$PORT DB_PATH=$DB_PATH ./webhook-tester

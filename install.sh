#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Webhook Tester Installer ===${NC}"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case $ARCH in
    x86_64) ARCH="amd64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) echo -e "${RED}Unsupported architecture: $ARCH${NC}"; exit 1 ;;
esac

echo -e "${YELLOW}Detected: $OS ($ARCH)${NC}"

# Check dependencies
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is required but not installed.${NC}"
        exit 1
    fi
}

echo "Checking dependencies..."
check_command go
check_command node
check_command npm

echo -e "${GREEN}All dependencies found!${NC}"

# Build frontend
echo ""
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm install --silent
npm run build
cd ..

# Build backend
echo ""
echo -e "${YELLOW}Building backend...${NC}"
CGO_ENABLED=1 go build -o webhook-tester

# Success
echo ""
echo -e "${GREEN}=== Build Complete ===${NC}"
echo ""
echo "Binary created: ./webhook-tester"
echo ""
echo "Usage:"
echo "  ./webhook-tester                    # Run on default port 9847"
echo "  PORT=8080 ./webhook-tester          # Run on custom port"
echo "  DB_PATH=/data/app.db ./webhook-tester  # Custom database path"
echo ""
echo -e "${GREEN}Run './webhook-tester' to start the server${NC}"

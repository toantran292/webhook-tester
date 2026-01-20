#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm install --silent
npm run build

echo -e "${YELLOW}Building Go binary...${NC}"
cd ..
CGO_ENABLED=1 go build -o webhook-tester

SIZE=$(du -h webhook-tester | cut -f1)
echo -e "${GREEN}Done! Binary: ./webhook-tester ($SIZE)${NC}"

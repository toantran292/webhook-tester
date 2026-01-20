#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm install --silent
npm run build

echo "Building Go binary..."
cd ..
go build -o webhook-tester

echo "Done! Binary: ./webhook-tester ($(du -h webhook-tester | cut -f1))"

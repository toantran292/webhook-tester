# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Webhook Tester is a full-stack application for testing and debugging webhooks. Users can create disposable webhook endpoints, capture incoming requests, and inspect their details in real-time via Server-Sent Events (SSE).

## Build & Run Commands

### Backend (Go)
```bash
go build -o webhook-tester main.go   # Build binary
go run main.go                        # Run development server
```

Environment variables:
- `PORT` - Server port (default: 9847)
- `DB_PATH` - SQLite database path (default: webhook-tester.db)

### Frontend (React + Vite)
```bash
cd frontend
npm install                  # Install dependencies
npm run dev                  # Start dev server (port 3000, proxies to backend)
npm run build                # Build for production (outputs to ../static/)
```

## Architecture

### Backend Structure (`/`)
- **main.go** - Entry point: initializes database, SSE broker, and Gin router
- **internal/database/** - GORM SQLite initialization with auto-migration
- **internal/models/** - Data models: `Endpoint` (webhook config), `Request` (captured data)
- **internal/handlers/** - HTTP handlers split by domain:
  - `endpoints.go` - CRUD for webhook endpoints
  - `webhook.go` - Receives webhooks at `/hook/:slug`
  - `requests.go` - Lists captured requests
  - `sse.go` - Server-Sent Events stream
- **internal/sse/** - Pub/sub event broker for real-time notifications

### Frontend Structure (`/frontend/src/`)
- **App.tsx** - Main component with state management
- **components/** - Layout, EndpointList, EndpointForm, RequestList, RequestDetail
- **hooks/useSSE.ts** - Custom hook for EventSource connection with auto-reconnect
- **api/client.ts** - TypeScript API client with type definitions

### API Routes
- `GET/POST /api/endpoints/` - List/create endpoints
- `GET/PUT/DELETE /api/endpoints/:id` - Single endpoint operations
- `GET /api/endpoints/:id/requests` - List captured requests
- `DELETE /api/requests/:id` - Delete single request
- `ALL /hook/:slug` - Webhook receiver (accepts any HTTP method)
- `GET /api/sse` - SSE stream for real-time updates

### Real-time Flow
1. Webhook hits `/hook/:slug`
2. Request stored in SQLite, broadcast via SSE broker
3. Frontend receives event through `useSSE` hook
4. UI updates without page refresh

## Tech Stack

**Backend:** Go 1.21, Gin, GORM, SQLite
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS

## Deployment Model

Single binary deployment - frontend builds to `static/` which is embedded in the Go binary via `//go:embed`. No external database required.

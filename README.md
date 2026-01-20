# Webhook Tester

A self-hosted webhook testing tool. Capture, inspect, and debug HTTP requests in real-time.

## Features

- **Real-time updates** - See incoming requests instantly via Server-Sent Events (SSE)
- **Custom responses** - Configure status code, body, headers, and delay for each endpoint
- **Secret key authentication** - Protect endpoints with `X-Webhook-Secret` header validation
- **Single binary deployment** - Frontend embedded in Go binary, no separate server needed
- **SQLite database** - No external database required

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 20+
- npm

### Install & Run

```bash
# Clone the repository
git clone https://github.com/toantran292/webhook-tester.git
cd webhook-tester

# Build and run
./install.sh
./webhook-tester
```

Open http://localhost:9847 in your browser.

## Usage

### Scripts

| Script | Description |
|--------|-------------|
| `./install.sh` | Check dependencies, build frontend & backend |
| `./build.sh` | Quick build (skip dependency check) |
| `./run.sh` | Build if needed and start server |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `9847` | Server port |
| `DB_PATH` | `webhook-tester.db` | SQLite database path |

```bash
# Examples
PORT=8080 ./webhook-tester
DB_PATH=/data/webhooks.db ./webhook-tester
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/endpoints` | List all endpoints |
| `POST` | `/api/endpoints` | Create endpoint |
| `GET` | `/api/endpoints/:id` | Get endpoint |
| `PUT` | `/api/endpoints/:id` | Update endpoint |
| `DELETE` | `/api/endpoints/:id` | Delete endpoint |
| `GET` | `/api/endpoints/:id/requests` | List requests |
| `DELETE` | `/api/endpoints/:id/requests` | Clear requests |
| `ANY` | `/hook/:slug` | Webhook receiver |

### Webhook Configuration

Each endpoint can be configured with:

- **Response Status** - HTTP status code (default: 200)
- **Response Body** - Custom response body (JSON)
- **Response Delay** - Artificial delay in milliseconds
- **Secret Key** - Require `X-Webhook-Secret` header for authentication

### Example: Testing with curl

```bash
# Create an endpoint via UI, then send requests:
curl http://localhost:9847/hook/your-slug

# With secret key
curl -H "X-Webhook-Secret: your-secret" http://localhost:9847/hook/your-slug

# POST with JSON body
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"id": 123}}' \
  http://localhost:9847/hook/your-slug
```

## Tech Stack

**Backend:**
- Go + Gin (HTTP framework)
- GORM + SQLite (Database)
- Server-Sent Events (Real-time updates)

**Frontend:**
- React + TypeScript
- Tailwind CSS
- Vite (Build tool)

## Development

```bash
# Start backend (with hot reload using air)
go run main.go

# Start frontend dev server (separate terminal)
cd frontend
npm run dev
```

Frontend dev server runs on port 5847 with proxy to backend on 9847.

## License

MIT

# Ishuin NIM Proxy

Lightweight Node.js proxy that forwards `/api/chat` and `/api/audit` to NVIDIA NIM.

## Architecture

```
┌───────────┐     ┌────────────────┐     ┌─────────────┐
│   Client  │────▶│  api/index.js  │────▶│ NVIDIA NIM  │
│           │◀────│  (Vercel Fn)   │◀────│             │
└───────────┘     └────────────────┘     └─────────────┘
                        │
                        ▼
                  Route-based
                  system prompt
```

## Endpoints

### `POST /api/chat`
Returns a response with a technical-conversation system prompt.

**Request body:**
```json
{ "message": "string" }
```

### `POST /api/audit`
Returns a response with an architectural-review system prompt.

**Request body:**
```json
{ "message": "string" }
```

### `system` override
Optionally include `"system": "custom prompt"` to override the default system prompt.

## Configuration

| Variable | Purpose |
|----------|---------|
| `NIM_API_KEY` | NVIDIA NIM API key |

## Deployment

- **Vercel:** `npm run deploy`
- **Render:** push to `main` (uses `render.yaml`)

## Local

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

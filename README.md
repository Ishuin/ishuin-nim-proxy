# Ishuin NIM Proxy

Tiny FastAPI proxy that forwards `/api/chat` and `/api/audit` to NVIDIA NIM.

## Deploy

### Option A: Render (recommended, free)
1. Push this repo to GitHub.
2. Sign up at https://render.com
3. New + > Web Service > connect this repo
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add env var: `NIM_API_KEY` = your NVIDIA NIM key
7. Deploy.

### Option B: One-click from GitHub (after Render service exists)
Create these GitHub Secrets in this repo:
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

Then push to `main` to auto-deploy.

## Endpoints
- `POST /api/chat`
- `POST /api/audit`

Body: `{ "message": "..." }`

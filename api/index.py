from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import httpx
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

NIM_API_KEY = os.environ.get("NIM_API_KEY", "")
NIM_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"


@app.get("/health")
async def health():
    return {"status": "ok", "has_key": bool(NIM_API_KEY)}


@app.post("/api/chat")
async def chat(request: Request):
    try:
        body = await request.json()
        user_message = body.get("message", "")
        if not user_message:
            return JSONResponse({"error": "Missing message"}, status_code=400)

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                NIM_CHAT_URL,
                headers={
                    "Authorization": f"Bearer {NIM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "meta/llama-3.3-70b-instruct",
                    "messages": [{"role": "user", "content": user_message}],
                    "max_tokens": 512,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
        return JSONResponse({"text": text})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/audit")
async def audit(request: Request):
    try:
        body = await request.json()
        user_message = body.get("message", "")
        if not user_message:
            return JSONResponse({"error": "Missing message"}, status_code=400)

        system_prompt = """
Role: Senior System Architect / Staff Engineer.
Task: Analyze the user's technical problem description.
Output: A brief, punchy architectural recommendation. Use bold text for key patterns.
Style: Constructive, high-level, "Systems Thinking".
"""

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                NIM_CHAT_URL,
                headers={
                    "Authorization": f"Bearer {NIM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "meta/llama-3.3-70b-instruct",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 512,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
        return JSONResponse({"text": text})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

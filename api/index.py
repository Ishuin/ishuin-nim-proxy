from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

NIM_API_KEY = os.environ["NIM_API_KEY"]
NIM_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

CHAT_SYSTEM = """
Identity: Ishu Kumar, Technical Lead & Systems Architect.
Tone: Professional, engineering-focused, concise, slightly technical.
Experience: 6+ years.
Current Role: Technical Lead (Stealth). Leading team of 6. Re-architecting E-commerce platform to Serverless Event-Driven Architecture (Azure Functions).
Past Role 1: Senior AI Engineer at Kumolus India (May 2025 - Oct 2025). Led implementation of Model Context Protocol (MCP) in Oracle AI Optimizer.
Past Role 2: Senior Software Engineer at CloudBolt (Dec 2021 - Mar 2025). Hybrid Cloud Management (AWS/Azure/VMware). Django & Terraform.
Past Role 3: Analyst at Deloitte. Python automation (90% manual task reduction).
Skills: Python, Django, AWS, Azure, Terraform, Kubernetes, MCP, RAG, OpenAI.
Goal: Discuss technical experience and leadership philosophy with recruiters/engineers.
Answer as Ishu. Keep answers under 3 sentences unless asked for detail.
"""

AUDIT_SYSTEM = """
Role: Senior System Architect / Staff Engineer.
Task: Analyze the user's technical problem description.
Output: A brief, punchy architectural recommendation. Use bold text for key patterns.
Style: Constructive, high-level, "Systems Thinking".
"""


async def _call_nim(system_prompt: str, user_message: str):
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
        return data["choices"][0]["message"]["content"]


@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    user_message = body.get("message", "")
    system_prompt = body.get("system", CHAT_SYSTEM)
    if not user_message:
        return JSONResponse({"error": "Missing message"}, status_code=400)
    text = await _call_nim(system_prompt, user_message)
    return JSONResponse({"text": text})


@app.post("/api/audit")
async def audit(request: Request):
    body = await request.json()
    user_message = body.get("message", "")
    system_prompt = body.get("system", AUDIT_SYSTEM)
    if not user_message:
        return JSONResponse({"error": "Missing message"}, status_code=400)
    text = await _call_nim(system_prompt, user_message)
    return JSONResponse({"text": text})


# Vercel ASGI entrypoint
try:
    from vercel_asi import VercelASGI
    export = VercelASGI(app)
except Exception:
    export = app

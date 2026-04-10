# backend/main.py
# FastAPI application entry point for ClawShield Finance.
# Run with: python -m uvicorn backend.main:app --reload
import sys
import io
# Force UTF-8 output on Windows to avoid cp1252 encoding errors
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # Load .env from project root

from backend.core.executor import Executor
from backend.routers import agent as agent_router_module
from backend.routers.agent  import router as agent_router
from backend.routers.audit  import router as audit_router
from backend.routers.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the executor on startup."""
    executor = Executor()
    await executor.initialize()
    agent_router_module.set_executor(executor)
    print("[OK] ClawShield Finance FastAPI backend ready")
    yield
    print("[--] ClawShield Finance shutting down")


app = FastAPI(
    title="ClawShield Finance API",
    description="Intent-Aware Autonomous Financial Agent — ArmorIQ x OpenClaw Hackathon",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(agent_router)
app.include_router(audit_router)

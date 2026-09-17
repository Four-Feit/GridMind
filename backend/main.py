"""
GridMind Main Entrypoint
"""
import os
import asyncio
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.api.routes import router as api_router
from backend.api.websocket import ws_router, manager
from backend.api.service import service

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    service.set_event_loop(loop)
    service.set_ws_broadcaster(manager.broadcast_event)
    yield


app = FastAPI(
    title="GridMind API",
    description="Agent Framework & Grid Simulator API",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router)


@app.get("/")
def root():
    return {"name": "GridMind API", "status": "running", "version": "0.1.0"}


if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)

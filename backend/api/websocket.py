"""
WebSocket Manager for Agent Event Streaming (Owned by P4)
"""
import asyncio
import json
import logging
from typing import Any, Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("gridmind.websocket")

ws_router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections and handles event broadcasting."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected. Total connections: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected. Remaining connections: %d", len(self.active_connections))

    async def broadcast_event(self, event_data: Dict[str, Any]):
        """Broadcasts an event to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(event_data)
            except Exception as e:
                logger.warning("Failed to send to client: %s", e)
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Import lazily to avoid circular dependencies
        from backend.api.service import service

        # Send initial welcome state immediately upon connection
        init_payload = {
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to GridMind real-time telemetry feed",
            "grid_state": service.get_grid_state(),
            "agent_state": service.get_agent_state(),
            "recent_events": service.get_events()[-15:]
        }
        await websocket.send_json(init_payload)

        while True:
            # Listen for client messages (e.g., ping/pong or client commands)
            text_data = await websocket.receive_text()
            try:
                msg = json.loads(text_data)
                action = msg.get("action")
                if action == "ping":
                    await websocket.send_json({"type": "PONG", "timestamp": msg.get("timestamp")})
                elif action == "get_state":
                    await websocket.send_json({
                        "type": "STATE_SNAPSHOT",
                        "grid_state": service.get_grid_state(),
                        "agent_state": service.get_agent_state()
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning("WebSocket exception: %s", e)
        manager.disconnect(websocket)

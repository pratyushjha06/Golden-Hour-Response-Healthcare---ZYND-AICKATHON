from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.orchestrator.orchestrator import orchestrator
import json

router = APIRouter()

class ConnectionManager:
    """Manages active WebSocket connections"""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, websocket: WebSocket, message: dict):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/emergency/{emergency_id}")
async def emergency_websocket(websocket: WebSocket, emergency_id: str):
    """
    WebSocket endpoint for real-time emergency updates
    """
    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            request_data = json.loads(data)

            await manager.send_message(websocket, {
                "status": "received",
                "message": f"Emergency request received for {emergency_id}"
            })

            # --- Create dummy request object to pass to orchestrator ---
            class DummyRequest:
                def __init__(self, payload):
                    self.location = type("obj", (), payload["location"])
                    self.symptoms = payload["symptoms"]
                    self.vitals = payload["vitals"]
                    self.age = payload["age"]
                    self.description = payload["description"]
                    self.contact_email = payload["contact_email"]

            dummy_request = DummyRequest(request_data)

            # Run orchestrator (no background tasks for WS)
            response = await orchestrator.handle_emergency(
                dummy_request,
                background_tasks=None
            )

            await manager.send_message(websocket, {
                "status": "completed",
                "data": response
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"WebSocket disconnected: {emergency_id}")

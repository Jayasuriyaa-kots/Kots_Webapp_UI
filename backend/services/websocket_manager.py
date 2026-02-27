from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # dictionary where key is booking_id and value is a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, booking_id: str):
        await websocket.accept()
        if booking_id not in self.active_connections:
            self.active_connections[booking_id] = []
        self.active_connections[booking_id].append(websocket)
        logger.info(f"WebSocket connected for booking: {booking_id}. Total connections for this id: {len(self.active_connections[booking_id])}")

    def disconnect(self, websocket: WebSocket, booking_id: str):
        if booking_id in self.active_connections:
            if websocket in self.active_connections[booking_id]:
                self.active_connections[booking_id].remove(websocket)
                if not self.active_connections[booking_id]:
                    del self.active_connections[booking_id]
            logger.info(f"WebSocket disconnected for booking: {booking_id}")

    async def broadcast_to_booking(self, booking_id: str, message: dict):
        """Send a message to all active sessions for a specific booking_id."""
        if booking_id in self.active_connections:
            # We iterate over a copy to avoid issues if a connection drops during iteration
            for connection in self.active_connections[booking_id][:]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Error sending message to WebSocket for booking {booking_id}: {e}")
                    # Auto-cleanup on failure
                    self.disconnect(connection, booking_id)

manager = ConnectionManager()

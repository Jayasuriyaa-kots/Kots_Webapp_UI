from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import get_db, SessionLocal
from routes.bookings import router as bookings_router
from routes.tenant import router as tenant_router
from routes.contract_documents import router as contract_documents_router
from routes.parking import router as parking_router
from routes.referral import router as referral_router
from routes.ticket import router as ticket_router
from routes.invoices import router as invoices_router
from routes.wifi import router as wifi_router
from routes.occupancy import router as occupancy_router
from routes.notification import router as notification_router
from services.email_service import sync_sign_request_emails
from services.ticket_email_sync import sync_ticket_emails
from services.websocket_manager import manager
from fastapi import WebSocket, WebSocketDisconnect

# Initialize scheduler
scheduler = AsyncIOScheduler()

def run_email_sync_job():
    """Background job to sync emails"""
    db = SessionLocal()
    try:
        sync_sign_request_emails(db)
    except Exception as e:
        print(f"Error in email sync job: {e}")
    finally:
        db.close()

def run_ticket_sync_job():
    """Background job to sync ticket emails"""
    from datetime import datetime
    print(f"\n{'='*60}")
    print(f"TICKET EMAIL SYNC - {datetime.now().strftime('%H:%M:%S')}")
    db = SessionLocal()
    try:
        result = sync_ticket_emails(db)
        print(f"  Result: {result}")
    except Exception as e:
        print(f"  ERROR in ticket sync job: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start scheduler
    # scheduler.add_job(run_email_sync_job, "interval", minutes=2)
    scheduler.add_job(run_ticket_sync_job, "interval", minutes=3)
    scheduler.start()
    print("Ticket sync scheduler started (every 3 minutes)")
    yield
    # Shutdown: Stop scheduler
    scheduler.shutdown()

# Create FastAPI app
app = FastAPI(
    title="KOTS Booking API",
    description="API for fetching booking information by phone number",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
from config import get_settings
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(bookings_router)
app.include_router(tenant_router)
app.include_router(contract_documents_router)
app.include_router(parking_router)
app.include_router(referral_router)
app.include_router(ticket_router)
app.include_router(invoices_router)
app.include_router(wifi_router)
app.include_router(occupancy_router)
app.include_router(notification_router)


@app.websocket("/ws/notifications/{booking_id}")
async def websocket_endpoint(websocket: WebSocket, booking_id: str):
    await manager.connect(websocket, booking_id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, booking_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, booking_id)


@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "KOTS Booking API is running"}


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Database health check"""
    try:
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    # Trigger reload for config update

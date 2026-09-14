from fastapi import APIRouter, Response, status
from sqlalchemy import text
from datetime import datetime, timezone
import time
from hybrid_recommendation_server.core.config import settings
from hybrid_recommendation_server.core.database import engine

router = APIRouter(tags=["Health"])
start_time = time.time()

@router.get("/health")
@router.get("/api/v1/health")
async def health_check(response: Response):
    db_connected = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_connected = True
    except Exception:
        db_connected = False

    is_healthy = db_connected
    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptimeSeconds": int(time.time() - start_time),
        "database": {
            "type": "postgresql",
            "connected": db_connected
        }
    }


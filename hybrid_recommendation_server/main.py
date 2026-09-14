import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from hybrid_recommendation_server.core.config import settings
from hybrid_recommendation_server.core.database import engine, Base
from hybrid_recommendation_server.routers.recommendation import router as recommendation_router
from hybrid_recommendation_server.routers.health import router as health_router
from hybrid_recommendation_server.workers.batch_scheduler import periodic_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hybrid_server")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB tables
    logger.info("[HybridRecommendationServer] Initializing database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[HybridRecommendationServer] Recommendation tables verified/created.")
    except Exception as e:
        logger.warning(f"[HybridRecommendationServer] Database init warning: {e}")

    # 2. Start background periodic scheduler task
    scheduler_task = asyncio.create_task(
        periodic_scheduler(interval_minutes=settings.TRAINING_INTERVAL_MINUTES)
    )

    yield

    # Cancellation on shutdown
    scheduler_task.cancel()
    await engine.dispose()
    logger.info("[HybridRecommendationServer] Engine closed and scheduler stopped.")

def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )

    # Cross-Origin Resource Sharing (CORS)
    origins = [
        settings.FRONTEND_URL,
        settings.MAIN_BACKEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:10000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:10000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(recommendation_router)

    return app

app = create_application()

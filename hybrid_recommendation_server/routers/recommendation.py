from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List
from hybrid_recommendation_server.core.database import get_db
from hybrid_recommendation_server.models.recommendation import UserRecommendation, CourseBundle
from hybrid_recommendation_server.workers.batch_scheduler import RecommendationBatchWorker

router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])

@router.get("/{user_id}")
async def get_user_recommendations(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Sub-15ms cached recommendation lookup for a given student ID.
    """
    stmt = select(UserRecommendation).where(UserRecommendation.user_id == user_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if record:
        return {
            "success": True,
            "userId": user_id,
            "source": "cache",
            "updatedAt": record.updated_at.isoformat() if record.updated_at else None,
            "recommendations": record.recommendations
        }

    return {
        "success": True,
        "userId": user_id,
        "source": "cold_start_fallback",
        "recommendations": []
    }

@router.get("/bundles/list")
async def get_mined_course_bundles(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns mined 'Frequently Bought Together' course bundles from Apriori.
    """
    stmt = select(CourseBundle).order_by(CourseBundle.lift.desc()).limit(20)
    result = await db.execute(stmt)
    bundles = result.scalars().all()

    return {
        "success": True,
        "count": len(bundles),
        "bundles": [
            {
                "sourceCourseId": b.source_course_id,
                "targetCourseId": b.target_course_id,
                "support": b.support,
                "confidence": b.confidence,
                "lift": b.lift
            }
            for b in bundles
        ]
    }

@router.post("/retrain")
async def trigger_retrain_batch(
    background_tasks: BackgroundTasks
):
    """
    Triggers an asynchronous re-training of SVD & Apriori and refreshes all user caches.
    """
    worker = RecommendationBatchWorker()
    background_tasks.add_task(worker.run_batch_pipeline)
    return {
        "success": True,
        "message": "Background retraining pipeline dispatched successfully."
    }

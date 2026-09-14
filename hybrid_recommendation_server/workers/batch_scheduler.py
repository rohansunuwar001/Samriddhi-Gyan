import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy import select, delete, text
from sqlalchemy.dialects.postgresql import insert
from hybrid_recommendation_server.core.database import SessionLocal, engine, Base
from hybrid_recommendation_server.models.recommendation import UserRecommendation, CourseBundle
from hybrid_recommendation_server.algorithms.hybrid_engine import HybridRecommendationEngine
from hybrid_recommendation_server.algorithms.apriori import AprioriBundlingAlgorithm
from hybrid_recommendation_server.algorithms.embedding import EmbeddingService

logger = logging.getLogger("HybridRecWorker")

class RecommendationBatchWorker:
    """
    Background worker that runs periodic offline training:
    1. Collects explicit ratings (Reviews) and progress data.
    2. Trains the SVD Matrix Factorization model.
    3. Runs the Hybrid Engine for all active users and saves Top 10 recommendations to PostgreSQL.
    4. Runs Apriori on completed purchases and caches course bundles.
    """
    def __init__(self):
        self.engine = HybridRecommendationEngine()
        self.apriori = AprioriBundlingAlgorithm(min_support=0.03, min_confidence=0.2)

    async def run_batch_pipeline(self) -> Dict[str, Any]:
        logger.info("[BatchWorker] Starting Hybrid Recommendation & Apriori Training Pipeline...")
        start_time = datetime.utcnow()

        async with SessionLocal() as session:
            try:
                # 1. Fetch raw ratings data (Reviews)
                reviews_query = text('SELECT "userId", "courseId", rating FROM "Review"')
                reviews_res = await session.execute(reviews_query)
                review_rows = reviews_res.fetchall()

                ratings_dataset = [
                    {"userId": str(r[0]), "courseId": str(r[1]), "rating": float(r[2])}
                    for r in review_rows if r[0] and r[1] and r[2] is not None
                ]

                # 2. Train SVD
                logger.info(f"[BatchWorker] Training SVD model on {len(ratings_dataset)} user-course ratings...")
                self.engine.train_svd(ratings_dataset)

                # 3. Fetch all published courses using learnings as tags
                courses_query = text("""
                    SELECT id, title, category, learnings, "totalDurationInSeconds"
                    FROM "Course"
                    WHERE "isPublished" = true
                """)
                courses_res = await session.execute(courses_query)
                course_rows = courses_res.fetchall()

                candidate_courses = []
                for row in course_rows:
                    cid, title, category, learnings, duration = row[0], row[1], row[2], row[3], row[4]
                    tags_list = learnings or []
                    emb = EmbeddingService.generate_embedding(f"{title} {category} {' '.join(tags_list)}")
                    candidate_courses.append({
                        "id": str(cid),
                        "title": title or "",
                        "category": category or "",
                        "tags": tags_list,
                        "embedding": emb,
                        "studentCount": 10
                    })

                # 4. Fetch all users and compute recommendations
                users_query = text('SELECT id FROM "User"')
                users_res = await session.execute(users_query)
                user_ids = [str(r[0]) for r in users_res.fetchall()]

                user_count = 0
                for uid in user_ids:
                    enroll_query = text(f'SELECT "courseId" FROM "Enrollment" WHERE "userId" = \'{uid}\'')
                    try:
                        enroll_res = await session.execute(enroll_query)
                        enrolled_ids = {str(r[0]) for r in enroll_res.fetchall()}
                    except Exception:
                        enrolled_ids = set()

                    enrolled_courses = [c for c in candidate_courses if c["id"] in enrolled_ids]
                    enrolled_cats = {c["category"] for c in enrolled_courses if c.get("category")}
                    enrolled_tags = {t for c in enrolled_courses for t in (c.get("tags") or [])}
                    user_vector = EmbeddingService.build_user_vector([c["embedding"] for c in enrolled_courses])

                    top_recommendations = self.engine.score_and_rank(
                        user_id=uid,
                        enrolled_course_ids=enrolled_ids,
                        enrolled_categories=enrolled_cats,
                        enrolled_tags=enrolled_tags,
                        user_vector=user_vector,
                        candidate_courses=candidate_courses,
                        limit=8
                    )

                    stmt = insert(UserRecommendation).values(
                        user_id=uid,
                        recommendations=top_recommendations,
                        updated_at=datetime.utcnow()
                    ).on_conflict_do_update(
                        index_elements=["userId"],
                        set_={
                            "recommendations": top_recommendations,
                            "updatedAt": datetime.utcnow()
                        }
                    )
                    await session.execute(stmt)
                    user_count += 1

                # 5. Apriori Market Basket Analysis on completed orders
                purchases_query = text("SELECT courses FROM \"CoursePurchase\" WHERE status = 'completed'")
                try:
                    purchases_res = await session.execute(purchases_query)
                    transactions = []
                    for row in purchases_res.fetchall():
                        raw_courses = row[0]
                        if isinstance(raw_courses, list):
                            c_ids = [str(c.get("courseId")) for c in raw_courses if isinstance(c, dict) and c.get("courseId")]
                            if len(c_ids) > 1:
                                transactions.append(c_ids)

                    rules = self.apriori.find_rules(transactions)
                    if rules:
                        await session.execute(delete(CourseBundle))
                        for r in rules:
                            bundle = CourseBundle(
                                source_course_id=r["sourceCourseId"],
                                target_course_id=r["targetCourseId"],
                                support=r["support"],
                                confidence=r["confidence"],
                                lift=r["lift"]
                            )
                            session.add(bundle)
                except Exception as e:
                    logger.warning(f"[BatchWorker] Apriori bundling skipped: {e}")

                await session.commit()
                duration_sec = (datetime.utcnow() - start_time).total_seconds()
                logger.info(f"[BatchWorker] Batch training complete in {duration_sec:.2f}s for {user_count} users.")
                return {
                    "status": "success",
                    "usersProcessed": user_count,
                    "ratingsTrained": len(ratings_dataset),
                    "durationSeconds": duration_sec
                }
            except Exception as ex:
                await session.rollback()
                logger.error(f"[BatchWorker] Error during batch training: {ex}")
                return {"status": "error", "error": str(ex)}

async def periodic_scheduler(interval_minutes: int = 60):
    """Background loop that runs every N minutes indefinitely."""
    worker = RecommendationBatchWorker()
    while True:
        try:
            await worker.run_batch_pipeline()
        except Exception as e:
            logger.error(f"[Scheduler] Unexpected exception: {e}")
        await asyncio.sleep(interval_minutes * 60)

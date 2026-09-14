from typing import List, Dict, Any, Set, Optional
from hybrid_recommendation_server.algorithms.svd import SvdRecommendationAlgorithm
from hybrid_recommendation_server.algorithms.embedding import EmbeddingService

class HybridRecommendationEngine:
    """
    Blends Collaborative Filtering (SVD), Semantic Vector Similarity,
    Category Matching, Tag Overlap, and Social Proof into a unified recommendation score.
    """
    def __init__(self):
        self.svd = SvdRecommendationAlgorithm(latent_factors=5, epochs=30)
        self.embedding_service = EmbeddingService()
        self.is_trained = False

    def train_svd(self, ratings: List[Dict[str, Any]]) -> None:
        self.svd.train(ratings)
        self.is_trained = True

    def score_and_rank(
        self,
        user_id: str,
        enrolled_course_ids: Set[str],
        enrolled_categories: Set[str],
        enrolled_tags: Set[str],
        user_vector: Optional[List[float]],
        candidate_courses: List[Dict[str, Any]],
        limit: int = 8
    ) -> List[Dict[str, Any]]:
        scored = []

        for c in candidate_courses:
            cid = str(c["id"])
            if cid in enrolled_course_ids:
                continue

            score = 0.0

            # 1. Category alignment (20%)
            if c.get("category") in enrolled_categories:
                score += 0.20

            # 2. Tag overlap (10%)
            c_tags = set(c.get("tags") or [])
            if c_tags.intersection(enrolled_tags):
                score += 0.10

            # 3. Social proof / popularity (10%)
            students = c.get("studentCount", 0) or 0
            score += min(0.10, (students / 5000.0) * 0.10)

            # 4. Semantic vector embedding similarity (30%)
            c_embedding = c.get("embedding")
            emb_sim = self.embedding_service.cosine_similarity(user_vector, c_embedding)
            score += emb_sim * 0.30

            # 5. SVD Predicted Rating (30%)
            predicted_rating = self.svd.predict(user_id, cid) if self.is_trained else 4.0
            svd_norm = (predicted_rating / 5.0) * 0.30
            score += svd_norm

            scored.append({
                "courseId": cid,
                "title": c.get("title", ""),
                "category": c.get("category", ""),
                "score": round(score, 4),
                "predictedRating": round(predicted_rating, 2),
                "embeddingSimilarity": round(emb_sim, 4),
                "showBadge": (students >= 5) or (predicted_rating >= 4.5)
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

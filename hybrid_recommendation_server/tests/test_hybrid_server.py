import asyncio
import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from hybrid_recommendation_server.algorithms.svd import SvdRecommendationAlgorithm
from hybrid_recommendation_server.algorithms.embedding import EmbeddingService
from hybrid_recommendation_server.algorithms.apriori import AprioriBundlingAlgorithm
from hybrid_recommendation_server.algorithms.hybrid_engine import HybridRecommendationEngine

def test_svd():
    print("Testing SVD Algorithm...")
    svd = SvdRecommendationAlgorithm(latent_factors=3, epochs=20)
    data = [
        {"userId": "u1", "courseId": "c1", "rating": 5.0},
        {"userId": "u1", "courseId": "c2", "rating": 4.0},
        {"userId": "u2", "courseId": "c1", "rating": 2.0},
        {"userId": "u2", "courseId": "c3", "rating": 5.0},
    ]
    svd.train(data)
    pred_u1_c1 = svd.predict("u1", "c1")
    assert 1.0 <= pred_u1_c1 <= 5.0, f"Invalid prediction: {pred_u1_c1}"
    print(f"  -> SVD predicted rating for u1, c1: {pred_u1_c1:.2f}")

def test_embedding():
    print("Testing Embedding Service...")
    emb1 = EmbeddingService.generate_embedding("Python Data Science and Machine Learning")
    emb2 = EmbeddingService.generate_embedding("Python Deep Learning and AI")
    emb3 = EmbeddingService.generate_embedding("Learn Italian Cooking and Pasta")

    assert len(emb1) == 384
    sim_tech = EmbeddingService.cosine_similarity(emb1, emb2)
    sim_diff = EmbeddingService.cosine_similarity(emb1, emb3)
    print(f"  -> Tech vs Tech similarity: {sim_tech:.4f}")
    print(f"  -> Tech vs Cooking similarity: {sim_diff:.4f}")
    assert sim_tech > sim_diff

def test_apriori():
    print("Testing Apriori Bundling Algorithm...")
    apriori = AprioriBundlingAlgorithm(min_support=0.3, min_confidence=0.5)
    txs = [
        ["react-course", "node-course", "fullstack-course"],
        ["react-course", "node-course"],
        ["react-course", "node-course", "docker-course"],
        ["python-course", "django-course"],
    ]
    rules = apriori.find_rules(txs)
    print(f"  -> Discovered {len(rules)} association rules for bundling:")
    for r in rules:
        print(f"     {r['sourceCourseId']} -> {r['targetCourseId']} (Conf: {r['confidence']}, Lift: {r['lift']})")
    assert len(rules) > 0

def test_hybrid_engine():
    print("Testing Hybrid Recommendation Engine...")
    engine = HybridRecommendationEngine()
    engine.train_svd([
        {"userId": "u10", "courseId": "c_py", "rating": 5.0},
        {"userId": "u10", "courseId": "c_js", "rating": 3.0}
    ])

    emb_py = EmbeddingService.generate_embedding("Python programming fundamentals")
    candidates = [
        {
            "id": "c_ai",
            "title": "Advanced AI with Python",
            "category": "Programming",
            "tags": ["python", "ai"],
            "embedding": EmbeddingService.generate_embedding("Advanced Python AI and Machine Learning"),
            "studentCount": 250
        },
        {
            "id": "c_cook",
            "title": "Gourmet Cooking Basics",
            "category": "Culinary",
            "tags": ["cooking", "food"],
            "embedding": EmbeddingService.generate_embedding("Cooking French and Italian dishes"),
            "studentCount": 10
        }
    ]

    results = engine.score_and_rank(
        user_id="u10",
        enrolled_course_ids={"c_py"},
        enrolled_categories={"Programming"},
        enrolled_tags={"python"},
        user_vector=emb_py,
        candidate_courses=candidates,
        limit=5
    )

    print(f"  -> Top recommendation: {results[0]['title']} with score {results[0]['score']}")
    assert results[0]["courseId"] == "c_ai"
    assert results[0]["score"] > results[1]["score"]

if __name__ == "__main__":
    test_svd()
    test_embedding()
    test_apriori()
    test_hybrid_engine()
    print("\nSUCCESS: ALL HYBRID RECOMMENDATION SERVER ALGORITHMS PASSED!")

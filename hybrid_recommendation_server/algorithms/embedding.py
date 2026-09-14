import math
import hashlib
from typing import List, Dict, Any, Optional

DIMENSIONS = 384

class EmbeddingService:
    """
    Computes 384-dimensional dense semantic vectors and cosine similarity
    for content-based recommendation matching using subword n-gram feature hashing.
    """
    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * DIMENSIONS

        clean_text = text.lower().strip()
        words = clean_text.split()
        vector = [0.0] * DIMENSIONS

        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % DIMENSIONS
            sign = 1.0 if ((h >> 8) & 1) else -1.0
            vector[idx] += sign * (1.0 / math.sqrt(i + 1))

            if len(word) >= 3:
                for c in range(len(word) - 2):
                    trigram = word[c : c + 3]
                    th = int(hashlib.sha1(trigram.encode("utf-8")).hexdigest(), 16)
                    t_idx = th % DIMENSIONS
                    t_sign = 1.0 if ((th >> 8) & 1) else -1.0
                    vector[t_idx] += t_sign * 0.5

        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0.0:
            return [round(v / norm, 6) for v in vector]
        return [0.0] * DIMENSIONS

    @staticmethod
    def cosine_similarity(vec_a: Optional[List[float]], vec_b: Optional[List[float]]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a < 1e-9 or norm_b < 1e-9:
            return 0.0

        sim = dot / (norm_a * norm_b)
        return max(0.0, min(1.0, float(sim)))

    @staticmethod
    def build_user_vector(course_embeddings: List[List[float]]) -> List[float]:
        valid = [v for v in course_embeddings if v and len(v) == DIMENSIONS]
        if not valid:
            return [0.0] * DIMENSIONS

        avg = [0.0] * DIMENSIONS
        for vec in valid:
            for d in range(DIMENSIONS):
                avg[d] += vec[d]

        n = len(valid)
        avg = [x / n for x in avg]
        norm = math.sqrt(sum(x * x for x in avg))
        if norm > 1e-9:
            avg = [round(x / norm, 6) for x in avg]
        return avg

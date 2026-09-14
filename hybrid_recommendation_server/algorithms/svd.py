import random
from typing import List, Dict, Any, Optional

class SvdRecommendationAlgorithm:
    """
    Singular Value Decomposition (SVD) Matrix Factorization via SGD.
    Predicts missing learner-course ratings for personalized collaborative filtering.
    """
    def __init__(
        self,
        latent_factors: int = 5,
        learning_rate: float = 0.05,
        regularization: float = 0.02,
        epochs: int = 30
    ):
        self.latent_factors = latent_factors
        self.learning_rate = learning_rate
        self.regularization = regularization
        self.epochs = epochs

        self.mu = 4.0  # Global mean rating
        self.b_user: Dict[str, float] = {}
        self.b_course: Dict[str, float] = {}
        self.p_user: Dict[str, List[float]] = {}
        self.q_course: Dict[str, List[float]] = {}

    def train(self, ratings: List[Dict[str, Any]]) -> None:
        if not ratings:
            return

        total_rating = sum(float(r["rating"]) for r in ratings)
        self.mu = total_rating / len(ratings)

        user_ids = {str(r["userId"]) for r in ratings}
        course_ids = {str(r["courseId"]) for r in ratings}

        for u in user_ids:
            self.b_user[u] = 0.0
            self.p_user[u] = [(random.random() - 0.5) * 0.1 for _ in range(self.latent_factors)]

        for c in course_ids:
            self.b_course[c] = 0.0
            self.q_course[c] = [(random.random() - 0.5) * 0.1 for _ in range(self.latent_factors)]

        for _ in range(self.epochs):
            for r in ratings:
                u = str(r["userId"])
                c = str(r["courseId"])
                rating = float(r["rating"])

                bu = self.b_user.get(u, 0.0)
                bc = self.b_course.get(c, 0.0)
                pu = self.p_user.get(u, [0.0] * self.latent_factors)
                qc = self.q_course.get(c, [0.0] * self.latent_factors)

                dot = sum(pu[k] * qc[k] for k in range(self.latent_factors))
                prediction = self.mu + bu + bc + dot
                error = rating - prediction

                # Gradient descent updates with L2 regularization
                self.b_user[u] = bu + self.learning_rate * (error - self.regularization * bu)
                self.b_course[c] = bc + self.learning_rate * (error - self.regularization * bc)

                for k in range(self.latent_factors):
                    pu_k = pu[k]
                    qc_k = qc[k]
                    pu[k] = pu_k + self.learning_rate * (error * qc_k - self.regularization * pu_k)
                    qc[k] = qc_k + self.learning_rate * (error * pu_k - self.regularization * qc_k)

    def predict(self, user_id: str, course_id: str) -> float:
        u = str(user_id)
        c = str(course_id)

        bu = self.b_user.get(u, 0.0)
        bc = self.b_course.get(c, 0.0)
        pu = self.p_user.get(u, [0.0] * self.latent_factors)
        qc = self.q_course.get(c, [0.0] * self.latent_factors)

        dot = sum(pu[k] * qc[k] for k in range(self.latent_factors))
        est = self.mu + bu + bc + dot
        return max(1.0, min(5.0, est))

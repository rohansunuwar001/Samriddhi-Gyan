from typing import List, Dict, Any
from collections import defaultdict

class AprioriBundlingAlgorithm:
    """
    Apriori Association Rule Mining Algorithm.
    Discovers frequent itemsets and course bundles from completed purchase transactions.
    """
    def __init__(self, min_support: float = 0.05, min_confidence: float = 0.3):
        self.min_support = min_support
        self.min_confidence = min_confidence

    def find_rules(self, transactions: List[List[str]]) -> List[Dict[str, Any]]:
        n = len(transactions)
        if n == 0:
            return []

        # 1. Frequency of single items
        item_counts = defaultdict(int)
        for tx in transactions:
            for item in set(tx):
                item_counts[item] += 1

        frequent_1 = {}
        for item, count in item_counts.items():
            support = count / n
            if support >= self.min_support:
                frequent_1[item] = support

        freq_items = list(frequent_1.keys())
        rules = []

        # 2. Frequent pairs & rules
        for i in range(len(freq_items)):
            for j in range(i + 1, len(freq_items)):
                item_a = freq_items[i]
                item_b = freq_items[j]

                pair_count = sum(1 for tx in transactions if item_a in tx and item_b in tx)
                support_pair = pair_count / n

                if support_pair >= self.min_support:
                    # Rule: A -> B
                    conf_a_to_b = support_pair / frequent_1[item_a]
                    lift_a_to_b = conf_a_to_b / frequent_1[item_b] if frequent_1[item_b] > 0 else 1.0
                    if conf_a_to_b >= self.min_confidence:
                        rules.append({
                            "sourceCourseId": item_a,
                            "targetCourseId": item_b,
                            "support": round(support_pair, 3),
                            "confidence": round(conf_a_to_b, 3),
                            "lift": round(lift_a_to_b, 3)
                        })

                    # Rule: B -> A
                    conf_b_to_a = support_pair / frequent_1[item_b]
                    lift_b_to_a = conf_b_to_a / frequent_1[item_a] if frequent_1[item_a] > 0 else 1.0
                    if conf_b_to_a >= self.min_confidence:
                        rules.append({
                            "sourceCourseId": item_b,
                            "targetCourseId": item_a,
                            "support": round(support_pair, 3),
                            "confidence": round(conf_b_to_a, 3),
                            "lift": round(lift_b_to_a, 3)
                        })

        rules.sort(key=lambda x: (x["lift"], x["confidence"]), reverse=True)
        return rules

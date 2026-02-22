"""
Ranking comparison utilities for the rerank notebook.

Extracted from Notebook 03 for testability and reuse.
"""

import pandas as pd


def build_comparison(naive_hits: list, reranked_hits: list) -> pd.DataFrame:
    """
    Build a side-by-side comparison of naive vs reranked search results.

    Args:
        naive_hits: List of ES hit dicts from naive semantic search
        reranked_hits: List of ES hit dicts from reranked search

    Returns:
        DataFrame with columns: Reranked, Article, Title, Was Rank, Movement

    Raises:
        ValueError: If reranked_hits is empty (nothing to compare)
    """
    if not reranked_hits:
        raise ValueError("reranked_hits must not be empty")

    not_found_label = f">{len(naive_hits)}"

    naive_ranks = {
        hit['_source']['article_number']: i + 1
        for i, hit in enumerate(naive_hits)
    }

    comparison = []
    for i, hit in enumerate(reranked_hits, 1):
        article = hit['_source']['article_number']
        naive_rank = naive_ranks.get(article, not_found_label)

        if isinstance(naive_rank, int):
            movement = naive_rank - i
            if movement > 0:
                movement_str = f"↑{movement}"
            elif movement < 0:
                movement_str = f"↓{abs(movement)}"
            else:
                movement_str = "="
        else:
            movement_str = "NEW"

        title = hit['_source']['title']
        if len(title) > 40:
            title = title[:40] + "..."

        comparison.append({
            "Reranked": i,
            "Article": article,
            "Title": title,
            "Was Rank": naive_rank,
            "Movement": movement_str
        })

    return pd.DataFrame(comparison)

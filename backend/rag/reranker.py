"""
Reranker — Lightweight cross-encoder-free reranker using keyword overlap scoring.
Reranks retrieved FAISS chunks based on query relevance without additional model overhead.

Pipeline: top_k=5 from FAISS → rerank by relevance → return top 3.
"""

from typing import List, Tuple
import re


def _tokenize(text: str) -> set:
    """Simple whitespace + punctuation tokenizer, lowercased."""
    return set(re.findall(r'\w+', text.lower()))


def _keyword_overlap_score(query_tokens: set, chunk_tokens: set) -> float:
    """Calculate Jaccard-like overlap between query and chunk tokens."""
    if not query_tokens or not chunk_tokens:
        return 0.0
    intersection = query_tokens & chunk_tokens
    # Weighted: prioritize recall of query terms in chunk
    recall = len(intersection) / len(query_tokens) if query_tokens else 0.0
    precision = len(intersection) / len(chunk_tokens) if chunk_tokens else 0.0
    # F1-like combination, biased toward recall
    if recall + precision == 0:
        return 0.0
    return (2 * recall * precision) / (recall + precision)


def rerank(
    question: str,
    candidates: List[Tuple[str, float]],
    top_k: int = 3
) -> List[Tuple[str, float]]:
    """
    Rerank candidate chunks by combining FAISS similarity score with keyword overlap.

    Args:
        question: User's original question
        candidates: List of (chunk_text, faiss_score) from vector search
        top_k: Number of top results to return after reranking

    Returns:
        Reranked list of (chunk_text, combined_score), truncated to top_k
    """
    if not candidates:
        return []

    query_tokens = _tokenize(question)
    scored = []

    for chunk_text, faiss_score in candidates:
        chunk_tokens = _tokenize(chunk_text)
        keyword_score = _keyword_overlap_score(query_tokens, chunk_tokens)

        # Combined score: 60% FAISS similarity + 40% keyword overlap
        combined = (0.6 * faiss_score) + (0.4 * keyword_score)
        scored.append((chunk_text, combined))

    # Sort by combined score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]

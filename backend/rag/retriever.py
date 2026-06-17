"""
Retriever — Semantic search over FAISS knowledge index.
Pipeline: embed query → FAISS top_k=5 → rerank → return top 3.
"""

from typing import List, Tuple
from rag.embedder import embed_query
from rag.vector_store import VectorStore
from rag.reranker import rerank

# Singleton store
_store: VectorStore | None = None


def _get_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
        loaded = _store.load()
        if not loaded:
            print("Retriever: No pre-built index found. RAG will use fallback.")
    return _store


def retrieve(question: str, top_k: int = 3) -> List[Tuple[str, float]]:
    """
    Retrieve top_k relevant knowledge chunks for a question.
    Uses FAISS for initial retrieval (top_k=5) then reranks to top_k.
    Returns list of (chunk_text, similarity_score) tuples.
    """
    store = _get_store()
    if store.index is None or store.index.ntotal == 0:
        return []
    q_emb = embed_query(question)
    # Over-fetch from FAISS, then rerank
    candidates = store.search(q_emb, top_k=max(top_k + 2, 5))
    return rerank(question, candidates, top_k=top_k)

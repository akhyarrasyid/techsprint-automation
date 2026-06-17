"""
Retriever — Semantic search over FAISS knowledge index with keyword fallback.
Pipeline: embed query → FAISS top_k=5 → rerank → return top 3.
Falls back to pure keyword BM25-like retrieval if embedding is unavailable.
"""

from typing import List, Tuple
from rag.vector_store import VectorStore
from rag.reranker import rerank, _tokenize, _keyword_overlap_score

# Singleton store
_store: VectorStore | None = None


def _get_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
        loaded = _store.load()
        if not loaded:
            print("Retriever: No pre-built index found. Will use keyword fallback.")
    return _store


def _keyword_retrieve(question: str, texts: List[str], top_k: int) -> List[Tuple[str, float]]:
    """BM25-like keyword retrieval over a list of texts when embedding is unavailable."""
    query_tokens = _tokenize(question)
    scored = []
    for text in texts:
        chunk_tokens = _tokenize(text)
        score = _keyword_overlap_score(query_tokens, chunk_tokens)
        if score > 0:
            scored.append((text, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


def retrieve(question: str, top_k: int = 3) -> List[Tuple[str, float]]:
    """
    Retrieve top_k relevant knowledge chunks for a question.
    Primary: FAISS semantic search + rerank.
    Fallback: keyword overlap search when embedding is unavailable.
    Returns list of (chunk_text, similarity_score) tuples.
    """
    store = _get_store()

    # Primary: neural embedding + FAISS (only when index is loaded and healthy)
    if store.index is not None and store.index.ntotal > 0:
        from concurrent.futures import ThreadPoolExecutor
        executor = ThreadPoolExecutor(max_workers=1)
        try:
            from rag.embedder import embed_query
            future = executor.submit(embed_query, question)
            q_emb = future.result(timeout=25)
            candidates = store.search(q_emb, top_k=max(top_k + 2, 5))
            return rerank(question, candidates, top_k=top_k)
        except Exception as e:
            print(f"Retriever: Embedding failed/timed out ({type(e).__name__}), falling back to keyword search.")
        finally:
            executor.shutdown(wait=False)  # never block on a hanging embed thread

    # Fallback: fast keyword matching over loaded text chunks (no network, no GPU)
    print(f"Retriever: Using keyword fallback over {len(store.texts)} chunks.")
    if store.texts:
        return _keyword_retrieve(question, store.texts, top_k)

    return []

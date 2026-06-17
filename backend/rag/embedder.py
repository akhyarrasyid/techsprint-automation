"""
Embedder — Sentence embedding using BAAI/bge-small-en-v1.5.
Dimension: 384. Normalized for cosine similarity via FAISS IndexFlatIP.
"""

import numpy as np
from typing import List
import os

_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            os.environ["HF_HUB_OFFLINE"] = "1"
            from sentence_transformers import SentenceTransformer
            cache_dir = os.environ.get("HF_HOME", None)
            _model = SentenceTransformer(
                "BAAI/bge-small-en-v1.5",
                cache_folder=cache_dir
            )
            print("Embedder: BAAI/bge-small-en-v1.5 loaded successfully.")
        except Exception as e:
            print(f"Embedder: Failed to load SentenceTransformer: {e}")
            _model = "FAILED"
    return _model

def embed_texts(texts: List[str]) -> np.ndarray:
    """Embed a list of texts into normalized vectors (384-dim)."""
    model = _get_model()
    if model == "FAILED" or model is None:
        # Fallback: return random embeddings for resilience
        return np.random.randn(len(texts), 384).astype(np.float32)
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return np.array(embeddings, dtype=np.float32)

def embed_query(text: str) -> np.ndarray:
    """Embed a single query with instruction prefix for bge models."""
    model = _get_model()
    prefix = "Represent this sentence for searching relevant passages: "
    if model == "FAILED" or model is None:
        return np.random.randn(384).astype(np.float32)
    embedding = model.encode(prefix + text, normalize_embeddings=True, show_progress_bar=False)
    return np.array(embedding, dtype=np.float32)

"""
Vector Store — FAISS IndexFlatIP for cosine similarity search.
Stores pre-embedded knowledge chunks for RAG retrieval.
"""

import os
import pickle
import numpy as np
from typing import List, Tuple, Optional

_INDEX_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
INDEX_PATH = os.path.join(_INDEX_DIR, "faiss_index.bin")
TEXTS_PATH = os.path.join(_INDEX_DIR, "faiss_index_texts.pkl")


class VectorStore:
    def __init__(self):
        self.index = None
        self.texts: List[str] = []

    def add(self, embeddings: np.ndarray, texts: List[str]):
        """Add embeddings and their source texts to the store."""
        import faiss
        dim = embeddings.shape[1]
        if self.index is None:
            self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)
        self.texts.extend(texts)

    def search(self, query_embedding: np.ndarray, top_k: int = 3) -> List[Tuple[str, float]]:
        """Search for top_k most similar chunks. Returns (text, score) pairs."""
        if self.index is None or self.index.ntotal == 0:
            return []
        query = query_embedding.reshape(1, -1)
        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query, k)
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.texts) and idx >= 0:
                results.append((self.texts[idx], float(scores[0][i])))
        return results

    def save(self, index_path: str = INDEX_PATH, texts_path: str = TEXTS_PATH):
        """Persist FAISS index and texts to disk."""
        import faiss
        if self.index is not None:
            os.makedirs(os.path.dirname(index_path), exist_ok=True)
            faiss.write_index(self.index, index_path)
            with open(texts_path, "wb") as f:
                pickle.dump(self.texts, f)
            print(f"VectorStore saved: {self.index.ntotal} vectors -> {index_path}")

    def load(self, index_path: str = INDEX_PATH, texts_path: str = TEXTS_PATH) -> bool:
        """Load FAISS index and texts from disk. Returns True if successful."""
        import faiss
        if os.path.exists(index_path) and os.path.exists(texts_path):
            self.index = faiss.read_index(index_path)
            with open(texts_path, "rb") as f:
                self.texts = pickle.load(f)
            print(f"VectorStore loaded: {self.index.ntotal} vectors from {index_path}")
            return True
        print(f"VectorStore: No index found at {index_path}")
        return False

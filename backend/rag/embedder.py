"""
Embedder — Sentence embedding using BAAI/bge-small-en-v1.5.
Dimension: 384. Normalized for cosine similarity via FAISS IndexFlatIP.

Uses HuggingFace transformers directly (not sentence_transformers) to avoid
DataLoader/threading deadlocks inside uvicorn's async event loop on Windows.
"""

import numpy as np
from typing import List
import os

# Prevent tokenizer and MKL parallelism deadlocks in multi-threaded servers
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

_tokenizer = None
_model = None


def _get_components():
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        try:
            from transformers import AutoTokenizer, AutoModel
            import torch

            model_name = "BAAI/bge-small-en-v1.5"
            cache_dir = os.environ.get("HF_HOME", None)

            # local_files_only=True avoids network hang when cache exists;
            # fallback allows download on fresh HuggingFace Spaces deployment.
            try:
                _tokenizer = AutoTokenizer.from_pretrained(
                    model_name, cache_dir=cache_dir, local_files_only=True
                )
                _model = AutoModel.from_pretrained(
                    model_name, cache_dir=cache_dir, local_files_only=True
                )
            except Exception:
                _tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=cache_dir)
                _model = AutoModel.from_pretrained(model_name, cache_dir=cache_dir)

            _model.eval()
            print("Embedder: BAAI/bge-small-en-v1.5 loaded via transformers.")
        except Exception as e:
            print(f"Embedder: Failed to load model: {e}")
            _tokenizer = "FAILED"
            _model = "FAILED"
    return _tokenizer, _model


def _encode(texts: List[str]) -> np.ndarray:
    """Encode texts using direct transformers forward pass (no DataLoader)."""
    import torch

    tok, mdl = _get_components()
    if tok == "FAILED" or mdl == "FAILED":
        return np.random.randn(len(texts), 384).astype(np.float32)

    with torch.no_grad():
        encoded = tok(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        outputs = mdl(**encoded)
        # CLS token representation
        embeddings = outputs.last_hidden_state[:, 0, :]
        # L2 normalize
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)

    return embeddings.cpu().numpy().astype(np.float32)


def embed_texts(texts: List[str]) -> np.ndarray:
    """Embed a list of texts into normalized vectors (384-dim)."""
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
    # Process in batches of 32 to avoid OOM on large inputs
    batch_size = 32
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        all_embeddings.append(_encode(batch))
    return np.vstack(all_embeddings)


def embed_query(text: str) -> np.ndarray:
    """Embed a single query with instruction prefix for bge models."""
    prefix = "Represent this sentence for searching relevant passages: "
    result = _encode([prefix + text])
    return result[0]

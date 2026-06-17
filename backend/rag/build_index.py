"""
Build Index — Offline script to build FAISS index from knowledge base files.

Usage:
    cd backend
    uv run python -m rag.build_index

Flow:
    load *.txt → split → embed → FAISS → save index
"""

import os
import glob
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rag.embedder import embed_texts
from rag.vector_store import VectorStore

KNOWLEDGE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "knowledge"
)


def build_index():
    """Build FAISS index from all .txt files in data/knowledge/."""
    # 1. Load all knowledge files
    txt_files = glob.glob(os.path.join(KNOWLEDGE_DIR, "*.txt"))
    if not txt_files:
        print(f"No .txt files found in {KNOWLEDGE_DIR}")
        return

    all_text = ""
    for fpath in txt_files:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        all_text += f"\n\n--- {os.path.basename(fpath)} ---\n\n{content}"
    print(f"Loaded {len(txt_files)} knowledge files ({len(all_text)} chars)")

    # 2. Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = splitter.split_text(all_text)
    # Filter empty chunks
    chunks = [c.strip() for c in chunks if c.strip()]
    print(f"Split into {len(chunks)} chunks")

    # 3. Embed
    embeddings = embed_texts(chunks)
    print(f"Embedded: {embeddings.shape}")

    # 4. Build FAISS index
    store = VectorStore()
    store.add(embeddings, chunks)

    # 5. Save
    store.save()
    print("Index built successfully!")


if __name__ == "__main__":
    build_index()

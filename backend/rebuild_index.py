"""One-shot script: rebuild FAISS index from current knowledge files."""
import sys, os, glob, pickle
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

KNOWLEDGE_DIR = 'data/knowledge'
txt_files = sorted(glob.glob(os.path.join(KNOWLEDGE_DIR, '*.txt')))
all_text = ''
for fpath in txt_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    all_text += f'\n\n--- {os.path.basename(fpath)} ---\n\n{content}'
print(f'Loaded {len(txt_files)} files, {len(all_text)} chars')

from langchain_text_splitters import RecursiveCharacterTextSplitter
splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50, separators=['\n\n','\n','. ',' ',''])
chunks = [c.strip() for c in splitter.split_text(all_text) if c.strip()]
print(f'Split into {len(chunks)} chunks')

from rag.embedder import embed_texts
embeddings = embed_texts(chunks)
print(f'Embedded: {embeddings.shape}')

from rag.vector_store import VectorStore
store = VectorStore()
store.add(embeddings, chunks)
store.save()
print('Done!')

with open('data/faiss_index_texts.pkl', 'rb') as f:
    texts = pickle.load(f)
old = [t for t in texts if any(kw in t.lower() for kw in ['tepung', 'makmur', 'gandum', 'lgbm', 'catboost'])]
print(f'Stale chunks remaining: {len(old)} (should be 0)')
coffee = [t for t in texts if 'kopikita' in t.lower() or 'kopi susu' in t.lower() or 'espresso bean' in t.lower()]
print(f'Kopikita-specific chunks: {len(coffee)}')

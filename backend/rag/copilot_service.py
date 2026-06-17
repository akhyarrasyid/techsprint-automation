"""
Copilot Service — RAG-powered AI Supply Chain Copilot.

Pipeline:
  1. Classify query into domain categories
  2. Retrieve relevant knowledge chunks from FAISS (with reranking)
  3. Gather live business data from PipelineStore via context_builder
  4. Build augmented prompt using centralized prompts module
  5. Query Groq LLM (Llama 4 Scout)
  6. Fallback to Insight Engine if LLM fails
"""

import os
import time
import logging
from typing import Dict, Any, List, Optional
from cachetools import TTLCache
from dotenv import load_dotenv

load_dotenv()

from rag.prompts import SYSTEM_PROMPT, QUERY_TEMPLATE
from rag.context_builder import build_live_context
from rag.query_classifier import classify_query

# ── Logging setup ──
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("copilot")
logger.setLevel(logging.INFO)
_handler = logging.FileHandler(os.path.join(LOG_DIR, "copilot.log"), encoding="utf-8")
_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
if not logger.handlers:
    logger.addHandler(_handler)

# ── Cache: 5 minute TTL, max 100 entries ──
_cache = TTLCache(maxsize=100, ttl=300)


_GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama3-70b-8192",
]


def _query_groq(prompt: str) -> Optional[str]:
    """Query Groq API via urllib (no httpx/async dependencies). Returns None on all failures."""
    import urllib.request
    import urllib.error
    import json as _json

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY not set. Falling back to insight engine.")
        return None

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    for model in _GROQ_MODELS:
        payload = _json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 500,
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, headers={
            **headers,
            "User-Agent": "groq-python/0.11.0",
        }, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = _json.loads(resp.read().decode("utf-8"))
                answer = body["choices"][0]["message"]["content"]
                usage = body.get("usage", {})
                logger.info(
                    f"Groq model={model} tokens: prompt={usage.get('prompt_tokens','?')}, "
                    f"completion={usage.get('completion_tokens','?')}"
                )
                return answer
        except Exception as e:
            logger.warning(f"Groq model {model} failed: {e}")

    logger.error("All Groq models failed.")
    return None


def _fallback_answer() -> str:
    """Fallback: use Insight Engine rule-based response."""
    try:
        from services.pipeline_store import PipelineStore
        from services.insight_engine import generate_insights
        results = PipelineStore.get_results("Base")
        insights = generate_insights(
            results.get("forecast", []),
            results.get("inventory", []),
            results.get("mrp", []),
            results.get("profitability", []),
        )
        if insights:
            lines = [f"• **{ins['title']}**: {ins['description']}" for ins in insights[:5]]
            return (
                "⚠️ LLM tidak tersedia. Berikut insight dari rule engine:\n\n"
                + "\n".join(lines)
                + "\n\n_Untuk jawaban lebih detail, pastikan GROQ_API_KEY telah dikonfigurasi._"
            )
    except Exception:
        pass
    return "Maaf, saya tidak dapat memproses pertanyaan saat ini. Silakan coba lagi nanti."


def ask_copilot(question: str, scenario: str = "Base") -> Dict[str, Any]:
    """
    Main entry point for the RAG Copilot.
    Returns: { answer, sources, model, latency_ms, cached }
    """
    start = time.time()

    # Check cache
    cache_key = f"{question.strip().lower()}|{scenario}"
    if cache_key in _cache:
        cached = _cache[cache_key]
        cached["cached"] = True
        logger.info(f"Cache HIT: {question[:50]}")
        return cached

    # 0. Classify query
    categories = classify_query(question)
    logger.info(f"Query categories: {categories}")

    # 1. Retrieve knowledge (with reranking)
    sources: List[str] = []
    knowledge_context = ""
    logger.info("Step 1: Starting FAISS retrieval...")
    try:
        from rag.retriever import retrieve
        results = retrieve(question, top_k=3)
        if results:
            sources = [chunk for chunk, score in results]
            knowledge_context = "\n".join([f"- {chunk}" for chunk in sources])
        logger.info(f"Step 1 done: {len(sources)} sources retrieved")
    except Exception as e:
        logger.warning(f"Retrieval failed: {e}")

    # 2. Build live context
    logger.info("Step 2: Building live context...")
    live_context = build_live_context(scenario)
    logger.info("Step 2 done")

    # 2.5 Multi-Agent analysis (optional — agents module may not exist)
    agent_context = ""
    logger.info("Step 2.5: Multi-agent analysis...")
    try:
        from agents.coordinator import coordinator
        from services.pipeline_store import PipelineStore
        agent_results = PipelineStore.get_results(scenario)
        agent_context = coordinator.get_agent_context(agent_results, question)
        logger.info("Step 2.5 done")
    except Exception as e:
        logger.info(f"Multi-agent skipped: {e}")

    # 3. Build augmented prompt using template
    prompt = QUERY_TEMPLATE.format(
        knowledge_context=knowledge_context if knowledge_context else "(tidak ada knowledge relevan)",
        scenario=scenario,
        live_context=live_context,
        agent_context=agent_context,
        question=question,
    )

    logger.info(f"Question: {question[:80]} | Sources: {len(sources)} chunks | Categories: {categories}")

    # 4. Query LLM
    logger.info("Step 4: Querying Groq LLM...")
    answer = _query_groq(prompt)
    logger.info(f"Step 4 done: answer={'OK' if answer else 'None (fallback)'}")
    model_name = "llama-3.3-70b-versatile"

    # 5. Fallback
    if answer is None:
        answer = _fallback_answer()
        model_name = "rule-engine-fallback"

    latency = round((time.time() - start) * 1000, 1)
    logger.info(f"Latency: {latency}ms | Model: {model_name}")

    result = {
        "answer": answer,
        "sources": sources,
        "model": model_name,
        "latency_ms": latency,
        "cached": False,
    }

    # Cache result
    _cache[cache_key] = result
    return result

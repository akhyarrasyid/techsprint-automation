---
title: Techsprint Automation BPAS
emoji: ☕
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 8080
---

# Kopikita BPAS — Business Planning Automation System

Backend API untuk sistem otomasi perencanaan bisnis Kopikita Roastery (FastAPI + RAG Copilot).

## Endpoints
- `GET /health` — Status sistem & pipeline
- `GET /forecast` — Proyeksi demand 5 minggu (25 menu)
- `GET /inventory` — Status stok 42 bahan baku (safety stock, ROP)
- `GET /mrp` — Material Requirements Planning & shortage analysis
- `GET /profitability` — Analisis profitabilitas & margin
- `GET /kpi` — KPI dashboard (service level, fill rate, dll)
- `GET /anomalies` — Deteksi anomali shrinkage (Modified Z-score MAD)
- `POST /copilot/ask` — AI RAG Copilot (Groq llama-3.3-70b-versatile)

## HF Spaces Secrets Required
- `GROQ_API_KEY` — Groq API key untuk AI Copilot
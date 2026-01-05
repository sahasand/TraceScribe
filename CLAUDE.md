# TraceScribe

Clinical trial AI document generation SaaS. Upload protocol → generate ICF, DMP, SAP → translate to 10 languages.

## Quick Start

```bash
# Backend (terminal 1)
cd backend && uvicorn app.main:app --reload  # http://localhost:8000

# Frontend (terminal 2)
cd frontend && npm run dev  # http://localhost:3000
```

## Critical: GPT-5 Nano Constraints

```python
# MUST use these settings for GPT-5 Nano:
response = await client.chat.completions.create(
    model="gpt-5-nano",
    messages=messages,
    max_completion_tokens=4000,  # NOT max_tokens!
    temperature=1.0,             # ONLY 1.0 supported
)
```

**Rate Limiting:** GPT-5 Nano returns empty responses when overloaded. Use delays between calls and retry logic.

## File Map (Backend)

```
backend/app/
├── main.py                          # FastAPI app entry
├── core/
│   ├── config.py                    # Settings (OPENAI_API_KEY, DATABASE_URL)
│   ├── database.py                  # SQLAlchemy async (SQLite/PostgreSQL)
│   └── docengine/
│       ├── engine.py                # Renders UIF → Word
│       └── schema.py                # UIF schema (UniversalDocument, Section, ContentBlock)
└── modules/
    ├── ai/
    │   └── openai_client.py         # OpenAI wrapper with retry
    ├── protocols/
    │   ├── router.py                # POST /api/protocols/upload
    │   ├── service.py               # Upload + parse logic
    │   └── parser.py                # GPT-5 Nano protocol extraction
    └── documents/
        ├── router.py                # POST /api/documents/generate, /translate
        ├── service.py               # Generation + translation orchestration
        ├── workflows/
        │   ├── icf_guru.py          # ICF generation (25 subsections)
        │   ├── dmp.py               # DMP generation
        │   └── sap.py               # SAP generation
        └── translation/             # ★ PARALLEL TRANSLATION SYSTEM
            ├── __init__.py
            ├── batcher.py           # Batches text with |||N||| delimiters
            ├── cache.py             # In-memory translation cache
            └── parallel_translator.py  # Main translator (rate-limited)
```

## API Endpoints

```
POST /api/protocols/upload              Upload + parse protocol PDF
GET  /api/protocols                     List protocols
GET  /api/protocols/{id}                Get protocol details

POST /api/documents/generate            Generate ICF/DMP/SAP
POST /api/documents/{id}/translate      Translate to language (es|fr|de|zh|ja|ko|pt|it|nl|pl)
GET  /api/documents                     List documents
GET  /api/documents/{id}/download       Download .docx file
```

## Translation System (Updated Jan 5, 2026)

**Architecture:**
```
English ICF → ParallelTranslator → Batched GPT-5 Nano calls → Translated UIF → Word
```

**Key Files:**
- `translation/parallel_translator.py` - Main engine with rate limiting
- `translation/batcher.py` - Groups text items with `|||0|||`, `|||1|||` markers
- `translation/cache.py` - Memoizes repeated terms

**Configuration (parallel_translator.py:190-192):**
```python
max_retries = 4      # Retry empty responses
base_delay = 5       # Seconds between batches (exponential backoff)
MAX_CONCURRENT = 1   # Sequential to avoid rate limits
```

**Batch Settings (batcher.py:145-146):**
```python
max_items = 5        # Items per batch
max_chars = 1000     # Chars per batch
```

## Document Generation Flow

```
Protocol PDF → parser.py → JSON → workflow → UIF → docengine → .docx
```

**UIF (Universal Intermediate Format):** JSON schema in `core/docengine/schema.py`
- `UniversalDocument` - Top level (title, sections, metadata)
- `Section` - Heading + content_blocks + subsections
- `ContentBlock` - Paragraph, list, table, or signature

## Database Schema

```sql
-- Key tables
protocols (id, user_id, extracted_data JSON, file_hash, ...)
documents (id, protocol_id, document_type, language, source_document_id, uif_content JSON, ...)
```

**UUIDs:** Use `String(36)` for SQLite/PostgreSQL compatibility
**JSON:** Use `JSON` not `JSONB` for SQLite compatibility

## Environment Variables

```bash
# backend/.env
DATABASE_URL=sqlite+aiosqlite:///./tracescribe.db
OPENAI_API_KEY=sk-...  # Required
ANTHROPIC_API_KEY=...  # Optional (SAP polish only)

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Agent Instructions

1. **Read before editing** - Always read files before modifying
2. **Follow patterns** - Match existing code style
3. **GPT-5 Nano rules** - temperature=1.0, max_completion_tokens (not max_tokens)
4. **Test after changes** - Run the server and verify
5. **Audit logging** - Log document operations for 21 CFR Part 11

## Frontend (Quick Reference)

```
frontend/app/(dashboard)/
├── dashboard/           # Home with bento grid
├── protocols/           # Upload, list, detail
├── documents/           # List, download
├── dashboards/
│   └── query-status/    # Query analytics dashboard
├── dbl-tracker/         # Database lock tracker
├── data-reconciliation/ # EDC-Lab reconciliation
└── topline-results/     # Trial results dashboard
```

**Design System:** Teal (#0D9488) primary, Coral (#F97316) accent, Plus Jakarta Sans font

## Common Tasks

**Add new language support:**
1. Add to `LANGUAGE_NAMES` dict in `translation/parallel_translator.py`

**Modify translation prompts:**
1. Edit `BATCH_TRANSLATION_PROMPT` in `translation/parallel_translator.py`

**Add new document type:**
1. Create workflow in `modules/documents/workflows/`
2. Inherit from `BaseWorkflow`
3. Register in `DocumentService.workflows`

**Debug empty API responses:**
1. Increase `base_delay` in `parallel_translator.py`
2. Reduce `max_items` in `batcher.py`
3. Check server logs for rate limit warnings

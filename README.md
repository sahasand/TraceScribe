# TraceScribe

Clinical trial AI document generation SaaS platform. Automatically generate Informed Consent Forms (ICF), Data Management Plans (DMP), and Statistical Analysis Plans (SAP) from clinical trial protocols, with translation support for 10 languages.

## Features

- **Protocol Upload & Parsing** - Upload clinical trial protocols and extract key information using GPT-5 Nano
- **Document Generation** - Auto-generate ICF, DMP, and SAP documents from protocol data
- **Multi-language Support** - Translate documents to 10 languages (ES, FR, DE, ZH, JA, KO, PT, IT, NL, PL)
- **Advanced Dashboards** - Query status tracking, database lock monitoring, data reconciliation, topline results
- **21 CFR Part 11 Compliant** - Audit logging for clinical trial compliance
- **Real-time Collaboration** - Modern dashboard interface with dark mode support

## Quick Start

### Prerequisites

- Python 3.9+ (backend)
- Node.js 18+ (frontend)
- SQLite or PostgreSQL

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env and set OPENAI_API_KEY and DATABASE_URL

# Run development server
python -m uvicorn app.main:app --reload
```

Backend runs on **http://localhost:8000**

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

Frontend runs on **http://localhost:3000**

### One-Command Startup

```bash
# Terminal 1: Backend
cd backend && python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL=sqlite+aiosqlite:///./tracescribe.db
OPENAI_API_KEY=sk-...                    # Required for document generation
ANTHROPIC_API_KEY=...                    # Optional (SAP polish only)
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

### Protocols

```
POST   /api/protocols/upload              Upload and parse protocol PDF
GET    /api/protocols                     List all protocols
GET    /api/protocols/{id}                Get protocol details
```

### Documents

```
POST   /api/documents/generate            Generate ICF/DMP/SAP
POST   /api/documents/{id}/translate      Translate to language code
GET    /api/documents                     List all documents
GET    /api/documents/{id}/download       Download document as .docx
```

### Subscriptions

```
POST   /api/subscriptions/create-session  Create Stripe checkout session
GET    /api/subscriptions/webhook         Handle Stripe webhooks
```

## Project Structure

```
TraceScribe/
├── backend/                              # FastAPI server
│   ├── app/
│   │   ├── main.py                       # FastAPI app entry
│   │   ├── core/
│   │   │   ├── config.py                 # Settings & environment
│   │   │   ├── database.py               # SQLAlchemy async ORM
│   │   │   └── docengine/                # Word document generation
│   │   │       ├── engine.py
│   │   │       └── schema.py             # UIF (Universal Intermediate Format)
│   │   └── modules/
│   │       ├── ai/                       # OpenAI, Claude, Gemini clients
│   │       ├── protocols/                # Protocol upload & parsing
│   │       ├── documents/                # Document generation & translation
│   │       │   ├── workflows/            # ICF, DMP, SAP generation
│   │       │   └── translation/          # Parallel translation system
│   │       └── subscriptions/            # Stripe integration
│   ├── requirements.txt
│   └── railway.toml                      # Railway deployment config
│
├── frontend/                             # Next.js dashboard
│   ├── app/
│   │   ├── (auth)/                       # Sign in/up pages
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/                # Home & stats
│   │   │   ├── protocols/                # Upload & list
│   │   │   ├── documents/                # Generated documents
│   │   │   ├── dashboards/               # Query status analytics
│   │   │   ├── dbl-tracker/              # Database lock tracker
│   │   │   ├── data-reconciliation/      # EDC-Lab reconciliation
│   │   │   └── topline-results/          # Trial results visualization
│   │   └── layout.tsx                    # Root layout with auth
│   ├── components/
│   │   ├── ui/                           # Shadcn UI components
│   │   ├── dashboard/                    # Dashboard components
│   │   └── protocol/                     # Protocol components
│   ├── lib/
│   │   ├── api-client.ts                 # API communication
│   │   └── utils.ts                      # Utilities
│   └── tailwind.config.ts                # Tailwind CSS config
│
├── CLAUDE.md                             # Detailed development guide
├── docker-compose.yml                    # Docker configuration
└── README.md                             # This file
```

## Key Features

### Translation System

The translation system batches text items and makes parallel API calls with exponential backoff to handle rate limits:

- **Batch Size:** 5 items per batch, max 1000 characters
- **Rate Limiting:** 5-second base delay between batches
- **Retry Logic:** Up to 4 retries for failed requests
- **Caching:** In-memory cache for repeated terms

**Configuration:** `backend/app/modules/documents/translation/parallel_translator.py`

### Document Generation

Universal Intermediate Format (UIF) pipeline:

```
Protocol PDF → Parser → JSON → Workflow → UIF → Word Document
```

**UIF Schema:** `backend/app/core/docengine/schema.py`
- `UniversalDocument` - Complete document structure
- `Section` - Heading with content blocks
- `ContentBlock` - Paragraph, list, table, or signature

### GPT-5 Nano Requirements

⚠️ **Critical Configuration:**

```python
response = await client.chat.completions.create(
    model="gpt-5-nano",
    messages=messages,
    max_completion_tokens=4000,  # NOT max_tokens!
    temperature=1.0,             # ONLY 1.0 supported
)
```

**Important:** GPT-5 Nano returns empty responses when rate-limited. Adjust delays and retry logic as needed.

## Database Schema

### Key Tables

```sql
protocols (
    id UUID PRIMARY KEY,
    user_id UUID,
    extracted_data JSON,
    file_hash VARCHAR,
    created_at TIMESTAMP
)

documents (
    id UUID PRIMARY KEY,
    protocol_id UUID FOREIGN KEY,
    document_type VARCHAR,
    language VARCHAR(5),
    source_document_id UUID,
    uif_content JSON,
    created_at TIMESTAMP
)
```

**Note:** Uses `String(36)` for UUIDs and `JSON` type for SQLite/PostgreSQL compatibility.

## Development

### Running Tests

```bash
cd backend
pytest
```

### Building Docker Image

```bash
docker-compose build
docker-compose up
```

### Adding a New Language

1. Update `LANGUAGE_NAMES` in `backend/app/modules/documents/translation/parallel_translator.py`
2. Update batch translation prompt if needed
3. Test with sample protocol

### Debugging Empty Responses

If document generation returns empty content:

1. Increase `base_delay` in `parallel_translator.py` (line 190)
2. Reduce `max_items` in `batcher.py` (line 145)
3. Check server logs for rate limit warnings
4. Monitor OpenAI API usage dashboard

## Design System

- **Primary Color:** Teal (#0D9488)
- **Accent Color:** Coral (#F97316)
- **Typography:** Plus Jakarta Sans
- **Components:** Shadcn UI + Tailwind CSS

## Deployment

### Railway (Backend)

1. Connect GitHub repository
2. Set environment variables (OPENAI_API_KEY, DATABASE_URL)
3. Deploy using `backend/railway.toml`

### Vercel (Frontend)

1. Connect GitHub repository
2. Set NEXT_PUBLIC_API_URL to production backend
3. Deploy automatically on push to main

## Configuration Guide

### Modify Translation Prompts

Edit `BATCH_TRANSLATION_PROMPT` in `backend/app/modules/documents/translation/parallel_translator.py`

### Add New Document Type

1. Create workflow in `backend/app/modules/documents/workflows/`
2. Inherit from `BaseWorkflow`
3. Register in `DocumentService.workflows`
4. Add API endpoint in `documents/router.py`

### Enable Audit Logging

Audit logging is configured in `backend/app/core/audit.py`. All document operations are logged for 21 CFR Part 11 compliance.

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.9+

# Verify dependencies
pip install -r requirements.txt

# Check database connection
echo $DATABASE_URL
```

### Frontend build errors

```bash
# Clear Node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### API connection errors

```bash
# Verify backend is running
curl http://localhost:8000/docs

# Check frontend .env.local
cat frontend/.env.local

# Check browser console for CORS errors
```

### Empty document generation

See "Debugging Empty Responses" section above.

## Documentation

- **CLAUDE.md** - Detailed development guide with architecture decisions
- **API Docs** - Available at http://localhost:8000/docs (Swagger UI)
- **Architecture** - See `PROJECT_STRUCTURE.md` for detailed breakdown

## Support & Contributing

For issues, bugs, or feature requests, please open an issue on GitHub.

## License

Proprietary - TraceScribe Clinical Trial AI Platform

---

**Status:** Production Ready
**Last Updated:** January 2026
**Maintainer:** Sandeep Saha

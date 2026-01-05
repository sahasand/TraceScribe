# Development Tasks

Copy-paste into Claude Code. Complete each fully before stopping.

---

## Phase 1: Foundation

### Task 1.1: Backend Scaffold

```
Create FastAPI backend:
- backend/app/main.py (FastAPI app, CORS, health check)
- backend/app/core/config.py (Pydantic settings)
- backend/app/core/database.py (async SQLAlchemy)
- backend/app/core/audit.py (audit logging)
- backend/requirements.txt

Complete all files. Test with uvicorn.
```

### Task 1.2: Protocol Module

```
Create protocols module:
- backend/app/modules/protocols/router.py
- backend/app/modules/protocols/service.py
- backend/app/modules/protocols/parser.py
- backend/app/modules/protocols/schemas.py
- backend/app/modules/protocols/models.py

Endpoints: POST /upload, GET /, GET /{id}, DELETE /{id}

Read skills/protocol-analyzer/SKILL.md for schema.
Complete all files.
```

### Task 1.3: Gemini Client

```
Create Gemini client:
- backend/app/modules/ai/gemini_client.py

Use gemini-3-flash-preview, temperature 0.2, thinking_level high.
Read skills/protocol-analyzer/references/extraction-prompt.md for prompt.
Include retry logic and error handling.
```

### Task 1.4: Frontend Scaffold

```
Create Next.js frontend:
- App Router with (auth) and (dashboard) groups
- Clerk authentication
- shadcn/ui components
- Dashboard layout with sidebar
- API client in lib/

Complete full structure.
```

### Task 1.5: Protocol Upload UI

```
Create protocol upload flow:
- frontend/app/(dashboard)/protocols/page.tsx
- frontend/components/protocol/upload-form.tsx

File drop zone, upload progress, display extraction results.
Connect to backend API.
```

---

## Phase 2: Core Modules

### Task 2.1: ICF Generator

```
Create ICF generator:
- backend/app/modules/documents/generators/icf.py
- backend/app/modules/ai/prompts/icf_generation.py
- backend/app/templates/icf/standard_icf.docx

Read skills/icf-builder/SKILL.md for requirements.
Set requires_polish = True.
```

### Task 2.2: DMP Generator

```
Create DMP generator:
- backend/app/modules/documents/generators/dmp.py
- backend/app/modules/ai/prompts/dmp_generation.py
- backend/app/templates/dmp/standard_dmp.docx

Read skills/dmp-builder/SKILL.md for structure.
4-level numbering.
```

### Task 2.3: SAP Generator

```
Create SAP generator:
- backend/app/modules/documents/generators/sap.py
- backend/app/modules/ai/prompts/sap_generation.py
- backend/app/templates/sap/standard_sap.docx

Read skills/sap-builder/SKILL.md for requirements.
Endpoints verbatim.
```

### Task 2.4: Documents API

```
Create documents module:
- backend/app/modules/documents/router.py
- backend/app/modules/documents/service.py
- backend/app/modules/documents/schemas.py

POST /generate, GET /, GET /{id}/download
Background task for generation.
```

### Task 2.5: Claude Polish

```
Create Claude client:
- backend/app/modules/ai/claude_client.py

Methods: polish_regulatory_text(), check_readability()
Use claude-sonnet-4-20250514.
```

---

## Phase 3: Launch

### Task 3.1: Stripe Billing

```
Create subscriptions module:
- backend/app/modules/subscriptions/router.py
- backend/app/modules/subscriptions/stripe_service.py
- frontend/app/(dashboard)/settings/billing/page.tsx

Tiers: Starter $99, Professional $249, Enterprise $499.
```

### Task 3.2: Document Versioning

```
Add versioning to documents:
- Add version column to documents table
- Auto-increment on regenerate
- Version history endpoint
- Version selector in UI
```

### Task 3.3: Deployment Config

```
Create deployment files:
- backend/railway.toml
- backend/Dockerfile
- frontend/vercel.json
- docker-compose.yml (local dev)
- .env.example
```

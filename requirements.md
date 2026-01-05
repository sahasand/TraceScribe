# TraceScribe Requirements

## Prerequisites

### Required Software
| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 20+ | Frontend runtime |
| PostgreSQL | 15+ | Database |
| Docker | (optional) | Local development |

---

## API Keys & Services

### Required for Core Functionality

#### 1. Clerk Authentication
- **Sign up:** https://clerk.com
- **Keys needed:**
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  ```
- **Setup:**
  1. Create a Clerk application
  2. Enable Email/Password sign-in
  3. Copy keys from Dashboard > API Keys
- **Status:** ✅ Configured

#### 2. Google Gemini API
- **Sign up:** https://makersuite.google.com/app/apikey
- **Key needed:**
  ```
  GEMINI_API_KEY=AI...
  ```
- **Purpose:** Protocol PDF parsing and data extraction
- **Model used:** `gemini-3-flash-preview`
- **Status:** ✅ Configured

#### 3. Local File Storage
- **No cloud service required** - files stored locally for data sovereignty
- **Configuration:**
  ```
  STORAGE_PATH=./uploads
  ```
- **Benefits:**
  - Full data control (HIPAA/GxP compliance)
  - No third-party data processing
  - Works offline/air-gapped
  - No cloud storage costs
- **Status:** ✅ Configured (default: `./uploads`)

---

### Optional (Enhanced Features)

#### 4. Anthropic Claude API
- **Sign up:** https://console.anthropic.com
- **Key needed:**
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- **Purpose:** Document polishing for ICF/SAP (improves readability)
- **Model used:** `claude-sonnet-4-20250514`

#### 5. Stripe Billing
- **Sign up:** https://dashboard.stripe.com
- **Keys needed:**
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- **Setup:**
  1. Create 3 subscription products:
     - Starter: $99/month (price_id: `price_starter`)
     - Professional: $249/month (price_id: `price_professional`)
     - Enterprise: $499/month (price_id: `price_enterprise`)
  2. Set up webhook endpoint: `https://your-api.com/api/subscriptions/webhook`
  3. Subscribe to events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

---

## Database Setup

### Option A: Docker (Recommended for Development)
```bash
docker run -d --name tracescribe-db \
  -e POSTGRES_USER=tracescribe \
  -e POSTGRES_PASSWORD=tracescribe_dev \
  -e POSTGRES_DB=tracescribe \
  -p 5432:5432 \
  postgres:15-alpine
```

### Option B: Supabase (Recommended for Production)
1. Create project at https://supabase.com
2. Copy connection string from Settings > Database
3. Use format: `postgresql+asyncpg://user:password@host:5432/postgres`

### Database URL Format
```
DATABASE_URL=postgresql+asyncpg://tracescribe:tracescribe_dev@localhost:5432/tracescribe
```

---

## Quick Start

### 1. Clone and Configure
```bash
cd TraceScribe
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Database
```bash
docker run -d --name tracescribe-db \
  -e POSTGRES_USER=tracescribe \
  -e POSTGRES_PASSWORD=tracescribe_dev \
  -e POSTGRES_DB=tracescribe \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Runs at http://localhost:8000
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

---

## Environment Variables Summary

```bash
# Database (Required)
DATABASE_URL=postgresql+asyncpg://tracescribe:tracescribe_dev@localhost:5432/tracescribe

# Authentication (Required)
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# AI - Protocol Parsing (Required)
GEMINI_API_KEY=AI...

# AI - Document Polish (Optional)
ANTHROPIC_API_KEY=sk-ant-...

# Storage (Local - no cloud required)
STORAGE_PATH=./uploads

# Billing (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# CORS
CORS_ORIGINS=["http://localhost:3000"]
```

---

## Production Deployment

### Backend (Railway)
1. Connect GitHub repo
2. Set environment variables
3. Deploy from `backend/` directory

### Frontend (Vercel)
1. Import project
2. Set root directory to `frontend/`
3. Add environment variables
4. Deploy

### Or Use Docker Compose
```bash
docker-compose up -d
```

---

## Minimum Viable Setup

To test the platform with minimal configuration:

| Component | Required | Notes |
|-----------|----------|-------|
| PostgreSQL | Yes | Local Docker or Supabase |
| Clerk | Yes | Free tier available |
| Gemini | Yes | Free tier available |
| Storage | Local | No cloud service needed |
| Claude | No | Fallback content used |
| Stripe | No | Billing disabled |

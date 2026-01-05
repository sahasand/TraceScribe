# TraceScribe Language Translation Feature - Implementation Plan

**Feature:** On-demand ICF document translation from English to 10 major languages
**Approach:** UIF-based translation with direct AI translation (GPT-5 Nano)
**Target:** ICF documents only, English source required

---

## Executive Summary

Add language translation capability to TraceScribe ICF documents. Users generate English ICFs as normal, then optionally translate them to Spanish, French, German, Chinese, Japanese, Korean, Portuguese, Italian, Dutch, or Polish via an on-demand "Translate" button.

**Key Decisions:**
- ✅ **UIF Storage** - Add `uif_content` JSON field to store UIF for fast translation
- ✅ **ICF Only** - Translation restricted to ICF documents initially
- ✅ **Separate Documents** - Each language = independent Document record
- ✅ **On-Demand** - Translate after English generation, not during
- ✅ **Direct Translation** - GPT-5 Nano translates UIF text directly
- ✅ **Orphaned Translations** - Translations remain if source deleted (simpler)

---

## Architecture Overview

```
User Flow:
1. Generate ICF in English (existing flow)
2. Click "Translate" button on document card
3. Select target language from modal (10 options)
4. System retrieves stored UIF → Translates → Re-renders to Word
5. New Document record created with language field
6. User downloads both English and translated versions

Technical Flow:
Protocol → ICF Guru → UIF (JSON) → [SAVE UIF] → DocEngine → Word (EN)
                         ↓
                    [Retrieve UIF] → Translate Text → UIF (Translated) → Word (ES/FR/etc)
```

---

## Backend Implementation

### 1. Database Schema Changes

**File:** `/backend/app/modules/documents/models.py`

```python
class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    # Existing fields
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    protocol_id = Column(String(36), ForeignKey("protocols.id"), nullable=False, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    document_type = Column(String(50), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="draft", nullable=False)

    # NEW: Fix missing field bug (referenced in service.py)
    file_size = Column(Integer, nullable=True)

    # NEW: UIF storage for translation
    uif_content = Column(JSON, nullable=True)  # Complete UIF JSON structure

    # NEW: Translation tracking
    language = Column(String(10), default="en", nullable=False, index=True)  # ISO 639-1
    source_document_id = Column(String(36), nullable=True, index=True)  # Link to English doc
```

**Migration Strategy:**
- No Alembic detected in codebase
- For existing database: Manual `ALTER TABLE` or recreate database
- SQLite: `ALTER TABLE documents ADD COLUMN uif_content JSON`
- SQLite: `ALTER TABLE documents ADD COLUMN file_size INTEGER`
- SQLite: `ALTER TABLE documents ADD COLUMN language VARCHAR(10) DEFAULT 'en'`
- SQLite: `ALTER TABLE documents ADD COLUMN source_document_id VARCHAR(36)`
- PostgreSQL: Same SQL, replace `VARCHAR` with `TEXT`

---

### 2. API Schemas

**File:** `/backend/app/modules/documents/schemas.py`

```python
from typing import Optional, Literal

# NEW: Translation request
class DocumentTranslateRequest(BaseModel):
    """Request to translate a document."""
    target_language: Literal["es", "fr", "de", "zh", "ja", "ko", "pt", "it", "nl", "pl"]

# NEW: Translation response
class DocumentTranslateResponse(BaseModel):
    """Response after document translation."""
    id: UUID
    source_document_id: UUID
    target_language: str
    status: str
    message: str

# UPDATED: Add translation fields to existing response
class DocumentResponse(BaseModel):
    """Document response."""
    id: UUID
    protocol_id: UUID
    user_id: str
    document_type: str
    version: int
    file_path: str
    status: str
    created_at: datetime

    # NEW FIELDS
    file_size: Optional[int] = None  # Fix missing field
    language: str = "en"  # ISO 639-1 code
    source_document_id: Optional[UUID] = None  # Link to source if translation

    class Config:
        from_attributes = True
```

---

### 3. Translation Service

**File:** `/backend/app/modules/documents/service.py`

**3a. Save UIF During Generation (1-line change)**

```python
async def generate_document(
    self,
    protocol_id: uuid.UUID,
    document_type: str,
    user_id: str,
    ip_address: Optional[str] = None,
) -> Document:
    # ... existing code ...

    # Execute workflow to get UIF document
    uif_document = await workflow.execute(
        protocol_data=protocol.extracted_data,
        user_id=user_id,
    )

    # Render with DocEngine and upload to storage
    result = await doc_engine.render_and_upload(
        document=uif_document,
        user_id=user_id,
        protocol_id=str(protocol_id),
        version=version,
    )

    # Update document record
    document.file_path = result.file_path
    document.file_size = result.file_size
    document.uif_content = uif_document.model_dump()  # ← NEW: Save UIF!
    document.language = "en"  # ← NEW: Set default language
    document.status = "draft"

    # ... rest of existing code ...
```

**3b. Add Translation Method (NEW)**

```python
async def translate_document(
    self,
    source_document_id: uuid.UUID,
    target_language: str,
    user_id: str,
    ip_address: Optional[str] = None,
) -> Document:
    """
    Translate an existing document to a new language.

    Process:
    1. Fetch source document (must be ICF, must have UIF)
    2. Extract and parse UIF content
    3. Translate all text fields using GPT-5 Nano
    4. Re-render translated UIF to Word
    5. Create new Document record with target language

    Args:
        source_document_id: UUID of source document (must be English ICF)
        target_language: ISO 639-1 code (es, fr, de, zh, ja, ko, pt, it, nl, pl)
        user_id: User ID for access control
        ip_address: Optional client IP for audit log

    Returns:
        Newly created translated Document

    Raises:
        ValueError: If source not found, not ICF, or no UIF content
    """
    # 1. Get source document
    source_doc = await self.get_by_id(source_document_id, user_id)
    if not source_doc:
        raise ValueError("Source document not found")

    if source_doc.document_type != "icf":
        raise ValueError("Translation only supported for ICF documents")

    if not source_doc.uif_content:
        raise ValueError(
            "Source document has no UIF content. "
            "Please regenerate the document to enable translation."
        )

    # 2. Parse UIF from JSON
    from app.core.docengine.schema import UniversalDocument
    uif_document = UniversalDocument(**source_doc.uif_content)

    # 3. Calculate version for this language
    # Each language has independent versioning
    version = await self._get_next_version_for_language(
        protocol_id=source_doc.protocol_id,
        document_type=source_doc.document_type,
        language=target_language,
        user_id=user_id,
    )

    # 4. Create translating document record
    translated_doc = Document(
        protocol_id=source_doc.protocol_id,
        user_id=user_id,
        document_type=source_doc.document_type,
        version=version,
        file_path="",  # Updated after rendering
        status="translating",  # NEW status
        language=target_language,
        source_document_id=str(source_document_id),
    )
    self.db.add(translated_doc)
    await self.db.flush()

    try:
        # 5. Translate UIF content
        logger.info(f"Translating document {source_document_id} to {target_language}")
        translated_uif = await self._translate_uif(uif_document, target_language)

        # 6. Render translated UIF to Word
        result = await doc_engine.render_and_upload(
            document=translated_uif,
            user_id=user_id,
            protocol_id=source_doc.protocol_id,
            version=version,
            filename_suffix=f"_{target_language}",  # icf_es_v1.docx
        )

        # 7. Update record
        translated_doc.file_path = result.file_path
        translated_doc.file_size = result.file_size
        translated_doc.uif_content = translated_uif.model_dump()  # Save translated UIF
        translated_doc.status = "draft"

        # 8. Audit log
        await audit_log(
            db=self.db,
            user_id=user_id,
            action="TRANSLATE",  # NEW action constant
            resource_type=AuditLogger.DOCUMENT,
            resource_id=translated_doc.id,
            details={
                "source_document_id": str(source_document_id),
                "source_language": source_doc.language,
                "target_language": target_language,
                "document_type": source_doc.document_type,
                "version": version,
                "file_size": result.file_size,
            },
            ip_address=ip_address,
        )

        logger.info(
            f"Translation complete: {translated_doc.id} "
            f"({source_doc.language} → {target_language})"
        )
        return translated_doc

    except Exception as e:
        # Update status to failed
        translated_doc.status = "failed"
        logger.error(f"Translation failed for {source_document_id}: {e}")
        raise


async def _translate_uif(
    self,
    uif: UniversalDocument,
    target_language: str,
) -> UniversalDocument:
    """
    Translate all text content in UIF to target language.

    Translates:
    - Document title
    - Section headings
    - Paragraph content
    - List items
    - Table headers and cells
    - Signature block labels and preambles

    Args:
        uif: Source UniversalDocument
        target_language: ISO 639-1 language code

    Returns:
        Translated UniversalDocument with same structure
    """
    import copy

    # Language name mapping for prompts
    LANGUAGE_NAMES = {
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "zh": "Chinese (Simplified)",
        "ja": "Japanese",
        "ko": "Korean",
        "pt": "Portuguese",
        "it": "Italian",
        "nl": "Dutch",
        "pl": "Polish",
    }

    language_name = LANGUAGE_NAMES.get(target_language, target_language.upper())

    # Build translation prompt template
    prompt_template = f"""
Translate the following ICF (Informed Consent Form) content to {language_name}.

CRITICAL TRANSLATION RULES:
1. Use plain, simple language (8th grade reading level)
2. Maintain formal, respectful tone appropriate for medical consent forms
3. Preserve ALL formatting markers, line breaks, and structure exactly
4. Keep medical/scientific terms accurate and properly translated
5. DO NOT translate:
   - Protocol numbers (e.g., "Protocol XYZ-123")
   - Drug/product codes (e.g., "ABC-456")
   - Abbreviations like "ICF", "FDA", "IRB"
   - Proper names of organizations and sponsors
   - Version numbers
6. Use culturally appropriate phrasing for consent language

Output ONLY the translated text. No explanations, no notes.

English text:
{{{{content}}}}

{language_name} translation:"""

    # Deep copy UIF to avoid modifying original
    translated_uif = copy.deepcopy(uif)

    # Update compliance metadata
    translated_uif.compliance.generated_by = uif.compliance.generated_by
    translated_uif.compliance.regulatory_framework = uif.compliance.regulatory_framework

    # Translate document title
    if translated_uif.title:
        translated_uif.title = await self._translate_text(
            text=translated_uif.title,
            target_language=target_language,
            prompt_template=prompt_template,
        )

    # Translate each section
    for section in translated_uif.sections:
        # Translate section heading
        if section.heading:
            section.heading = await self._translate_text(
                text=section.heading,
                target_language=target_language,
                prompt_template=prompt_template,
            )

        # Translate content blocks
        for block in section.content_blocks:
            # Translate paragraph/heading content
            if block.content:
                block.content = await self._translate_text(
                    text=block.content,
                    target_language=target_language,
                    prompt_template=prompt_template,
                )

            # Translate list items
            if block.items:
                translated_items = []
                for item in block.items:
                    if isinstance(item, str):
                        translated_item = await self._translate_text(
                            text=item,
                            target_language=target_language,
                            prompt_template=prompt_template,
                        )
                        translated_items.append(translated_item)
                    else:
                        # Nested list items (dict with nested items)
                        translated_items.append(item)  # Keep structure
                block.items = translated_items

            # Translate table content
            if block.table:
                # Translate headers
                block.table.headers = [
                    await self._translate_text(h, target_language, prompt_template)
                    for h in block.table.headers
                ]

                # Translate rows (handle both string and TableCell)
                translated_rows = []
                for row in block.table.rows:
                    translated_row = []
                    for cell in row:
                        if isinstance(cell, str):
                            translated_cell = await self._translate_text(
                                cell, target_language, prompt_template
                            )
                            translated_row.append(translated_cell)
                        else:
                            # TableCell object - translate content field
                            cell.content = await self._translate_text(
                                cell.content, target_language, prompt_template
                            )
                            translated_row.append(cell)
                    translated_rows.append(translated_row)
                block.table.rows = translated_rows

            # Translate signature block
            if block.signature:
                if block.signature.preamble:
                    block.signature.preamble = await self._translate_text(
                        block.signature.preamble,
                        target_language,
                        prompt_template,
                    )

                for sig_line in block.signature.lines:
                    sig_line.label = await self._translate_text(
                        sig_line.label,
                        target_language,
                        prompt_template,
                    )

    return translated_uif


async def _translate_text(
    self,
    text: str,
    target_language: str,
    prompt_template: str,
) -> str:
    """
    Translate a single text string using GPT-5 Nano.

    Args:
        text: Text to translate
        target_language: ISO 639-1 code
        prompt_template: Translation prompt with {{content}} placeholder

    Returns:
        Translated text
    """
    if not text or not text.strip():
        return text

    # Build full prompt
    full_prompt = prompt_template.replace("{{content}}", text)

    # Call OpenAI GPT-5 Nano
    response = await self.openai.generate(
        prompt=full_prompt,
        temperature=1.0,  # GPT-5 Nano only supports temperature=1
        max_tokens=2000,
        model="gpt-5-nano",
    )

    return response.strip()


async def _get_next_version_for_language(
    self,
    protocol_id: str,
    document_type: str,
    language: str,
    user_id: str,
) -> int:
    """
    Get next version number for a specific language.

    Versions are tracked independently per language.
    Example: ICF English v1, v2, v3 | ICF Spanish v1, v2

    Args:
        protocol_id: Protocol UUID string
        document_type: Document type (icf, dmp, sap)
        language: ISO 639-1 language code
        user_id: User ID

    Returns:
        Next version number for this language
    """
    result = await self.db.execute(
        select(func.max(Document.version)).where(
            Document.protocol_id == protocol_id,
            Document.document_type == document_type,
            Document.language == language,
            Document.user_id == user_id,
        )
    )
    max_version = result.scalar() or 0
    return max_version + 1
```

---

### 4. API Router

**File:** `/backend/app/modules/documents/router.py`

```python
@router.post("/{document_id}/translate", response_model=DocumentTranslateResponse)
async def translate_document(
    document_id: UUID,
    body: DocumentTranslateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Translate a document to another language.

    - **document_id**: Source document UUID (must be ICF in English)
    - **target_language**: ISO 639-1 language code (es, fr, de, zh, ja, ko, pt, it, nl, pl)

    Creates a new Document record with translated content.
    Only ICF documents can be translated.
    Source document must have UIF content stored.
    """
    user_id = get_user_id(request)
    ip_address = get_client_ip(request)

    # Get OpenAI client (required for translation)
    try:
        from app.modules.ai.openai_client import openai_client
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Translation service unavailable (OpenAI client not configured)",
        )

    if not openai_client:
        raise HTTPException(
            status_code=500,
            detail="Translation service unavailable (OPENAI_API_KEY not set)",
        )

    # Initialize service
    service = DocumentService(db, openai_client)

    try:
        translated_doc = await service.translate_document(
            source_document_id=document_id,
            target_language=body.target_language,
            user_id=user_id,
            ip_address=ip_address,
        )

        return DocumentTranslateResponse(
            id=translated_doc.id,
            source_document_id=document_id,
            target_language=body.target_language,
            status=translated_doc.status,
            message=f"Document translated to {body.target_language.upper()} successfully",
        )

    except ValueError as e:
        # Client errors (document not found, wrong type, etc.)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Server errors
        logger.error(f"Translation failed for {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
```

---

### 5. Audit Logging

**File:** `/backend/app/core/audit.py`

```python
class AuditLogger:
    """Audit logger for tracking document actions."""

    # Action constants
    UPLOAD = "UPLOAD"
    PARSE = "PARSE"
    GENERATE = "GENERATE"
    DOWNLOAD = "DOWNLOAD"
    DELETE = "DELETE"
    UPDATE = "UPDATE"
    VIEW = "VIEW"
    TRANSLATE = "TRANSLATE"  # ← NEW: Add translation action

    # Resource type constants
    PROTOCOL = "protocol"
    DOCUMENT = "document"
    USER = "user"
    SUBSCRIPTION = "subscription"
```

---

### 6. DocEngine Update (Optional)

**File:** `/backend/app/core/docengine/engine.py`

If you want language-specific filenames (e.g., `icf_es_v1.docx` instead of `icf_v1.docx`):

```python
async def render_and_upload(
    self,
    document: UniversalDocument,
    user_id: str,
    protocol_id: str,
    version: int,
    filename_suffix: str = "",  # ← NEW: Optional suffix for language
) -> DocEngineResult:
    # ... existing rendering code ...

    # Generate filename
    filename = f"{document.document_type}{filename_suffix}_v{version}.docx"
    # Example: icf_es_v1.docx, icf_fr_v2.docx

    # ... rest of existing code ...
```

---

## Frontend Implementation

### 1. New Components

#### 1a. Language Badge Component

**File:** `/frontend/components/ui/language-badge.tsx` (NEW)

```tsx
import { cn } from "@/lib/utils";

interface LanguageBadgeProps {
  code: string; // ISO 639-1
  variant?: "default" | "glow";
  className?: string;
}

export function LanguageBadge({ code, variant = "default", className }: LanguageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2 py-0.5",
        "font-mono text-[10px] font-bold uppercase tracking-wider",
        "transition-all duration-200",
        {
          // Default variant - neutral
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400":
            variant === "default",

          // Glow variant - teal accent for translated docs
          "bg-primary/10 text-primary border border-primary/20":
            variant === "glow",
          "shadow-[0_0_8px_rgba(45,212,191,0.3)]":
            variant === "glow",
        },
        className
      )}
      aria-label={`${getLanguageName(code)} translation`}
    >
      {code.toUpperCase()}
    </span>
  );
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    pt: "Portuguese",
    it: "Italian",
    nl: "Dutch",
    pl: "Polish",
  };
  return names[code] || code.toUpperCase();
}
```

---

#### 1b. Translate Button Component

**File:** `/frontend/components/documents/translate-button.tsx` (NEW)

```tsx
import { useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranslateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function TranslateButton({ onClick, disabled, className }: TranslateButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2 transition-all duration-200",
        "hover:border-primary hover:text-primary",
        "hover:bg-primary/5",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Translate document to another language"
    >
      <Languages
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          isHovered && "rotate-3"
        )}
      />
      Translate
    </Button>
  );
}
```

---

#### 1c. Translate Dialog Component

**File:** `/frontend/components/documents/translate-dialog.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

interface TranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  onSuccess?: () => void;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
];

export function TranslateDialog({
  open,
  onOpenChange,
  documentId,
  onSuccess,
}: TranslateDialogProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!selectedLanguage) return;

    setIsTranslating(true);
    try {
      await api.translateDocument(documentId, selectedLanguage);

      toast({
        title: "Translation started",
        description: `Translating document to ${LANGUAGES.find(l => l.code === selectedLanguage)?.name}`,
      });

      onOpenChange(false);
      setSelectedLanguage(null);
      onSuccess?.();

    } catch (error) {
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "Failed to translate document",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Translate Document
          </DialogTitle>
          <DialogDescription>
            Select the target language for translation
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-3 py-6">
          {LANGUAGES.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "animate-fade-in-up opacity-0",
                selectedLanguage === lang.code
                  ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(45,212,191,0.3)]"
                  : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
              )}
              style={{
                animationDelay: `${index * 40}ms`,
                animationFillMode: "forwards",
              }}
              aria-label={`Translate to ${lang.name}`}
            >
              <span className="text-2xl" aria-hidden="true">{lang.flag}</span>
              <span className="font-mono text-xs font-bold text-primary">
                {lang.code.toUpperCase()}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {lang.name}
              </span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              setSelectedLanguage(null);
            }}
            disabled={isTranslating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTranslate}
            disabled={!selectedLanguage || isTranslating}
            className="gap-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Translate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 2. Modified Components

#### 2a. Documents Page - Add Translation

**File:** `/frontend/app/(dashboard)/documents/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Download, Clock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { LanguageBadge } from "@/components/ui/language-badge"; // NEW
import { TranslateButton } from "@/components/documents/translate-button"; // NEW
import { TranslateDialog } from "@/components/documents/translate-dialog"; // NEW
import api, { DocumentResponse } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false); // NEW
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null); // NEW
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const response = await api.listDocuments();
      setDocuments(response.documents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(doc: DocumentResponse) {
    try {
      const blob = await api.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Include language in filename if not English
      const langSuffix = doc.language !== "en" ? `_${doc.language}` : "";
      a.download = `${doc.document_type}${langSuffix}_v${doc.version}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Downloaded",
        description: `${doc.document_type.toUpperCase()} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  }

  // NEW: Handle translate button click
  function handleTranslateClick(documentId: string) {
    setSelectedDocumentId(documentId);
    setTranslateDialogOpen(true);
  }

  // NEW: Refresh documents after translation
  function handleTranslationSuccess() {
    loadDocuments();
  }

  // NEW: Check if document can be translated
  function canTranslate(doc: DocumentResponse): boolean {
    return doc.document_type === "icf" && doc.language === "en";
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      icf: "Informed Consent Form",
      dmp: "Data Management Plan",
      sap: "Statistical Analysis Plan",
    };
    return labels[type] || type.toUpperCase();
  };

  const getDocumentTypeIcon = (type: string) => {
    return FileText;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 stagger-children">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            View and download generated documents
          </p>
        </div>

        {documents.length === 0 ? (
          <Card className="border-dashed">
            <EmptyState
              icon={FileCheck}
              title="No documents yet"
              description="Upload a protocol and generate documents to get started"
              action={{
                label: "Go to Protocols",
                onClick: () => window.location.href = "/protocols",
              }}
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc, index) => (
              <Card
                key={doc.id}
                className={cn(
                  "group transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5",
                  "animate-fade-in-up opacity-0"
                )}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {getDocumentTypeLabel(doc.document_type)}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs flex items-center gap-2">
                          Version {doc.version}
                          {/* NEW: Language badge for non-English documents */}
                          {doc.language !== "en" && (
                            <LanguageBadge code={doc.language} variant="glow" />
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <StatusIndicator status={doc.status as any} />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* NEW: Show source link for translations */}
                  {doc.source_document_id && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Translated from{" "}
                      <Link
                        href={`#${doc.source_document_id}`}
                        className="underline hover:text-primary"
                      >
                        English version
                      </Link>
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1.5" />
                      {formatDate(doc.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* NEW: Translate button (only for English ICF) */}
                      {canTranslate(doc) && (
                        <TranslateButton
                          onClick={() => handleTranslateClick(doc.id)}
                        />
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 group-hover:border-primary group-hover:text-primary transition-colors"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Translation dialog */}
      {selectedDocumentId && (
        <TranslateDialog
          open={translateDialogOpen}
          onOpenChange={setTranslateDialogOpen}
          documentId={selectedDocumentId}
          onSuccess={handleTranslationSuccess}
        />
      )}
    </>
  );
}
```

---

#### 2b. Status Indicator - Add "translating"

**File:** `/frontend/components/ui/status-indicator.tsx`

```tsx
import { Loader2, Clock, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "generating" | "translating" | "draft" | "final" | "failed" | "error";
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "generating":
        return {
          icon: Loader2,
          label: "Generating...",
          className: "text-blue-500 dark:text-blue-400",
          iconClassName: "animate-spin",
        };

      // NEW: Translating status
      case "translating":
        return {
          icon: Loader2,
          label: "Translating...",
          className: "text-blue-500 dark:text-blue-400",
          iconClassName: "animate-spin",
        };

      case "draft":
        return {
          icon: Clock,
          label: "Draft",
          className: "text-yellow-500 dark:text-yellow-400",
          iconClassName: "",
        };

      case "final":
        return {
          icon: Check,
          label: "Final",
          className: "text-green-500 dark:text-green-400",
          iconClassName: "",
        };

      case "failed":
      case "error":
        return {
          icon: AlertCircle,
          label: "Failed",
          className: "text-red-500 dark:text-red-400",
          iconClassName: "",
        };

      default:
        return {
          icon: Clock,
          label: status,
          className: "text-slate-500",
          iconClassName: "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-4 w-4", config.iconClassName)} />
      <span>{config.label}</span>
    </div>
  );
}
```

---

#### 2c. API Client - Add Translation Method

**File:** `/frontend/lib/api-client.ts`

```typescript
// Add to DocumentResponse interface
export interface DocumentResponse {
  id: string;
  protocol_id: string;
  user_id: string;
  document_type: string;
  version: number;
  file_path: string;
  status: string;
  created_at: string;

  // NEW: Translation fields
  file_size?: number;
  language: string;
  source_document_id?: string;
}

// Add new method to api object
const api = {
  // ... existing methods ...

  // NEW: Translate document
  async translateDocument(
    documentId: string,
    targetLanguage: string
  ): Promise<{ id: string; status: string; message: string }> {
    const response = await fetch(`${API_URL}/api/documents/${documentId}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": getUserId(),
      },
      body: JSON.stringify({ target_language: targetLanguage }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Translation failed");
    }

    return response.json();
  },
};

export default api;
```

---

### 3. CSS Additions

**File:** `/frontend/app/globals.css`

```css
/* Translation-specific animations */

@keyframes gentle-rotate {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(3deg); }
}

@keyframes language-card-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(45, 212, 191, 0);
  }
}

/* Apply to translated document cards */
.translation-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}

/* Fade-in-up animation for staggered entrance */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 300ms ease-out;
}
```

---

## Testing Plan

### Backend Testing

**Manual Test Flow:**

1. **Generate English ICF**:
   ```bash
   curl -X POST http://localhost:8000/api/documents/generate \
     -H "Content-Type: application/json" \
     -H "X-User-ID: dev-user" \
     -d '{"protocol_id": "<uuid>", "document_type": "icf"}'
   ```
   - Verify `uif_content` is saved in database
   - Verify `language` = "en"

2. **Translate to Spanish**:
   ```bash
   curl -X POST http://localhost:8000/api/documents/<doc-id>/translate \
     -H "Content-Type: application/json" \
     -H "X-User-ID: dev-user" \
     -d '{"target_language": "es"}'
   ```
   - Verify new Document record created
   - Verify `language` = "es"
   - Verify `source_document_id` points to English doc
   - Download and inspect Spanish Word file

3. **Error Cases**:
   - Try translating DMP (should fail: "ICF only")
   - Try translating document without UIF (should fail)
   - Try invalid language code (should fail validation)

4. **Audit Logs**:
   ```sql
   SELECT * FROM audit_logs WHERE action = 'TRANSLATE';
   ```
   - Verify TRANSLATE actions logged with correct details

### Frontend Testing

**Manual Test Flow:**

1. **UI Visibility**:
   - English ICF should show "Translate" button
   - Spanish ICF should show "ES" badge (no Translate button)
   - DMP/SAP should NOT show Translate button

2. **Translation Dialog**:
   - Click "Translate" → modal opens
   - Verify 10 language cards displayed
   - Click language → card highlights
   - Click "Translate" → modal closes, toast shows
   - Verify new document appears in list after translation

3. **Status Updates**:
   - During translation: "Translating..." status (blue spinner)
   - After completion: "Draft" status

4. **Language Badge**:
   - Translated docs show language badge
   - Badge has teal glow effect
   - Badge displays correct ISO code

5. **Responsive Design**:
   - Test on mobile (language grid should be 3 columns)
   - Test on tablet (4 columns)
   - Test on desktop (5 columns)

---

## Deployment Steps

### 1. Database Migration

**For existing databases:**

```sql
-- SQLite
ALTER TABLE documents ADD COLUMN file_size INTEGER;
ALTER TABLE documents ADD COLUMN uif_content JSON;
ALTER TABLE documents ADD COLUMN language VARCHAR(10) DEFAULT 'en' NOT NULL;
ALTER TABLE documents ADD COLUMN source_document_id VARCHAR(36);

CREATE INDEX idx_documents_language ON documents(language);
CREATE INDEX idx_documents_source_id ON documents(source_document_id);

-- PostgreSQL
ALTER TABLE documents ADD COLUMN file_size INTEGER;
ALTER TABLE documents ADD COLUMN uif_content JSONB;
ALTER TABLE documents ADD COLUMN language VARCHAR(10) DEFAULT 'en' NOT NULL;
ALTER TABLE documents ADD COLUMN source_document_id VARCHAR(36);

CREATE INDEX idx_documents_language ON documents(language);
CREATE INDEX idx_documents_source_id ON documents(source_document_id);
```

**For fresh deployment:**
- Schema changes will auto-apply on next `Base.metadata.create_all()`

### 2. Backend Deployment

```bash
cd backend
pip install -r requirements.txt  # No new dependencies
python -m pytest tests/  # Run tests (if any)
uvicorn app.main:app --reload
```

### 3. Frontend Deployment

```bash
cd frontend
npm install  # No new dependencies
npm run build
npm run start
```

### 4. Environment Variables

Ensure `OPENAI_API_KEY` is set:

```bash
# backend/.env
OPENAI_API_KEY=sk-...  # Required for translation
```

---

## Success Criteria

✅ **Backend:**
- UIF content stored during ICF generation
- Translation endpoint creates new Document with correct language
- Translated Word files render correctly with target language
- Audit logs record TRANSLATE actions
- Version numbers track independently per language

✅ **Frontend:**
- Translate button appears only on English ICF documents
- Language selector dialog displays 10 languages
- Language badges show on translated documents
- "Translating..." status displays during translation
- Documents list refreshes after translation

✅ **Quality:**
- Translations maintain plain language (8th grade level)
- Formatting preserved (headings, lists, tables, signatures)
- Medical terms translated accurately
- Protocol numbers and codes NOT translated

---

## Known Limitations & Future Enhancements

**Current Limitations:**
1. **ICF only** - DMP and SAP translation not implemented
2. **No back-translation** - Cannot translate translated docs to another language
3. **No translation review** - No UI to compare English vs translated side-by-side
4. **No versioning link** - If English ICF v2 generated, existing Spanish v1 not updated

**Future Enhancements:**
1. **Multi-document translation** - Translate DMP, SAP, other document types
2. **Translation memory** - Cache common phrases for consistency
3. **Side-by-side comparison** - View English and translation in split view
4. **Translation quality scoring** - AI-powered quality assessment
5. **Re-translation on update** - Prompt to update translations when source changes
6. **Batch translation** - Translate to multiple languages at once
7. **Custom glossaries** - User-defined term translations for consistency
8. **Translation history** - Track translation edits and versions

---

## File Checklist

### Backend Files Modified
- ✅ `/backend/app/modules/documents/models.py` - Add 4 fields
- ✅ `/backend/app/modules/documents/schemas.py` - Add 2 schemas, update 1
- ✅ `/backend/app/modules/documents/service.py` - Add 3 methods, modify 1 line
- ✅ `/backend/app/modules/documents/router.py` - Add 1 endpoint
- ✅ `/backend/app/core/audit.py` - Add TRANSLATE constant
- ⚠️ `/backend/app/core/docengine/engine.py` - Optional: filename_suffix param

### Frontend Files Modified
- ✅ `/frontend/components/ui/language-badge.tsx` - NEW component
- ✅ `/frontend/components/documents/translate-button.tsx` - NEW component
- ✅ `/frontend/components/documents/translate-dialog.tsx` - NEW component
- ✅ `/frontend/app/(dashboard)/documents/page.tsx` - Add translation UI
- ✅ `/frontend/components/ui/status-indicator.tsx` - Add "translating" status
- ✅ `/frontend/lib/api-client.ts` - Add translateDocument() method
- ✅ `/frontend/app/globals.css` - Add translation animations

### Database Migration
- ✅ SQL commands for schema update

---

## Estimated Implementation Time

**Backend:** ~3-4 hours
- Database schema: 30 min
- Translation service logic: 2 hours
- API endpoint + testing: 1 hour

**Frontend:** ~3-4 hours
- Language badge component: 30 min
- Translate button: 30 min
- Translate dialog: 1.5 hours
- Documents page integration: 1 hour
- Status indicator update: 30 min

**Testing & Refinement:** ~2 hours
- Manual testing: 1 hour
- Bug fixes: 1 hour

**Total:** ~8-10 hours for complete implementation

---

## Questions & Support

For implementation questions:
1. Check existing code patterns in similar modules
2. Review UIF schema for translation targets
3. Test with small documents first before production use
4. Monitor audit logs for translation activity

**End of Implementation Plan**

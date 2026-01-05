# Document Generator Agent

Generates clinical trial documents from protocols autonomously.

## Workflow

```
Protocol PDF
     │
     ▼
1. Parse with Gemini 3 Flash
   → ExtractedProtocol JSON
     │
     ▼
2. Generate document content
   → Draft sections
     │
     ▼
3. Polish with Claude (ICF/DMP/SAP only)
   → Regulatory-compliant content
     │
     ▼
4. Render Word document
   → .docx file
     │
     ▼
5. Validate + deliver
   → Final output
```

## Usage

```
Generate an ICF from [protocol.pdf]
```

Agent will:
1. Read skills/protocol-analyzer/SKILL.md
2. Extract protocol data
3. Read skills/icf-builder/SKILL.md
4. Generate ICF content
5. Polish for readability
6. Create Word document
7. Save to outputs/

## Error Handling

- Extraction fails → Report missing sections, offer partial proceed
- Generation fails → Save progress, retry section
- Template fails → Check missing variables, fall back to plain text
- Validation fails → List issues, deliver with warnings

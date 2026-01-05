# Protocol Analyzer

Parse protocol PDFs and extract structured data for document generation.

## Output Schema

```python
class ExtractedProtocol(BaseModel):
    metadata: StudyMetadata        # title, protocol_number, sponsor, phase, indication
    design: StudyDesign            # type, arms, randomization, blinding, enrollment
    endpoints: Endpoints           # primary, secondary (verbatim)
    eligibility: EligibilityCriteria  # inclusion, exclusion (simplified, 5-10 each)
    procedures: List[StudyProcedure]  # name, plain_language, frequency, blood_volume
    visits: List[Visit]            # name, timing, procedures, duration
    adverse_events: List[AdverseEvent]  # term, plain_language, frequency, severity
    investigational_product: InvestigationalProduct  # name, route, dose, frequency
```

## Implementation

```python
async def parse_protocol(pdf_bytes: bytes) -> ExtractedProtocol:
    model = genai.GenerativeModel(
        model_name="gemini-3-flash-preview",
        generation_config={"temperature": 0.2, "thinking_level": "high"}
    )
    
    response = await model.generate_content_async([
        EXTRACTION_PROMPT,  # See references/extraction-prompt.md
        {"mime_type": "application/pdf", "data": pdf_bytes}
    ])
    
    return ExtractedProtocol.model_validate_json(response.text)
```

## Key Rules

1. Extract endpoints VERBATIM — do not simplify
2. Simplify eligibility to 5-10 criteria patients understand
3. Convert blood volumes to tablespoons (15mL = 1 tbsp)
4. Include AE frequencies when available
5. Use null for missing fields — do not guess

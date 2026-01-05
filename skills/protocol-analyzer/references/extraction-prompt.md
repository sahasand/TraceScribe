# Extraction Prompt

```
You are a clinical trial protocol analyst. Extract structured data from this protocol.

RULES:
- Extract endpoints VERBATIM
- Simplify eligibility to 5-10 key criteria
- Include AE frequencies when available
- Use null for missing fields
- Flag sections needing review

OUTPUT: Valid JSON matching this schema:

{
  "metadata": {
    "protocol_number": "string",
    "title": "string",
    "sponsor": "string",
    "phase": "string",
    "indication": "string",
    "version": "string"
  },
  "design": {
    "study_type": "interventional|observational|device",
    "design": "string - full description",
    "arms": ["array of arm names"],
    "randomization_ratio": "string or null",
    "blinding": "open|single-blind|double-blind",
    "control": "placebo|active|none|null",
    "planned_enrollment": integer,
    "study_duration_weeks": integer
  },
  "endpoints": {
    "primary": ["VERBATIM from protocol"],
    "secondary": ["VERBATIM from protocol"]
  },
  "eligibility": {
    "inclusion": ["5-10 simplified criteria"],
    "exclusion": ["5-10 simplified criteria"],
    "age_range": "string",
    "sex": "All|Male|Female"
  },
  "procedures": [
    {
      "name": "string",
      "plain_language": "patient-friendly description",
      "frequency": "string",
      "visits": ["which visits"],
      "blood_volume_ml": integer or null
    }
  ],
  "visits": [
    {
      "name": "string",
      "timing": "string",
      "procedures": ["procedure names"],
      "estimated_duration_hours": number
    }
  ],
  "adverse_events": [
    {
      "term": "medical term",
      "plain_language": "patient term",
      "frequency": "Very common (>10%)|Common (1-10%)|Uncommon (<1%)|Rare|Unknown",
      "severity": "mild|moderate|severe"
    }
  ],
  "investigational_product": {
    "name": "string",
    "type": "small molecule|biologic|device",
    "route": "oral|IV|subcutaneous|etc",
    "dose": "string",
    "frequency": "string",
    "duration": "string"
  },
  "confidence_flags": ["sections needing review"]
}
```

## Where to Find Data

| Data | Protocol Location |
|------|-------------------|
| Metadata | Title page, synopsis |
| Design | Study Design section |
| Endpoints | Objectives section (copy verbatim) |
| Eligibility | Study Population section |
| Procedures | Schedule of Assessments TABLE |
| AEs | Safety section, IB reference |
| IP | Investigational Product section |

# SAP Builder

Generate Statistical Analysis Plans from extracted protocol data.

## Standard Sections

1. Introduction
2. Study Objectives and Endpoints
3. Study Design
4. Analysis Populations
5. Statistical Methods
   - General Considerations
   - Primary Endpoint Analysis
   - Secondary Endpoint Analysis
   - Safety Analysis
6. Sample Size
7. Handling Missing Data
8. Interim Analysis (if applicable)
9. Tables, Listings, Figures Shell

## Template Variables

```
{{protocol_number}}, {{study_title}}, {{sponsor}}, {{phase}}
{{primary_endpoints}} — VERBATIM from protocol
{{secondary_endpoints}} — VERBATIM from protocol
{{planned_enrollment}}, {{randomization_ratio}}
{{study_design}} — e.g., "randomized, double-blind, placebo-controlled"
```

## Analysis Populations

| Population | Definition |
|------------|------------|
| ITT | All randomized subjects |
| mITT | Randomized + received ≥1 dose |
| Per-Protocol | Completed without major deviations |
| Safety | Received ≥1 dose of study drug |

## Key Rules

1. Endpoints copied VERBATIM from protocol
2. Statistical methods appropriate for endpoint type
3. Include TLF shells based on endpoints
4. Reference ICH E9 guidelines
5. Set requires_polish = True for biostatistician review

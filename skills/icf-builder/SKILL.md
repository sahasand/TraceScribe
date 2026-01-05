# ICF Builder

Generate FDA-compliant Informed Consent Forms from extracted protocol data.

## Requirements

- Reading level: 6-8th grade (Flesch-Kincaid)
- All FDA 21 CFR 50.25 required elements
- Plain language throughout
- Risks organized by frequency

## Required Sections (21 CFR 50.25)

1. Study Purpose — what the research is about
2. Procedures — what will happen, which are experimental
3. Time Commitment — duration, number of visits
4. Risks — foreseeable risks by frequency
5. Benefits — realistic, not overstated
6. Alternatives — other options available
7. Confidentiality — how records are protected
8. Compensation — for injury if applicable
9. Contacts — questions, rights, injury
10. Voluntary — can refuse/withdraw without penalty

## Template Variables

**Fill from protocol:**
```
{{study_title}}, {{protocol_number}}, {{sponsor}}, {{phase}}
{{purpose_section}}, {{procedures_section}}, {{risks_section}}
{{visits}} (loop), {{adverse_events}} (loop)
```

**Leave as placeholders (site-specific):**
```
{{site_name}}, {{pi_name}}, {{pi_phone}}
{{irb_name}}, {{irb_phone}}, {{emergency_contact}}
```

## Plain Language Rules

| Medical Term | Plain Language |
|--------------|----------------|
| Adverse event | Side effect |
| Randomized | Assigned by chance |
| Placebo | Inactive substance |
| Double-blind | Neither you nor doctor knows |
| Intravenous | Through a vein |
| Hematology | Blood cell tests |

## Validation

Before output, verify:
- All required elements present
- No exculpatory language ("waive", "release from liability")
- No coercive language ("you must", "required")
- Grade level ≤ 8
- All protocol AEs mentioned in risks

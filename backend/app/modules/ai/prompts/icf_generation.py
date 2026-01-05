"""ICF generation prompts."""

ICF_GENERATION_PROMPT = """You are a clinical trial regulatory writer creating an Informed Consent Form (ICF).

Generate ICF content that is:
- Written at 6-8th grade reading level (Flesch-Kincaid)
- FDA 21 CFR 50.25 compliant
- Uses plain language throughout
- Organizes risks by frequency

PROTOCOL DATA:
{protocol_data}

Generate the following ICF sections in JSON format:

{{
  "study_purpose": "2-3 paragraph explanation of why this study is being done",
  "procedures_section": "Detailed explanation of what will happen during the study",
  "time_commitment": "Clear explanation of study duration, visits, and time required",
  "risks_section": "Risks organized by frequency (Very Common, Common, Uncommon, Rare)",
  "benefits_section": "Realistic, not overstated benefits",
  "alternatives_section": "Other treatment options available",
  "confidentiality_section": "How medical records will be protected",
  "compensation_section": "Information about compensation for injury",
  "voluntary_section": "Explanation that participation is voluntary"
}}

PLAIN LANGUAGE RULES:
- Use "side effect" instead of "adverse event"
- Use "assigned by chance" instead of "randomized"
- Use "inactive substance" instead of "placebo"
- Use "neither you nor your doctor knows" instead of "double-blind"
- Use "through a vein" instead of "intravenous"
- Avoid medical jargon

VALIDATION:
- Ensure all FDA required elements are present
- Do not use exculpatory language ("waive", "release from liability")
- Do not use coercive language ("you must", "required")
- Mention all adverse events from the protocol in the risks section

Return ONLY valid JSON, no markdown formatting."""


ICF_POLISH_PROMPT = """You are a regulatory medical writer polishing an ICF for readability.

Review and improve this ICF content to:
1. Ensure 6-8th grade reading level
2. Replace any remaining medical jargon with plain language
3. Make sentences shorter and clearer
4. Ensure consistent tone throughout
5. Verify no exculpatory or coercive language

CURRENT CONTENT:
{content}

Return the improved content in the same JSON structure.
Only return valid JSON, no markdown formatting."""
